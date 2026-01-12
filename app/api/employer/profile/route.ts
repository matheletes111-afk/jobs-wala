import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  companyName: z.string().min(1),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional(),
  companyLogo: z.string().url().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireEmployer();
    const body = await req.json();
    const data = profileSchema.parse(body);

    const profile = await prisma.employerProfile.create({
      data: {
        userId: user.id,
        ...data,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireEmployer();
    const body = await req.json();
    const data = profileSchema.parse(body);

    const profile = await prisma.employerProfile.update({
      where: { userId: user.id },
      data,
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

