import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient, ResumeParseStatus } from "@prisma/client";
import { parseResumeWithOpenAI } from "../lib/openai-resume-parser";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { extractS3KeyFromUrl } from "../lib/s3";

const prisma = new PrismaClient();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function downloadResume(url: string): Promise<Buffer> {
  // 1. Try fetching via HTTP
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      console.log(`[DOWNLOAD] Trying to fetch via HTTP: ${url}`);
      const res = await fetch(url);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
      console.log(`[DOWNLOAD] HTTP fetch returned status ${res.status}, falling back to R2 SDK`);
    } catch (e: any) {
      console.log(`[DOWNLOAD] HTTP fetch failed: ${e.message}, falling back to R2 SDK`);
    }
  }

  // 2. Fallback: Try downloading directly from R2
  const key = extractS3KeyFromUrl(url) || url;
  console.log(`[DOWNLOAD] Fetching from R2 key: ${key}`);
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  const response = await r2Client.send(command);
  const chunks: any[] = [];
  const body = response.Body as any;
  for await (const chunk of body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function guessNameFromFilename(filename: string): string | null {
  if (!filename) return null;
  // Remove extension
  let clean = filename.replace(/\.[^/.]+$/, "");
  // Remove brackets and parentheses content (e.g. [10y_3m], (1))
  clean = clean.replace(/\[[^\]]*\]/g, "").replace(/\([^)]*\)/g, "");
  // Replace underscores, hyphens, and multiple spaces with a single space
  clean = clean.replace(/[_-]+/g, " ").trim();
  // Remove common prefixes like "Naukri", "Resume", "CV", "Profile" (case-insensitive)
  clean = clean.replace(/^(naukri|resume|cv|profile|doc|draft|updated|latest)\b/i, "").trim();
  
  // If it's CamelCase (e.g. VijaySingh), add spaces before capitals
  if (/^[A-Z][a-z]+[A-Z][a-z]+/.test(clean)) {
    clean = clean.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  // Capitalize first letter of each word
  clean = clean.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();

  return clean || null;
}

async function main() {
  console.log("Starting reparsing unknown candidates in the database...");

  // Find all resumes with missing or unknown candidate names
  const resumes = await prisma.resumeDocument.findMany({
    where: {
      OR: [
        { extractedName: null },
        { extractedName: "" },
        { extractedName: { equals: "Unknown Candidate", mode: "insensitive" } },
        { extractedEmail: null },
        { currentTitle: null },
        { skills: { equals: [] } }
      ]
    }
  });

  console.log(`Found ${resumes.length} resumes matching the "Unknown Candidate" criteria.`);

  for (const doc of resumes) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing file: ${doc.originalFileName} (ID: ${doc.id})`);
    console.log(`R2 URL: ${doc.r2Url}`);

    try {
      const buffer = await downloadResume(doc.r2Url);
      console.log(`Downloaded resume file size: ${buffer.length} bytes`);

      console.log("Parsing resume with OpenAI...");
      const parsed = await parseResumeWithOpenAI(buffer, doc.originalFileName, doc.mimeType);

      const nameFallback = guessNameFromFilename(doc.originalFileName);
      const finalName = parsed.name || nameFallback;

      console.log(`Extracted name: ${parsed.name} (Fallback: ${nameFallback}) -> Final: ${finalName}`);
      console.log(`Extracted email: ${parsed.email}`);
      console.log(`Extracted location: ${parsed.location}`);
      console.log(`Extracted skills count: ${parsed.skills?.length || 0}`);

      // Update database
      await prisma.resumeDocument.update({
        where: { id: doc.id },
        data: {
          extractedText: parsed.extractedText,
          extractedName: finalName,
          extractedEmail: parsed.email || doc.extractedEmail,
          extractedPhone: parsed.phone || doc.extractedPhone,
          extractedLocation: parsed.location || doc.extractedLocation,
          experienceYears: parsed.experienceYears !== null ? parsed.experienceYears : doc.experienceYears,
          currentTitle: parsed.currentTitle || doc.currentTitle,
          extractedData: {
            education: parsed.education,
            summary: parsed.summary,
          },
          skills: parsed.skills?.length > 0 ? parsed.skills : doc.skills,
          parseStatus: ResumeParseStatus.PARSED,
          parseError: null,
        },
      });

      console.log(`✅ Successfully updated resume entry in DB for: ${finalName}`);
    } catch (err: any) {
      console.error(`❌ Error processing resume file ${doc.originalFileName}:`, err.message || err);
    }
  }

  console.log("\nFinished processing all resumes.");
}

main()
  .catch((e) => {
    console.error("Fatal error in script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
