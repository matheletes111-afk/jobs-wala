import { NextRequest, NextResponse } from "next/server";
import { Prisma, ResumeParseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || "10"))
    );
    const keyword = (searchParams.get("keyword") || "").trim();
    const skillsParam = (searchParams.get("skills") || "").trim();
    const location = (searchParams.get("location") || "").trim();
    const parseStatus = (searchParams.get("parseStatus") || "all").trim();
    const minExperience = Number(searchParams.get("minExperience") || "0");

    const whereAnd: Prisma.ResumeDocumentWhereInput[] = [];

    if (keyword) {
      whereAnd.push({
        OR: [
          { originalFileName: { contains: keyword, mode: "insensitive" } },
          { extractedName: { contains: keyword, mode: "insensitive" } },
          { extractedEmail: { contains: keyword, mode: "insensitive" } },
          { extractedText: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    if (location) {
      whereAnd.push({
        extractedLocation: { contains: location, mode: "insensitive" },
      });
    }

    if (parseStatus && parseStatus !== "all") {
      whereAnd.push({
        parseStatus: parseStatus as ResumeParseStatus,
      });
    }

    if (Number.isFinite(minExperience) && minExperience > 0) {
      whereAnd.push({
        experienceYears: { gte: Math.floor(minExperience) },
      });
    }

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};

    const rawResumes = await prisma.resumeDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalFileName: true,
        mimeType: true,
        sizeBytes: true,
        r2Key: true,
        r2Url: true,
        parseStatus: true,
        parseError: true,
        extractedName: true,
        extractedEmail: true,
        extractedLocation: true,
        experienceYears: true,
        currentTitle: true,
        skills: true,
        createdAt: true,
      },
    });

    const requestedSkills = skillsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const filteredResumes =
      requestedSkills.length === 0
        ? rawResumes
        : rawResumes.filter((resume) =>
            requestedSkills.every((requestedSkill) =>
              resume.skills.some((resumeSkill) =>
                resumeSkill.toLowerCase().includes(requestedSkill)
              )
            )
          );

    const total = filteredResumes.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const resumes = filteredResumes.slice(start, start + limit);

    return NextResponse.json({
      resumes,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("[GET /api/admin/resume-database]", error);
    return NextResponse.json(
      { error: "Failed to fetch resume database." },
      { status: 500 }
    );
  }
}
