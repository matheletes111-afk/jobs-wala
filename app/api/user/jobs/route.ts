import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * GET /api/user/jobs
 * For job seekers/public: browse ACTIVE jobs with backend pagination and filters.
 * Query: page, limit, search, category, location (JSON: country, state, city).
 * Returns appliedJobIds for the current user so UI can show "Already applied".
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const isJobSeeker = user?.role === UserRole.JOB_SEEKER;

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const title = (searchParams.get("title") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const sort = (searchParams.get("sort") || "desc").trim();
    let country = "";
    let state: string[] = [];
    let city: string[] = [];
    let locationRawSearch = "";
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
        // Fallback: If it is not a valid JSON string (e.g. from homepage banner), treat it as raw text search query
        locationRawSearch = decodeURIComponent(locationParam).trim();
      }
    }

    const andParts: Array<Record<string, unknown>> = [
      { status: "ACTIVE" as const },
      {
        employer: {
          approvalStatus: "APPROVED",
        },
      },
    ];
    if (search) {
      andParts.push({
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (title) {
      andParts.push({
        title: { contains: title, mode: "insensitive" as const },
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
    if (locationRawSearch) {
      andParts.push({
        location: {
          contains: locationRawSearch,
          mode: "insensitive" as const,
        },
      });
    }

    const where = { AND: andParts };

    let candidateSkills: string[] = [];
    if (isJobSeeker && user) {
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: user.id },
        select: { skills: true },
      });
      if (profile?.skills) {
        candidateSkills = profile.skills;
      }
    }

    const [total, jobs, applications] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: sort === "asc" ? "asc" as const : "desc" as const },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employer: { select: { companyName: true, companyLogo: true } },
        },
      }),
      isJobSeeker && user
        ? prisma.application.findMany({
            where: { jobSeekerId: user.id },
            select: { jobId: true },
          })
        : Promise.resolve([]),
    ]);

    const appliedJobIds = applications.map((a) => a.jobId);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      jobs: jobs.map((j) => {
        let matchScore: number | null = null;
        if (isJobSeeker && candidateSkills.length > 0) {
          const reqSkills = j.requiredSkills ?? [];
          if (reqSkills.length === 0) {
            matchScore = 100;
          } else {
            const matchedCount = reqSkills.filter((reqSkill) =>
              candidateSkills.some(
                (candSkill) =>
                  candSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
                  reqSkill.toLowerCase().includes(candSkill.toLowerCase())
              )
            ).length;
            matchScore = Math.round((matchedCount / reqSkills.length) * 100);
          }
        }

        return {
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
          companyName: j.companyName ? j.companyName : j.employer.companyName,
          employer: j.employer,
          createdAt: j.createdAt,
          matchScore,
          requiredSkills: j.requiredSkills ?? [],
          secondarySkills: j.secondarySkills ?? [],
        };
      }),
      total,
      totalPages,
      page,
      limit,
      appliedJobIds,
      candidateSkills: isJobSeeker ? candidateSkills : [],
    });
  } catch (e: any) {
    if (e?.digest?.startsWith("NEXT_REDIRECT") || e?.message === "NEXT_REDIRECT") {
      throw e;
    }
    console.error("[GET /api/user/jobs]", e);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}
