import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { formatLocation } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { matchSkill } from "@/lib/skill-match";

export async function GET(req: NextRequest) {
  try {
    await requireEmployer();

    const searchParams = req.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || "";
    const skillsParam = searchParams.get("skills") || "";
    const location = searchParams.get("location") || "";

    const where: Prisma.JobSeekerProfileWhereInput = {};
    const hasKeyword = keyword.trim().length > 0;

    // Apply plain-text location filter in Prisma where if not JSON
    const isLocationJson = location.trim().startsWith("{");
    if (location && !isLocationJson) {
      where.location = { contains: location, mode: "insensitive" };
    }

    const skillsArray = skillsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let candidates = await prisma.jobSeekerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: 1000,
    });

    // Keyword: match name, jobTitle, bio, education, any skill, or location (all-in-one search)
    if (hasKeyword) {
      const kw = keyword.trim().toLowerCase();
      candidates = candidates.filter((c) => {
        const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase();
        if (fullName.includes(kw)) return true;
        if (c.firstName?.toLowerCase().includes(kw)) return true;
        if (c.lastName?.toLowerCase().includes(kw)) return true;
        if (c.jobTitle?.toLowerCase().includes(kw)) return true;
        if (c.bio?.toLowerCase().includes(kw)) return true;
        if (c.education?.toLowerCase().includes(kw)) return true;
        if (c.user?.email?.toLowerCase().includes(kw)) return true;
        if (c.skills.some((s) => s.toLowerCase().includes(kw) || kw.includes(s.toLowerCase()))) return true;
        if (c.location) {
          try {
            const formatted = formatLocation(c.location);
            if (formatted.toLowerCase().includes(kw)) return true;
          } catch {
            if (c.location.toLowerCase().includes(kw)) return true;
          }
        }
        return false;
      });
    }

    // Skills filter: accurate match using matchSkill
    if (skillsArray.length > 0) {
      candidates = candidates.filter((c) => {
        return skillsArray.every((term) =>
          c.skills.some((skill) => matchSkill(skill, term))
        );
      });
    }

    // Plain-text location filter (when keyword was used we didn't add it to Prisma where)
    if (location && !isLocationJson && location.trim()) {
      const locLower = location.toLowerCase();
      candidates = candidates.filter((c) =>
        c.location?.toLowerCase().includes(locLower)
      );
    }

    // Apply JSON location filter in memory (same logic as /user/jobs JobSearch)
    if (location && isLocationJson) {
      try {
        const locationData = JSON.parse(location);
        
        let targetCountry = "";
        let targetStates: string[] = [];
        let targetCities: string[] = [];
        
        if (locationData.country) targetCountry = locationData.country.trim().toLowerCase();
        if (locationData.state) targetStates = (Array.isArray(locationData.state) ? locationData.state : [locationData.state]).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        if (locationData.city) targetCities = (Array.isArray(locationData.city) ? locationData.city : [locationData.city]).map((c: string) => c.trim().toLowerCase()).filter(Boolean);
        
        const hasLocationFilter = targetCountry || targetStates.length > 0 || targetCities.length > 0;
        
        if (hasLocationFilter) {
          candidates = candidates.filter((candidate) => {
            if (!candidate.location) return false;
            try {
              const candidateLocation = JSON.parse(candidate.location);
              let matches = false;
              
              let candStates: string[] = [];
              let candCities: string[] = [];
              
              if (candidateLocation.state) candStates = (Array.isArray(candidateLocation.state) ? candidateLocation.state : [candidateLocation.state]).map((s: string) => s.trim().toLowerCase());
              if (candidateLocation.city) candCities = (Array.isArray(candidateLocation.city) ? candidateLocation.city : [candidateLocation.city]).map((c: string) => c.trim().toLowerCase());
              
              if (targetCities.length > 0) {
                matches = targetCities.some(tc => candCities.includes(tc));
              } else if (targetStates.length > 0) {
                matches = targetStates.some(ts => candStates.includes(ts));
              } else if (targetCountry) {
                matches = candidateLocation.country && candidateLocation.country.trim().toLowerCase() === targetCountry;
              }
              return matches;
            } catch {
              try {
                const formattedLocation = formatLocation(location as string);
                return candidate.location
                  .toLowerCase()
                  .includes(formattedLocation.toLowerCase());
              } catch {
                return candidate.location.toLowerCase().includes(location.toLowerCase());
              }
            }
          });
        }
      } catch {
        candidates = candidates.filter((c) =>
          c.location?.toLowerCase().includes(location.toLowerCase())
        );
      }
    }

    // Backend pagination
    const isExport = searchParams.get("export") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const total = candidates.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = isExport ? candidates : candidates.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      candidates: paginated,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

