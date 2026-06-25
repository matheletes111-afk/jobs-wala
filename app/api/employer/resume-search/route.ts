import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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
    const isBooleanSearch = searchParams.get("isBooleanSearch") === "true";
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

      if (skillsParam) {
        if (isBooleanSearch) {
          if (!evaluateBooleanSkills(skillsParam, resume.skills || [])) return false;
        } else if (requestedSkills.length > 0) {
          const resumeSkills = (resume.skills || []).map((s) => s.toLowerCase());
          const anyMatch = requestedSkills.some((requested) =>
            resumeSkills.some((skill) => skill.includes(requested.toLowerCase()) || requested.toLowerCase().includes(skill))
          );
          if (!anyMatch) return false;
        }
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

