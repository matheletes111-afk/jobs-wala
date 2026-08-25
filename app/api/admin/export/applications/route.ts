import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { formatPhoneForCsv } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();

    const applications = await prisma.application.findMany({
      include: {
        job: {
          include: { employer: true }
        },
        jobSeeker: {
          include: { user: true }
        },
      },
    });

    const csv = "\uFEFF" + [
      ["ID", "Job Title", "Company", "Candidate First Name", "Candidate Last Name", "Candidate Email", "Candidate Phone", "Status", "Applied At"].join(","),
      ...applications.map(
        (a: any) =>
          `"${a.id}","${(a.job?.title || "").replace(/"/g, '""')}","${(a.job?.employer?.companyName || "").replace(/"/g, '""')}","${(a.jobSeeker?.firstName || "").replace(/"/g, '""')}","${(a.jobSeeker?.lastName || "").replace(/"/g, '""')}","${a.jobSeeker?.user?.email || ""}","${formatPhoneForCsv(a.jobSeeker?.phone).replace(/"/g, '""')}","${a.status}","${a.appliedAt ? new Date(a.appliedAt).toISOString() : ""}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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

