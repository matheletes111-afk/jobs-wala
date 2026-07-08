import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes for large bulk uploads (e.g. 27 resumes)
export const maxDuration = 300;

import { ResumeParseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3, extractS3KeyFromUrl } from "@/lib/s3";
import { parseResumeWithOpenAI, guessNameFromFilename } from "@/lib/openai-resume-parser";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Process a single file: upload to S3 + parse with OpenAI + save to DB
async function processFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    const doc = await prisma.resumeDocument.create({
      data: {
        originalFileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        r2Key: "invalid-file-type",
        r2Url: "invalid-file-type",
        parseStatus: ResumeParseStatus.FAILED,
        parseError: `Unsupported file type: ${file.type || "unknown"}`,
      },
    });
    return { success: false, doc };
  }

  try {
    if (file.name) {
      const nameExists = await prisma.resumeDocument.findFirst({
        where: { originalFileName: file.name },
      });
      if (nameExists) {
        throw new Error(`Duplicate file: A document named "${file.name}" has already been uploaded.`);
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFileToS3(buffer, file.name, file.type, "resume-database");
    const r2Key = extractS3KeyFromUrl(url) || url;
    const parsed = await parseResumeWithOpenAI(buffer, file.name, file.type);

    if (parsed.isResume === false) {
      throw new Error("Invalid document format: The uploaded file does not appear to be a candidate's resume/CV.");
    }

    if (parsed.email) {
      const emailExists = await prisma.resumeDocument.findFirst({
        where: { extractedEmail: parsed.email },
      });
      if (emailExists) {
        throw new Error(`Duplicate candidate: A resume for email "${parsed.email}" already exists.`);
      }
    }
    if (parsed.phone) {
      const phoneExists = await prisma.resumeDocument.findFirst({
        where: { extractedPhone: parsed.phone },
      });
      if (phoneExists) {
        throw new Error(`Duplicate candidate: A resume for phone number "${parsed.phone}" already exists.`);
      }
    }

    const docData = {
      originalFileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      r2Key,
      r2Url: url,
      parseStatus: ResumeParseStatus.PARSED,
      extractedText: parsed.extractedText || "",
      extractedName: parsed.name || guessNameFromFilename(file.name) || "Unknown",
      extractedEmail: parsed.email,
      extractedPhone: parsed.phone,
      extractedLocation: parsed.location,
      experienceYears: parsed.experienceYears,
      currentTitle: parsed.currentTitle,
      extractedData: {
        education: parsed.education,
        summary: parsed.summary,
      },
      skills: parsed.skills,
    };

    const doc = await prisma.resumeDocument.create({
      data: docData,
    });
    return { success: true, doc };
  } catch (error) {
    const parseError =
      error instanceof Error ? error.message : "Unknown upload/parse error";
    console.error(`[bulk-upload] Failed to process file "${file.name}":`, parseError);
    const doc = await prisma.resumeDocument.create({
      data: {
        originalFileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        r2Key: "upload-failed",
        r2Url: "upload-failed",
        parseStatus: ResumeParseStatus.FAILED,
        parseError,
      },
    });
    return { success: false, doc };
  }
}

// Process an array of files in batches to avoid overwhelming the server / OpenAI rate limits
async function processInBatches(files: File[], batchSize: number) {
  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(
      `[bulk-upload] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (files ${i + 1}–${Math.min(i + batchSize, files.length)} of ${files.length})`
    );
    const batchResults = await Promise.all(batch.map(processFile));
    results.push(...batchResults);
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided. Use formData key 'files'." },
        { status: 400 }
      );
    }

    console.log(`[bulk-upload] Starting bulk upload of ${files.length} files`);

    // Process in batches of 5 to prevent timeouts and rate limiting
    const BATCH_SIZE = 5;
    const results = await processInBatches(files, BATCH_SIZE);

    const createdDocs = [];
    let successCount = 0;
    let failedCount = 0;

    for (const res of results) {
      createdDocs.push(res.doc);
      if (res.success) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    console.log(
      `[bulk-upload] ✅ Done: ${successCount} parsed, ${failedCount} failed out of ${files.length} files`
    );

    return NextResponse.json({
      totalFiles: files.length,
      successCount,
      failedCount,
      createdDocs,
    });
  } catch (error) {
    console.error("[POST /api/admin/resume-database/bulk-upload]", error);
    return NextResponse.json(
      { error: "Failed to bulk upload resume documents." },
      { status: 500 }
    );
  }
}
