import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireJobSeeker } from "@/lib/auth-utils";
import { uploadFileToS3, extractS3KeyFromUrl } from "@/lib/s3";
import { parseResumeDetailedWithOpenAI } from "@/lib/openai-resume-parser";
import { prisma } from "@/lib/prisma";
import { ResumeParseStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireJobSeeker();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("[RESUME UPLOAD] Starting upload for file:", file.name);
    console.log("[RESUME UPLOAD] File size:", file.size, "bytes");
    console.log("[RESUME UPLOAD] File type:", file.type);

    const url = await uploadFileToS3(
      buffer,
      file.name,
      file.type
    );

    console.log("[RESUME UPLOAD] ✅ Upload successful, URL:", url);

    let skills: string[] = [];
    let name: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let location: string | null = null;
    let experienceYears: number | null = null;
    let currentTitle: string | null = null;
    let education: string[] = [];
    let summary: string | null = null;
    let linkedinUrl: string | null = null;
    let highestEducation: string | null = null;
    let noticePeriod: string | null = null;
    let dateOfBirth: string | null = null;
    let extractedText: string | null = null;

    try {
      console.log("[RESUME UPLOAD] Parsing resume with OpenAI Detailed Parser...");
      const parsed = await parseResumeDetailedWithOpenAI(buffer, file.name, file.type);
      
      // Validation check: if it lacks name, email, and phone, it is likely a random non-resume PDF document
      if (!parsed.name && !parsed.email && !parsed.phone) {
        console.log("[RESUME UPLOAD] Random document detected (no name/email/phone found). Restricting details extraction.");
      } else {
        extractedText = parsed.extractedText || null;
        skills = parsed.skills || [];
        name = parsed.name || null;
        email = parsed.email || null;
        phone = parsed.phone || null;
        location = parsed.location || null;
        experienceYears = parsed.experienceYears || null;
        currentTitle = parsed.currentTitle || null;
        education = parsed.education || [];
        summary = parsed.summary || null;
        linkedinUrl = parsed.linkedinUrl || null;
        highestEducation = parsed.highestEducation || null;
        noticePeriod = parsed.noticePeriod || null;
        dateOfBirth = parsed.dateOfBirth || null;
      }
      console.log("[RESUME UPLOAD] Parsed details successfully");

      // Sync to ResumeDocument database
      try {
        const r2Key = extractS3KeyFromUrl(url) || url;

        // 1. Check if resume document already exists for this userId
        let existingDoc = await prisma.resumeDocument.findFirst({
          where: { userId: user.id },
        });

        // 2. If not found by userId, check if matches by user's account email or parsed email
        if (!existingDoc && user.email) {
          existingDoc = await prisma.resumeDocument.findFirst({
            where: {
              OR: [
                { extractedEmail: user.email },
                ...(email ? [{ extractedEmail: email }] : []),
              ],
            },
          });
        }

        const docData = {
          originalFileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          r2Key,
          r2Url: url,
          parseStatus: ResumeParseStatus.PARSED,
          extractedText: extractedText || "",
          extractedName: name || user.email?.split("@")[0] || "Unknown",
          extractedEmail: email || user.email,
          extractedPhone: phone,
          extractedLocation: location,
          experienceYears,
          currentTitle,
          extractedData: {
            education,
            summary,
            linkedinUrl,
            highestEducation,
            noticePeriod,
            dateOfBirth,
          },
          skills,
          userId: user.id,
        };

        if (existingDoc) {
          await prisma.resumeDocument.update({
            where: { id: existingDoc.id },
            data: docData,
          });
          console.log(`[RESUME UPLOAD] Updated existing ResumeDocument: ${existingDoc.id}`);
        } else {
          const newDoc = await prisma.resumeDocument.create({
            data: docData,
          });
          console.log(`[RESUME UPLOAD] Created new ResumeDocument: ${newDoc.id}`);
        }
      } catch (dbErr) {
        console.error("[RESUME UPLOAD] Failed to sync to ResumeDocument database:", dbErr);
      }
    } catch (parseErr) {
      console.error("[RESUME UPLOAD] Resume parsing failed (non-fatal):", parseErr);
    }

    return NextResponse.json({
      url,
      skills,
      name,
      email,
      phone,
      location,
      experienceYears,
      currentTitle,
      education,
      summary,
      linkedinUrl,
      highestEducation,
      noticePeriod,
      dateOfBirth,
    });
  } catch (error) {
    console.error("[RESUME UPLOAD] ❌ Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload resume";
    return NextResponse.json(
      { 
        error: "Failed to upload resume",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

