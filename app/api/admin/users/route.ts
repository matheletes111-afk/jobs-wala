import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Query: page, limit, search (name/email), role
 * Backend pagination and filters for admin user management.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const isExport = searchParams.get("export") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const role = (searchParams.get("role") || "").trim();

    const andParts: Array<Record<string, unknown>> = [];

    if (role && role !== "all") {
      andParts.push({ role: role as "JOB_SEEKER" | "EMPLOYER" | "ADMIN" });
    }

    if (search) {
      andParts.push({
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { jobSeekerProfile: { firstName: { contains: search, mode: "insensitive" as const } } },
          { jobSeekerProfile: { lastName: { contains: search, mode: "insensitive" as const } } },
          { employerProfile: { companyName: { contains: search, mode: "insensitive" as const } } },
        ],
      });
    }

    const where = andParts.length > 0 ? { AND: andParts } : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(isExport ? {} : { skip: (page - 1) * limit, take: limit }),
        include: {
          jobSeekerProfile: {
            select: {
              firstName: true,
              lastName: true,
              location: true,
              skills: true,
              experience: true,
              jobTitle: true,
              availabilityStatus: true,
              bio: true,
              phone: true,
              resumeUrl: true,
              resumeUpdatedAt: true,
              education: true,
              certificates: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          employerProfile: {
            select: {
              companyName: true,
              companyLogo: true,
              industry: true,
              companySize: true,
              description: true,
              resumeSearchEnabled: true,
              resumeUploadEnabled: true,
              website: true,
              approvalStatus: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        jobSeekerProfile: u.jobSeekerProfile,
        employerProfile: u.employerProfile,
      })),
      total,
      totalPages,
      page,
      limit,
    });
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
