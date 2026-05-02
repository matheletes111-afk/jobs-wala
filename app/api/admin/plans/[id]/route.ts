import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plan = await prisma.plan.findUnique({
      where: { id: id },
    });
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status, name, description, jobLimit, resumeSearchEnabled } = body;

    const plan = await prisma.plan.update({
      where: { id: id },
      data: {
        status,
        name,
        description,
        jobLimit: jobLimit ? parseInt(jobLimit) : undefined,
        resumeSearchEnabled: resumeSearchEnabled !== undefined ? !!resumeSearchEnabled : undefined,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Instead of actual delete, we archive to maintain history
    const plan = await prisma.plan.update({
      where: { id: id },
      data: { status: "ARCHIVED" },
    });
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to archive plan" }, { status: 500 });
  }
}
