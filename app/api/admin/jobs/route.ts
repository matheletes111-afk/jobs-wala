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
    const isExport = searchParams.get("export") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const sort = (searchParams.get("sort") || "desc").trim();
    const locationParam = searchParams.get("location") || "";
    let country = "";
    let state: string[] = [];
    let city: string[] = [];
    let locationRawTokens: string[] = [];

    if (locationParam) {
      try {
        const loc = JSON.parse(decodeURIComponent(locationParam)) as {
          country?: string;
          state?: string | string[];
          city?: string | string[];
        };
        if (loc && typeof loc === "object") {
          if (loc.country) country = String(loc.country).trim();
          if (loc.state) state = (Array.isArray(loc.state) ? loc.state : [String(loc.state)]).map(s => s.trim()).filter(Boolean);
          if (loc.city) city = (Array.isArray(loc.city) ? loc.city : [String(loc.city)]).map(c => c.trim()).filter(Boolean);
        }
      } catch {
        const raw = decodeURIComponent(locationParam).trim();
        locationRawTokens = raw.split(/[,\s]+/).map(t => t.trim()).filter(t => t.length > 0);
      }
    }

    const searchType = (searchParams.get("searchType") || "all").toLowerCase().trim();
    const skill = (searchParams.get("skill") || "").trim();
    const company = (searchParams.get("company") || "").trim();

    const andParts: Array<Record<string, unknown>> = [];

    if (search) {
      if (searchType === "skill") {
        andParts.push({
          OR: [
            { requiredSkills: { has: search } },
            { secondarySkills: { has: search } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        });
      } else if (searchType === "company") {
        andParts.push({
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { employer: { companyName: { contains: search, mode: "insensitive" as const } } },
          ],
        });
      } else if (searchType === "title") {
        andParts.push({
          title: { contains: search, mode: "insensitive" as const },
        });
      } else {
        const searchTokens = search.split(/\s+/).map((t) => t.trim()).filter(Boolean);
        const makeOrForTerm = (term: string) => ({
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
            { description: { contains: term, mode: "insensitive" as const } },
            { companyName: { contains: term, mode: "insensitive" as const } },
            { employer: { companyName: { contains: term, mode: "insensitive" as const } } },
            { category: { contains: term, mode: "insensitive" as const } },
            { requiredSkills: { has: term } },
            { secondarySkills: { has: term } },
          ],
        });

        if (searchTokens.length > 1) {
          andParts.push({
            OR: [
              makeOrForTerm(search),
              { AND: searchTokens.map((t) => makeOrForTerm(t)) },
            ],
          });
        } else {
          andParts.push(makeOrForTerm(search));
        }
      }
    }

    if (skill) {
      andParts.push({
        OR: [
          { requiredSkills: { has: skill } },
          { secondarySkills: { has: skill } },
          { description: { contains: skill, mode: "insensitive" as const } },
        ],
      });
    }

    if (company) {
      andParts.push({
        OR: [
          { companyName: { contains: company, mode: "insensitive" as const } },
          { employer: { companyName: { contains: company, mode: "insensitive" as const } } },
        ],
      });
    }

    if (category && category !== "all") andParts.push({ category });
    if (status && status !== "all") {
      andParts.push({
        status: status as "PENDING" | "ACTIVE" | "INACTIVE" | "PAUSED" | "CLOSED",
      });
    }
    if (country) {
      andParts.push({
        location: { contains: country, mode: "insensitive" as const },
      });
    }
    if (state && state.length > 0) {
      const stateOrs = state.map(s => ({
        location: { contains: s, mode: "insensitive" as const },
      }));
      andParts.push({ OR: stateOrs });
    }
    if (city && city.length > 0) {
      const cityOrs = city.map(c => ({
        location: { contains: c, mode: "insensitive" as const },
      }));
      andParts.push({ OR: cityOrs });
    }
    if (locationRawTokens.length > 0) {
      locationRawTokens.forEach(token => {
        andParts.push({
          location: { contains: token, mode: "insensitive" as const },
        });
      });
    }

    const where = andParts.length > 0 ? { AND: andParts } : {};

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: sort === "asc" ? "asc" as const : "desc" as const },
        ...(isExport ? {} : { skip: (page - 1) * limit, take: limit }),
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
        companyName: j.companyName ? j.companyName : j.employer.companyName,
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
