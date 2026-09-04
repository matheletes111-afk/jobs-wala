import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { computeSkillMatch } from "@/lib/skill-match";

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

    const andParts: Array<Record<string, unknown>> = [
      { status: "ACTIVE" as const },
      {
        employer: {
          approvalStatus: "APPROVED",
        },
      },
    ];

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
        // searchType === "all" (Omni search across all dimensions)
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

    if (title) {
      andParts.push({
        title: { contains: title, mode: "insensitive" as const },
      });
    }

    if (category && category !== "all") andParts.push({ category });

    if (country) {
      andParts.push({
        location: {
          contains: country,
          mode: "insensitive" as const,
        },
      });
    }

    if (state && state.length > 0) {
      const stateOrs = state.map(s => ({
        location: {
          contains: s,
          mode: "insensitive" as const,
        }
      }));
      andParts.push({ OR: stateOrs });
    }

    if (city && city.length > 0) {
      const cityOrs = city.map(c => ({
        location: {
          contains: c,
          mode: "insensitive" as const,
        }
      }));
      andParts.push({ OR: cityOrs });
    }

    if (locationRawTokens.length > 0) {
      locationRawTokens.forEach(token => {
        andParts.push({
          location: {
            contains: token,
            mode: "insensitive" as const,
          },
        });
      });
    }

    const where = { AND: andParts };

    let candidateSkills: string[] = [];
    let candidateBio: string | null = null;
    if (isJobSeeker && user) {
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: user.id },
        select: { skills: true, bio: true },
      });
      if (profile?.skills) {
        candidateSkills = profile.skills;
        candidateBio = profile.bio ?? null;
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
          const match = computeSkillMatch(
            [...(j.requiredSkills ?? []), ...(j.secondarySkills ?? [])],
            candidateSkills,
            candidateBio
          );
          matchScore = match.percent;
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
