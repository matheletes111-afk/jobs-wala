import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = (searchParams.get("search") || "").trim();
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";

    const where: any = {};

    // Filter by customer details or payment identifiers
    if (search) {
      where.OR = [
        {
          employer: {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              { pointOfContact: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              {
                user: {
                  email: { contains: search, mode: "insensitive" }
                }
              }
            ]
          }
        },
        { razorpaySubscriptionId: { contains: search, mode: "insensitive" } },
        { razorpayOrderId: { contains: search, mode: "insensitive" } },
        { razorpayPaymentId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by date range (createdAt or startDate)
    if (startDateParam || endDateParam) {
      where.createdAt = {};
      if (startDateParam) {
        where.createdAt.gte = new Date(`${startDateParam}T00:00:00.000Z`);
      }
      if (endDateParam) {
        where.createdAt.lte = new Date(`${endDateParam}T23:59:59.999Z`);
      }
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employer: {
          include: {
            user: {
              select: {
                email: true,
              }
            }
          }
        },
        plan: true,
      }
    });

    return NextResponse.json(subscriptions);
  } catch (e: any) {
    console.error("[GET /api/admin/subscribers]", e);
    return NextResponse.json(
      { error: "Failed to fetch subscribers history." },
      { status: 500 }
    );
  }
}
