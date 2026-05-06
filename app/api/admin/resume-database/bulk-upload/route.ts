import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ResumeParseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3, extractS3KeyFromUrl } from "@/lib/s3";
import { parseResumeWithOpenAI } from "@/lib/openai-resume-parser";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

    const createdDocs = [];
    let successCount = 0;
    let failedCount = 0;

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        failedCount += 1;
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
        createdDocs.push(doc);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadFileToS3(
          buffer,
          file.name,
          file.type,
          "resume-database"
        );
        const r2Key = extractS3KeyFromUrl(url) || url;
        const parsed = await parseResumeWithOpenAI(buffer, file.name, file.type);

        const doc = await prisma.resumeDocument.create({
          data: {
            originalFileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            r2Key,
            r2Url: url,
            parseStatus: ResumeParseStatus.PARSED,
            extractedText: parsed.extractedText,
            extractedName: parsed.name,
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
          },
        });
        successCount += 1;
        createdDocs.push(doc);
      } catch (error) {
        const parseError =
          error instanceof Error ? error.message : "Unknown upload/parse error";
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
        failedCount += 1;
        createdDocs.push(doc);
      }
    }

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
