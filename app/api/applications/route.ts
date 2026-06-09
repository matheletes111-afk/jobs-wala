import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendNewApplicationEmail } from "@/lib/email";
import { canApplyForJobs } from "@/lib/profile-utils";
import { extractS3KeyFromUrl } from "@/lib/s3";
import { ResumeParseStatus } from "@prisma/client";

const applicationSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().optional().nullable().transform((v) => (v && v.trim().length >= 10 ? v.trim() : null)),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireJobSeeker();
    const body = await req.json();
    const data = applicationSchema.parse(body);

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        jobId_jobSeekerId: {
          jobId: data.jobId,
          jobSeekerId: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 400 }
      );
    }

    // Check if profile exists and is complete
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { 
          error: "Please complete your profile before applying",
          code: "PROFILE_INCOMPLETE",
          details: "Profile not created. Please complete your profile first.",
        },
        { status: 400 }
      );
    }

    // Check if profile meets requirements for applying
    const { canApply, missingRequirements } = canApplyForJobs(profile);
    
    if (!canApply) {
      return NextResponse.json(
        {
          error: "Profile incomplete. Please complete all required fields before applying.",
          code: "PROFILE_INCOMPLETE",
          missingRequirements,
          details: `Missing: ${missingRequirements.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Sync/verify resume exists in ResumeDocument database
    try {
      const existingDoc = await prisma.resumeDocument.findFirst({
        where: { userId: user.id },
      });

      if (!existingDoc && profile && profile.resumeUrl) {
        const r2Key = extractS3KeyFromUrl(profile.resumeUrl) || profile.resumeUrl;
        await prisma.resumeDocument.create({
          data: {
            originalFileName: profile.resumeUrl.split("/").pop() || "resume.pdf",
            mimeType: "application/pdf",
            sizeBytes: 0,
            r2Key,
            r2Url: profile.resumeUrl,
            parseStatus: ResumeParseStatus.PARSED,
            extractedName: `${profile.firstName} ${profile.lastName}`,
            extractedEmail: user.email || "",
            extractedPhone: profile.phone,
            extractedLocation: profile.location,
            experienceYears: profile.experience,
            currentTitle: profile.jobTitle,
            extractedData: {
              education: profile.education ? [profile.education] : [],
              summary: profile.bio,
              linkedinUrl: profile.linkedinUrl,
              highestEducation: profile.highestEducation,
              noticePeriod: profile.noticePeriod,
              dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split("T")[0] : null,
            },
            skills: profile.skills,
            userId: user.id,
          },
        });
        console.log(`[APPLICATION RESUME SYNC] Created fallback ResumeDocument for user ${user.id}`);
      }
    } catch (syncErr) {
      console.error("[APPLICATION RESUME SYNC] Failed to sync resume on application:", syncErr);
    }

    // Create application (cover letter optional)
    const application = await prisma.application.create({
      data: {
        jobId: data.jobId,
        jobSeekerId: user.id,
        coverLetter: data.coverLetter ?? null,
      },
      include: {
        job: {
          include: {
            employer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Send notification email to employer
    if (application.job.employer.user.email) {
      await sendNewApplicationEmail({
        to: application.job.employer.user.email,
        candidateName: `${profile.firstName} ${profile.lastName}`,
        jobTitle: application.job.title,
      });
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Application creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

