import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { EmploymentType, WorkMode } from "@prisma/client";

const payTypeEnum = z.enum(["HOURLY", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"]);

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  experienceRequired: z.number().min(0).nullish(),
  experienceMin: z.number().min(0).nullish(),
  experienceMax: z.number().min(0).nullish(),
  salaryRange: z.string().nullish(),
  salaryMin: z.number().min(0).nullish(),
  salaryMax: z.number().min(0).nullish(),
  currency: z.string().nullish(),
  payType: payTypeEnum.nullish(),
  requiredSkills: z.array(z.string()).nullish(),
  secondarySkills: z.array(z.string()).nullish(),
  employmentType: z.nativeEnum(EmploymentType),
  workMode: z.nativeEnum(WorkMode).nullish(),
  expiresAt: z.string().datetime().nullish(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEmployer();
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("[GET /api/jobs/[id]] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireEmployer();
    const { id } = await params;
    const body = await req.json();
    const data = jobSchema.parse(body);

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.postedBy !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        experienceRequired: data.experienceRequired ?? data.experienceMin ?? 0,
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        salaryRange: data.salaryRange,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        payType: data.payType,
        requiredSkills: data.requiredSkills ?? [],
        secondarySkills: data.secondarySkills ?? [],
        employmentType: data.employmentType,
        workMode: data.workMode || WorkMode.ONSITE,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[PUT /api/jobs/[id]] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
