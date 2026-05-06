import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = (searchParams.get("query") || "").trim().toLowerCase();

    // Fetch skills from the most recent resumes to get relevant suggestions
    // Flattening and making unique in memory for simplicity
    const resumes = await prisma.resumeDocument.findMany({
      where: {
        parseStatus: "PARSED",
        ...(query ? {
          extractedText: { contains: query, mode: "insensitive" }
        } : {})
      },
      select: {
        skills: true,
      },
      take: 1000,
      orderBy: { createdAt: "desc" }
    });

    // If query is provided, we might want a better prefix match. 
    // Since we are fetching 1000 resumes anyway, we can filter them in JS.
    
    const allSkills = new Map<string, string>();
    resumes.forEach(resume => {
      resume.skills.forEach(skill => {
        const s = skill.trim();
        if (s) {
          const lower = s.toLowerCase();
          if (!query || lower.includes(query)) {
            // Keep the first version we find, or prefer a version with capital letters if available
            if (!allSkills.has(lower)) {
              allSkills.set(lower, s);
            }
          }
        }
      });
    });

    // Return top 20 matches
    const suggestions = Array.from(allSkills.values())
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 20);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[GET /api/common/skills]", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
