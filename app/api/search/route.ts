import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { formatLocation } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireEmployer();

    const searchParams = req.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || "";
    const skillsParam = searchParams.get("skills") || "";
    const location = searchParams.get("location") || "";

    const where: any = {};
    const hasKeyword = keyword.trim().length > 0;

    // When keyword is used we filter in memory so one search matches name, skill, location, jobTitle, bio, education
    if (!hasKeyword) {
      // No keyword: only apply location filter in Prisma if plain text
      const isLocationJson = location.trim().startsWith("{");
      if (location && !isLocationJson) {
        where.location = { contains: location, mode: "insensitive" };
      }
    }

    const skillsArray = skillsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const isLocationJson = location.trim().startsWith("{");

    let candidates = await prisma.jobSeekerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: hasKeyword ? 400 : 200,
    });

    // Keyword: match name, jobTitle, bio, education, any skill, or location (all-in-one search)
    if (hasKeyword) {
      const kw = keyword.trim().toLowerCase();
      candidates = candidates.filter((c) => {
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

    // Skills filter: partial match – e.g. "react" matches "react", "react js", "React Native"
    if (skillsArray.length > 0) {
      candidates = candidates.filter((c) => {
        return skillsArray.every((term) =>
          c.skills.some(
            (skill) =>
              skill.toLowerCase().includes(term.toLowerCase()) ||
              term.toLowerCase().includes(skill.toLowerCase())
          )
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
        const hasLocationFilter =
          (locationData.city && locationData.city.trim() !== "") ||
          (locationData.state && locationData.state.trim() !== "") ||
          (locationData.country && locationData.country.trim() !== "");
        if (hasLocationFilter) {
          candidates = candidates.filter((candidate) => {
            if (!candidate.location) return false;
            try {
              const candidateLocation = JSON.parse(candidate.location);
              let matches = false;
              if (locationData.city && locationData.city.trim() !== "") {
                matches =
                  candidateLocation.city &&
                  candidateLocation.city.toLowerCase() === locationData.city.toLowerCase();
              } else if (locationData.state && locationData.state.trim() !== "") {
                matches =
                  candidateLocation.state &&
                  candidateLocation.state.toLowerCase() === locationData.state.toLowerCase();
              } else if (locationData.country && locationData.country.trim() !== "") {
                matches =
                  candidateLocation.country &&
                  candidateLocation.country.toLowerCase() === locationData.country.toLowerCase();
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const total = candidates.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = candidates.slice((page - 1) * limit, page * limit);

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

