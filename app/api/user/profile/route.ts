import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateProfileCompletion, canApplyForJobs } from "@/lib/profile-utils";

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  experience: z.number().optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()),
  profileImage: z.preprocess((v) => (v === "" ? null : v), z.string().url().optional().nullable()),
  resumeUrl: z.string().url().optional().nullable(),
  certificates: z.string().optional().nullable(), // JSON string
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  highestEducation: z.string().optional().nullable(),
  currentSalary: z.preprocess((v) => (v === "" || v === undefined || v === null ? null : Number(v)), z.number().optional().nullable()),
  currentSalaryCurrency: z.string().optional().nullable(),
  expectedSalary: z.preprocess((v) => (v === "" || v === undefined || v === null ? null : Number(v)), z.number().optional().nullable()),
  expectedSalaryCurrency: z.string().optional().nullable(),
  desiredLocation: z.string().optional().nullable(),
  noticePeriod: z.string().optional().nullable(),
  dateOfBirth: z.preprocess((v) => (v === "" || v === undefined || v === null ? null : typeof v === "string" ? new Date(v) : v), z.date().optional().nullable()),
  preferredCategories: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireJobSeeker();

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const completion = calculateProfileCompletion(profile);
    const applicationEligibility = canApplyForJobs(profile);

    return NextResponse.json({
      ...profile,
      completion: {
        percentage: completion.percentage,
        isComplete: completion.isComplete,
        completedFields: completion.completedFields,
        missingFields: completion.missingFields,
      },
      applicationEligibility: {
        canApply: applicationEligibility.canApply,
        missingRequirements: applicationEligibility.missingRequirements,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireJobSeeker();
    const body = await req.json();
    const data = profileSchema.parse(body);

    const profile = await prisma.jobSeekerProfile.create({
      data: {
        userId: user.id,
        ...data,
        ...(data.resumeUrl != null && { resumeUpdatedAt: new Date() }),
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireJobSeeker();
    const body = await req.json();
    const data = profileSchema.parse(body);
    const profile = await prisma.jobSeekerProfile.update({
      where: { userId: user.id },
      data: {
        ...data,
        ...(data.resumeUrl != null && { resumeUpdatedAt: new Date() }),
      },
    });

    const completion = calculateProfileCompletion(profile);
    const applicationEligibility = canApplyForJobs(profile);

    return NextResponse.json({
      ...profile,
      completion: {
        percentage: completion.percentage,
        isComplete: completion.isComplete,
        completedFields: completion.completedFields,
        missingFields: completion.missingFields,
      },
      applicationEligibility: {
        canApply: applicationEligibility.canApply,
        missingRequirements: applicationEligibility.missingRequirements,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const patchResumeSchema = z.object({
  resumeUrl: z.string().url().nullable(),
  skills: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  education: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().optional(),
  highestEducation: z.string().optional(),
  noticePeriod: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireJobSeeker();
    const body = await req.json();
    const data = patchResumeSchema.parse(body);

    const existing = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    const updateData: any = {
      resumeUrl: data.resumeUrl,
      resumeUpdatedAt: data.resumeUrl ? new Date() : null,
    };

    if (existing) {
      if (data.skills && data.skills.length > 0) {
        const mergedSkills = Array.from(new Set([...(existing.skills || []), ...data.skills]));
        updateData.skills = mergedSkills;
      }
      if (data.phone && !existing.phone) updateData.phone = data.phone;
      if (data.location && !existing.location) updateData.location = data.location;
      if (data.jobTitle && !existing.jobTitle) updateData.jobTitle = data.jobTitle;
      if (data.experience !== undefined && (existing.experience === null || existing.experience === 0)) {
        updateData.experience = data.experience;
      }
      if (data.education && !existing.education) updateData.education = data.education;
      if (data.bio && !existing.bio) updateData.bio = data.bio;
      if (data.linkedinUrl && !existing.linkedinUrl) updateData.linkedinUrl = data.linkedinUrl;
      if (data.highestEducation && !existing.highestEducation) updateData.highestEducation = data.highestEducation;
      if (data.noticePeriod && !existing.noticePeriod) updateData.noticePeriod = data.noticePeriod;
      if (data.dateOfBirth && !existing.dateOfBirth) {
        try {
          updateData.dateOfBirth = new Date(data.dateOfBirth);
        } catch (_) {}
      }
    }

    const profile = await prisma.jobSeekerProfile.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Profile PATCH resume error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

