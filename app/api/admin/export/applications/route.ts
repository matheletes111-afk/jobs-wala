import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const applications = await prisma.application.findMany({
      include: {
        job: true,
        jobSeeker: true,
      },
    });

    const csv = [
      ["Job Title", "Candidate", "Status", "Applied At"].join(","),
      ...applications.map(
        (a) =>
          `"${a.job.title}","${a.jobSeeker.firstName} ${a.jobSeeker.lastName}","${a.status}","${a.appliedAt.toISOString()}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=applications.csv",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

