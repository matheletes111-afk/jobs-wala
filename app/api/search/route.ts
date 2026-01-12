import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireEmployer();

    const searchParams = req.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || "";
    const skillsParam = searchParams.get("skills") || "";
    const location = searchParams.get("location") || "";

    const where: any = {};

    // Keyword search in bio, jobTitle, education
    if (keyword) {
      where.OR = [
        { bio: { contains: keyword, mode: "insensitive" } },
        { jobTitle: { contains: keyword, mode: "insensitive" } },
        { education: { contains: keyword, mode: "insensitive" } },
      ];
    }

    // Skills filter
    if (skillsParam) {
      const skillsArray = skillsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsArray.length > 0) {
        where.skills = { hasSome: skillsArray };
      }
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    const candidates = await prisma.jobSeekerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: 50,
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

