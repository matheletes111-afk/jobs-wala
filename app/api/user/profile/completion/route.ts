import { NextRequest, NextResponse } from "next/server";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompletion, canApplyForJobs } from "@/lib/profile-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireJobSeeker();

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    const completion = calculateProfileCompletion(profile);
    const applicationEligibility = canApplyForJobs(profile);

    return NextResponse.json({
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
    console.error("Profile completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
