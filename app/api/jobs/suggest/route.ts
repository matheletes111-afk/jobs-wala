import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export interface SuggestionItem {
  type: "title" | "skill" | "company";
  label: string;
  value: string;
}

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const [matchingJobs, matchingEmployers] = await Promise.all([
      // 1. Fetch matching active jobs to get titles & skills
      prisma.job.findMany({
        where: {
          status: "ACTIVE",
          employer: { approvalStatus: "APPROVED" },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          title: true,
          companyName: true,
          requiredSkills: true,
          secondarySkills: true,
        },
        take: 30,
      }),

      // 2. Fetch matching employers
      prisma.employerProfile.findMany({
        where: {
          approvalStatus: "APPROVED",
          companyName: { contains: q, mode: "insensitive" },
        },
        select: {
          companyName: true,
        },
        take: 10,
      }),
    ]);

    const suggestions: SuggestionItem[] = [];
    const seenLabels = new Set<string>();

    const qLower = q.toLowerCase();

    // Collect Job Titles matching query
    for (const job of matchingJobs) {
      if (job.title && job.title.toLowerCase().includes(qLower)) {
        const titleTrimmed = job.title.trim();
        const key = `title:${titleTrimmed.toLowerCase()}`;
        if (!seenLabels.has(key)) {
          seenLabels.add(key);
          suggestions.push({
            type: "title",
            label: titleTrimmed,
            value: titleTrimmed,
          });
        }
      }
      if (suggestions.filter((s) => s.type === "title").length >= 4) break;
    }

    // Collect Skills matching query from active jobs
    for (const job of matchingJobs) {
      const allSkills = [...(job.requiredSkills || []), ...(job.secondarySkills || [])];
      for (const skill of allSkills) {
        if (skill && skill.toLowerCase().includes(qLower)) {
          const skillTrimmed = skill.trim();
          const key = `skill:${skillTrimmed.toLowerCase()}`;
          if (!seenLabels.has(key)) {
            seenLabels.add(key);
            suggestions.push({
              type: "skill",
              label: skillTrimmed,
              value: skillTrimmed,
            });
          }
        }
        if (suggestions.filter((s) => s.type === "skill").length >= 4) break;
      }
    }

    // Collect Companies matching query
    for (const emp of matchingEmployers) {
      if (emp.companyName && emp.companyName.toLowerCase().includes(qLower)) {
        const compTrimmed = emp.companyName.trim();
        const key = `company:${compTrimmed.toLowerCase()}`;
        if (!seenLabels.has(key)) {
          seenLabels.add(key);
          suggestions.push({
            type: "company",
            label: compTrimmed,
            value: compTrimmed,
          });
        }
      }
      if (suggestions.filter((s) => s.type === "company").length >= 4) break;
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error in suggestions API:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
