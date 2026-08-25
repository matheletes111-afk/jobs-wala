import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { formatLocation, formatPhoneForCsv } from "@/lib/utils";

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
          const firstName = (isSeeker ? u.jobSeekerProfile.firstName : isEmployer ? (u.employerProfile.companyName || "").split(' ')[0] : "") || "";
          const lastName = (isSeeker ? u.jobSeekerProfile.lastName : "") || "";
          const companyName = (isEmployer ? u.employerProfile.companyName : "") || "";
          const rawPhone = isSeeker ? u.jobSeekerProfile.phone : isEmployer ? u.employerProfile.phone : "";
          const phone = formatPhoneForCsv(rawPhone);
          const rawLocation = isSeeker ? u.jobSeekerProfile.location : isEmployer ? u.employerProfile.location : "";
          const location = formatLocation(rawLocation);
          
          return `"${u.id}","${(u.email || "").replace(/"/g, '""')}","${u.role}","${firstName.replace(/"/g, '""')}","${lastName.replace(/"/g, '""')}","${companyName.replace(/"/g, '""')}","${phone.replace(/"/g, '""')}","${location.replace(/"/g, '""')}","${u.createdAt ? new Date(u.createdAt).toISOString() : ""}"`;
        }
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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

