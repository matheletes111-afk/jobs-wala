import { NextRequest, NextResponse } from "next/server";
import { Prisma, ResumeParseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromS3 } from "@/lib/s3";

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
          { id: { contains: keyword, mode: "insensitive" } },
          { originalFileName: { contains: keyword, mode: "insensitive" } },
          { extractedName: { contains: keyword, mode: "insensitive" } },
          { extractedEmail: { contains: keyword, mode: "insensitive" } },
          { extractedPhone: { contains: keyword, mode: "insensitive" } },
          { extractedText: { contains: keyword, mode: "insensitive" } },
          { extractedLocation: { contains: keyword, mode: "insensitive" } },
          { currentTitle: { contains: keyword, mode: "insensitive" } },
          { parseError: { contains: keyword, mode: "insensitive" } },
          // Partial match on skills array elements via OR
          { skills: { hasSome: [keyword] } },
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

    // Skills specific filter
    const requestedSkills = skillsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (requestedSkills.length > 0) {
      whereAnd.push({
        OR: requestedSkills.map((s) => ({
          skills: { hasSome: [s] }
        })),
      });
    }

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};

    // Get total count for pagination
    const total = await prisma.resumeDocument.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;

    const resumes = await prisma.resumeDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const failedResumes = await prisma.resumeDocument.findMany({
      where: { parseStatus: ResumeParseStatus.FAILED },
      select: { id: true, r2Key: true },
    });

    const s3Keys = failedResumes
      .map((item) => item.r2Key)
      .filter((key) => key.includes("/") && !key.startsWith("upload-failed") && !key.startsWith("invalid-file-type"));

    await Promise.allSettled(s3Keys.map((key) => deleteFileFromS3(key)));

    const { count } = await prisma.resumeDocument.deleteMany({
      where: { parseStatus: ResumeParseStatus.FAILED },
    });

    return NextResponse.json({
      deletedCount: count,
      deletedS3Objects: s3Keys.length,
    });
  } catch (error) {
    console.error("[DELETE /api/admin/resume-database]", error);
    return NextResponse.json(
      { error: "Failed to delete failed resumes." },
      { status: 500 }
    );
  }
}
