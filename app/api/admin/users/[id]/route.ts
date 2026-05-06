import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users/[id]
 * Returns full user with job seeker or employer profile for admin detail view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (e) {
    console.error("[GET /api/admin/users/[id]]", e);
    return NextResponse.json(
      { error: "Failed to fetch user." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Body: { resumeSearchEnabled: boolean }
 * Toggles employer resume database search access.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as { resumeSearchEnabled?: boolean };

    if (typeof body.resumeSearchEnabled !== "boolean") {
      return NextResponse.json(
        { error: "resumeSearchEnabled must be a boolean." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, employerProfile: { select: { id: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role !== "EMPLOYER" || !user.employerProfile) {
      return NextResponse.json(
        { error: "Resume database access can only be changed for employers." },
        { status: 400 }
      );
    }

    const updated = await prisma.employerProfile.update({
      where: { userId: id },
      data: { resumeSearchEnabled: body.resumeSearchEnabled },
      select: { userId: true, resumeSearchEnabled: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/admin/users/[id]]", e);
    return NextResponse.json(
      { error: "Failed to update employer resume access." },
      { status: 500 }
    );
  }
}
