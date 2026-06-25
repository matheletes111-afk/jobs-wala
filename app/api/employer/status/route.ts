import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        employerProfile: {
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { plan: true },
            },
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ authenticated: false });
    }

    const hasProfile = !!dbUser.employerProfile;
    const approvalStatus = dbUser.employerProfile?.approvalStatus || "PENDING";
    const companyName = dbUser.employerProfile?.companyName || "";
    const activeSubscription = dbUser.employerProfile?.subscriptions?.[0] || null;
    const isExpired = activeSubscription ? new Date(activeSubscription.endDate) < new Date() : true;

    return NextResponse.json({
      authenticated: true,
      role: dbUser.role,
      hasProfile,
      approvalStatus,
      companyName,
      activeSubscription: activeSubscription ? {
        planName: activeSubscription.plan.name,
        endDate: activeSubscription.endDate,
        jobLimit: activeSubscription.plan.jobLimit,
        isExpired,
      } : null,
    });
  } catch (error) {
    console.error("Employer status GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
