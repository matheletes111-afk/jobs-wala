import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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

    const csv = "\uFEFF" + [
      ["ID", "Email", "Role", "First Name", "Last Name", "Company Name", "Phone", "Location", "Created At"].join(","),
      ...users.map(
        (u: any) => {
          const isSeeker = u.role === "JOB_SEEKER" && u.jobSeekerProfile;
          const isEmployer = u.role === "EMPLOYER" && u.employerProfile;
          const firstName = isSeeker ? u.jobSeekerProfile.firstName : isEmployer ? u.employerProfile.companyName.split(' ')[0] : "";
          const lastName = isSeeker ? u.jobSeekerProfile.lastName : "";
          const companyName = isEmployer ? u.employerProfile.companyName : "";
          const phone = isSeeker ? u.jobSeekerProfile.phone : isEmployer ? u.employerProfile.phone : "";
          const location = isSeeker ? u.jobSeekerProfile.location : isEmployer ? u.employerProfile.location : "";
          
          return `"${u.id}","${u.email}","${u.role}","${firstName || ""}","${lastName || ""}","${companyName || ""}","${phone || ""}","${typeof location === 'string' ? location : typeof location === 'object' && location ? JSON.stringify(location).replace(/"/g, '""') : ""}","${u.createdAt.toISOString()}"`;
        }
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

