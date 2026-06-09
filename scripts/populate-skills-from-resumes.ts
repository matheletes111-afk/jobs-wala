import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
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

async function main() {
  console.log("Starting populating skills from existing resumes...");

  // Find all job seeker profiles who have a resumeUrl
  const profiles = await prisma.jobSeekerProfile.findMany({
    where: {
      resumeUrl: {
        not: null,
      },
    },
  });

  console.log(`Found ${profiles.length} profiles with resumes.`);

  for (const profile of profiles) {
    const { id, firstName, lastName, resumeUrl, skills } = profile;
    const fullName = `${firstName} ${lastName}`;
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing candidate: ${fullName} (ID: ${id})`);
    console.log(`Current skills in DB: ${JSON.stringify(skills)}`);
    console.log(`Resume URL: ${resumeUrl}`);

    if (!resumeUrl) {
      console.log("No resume URL. Skipping.");
      continue;
    }

    try {
      const buffer = await downloadResume(resumeUrl);
      console.log(`Downloaded resume file size: ${buffer.length} bytes`);

      console.log("Parsing resume with OpenAI...");
      const parsed = await parseResumeWithOpenAI(buffer, "resume.pdf", "application/pdf");
      const extractedSkills = parsed.skills || [];

      console.log(`Extracted skills: ${JSON.stringify(extractedSkills)}`);

      if (extractedSkills.length === 0) {
        console.log("No skills extracted or not a valid resume/CV document. Skipping update.");
        continue;
      }

      // Merge skills: preserve existing, add new ones (unique)
      const mergedSkills = Array.from(new Set([...skills, ...extractedSkills]));
      
      const newSkillsAdded = mergedSkills.filter(s => !skills.includes(s));
      if (newSkillsAdded.length === 0) {
        console.log("No new skills to add. DB already has all parsed skills.");
        continue;
      }

      console.log(`Adding new skills: ${JSON.stringify(newSkillsAdded)}`);
      
      // Update database
      await prisma.jobSeekerProfile.update({
        where: { id },
        data: {
          skills: mergedSkills,
        },
      });

      console.log(`✅ Successfully updated skills in DB for ${fullName}. Total skills now: ${mergedSkills.length}`);
    } catch (err: any) {
      console.error(`❌ Error processing resume for candidate ${fullName}:`, err.message || err);
    }
  }

  console.log("\nFinished processing all profiles.");
}

main()
  .catch((e) => {
    console.error("Fatal error in script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
