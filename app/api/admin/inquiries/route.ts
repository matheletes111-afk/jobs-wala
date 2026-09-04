import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ContactInquiryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();
    const statusParam = (searchParams.get("status") || "ALL").toUpperCase();
    const subjectParam = (searchParams.get("subject") || "ALL").trim();

    const where: Record<string, unknown> = {};

    // Status filter
    if (statusParam !== "ALL" && Object.values(ContactInquiryStatus).includes(statusParam as ContactInquiryStatus)) {
      where.status = statusParam;
    }

    // Subject filter
    if (subjectParam && subjectParam !== "ALL") {
      where.subject = { contains: subjectParam, mode: "insensitive" };
    }

    // Search query across name, email, mobile, subject, message
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const isExport = searchParams.get("export") === "true";
    if (isExport) {
      const allInquiries = await prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ inquiries: allInquiries, total: allInquiries.length });
    }

    const [inquiries, total, newCount, inProgressCount, resolvedCount, archivedCount] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
      prisma.contactInquiry.count({ where: { status: "IN_PROGRESS" } }),
      prisma.contactInquiry.count({ where: { status: "RESOLVED" } }),
      prisma.contactInquiry.count({ where: { status: "ARCHIVED" } }),
    ]);

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        total: newCount + inProgressCount + resolvedCount + archivedCount,
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        archived: archivedCount,
      },
    });
  } catch (error) {
    console.error("Admin inquiries fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}
