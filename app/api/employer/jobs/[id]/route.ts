import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { JobStatus } from "@prisma/client";

const updateSchema = z.object({
  status: z.enum([JobStatus.ACTIVE, JobStatus.PAUSED, JobStatus.CLOSED]),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ["PAUSED", "CLOSED"],
  PAUSED: ["ACTIVE"],
  CLOSED: [], // Cannot transition from CLOSED
  PENDING: [], // Only admin can set to ACTIVE
  INACTIVE: ["ACTIVE", "PAUSED", "CLOSED"], // Legacy: allow same as ACTIVE
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireEmployer();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Please complete your profile first." },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id },
    });
    if (!job || job.postedBy !== profile.userId) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const currentStatus = job.status as string;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(data.status)) {
      if (currentStatus === "CLOSED") {
        return NextResponse.json(
          { error: "This job is permanently closed and cannot be re-opened." },
          { status: 400 }
        );
      }
      if (currentStatus === "PENDING") {
        return NextResponse.json(
          { error: "This job is pending approval. Only an admin can activate it." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${data.status}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Employer job update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
