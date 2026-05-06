import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await prisma.plan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { amount: "asc" },
    });

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        employer: { userId: session.user.id },
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
      select: { 
        id: true,
        planId: true, 
        scheduledPlanId: true, 
        endDate: true,
        plan: {
          select: { name: true, amount: true, currency: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Plans API - Active Sub ID:", activeSubscription?.id);
    console.log("Plans API - Scheduled Plan ID:", activeSubscription?.scheduledPlanId);

    let scheduledPlanDetails = null;
    if (activeSubscription?.scheduledPlanId) {
      scheduledPlanDetails = await prisma.plan.findUnique({
        where: { id: activeSubscription.scheduledPlanId },
        select: { name: true, amount: true, currency: true }
      });
    }

    return NextResponse.json({
      plans,
      activePlanId: activeSubscription?.planId || null,
      scheduledPlanId: activeSubscription?.scheduledPlanId || null,
      activePlanEndDate: activeSubscription?.endDate || null,
      activePlanDetails: activeSubscription?.plan || null,
      scheduledPlanDetails: scheduledPlanDetails,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
