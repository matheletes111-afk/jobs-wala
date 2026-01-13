import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    const csv = [
      ["Email", "Role", "Created At"].join(","),
      ...users.map(
        (u: {
          email: string;
          role: string;
          createdAt: Date;
        }) =>
          `"${u.email}","${u.role}","${u.createdAt.toISOString()}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=users.csv",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

