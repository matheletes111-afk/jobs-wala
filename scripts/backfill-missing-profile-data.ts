import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient, ResumeParseStatus } from "@prisma/client";
import { parseResumeDetailedWithOpenAI } from "../lib/openai-resume-parser";
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
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      console.log(`[DOWNLOAD] Fetching via HTTP: ${url}`);
      const res = await fetch(url);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
      console.log(`[DOWNLOAD] HTTP fetch failed (status ${res.status}), trying R2 SDK fallback`);
    } catch (e: any) {
      console.log(`[DOWNLOAD] HTTP fetch error: ${e.message}, trying R2 SDK fallback`);
    }
  }

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
  console.log("=== Starting Profile Backfill Script ===");

  const profiles = await prisma.jobSeekerProfile.findMany({
    where: {
      resumeUrl: {
        not: null,
      },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  console.log(`Found ${profiles.length} profiles with a resume URL.`);

  let processedCount = 0;
  let skippedCount = 0;
  let successCount = 0;
  let failCount = 0;

  for (const profile of profiles) {
    const fullName = `${profile.firstName} ${profile.lastName}`;
    console.log(`\n--------------------------------------------------`);
    console.log(`[${++processedCount}/${profiles.length}] Checking: ${fullName} (ID: ${profile.id})`);

    const hasSkills = profile.skills && profile.skills.length > 0;
    const hasBio = !!profile.bio;
    const hasJobTitle = !!profile.jobTitle;
    const hasExperience = profile.experience !== null && profile.experience !== 0;

    // Check if profile already has core data
    if (hasSkills && hasBio && hasJobTitle && hasExperience) {
      console.log("⚡ Profile already has skills, bio, jobTitle, and experience. Skipping parsing.");
      skippedCount++;
      continue;
    }

    if (!profile.resumeUrl) {
      console.log("⚠️ No resume URL found on profile. Skipping.");
      skippedCount++;
      continue;
    }

    console.log(`🔍 Missing data detected. Downloading and parsing resume: ${profile.resumeUrl}`);

    try {
      const buffer = await downloadResume(profile.resumeUrl);
      const filename = profile.resumeUrl.split("/").pop() || "resume.pdf";

      console.log("🤖 Parsing resume with OpenAI Detailed Parser...");
      const parsed = await parseResumeDetailedWithOpenAI(buffer, filename, "application/pdf");

      if (!parsed.name && !parsed.email && !parsed.phone && parsed.skills.length === 0) {
        console.log("⚠️ Parser returned empty/invalid results. Skipping update.");
        failCount++;
        continue;
      }

      // 1. Prepare updates for JobSeekerProfile (only filling empty fields or merging skills)
      const updateData: any = {};

      if (parsed.skills && parsed.skills.length > 0) {
        const mergedSkills = Array.from(new Set([...(profile.skills || []), ...parsed.skills]));
        updateData.skills = mergedSkills;
      }
      if (parsed.phone && !profile.phone) updateData.phone = parsed.phone;
      if (parsed.location && !profile.location) updateData.location = parsed.location;
      if (parsed.currentTitle && !profile.jobTitle) updateData.jobTitle = parsed.currentTitle;
      if (parsed.experienceYears !== null && (profile.experience === null || profile.experience === 0)) {
        updateData.experience = parsed.experienceYears;
      }
      if (parsed.education && parsed.education.length > 0 && !profile.education) {
        updateData.education = parsed.education.join(", ");
      }
      if (parsed.summary && !profile.bio) updateData.bio = parsed.summary;
      if (parsed.linkedinUrl && !profile.linkedinUrl) updateData.linkedinUrl = parsed.linkedinUrl;
      if (parsed.highestEducation && !profile.highestEducation) updateData.highestEducation = parsed.highestEducation;
      if (parsed.noticePeriod && !profile.noticePeriod) updateData.noticePeriod = parsed.noticePeriod;
      if (parsed.dateOfBirth && !profile.dateOfBirth) {
        try {
          updateData.dateOfBirth = new Date(parsed.dateOfBirth);
        } catch (_) {}
      }

      await prisma.jobSeekerProfile.update({
        where: { id: profile.id },
        data: updateData,
      });

      console.log("✅ Updated JobSeekerProfile with parsed fields.");

      // 2. Update or create ResumeDocument
      const r2Key = extractS3KeyFromUrl(profile.resumeUrl) || profile.resumeUrl;
      const docData = {
        originalFileName: filename,
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        r2Key,
        r2Url: profile.resumeUrl,
        parseStatus: ResumeParseStatus.PARSED,
        extractedText: parsed.extractedText || "",
        extractedName: parsed.name || fullName,
        extractedEmail: parsed.email || profile.user?.email || "",
        extractedPhone: parsed.phone || profile.phone,
        extractedLocation: parsed.location || profile.location,
        experienceYears: parsed.experienceYears || profile.experience,
        currentTitle: parsed.currentTitle || profile.jobTitle,
        extractedData: {
          education: parsed.education,
          summary: parsed.summary,
          linkedinUrl: parsed.linkedinUrl,
          highestEducation: parsed.highestEducation,
          noticePeriod: parsed.noticePeriod,
          dateOfBirth: parsed.dateOfBirth,
        },
        skills: parsed.skills,
        userId: profile.userId,
      };

      const existingDoc = await prisma.resumeDocument.findFirst({
        where: { userId: profile.userId },
      });

      if (existingDoc) {
        await prisma.resumeDocument.update({
          where: { id: existingDoc.id },
          data: docData,
        });
        console.log(`✅ Updated existing ResumeDocument: ${existingDoc.id}`);
      } else {
        const newDoc = await prisma.resumeDocument.create({
          data: docData,
        });
        console.log(`✅ Created new ResumeDocument: ${newDoc.id}`);
      }

      successCount++;
    } catch (err: any) {
      console.error(`❌ Failed to process candidate ${fullName}:`, err.message || err);
      failCount++;
    }
  }

  console.log("\n=== Backfill Script Completed ===");
  console.log(`Total: ${profiles.length}`);
  console.log(`Skipped (Up-to-date): ${skippedCount}`);
  console.log(`Successfully backfilled: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

main()
  .catch((e) => {
    console.error("Fatal error in script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
