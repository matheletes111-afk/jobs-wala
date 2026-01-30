import { NextRequest, NextResponse } from "next/server";
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
  resumeUrl: z.string().url().optional().nullable(),
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
      data,
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

