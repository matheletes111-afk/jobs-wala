import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/jobs
 * For job seekers: browse ACTIVE jobs with backend pagination and filters.
 * Query: page, limit, search, category, location (JSON: country, state, city).
 * Returns appliedJobIds for the current user so UI can show "Already applied".
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireJobSeeker();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    let country = "";
    let state: string[] = [];
    let city: string[] = [];
    const locationParam = searchParams.get("location") || "";
    if (locationParam) {
      try {
        const loc = JSON.parse(decodeURIComponent(locationParam)) as {
          country?: string;
          state?: string | string[];
          city?: string | string[];
        };
        if (loc.country) country = loc.country.trim();
        if (loc.state) state = Array.isArray(loc.state) ? loc.state : [loc.state.trim()];
        if (loc.city) city = Array.isArray(loc.city) ? loc.city : [loc.city.trim()];
      } catch {
        // ignore invalid JSON
      }
    }

    const andParts: Array<Record<string, unknown>> = [
      { status: "ACTIVE" as const },
    ];
    if (search) {
      andParts.push({
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (category) andParts.push({ category });
    if (country) {
      andParts.push({
        location: {
          contains: `"country":"${country.replace(/"/g, '\\"')}"`,
          mode: "insensitive" as const,
        },
      });
    }
    if (state && state.length > 0) {
      const stateOrs = state.filter(s => s.trim()).map(s => ({
        location: {
          contains: `"${s.trim().replace(/"/g, '\\"')}"`,
          mode: "insensitive" as const,
        }
      }));
      if (stateOrs.length > 0) andParts.push({ OR: stateOrs });
    }
    if (city && city.length > 0) {
      const cityOrs = city.filter(c => c.trim()).map(c => ({
        location: {
          contains: `"${c.trim().replace(/"/g, '\\"')}"`,
          mode: "insensitive" as const,
        }
      }));
      if (cityOrs.length > 0) andParts.push({ OR: cityOrs });
    }

    const where = { AND: andParts };

    const [total, jobs, applications] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employer: { select: { companyName: true, companyLogo: true } },
        },
      }),
      prisma.application.findMany({
        where: { jobSeekerId: user.id },
        select: { jobId: true },
      }),
    ]);

    const appliedJobIds = applications.map((a) => a.jobId);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        location: j.location,
        category: j.category,
        salaryRange: j.salaryRange,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        payType: j.payType,
        employmentType: j.employmentType,
        experienceRequired: j.experienceRequired,
        employer: j.employer,
      })),
      total,
      totalPages,
      page,
      limit,
      appliedJobIds,
    });
  } catch (e) {
    console.error("[GET /api/user/jobs]", e);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}
