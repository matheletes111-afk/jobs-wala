import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { ResumeParseStatus } from "@prisma/client";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3, extractS3KeyFromUrl } from "@/lib/s3";
import { parseResumeWithOpenAI, guessNameFromFilename } from "@/lib/openai-resume-parser";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFileToS3(buffer, file.name, file.type, "resume-database");
    const r2Key = extractS3KeyFromUrl(url) || url;
    const parsed = await parseResumeWithOpenAI(buffer, file.name, file.type);

    let existingDoc = null;
    if (parsed.email) {
      existingDoc = await prisma.resumeDocument.findFirst({
        where: { extractedEmail: parsed.email },
      });
    }
    if (!existingDoc && parsed.phone) {
      existingDoc = await prisma.resumeDocument.findFirst({
        where: { extractedPhone: parsed.phone },
      });
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

    let doc;
    if (existingDoc) {
      doc = await prisma.resumeDocument.update({
        where: { id: existingDoc.id },
        data: docData,
      });
      console.log(`[employer-bulk-upload] Updated duplicate ResumeDocument (ID: ${existingDoc.id})`);
    } else {
      doc = await prisma.resumeDocument.create({
        data: docData,
      });
    }
    return { success: true, doc };
  } catch (error) {
    const parseError =
      error instanceof Error ? error.message : "Unknown upload/parse error";
    console.error(`[employer-bulk-upload] Failed to process file "${file.name}":`, parseError);
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

async function processInBatches(files: File[], batchSize: number) {
  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFile));
    results.push(...batchResults);
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireEmployer();

    // Verify upload access
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
      select: { resumeUploadEnabled: true, approvalStatus: true },
    });

    if (profile?.approvalStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Your profile is not yet approved." },
        { status: 403 }
      );
    }

    if (!profile?.resumeUploadEnabled) {
      return NextResponse.json(
        { error: "Resume database upload access is disabled for your account." },
        { status: 403 }
      );
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

    console.log(`[employer-bulk-upload] Starting bulk upload of ${files.length} files for employer ${user.id}`);

    // Process in batches of 5
    const BATCH_SIZE = 5;
    const results = await processInBatches(files, BATCH_SIZE);

    let successCount = 0;
    let failedCount = 0;
    const createdDocs = [];

    for (const res of results) {
      createdDocs.push(res.doc);
      if (res.success) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    return NextResponse.json({
      totalFiles: files.length,
      successCount,
      failedCount,
      createdDocs,
    });
  } catch (error) {
    console.error("[POST /api/employer/resume-search/bulk-upload]", error);
    return NextResponse.json(
      { error: "Failed to upload resume documents." },
      { status: 500 }
    );
  }
}
