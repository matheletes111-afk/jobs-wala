import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Prisma, ResumeParseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromS3 } from "@/lib/s3";
import { evaluateBooleanSkills, matchSkill, isBooleanExpression } from "@/lib/skill-match";

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
    const isBooleanSearch = searchParams.get("isBooleanSearch") === "true" || isBooleanExpression(skillsParam);
    const location = (searchParams.get("location") || "").trim();
    const parseStatus = (searchParams.get("parseStatus") || "all").trim();
    const minExperience = Number(searchParams.get("minExperience") || "0");
    const maxExperience = searchParams.get("maxExperience") ? Number(searchParams.get("maxExperience")) : null;

    const whereAnd: Prisma.ResumeDocumentWhereInput[] = [];

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

    if (maxExperience !== null && Number.isFinite(maxExperience)) {
      whereAnd.push({
        experienceYears: { lte: Math.floor(maxExperience) },
      });
    }

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};

    // Fetch all candidates matching core criteria first to filter in-memory for skills/keywords
    let resumes = await prisma.resumeDocument.findMany({
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
        extractedText: true,
        extractedPhone: true,
      },
    });

    // In-memory keyword filter
    if (keyword) {
      const kw = keyword.toLowerCase();
      resumes = resumes.filter((resume) => {
        if (resume.id.toLowerCase().includes(kw)) return true;
        if (resume.originalFileName.toLowerCase().includes(kw)) return true;
        if (resume.extractedName?.toLowerCase().includes(kw)) return true;
        if (resume.extractedEmail?.toLowerCase().includes(kw)) return true;
        if (resume.extractedPhone?.toLowerCase().includes(kw)) return true;
        if (resume.extractedText?.toLowerCase().includes(kw)) return true;
        if (resume.extractedLocation?.toLowerCase().includes(kw)) return true;
        if (resume.currentTitle?.toLowerCase().includes(kw)) return true;
        if (resume.parseError?.toLowerCase().includes(kw)) return true;
        if ((resume.skills || []).some((s) => s.toLowerCase().includes(kw) || kw.includes(s.toLowerCase()))) return true;
        return false;
      });
    }

    // In-memory skills filter
    if (skillsParam) {
      if (isBooleanSearch) {
        resumes = resumes.filter((resume) => evaluateBooleanSkills(skillsParam, resume.skills || []));
      } else {
        const requestedSkills = skillsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (requestedSkills.length > 0) {
          resumes = resumes.filter((resume) => {
            return requestedSkills.some((term) =>
              (resume.skills || []).some((skill) => matchSkill(skill, term))
            );
          });
        }
      }
    }

    // In-memory duplicates only filter (matches on email, phone, or name)
    const duplicatesOnly = searchParams.get("duplicatesOnly") === "true";
    if (duplicatesOnly) {
      const emailCounts = new Map<string, number>();
      const phoneCounts = new Map<string, number>();
      const nameCounts = new Map<string, number>();

      for (const r of resumes) {
        if (r.extractedEmail && r.extractedEmail.trim().length > 3) {
          const em = r.extractedEmail.trim().toLowerCase();
          emailCounts.set(em, (emailCounts.get(em) || 0) + 1);
        }
        if (r.extractedPhone && r.extractedPhone.trim().length >= 7) {
          const ph = r.extractedPhone.replace(/\D/g, "").slice(-10);
          if (ph.length >= 7) {
            phoneCounts.set(ph, (phoneCounts.get(ph) || 0) + 1);
          }
        }
        if (r.extractedName && r.extractedName.trim().length >= 3) {
          const nm = r.extractedName.trim().toLowerCase();
          nameCounts.set(nm, (nameCounts.get(nm) || 0) + 1);
        }
      }

      resumes = resumes.filter((r) => {
        const em = r.extractedEmail?.trim().toLowerCase();
        if (em && (emailCounts.get(em) || 0) > 1) return true;
        const ph = r.extractedPhone?.replace(/\D/g, "").slice(-10);
        if (ph && (phoneCounts.get(ph) || 0) > 1) return true;
        const nm = r.extractedName?.trim().toLowerCase();
        if (nm && (nameCounts.get(nm) || 0) > 1) return true;
        return false;
      });
    }

    const isExport = searchParams.get("export") === "true";

    // Format results - remove heavy extractedText to reduce payload size, keep extractedPhone
    if (isExport) {
      const exportResumes = resumes.map((resume) => {
        const { extractedText, ...rest } = resume;
        return rest;
      });

      return NextResponse.json({
        resumes: exportResumes,
        total: exportResumes.length,
        isExport: true,
      });
    }

    // Paginate in-memory results
    const total = resumes.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const paginatedResumes = resumes.slice(skip, skip + limit).map((resume) => {
      const { extractedText, ...rest } = resume;
      return rest;
    });

    return NextResponse.json({
      resumes: paginatedResumes,
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    let body: { ids?: string[] } | null = null;
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        body = await req.json();
      }
    } catch (_e) {}

    const ids: string[] = body?.ids && Array.isArray(body.ids) && body.ids.length > 0
      ? body.ids
      : id
      ? [id]
      : [];

    if (ids.length > 0) {
      const resumes = await prisma.resumeDocument.findMany({
        where: { id: { in: ids } },
        select: { id: true, r2Key: true },
      });

      if (resumes.length === 0) {
        return NextResponse.json({ error: "No matching resumes found." }, { status: 404 });
      }

      const s3Keys = resumes
        .map((r) => r.r2Key)
        .filter((k) => k && k.includes("/") && !k.startsWith("upload-failed") && !k.startsWith("invalid-file-type"));

      if (s3Keys.length > 0) {
        await Promise.allSettled(s3Keys.map((key) => deleteFileFromS3(key)));
      }

      const { count } = await prisma.resumeDocument.deleteMany({
        where: { id: { in: ids } },
      });

      return NextResponse.json({
        success: true,
        deletedCount: count,
        message: `Successfully deleted ${count} resume${count !== 1 ? "s" : ""}.`,
      });
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
      message: `Cleaned up ${count} failed resume records.`,
    });
  } catch (error) {
    console.error("[DELETE /api/admin/resume-database]", error);
    return NextResponse.json(
      { error: "Failed to delete resumes." },
      { status: 500 }
    );
  }
}
