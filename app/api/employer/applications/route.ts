import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/employer/applications
 * Query: page, limit, search, jobId, status
 * Backend pagination (default 10 per page) and filters.
 * Search: job title, applicant first/last name, cover letter.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireEmployer();
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Please complete your profile first." },
        { status: 400 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const jobId = (searchParams.get("jobId") || "").trim();
    const status = (searchParams.get("status") || "").trim();

    const andParts: Array<Record<string, unknown>> = [
      { job: { postedBy: profile.userId } },
    ];

    if (jobId) andParts.push({ jobId });
    if (status) andParts.push({ status: status as "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" });

    if (search) {
      andParts.push({
        OR: [
          { job: { title: { contains: search, mode: "insensitive" } } },
          { jobSeeker: { firstName: { contains: search, mode: "insensitive" } } },
          { jobSeeker: { lastName: { contains: search, mode: "insensitive" } } },
          { coverLetter: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where = { AND: andParts };

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          job: { select: { id: true, title: true, location: true, category: true } },
          jobSeeker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              resumeUrl: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        coverLetter: a.coverLetter,
        job: a.job,
        jobSeeker: a.jobSeeker,
      })),
      total,
      totalPages,
      page,
      limit,
    });
  } catch (e) {
    console.error("[GET /api/employer/applications]", e);
    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 }
    );
  }
}
