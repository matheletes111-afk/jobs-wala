import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireEmployer();
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
      select: { resumeSearchEnabled: true },
    });
    if (!employerProfile?.resumeSearchEnabled) {
      return NextResponse.json(
        { error: "Resume search access is disabled for this employer." },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "12")));
    const keyword = (searchParams.get("keyword") || "").trim().toLowerCase();
    const skillsParam = (searchParams.get("skills") || "").trim().toLowerCase();
    const location = (searchParams.get("location") || "").trim().toLowerCase();
    const minExperience = Number(searchParams.get("minExperience") || "0");

    const resumes = await prisma.resumeDocument.findMany({
      where: { parseStatus: "PARSED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalFileName: true,
        r2Url: true,
        extractedName: true,
        extractedEmail: true,
        extractedLocation: true,
        currentTitle: true,
        experienceYears: true,
        skills: true,
        createdAt: true,
      },
      take: 500,
    });

    const requestedSkills = skillsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const filtered = resumes.filter((resume) => {
      if (keyword) {
        const haystack = [
          resume.originalFileName,
          resume.extractedName,
          resume.extractedEmail,
          resume.currentTitle,
          resume.extractedLocation,
          ...(resume.skills || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      if (location) {
        if (!resume.extractedLocation?.toLowerCase().includes(location)) return false;
      }

      if (requestedSkills.length > 0) {
        const resumeSkills = (resume.skills || []).map((s) => s.toLowerCase());
        const allMatch = requestedSkills.every((requested) =>
          resumeSkills.some((skill) => skill.includes(requested))
        );
        if (!allMatch) return false;
      }

      if (Number.isFinite(minExperience) && minExperience > 0) {
        if ((resume.experienceYears ?? 0) < Math.floor(minExperience)) return false;
      }

      return true;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
      resumes: paginated,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("[GET /api/employer/resume-search]", error);
    return NextResponse.json(
      { error: "Failed to fetch resume database records." },
      { status: 500 }
    );
  }
}

