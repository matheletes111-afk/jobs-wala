import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/jobs
 * Query: page, limit, search, category, location (JSON), status
 * Backend pagination and filters for admin job management.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const sort = (searchParams.get("sort") || "desc").trim();
    let country = "";
    let state: string[] = [];
    let city: string[] = [];
    const locationParam = searchParams.get("location") || "";
    if (locationParam) {
      try {
        const loc = JSON.parse(decodeURIComponent(locationParam)) as { country?: string; state?: string | string[]; city?: string | string[] };
        if (loc.country) country = loc.country.trim();
        if (loc.state) state = Array.isArray(loc.state) ? loc.state : [loc.state.trim()];
        if (loc.city) city = Array.isArray(loc.city) ? loc.city : [loc.city.trim()];
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
    if (status) {
      andParts.push({
        status: status as "PENDING" | "ACTIVE" | "INACTIVE" | "PAUSED" | "CLOSED",
      });
    }
    if (country) {
      andParts.push({
        location: { contains: `"country":"${country.replace(/"/g, '\\"')}"`, mode: "insensitive" as const },
      });
    }
    if (state && state.length > 0) {
      const stateOrs = state.filter(s => s.trim()).map(s => ({
        location: { contains: `"${s.trim().replace(/"/g, '\\"')}"`, mode: "insensitive" as const }
      }));
      if (stateOrs.length > 0) andParts.push({ OR: stateOrs });
    }
    if (city && city.length > 0) {
      const cityOrs = city.filter(c => c.trim()).map(c => ({
        location: { contains: `"${c.trim().replace(/"/g, '\\"')}"`, mode: "insensitive" as const }
      }));
      if (cityOrs.length > 0) andParts.push({ OR: cityOrs });
    }

    const where = andParts.length > 0 ? { AND: andParts } : {};

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: sort === "asc" ? "asc" as const : "desc" as const },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employer: {
            select: {
              companyName: true,
              companyLogo: true,
              industry: true,
              companySize: true,
              description: true,
            },
          },
          _count: { select: { applications: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        location: j.location,
        category: j.category,
        status: j.status,
        experienceMin: j.experienceMin,
        experienceMax: j.experienceMax,
        employmentType: j.employmentType,
        workMode: j.workMode,
        requiredSkills: j.requiredSkills,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        payType: j.payType,
        createdAt: j.createdAt,
        expiresAt: j.expiresAt,
        employer: j.employer,
        _count: j._count,
      })),
      total,
      totalPages,
      page,
      limit,
    });
  } catch (e: any) {
    if (e?.digest?.startsWith("NEXT_REDIRECT") || e?.message === "NEXT_REDIRECT") {
      throw e;
    }
    console.error("[GET /api/admin/jobs]", e);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}
