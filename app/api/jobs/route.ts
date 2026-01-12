import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { EmploymentType, JobStatus } from "@prisma/client";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  experienceRequired: z.number().min(0).optional(),
  salaryRange: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireEmployer();
    const body = await req.json();
    const data = jobSchema.parse(body);

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Please complete your company profile first" },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        ...data,
        postedBy: profile.userId,
        status: JobStatus.PENDING,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const employerId = searchParams.get("employerId");

  const where: any = {};
  if (employerId) {
    where.postedBy = employerId;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      employer: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

