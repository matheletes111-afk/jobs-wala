import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Prisma, ResumeParseStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromS3 } from "@/lib/s3";

function evaluateBooleanSkills(expr: string, candidateSkills: string[]): boolean {
  const lowerSkills = candidateSkills.map(s => s.toLowerCase());
  
  const hasSkill = (term: string) => {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return false;
    return lowerSkills.some(s => s.includes(cleanTerm) || cleanTerm.includes(s));
  };

  const rawTokens = expr.match(/AND|OR|NOT|\(|\)|"[^"]+"|[^\s()]+/gi) || [];
  const outputQueue: string[] = [];
  const operatorStack: string[] = [];
  const precedence: Record<string, number> = {
    'NOT': 3,
    'AND': 2,
    'OR': 1
  };

  for (const token of rawTokens) {
    const upper = token.toUpperCase();
    if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[upper]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(upper);
    } else if (token === '(') {
      operatorStack.push('(');
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.pop(); // remove '('
    } else {
      const term = token.startsWith('"') && token.endsWith('"') ? token.slice(1, -1) : token;
      outputQueue.push(term);
    }
  }
  
  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!);
  }

  const stack: boolean[] = [];
  for (const token of outputQueue) {
    if (token === 'AND') {
      const b = stack.pop() ?? false;
      const a = stack.pop() ?? false;
      stack.push(a && b);
    } else if (token === 'OR') {
      const b = stack.pop() ?? false;
      const a = stack.pop() ?? false;
      stack.push(a || b);
    } else if (token === 'NOT') {
      const a = stack.pop() ?? false;
      stack.push(!a);
    } else {
      stack.push(hasSkill(token));
    }
  }

  return stack.pop() ?? false;
}

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
    const isBooleanSearch = searchParams.get("isBooleanSearch") === "true";
    const location = (searchParams.get("location") || "").trim();
    const parseStatus = (searchParams.get("parseStatus") || "all").trim();
    const minExperience = Number(searchParams.get("minExperience") || "0");

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
        if (resume.skills.some((s) => s.toLowerCase().includes(kw) || kw.includes(s.toLowerCase()))) return true;
        return false;
      });
    }

    // In-memory skills filter
    if (skillsParam) {
      if (isBooleanSearch) {
        resumes = resumes.filter((resume) => evaluateBooleanSkills(skillsParam, resume.skills));
      } else {
        const requestedSkills = skillsParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        if (requestedSkills.length > 0) {
          resumes = resumes.filter((resume) => {
            return requestedSkills.every((term) =>
              resume.skills.some(
                (skill) =>
                  skill.toLowerCase().includes(term) ||
                  term.includes(skill.toLowerCase())
              )
            );
          });
        }
      }
    }

    // Paginate in-memory results
    const total = resumes.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const paginatedResumes = resumes.slice(skip, skip + limit).map((resume) => {
      // Remove heavy extractedText from final output to reduce payload size
      const { extractedText, extractedPhone, ...rest } = resume;
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
