import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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

    const csv = "\uFEFF" + [
      ["ID", "Title", "Company", "Category", "Employment Type", "Work Mode", "Location", "Status", "Experience", "Salary", "Created At"].join(","),
      ...jobs.map(
        (j: any) => {
          const exp = j.experienceMin != null && j.experienceMax != null ? `${j.experienceMin}-${j.experienceMax} YRS` : j.experienceMin != null ? `${j.experienceMin}+ YRS` : "";
          const salary = j.salaryMin != null && j.salaryMax != null ? `${j.currency || ""} ${j.salaryMin}-${j.salaryMax} / ${j.payType || ""}` : "";
          const location = typeof j.location === 'string' ? j.location : typeof j.location === 'object' && j.location ? JSON.stringify(j.location).replace(/"/g, '""') : "";
          
          return `"${j.id}","${(j.title || "").replace(/"/g, '""')}","${((j.companyName || j.employer?.companyName) || "").replace(/"/g, '""')}","${(j.category || "").replace(/"/g, '""')}","${j.employmentType || ""}","${j.workMode || ""}","${location}","${j.status}","${exp}","${salary}","${j.createdAt.toISOString()}"`;
        }
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

