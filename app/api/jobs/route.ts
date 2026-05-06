import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendNewJobPostedNotificationToAdmin } from "@/lib/email";
import { z } from "zod";
import { EmploymentType, JobStatus, UserRole, WorkMode } from "@prisma/client";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

export async function POST(req: NextRequest) {
  try {
    const user = await requireEmployer();
    const body = await req.json();
    const data = jobSchema.parse(body);

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Please complete your company profile first" },
        { status: 400 }
      );
    }

    const activeSubscription = profile.subscriptions[0];

    // Check if subscription exists and is not expired
    if (!activeSubscription || new Date(activeSubscription.endDate) < new Date()) {
      return NextResponse.json(
        { error: "NO_ACTIVE_PLAN", message: "Please subscribe to a plan to post jobs" },
        { status: 403 }
      );
    }

    // Count jobs posted within the current subscription period
    const jobCount = await prisma.job.count({
      where: {
        postedBy: user.id,
        createdAt: { gte: activeSubscription.startDate },
      },
    });

    if (activeSubscription.plan.jobLimit !== -1 && jobCount >= activeSubscription.plan.jobLimit) {
      return NextResponse.json(
        { error: "PLAN_LIMIT_REACHED", message: `You have reached your limit of ${activeSubscription.plan.jobLimit} jobs for this plan.` },
        { status: 403 }
      );
    }

    const job = await prisma.job.create({
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
        postedBy: profile.userId,
        status: JobStatus.PENDING,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Notify all admins so they can review and approve or reject the job
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { email: true },
      });
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const reviewUrl = `${baseUrl}/admin/jobs/${job.id}`;
      for (const admin of admins) {
        await sendNewJobPostedNotificationToAdmin({
          to: admin.email,
          jobTitle: job.title,
          companyName: profile.companyName,
          reviewUrl,
        });
      }
    } catch (emailErr) {
      console.error("[POST /api/jobs] Admin notification email failed:", emailErr);
      // Do not fail job creation if email fails
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
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
  const category = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page") || String(DEFAULT_PAGE), 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10))
  );
  const usePagination = searchParams.get("page") !== null || searchParams.get("limit") !== null;

  const where: { postedBy?: string; category?: string; status?: JobStatus } = {};
  // Public listing: default to ACTIVE only (no auth required)
  where.status = JobStatus.ACTIVE;
  if (employerId) where.postedBy = employerId;
  if (category) where.category = category;

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip: usePagination ? (page - 1) * limit : 0,
      take: usePagination ? limit : 50,
      orderBy: { createdAt: "desc" },
      include: {
        employer: {
          select: { companyName: true, companyLogo: true },
        },
      },
    }),
  ]);

  if (!usePagination) {
    return NextResponse.json(jobs);
  }

  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    jobs,
    total,
    totalPages,
    page,
    limit,
  });
}

