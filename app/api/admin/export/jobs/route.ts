import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const jobs = await prisma.job.findMany({
      include: {
        employer: true,
      },
    });

    const csv = [
      ["Title", "Company", "Location", "Status", "Created At"].join(","),
      ...jobs.map(
        (j: {
          title: string;
          location: string | null;
          status: string;
          createdAt: Date;
          employer: {
            companyName: string;
          };
        }) =>
          `"${j.title}","${j.employer.companyName}","${j.location}","${j.status}","${j.createdAt.toISOString()}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=jobs.csv",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

