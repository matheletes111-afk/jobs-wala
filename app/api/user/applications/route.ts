import { NextRequest, NextResponse } from "next/server";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/applications
 * For job seekers: list own applications with backend pagination and filters.
 * Query: page, limit, search, category, location (JSON), status.
 * Search: job title, job description, cover letter.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireJobSeeker();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    let country = (searchParams.get("country") || "").trim();
    let state = (searchParams.get("state") || "").trim();
    let city = (searchParams.get("city") || "").trim();
    const locationParam = searchParams.get("location") || "";
    if (locationParam) {
      try {
        const loc = JSON.parse(decodeURIComponent(locationParam)) as {
          country?: string;
          state?: string;
          city?: string;
        };
        if (loc.country) country = loc.country.trim();
        if (loc.state) state = loc.state.trim();
        if (loc.city) city = loc.city.trim();
      } catch {
        // ignore invalid JSON
      }
    }

    const andParts: Array<Record<string, unknown>> = [
      { jobSeekerId: user.id },
    ];

    if (status) {
      andParts.push({
        status: status as "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED",
      });
    }

    if (search) {
      andParts.push({
        OR: [
          { job: { title: { contains: search, mode: "insensitive" as const } } },
          { job: { description: { contains: search, mode: "insensitive" as const } } },
          { coverLetter: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (category) {
      andParts.push({ job: { category } });
    }

    if (country) {
      andParts.push({
        job: {
          location: {
            contains: `"country":"${country.replace(/"/g, '\\"')}"`,
            mode: "insensitive" as const,
          },
        },
      });
    }
    if (state) {
      andParts.push({
        job: {
          location: {
            contains: `"state":"${state.replace(/"/g, '\\"')}"`,
            mode: "insensitive" as const,
          },
        },
      });
    }
    if (city) {
      andParts.push({
        job: {
          location: {
            contains: `"city":"${city.replace(/"/g, '\\"')}"`,
            mode: "insensitive" as const,
          },
        },
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
          job: {
            include: {
              employer: { select: { companyName: true, companyLogo: true } },
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
        job: {
          id: a.job.id,
          title: a.job.title,
          description: a.job.description,
          location: a.job.location,
          category: a.job.category,
          status: a.job.status,
          employer: a.job.employer,
        },
      })),
      total,
      totalPages,
      page,
      limit,
    });
  } catch (e) {
    console.error("[GET /api/user/applications]", e);
    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 }
    );
  }
}
