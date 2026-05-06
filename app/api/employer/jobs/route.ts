import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/employer/jobs
 * Query: page, limit, search, category, country, state, city
 * Backend pagination (default 10 per page) and filters.
 * Location filter matches JSON stored in job.location: { country, state, city }
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
    const category = (searchParams.get("category") || "").trim();
    let country = (searchParams.get("country") || "").trim();
    let state = (searchParams.get("state") || "").trim();
    let city = (searchParams.get("city") || "").trim();
    const locationJson = searchParams.get("location") || "";
    if (locationJson) {
      try {
        const loc = JSON.parse(decodeURIComponent(locationJson)) as { country?: string; state?: string; city?: string };
        if (loc.country) country = loc.country.trim();
        if (loc.state) state = loc.state.trim();
        if (loc.city) city = loc.city.trim();
      } catch {
        // ignore invalid JSON
      }
    }

    const andParts: Array<Record<string, unknown>> = [];
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
        location: { contains: `"country":"${country.replace(/"/g, '\\"')}"`, mode: "insensitive" as const },
      });
    }
    if (state) {
      andParts.push({
        location: { contains: `"state":"${state.replace(/"/g, '\\"')}"`, mode: "insensitive" as const },
      });
    }
    if (city) {
      andParts.push({
        location: { contains: `"city":"${city.replace(/"/g, '\\"')}"`, mode: "insensitive" as const },
      });
    }

    const where = {
      postedBy: profile.userId,
      ...(andParts.length > 0 ? { AND: andParts } : {}),
    };

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employer: { select: { companyName: true, companyLogo: true } },
          _count: { select: { applications: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        location: j.location,
        category: j.category,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        payType: j.payType,
        status: j.status,
        employer: j.employer,
        _count: j._count,
      })),
      total,
      totalPages,
      page,
      limit,
    });
  } catch (e) {
    console.error("[GET /api/employer/jobs]", e);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}
