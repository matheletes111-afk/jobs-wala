import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayPlan } from "@/lib/razorpay";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await prisma.plan.findMany({
      where: {
        status: {
          not: "ARCHIVED"
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, amount, durationDays, jobLimit, resumeSearchEnabled, xraySearchEnabled } = body;

    let razorpayPlanId = null;

    // Only create Razorpay plan if amount > 0
    if (amount > 0) {
      let period: "daily" | "weekly" | "monthly" | "yearly" = "daily";
      let interval = durationDays;

      if (durationDays % 365 === 0) {
        period = "yearly";
        interval = durationDays / 365;
      } else if (durationDays % 30 === 0) {
        period = "monthly";
        interval = durationDays / 30;
      } else if (durationDays % 7 === 0) {
        period = "weekly";
        interval = durationDays / 7;
      }

      const rpPlan = await createRazorpayPlan({
        name,
        description: description || "",
        amount: amount,
        currency: "INR",
        period,
        interval,
      });
      razorpayPlanId = rpPlan.id;
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        durationDays: parseInt(durationDays),
        jobLimit: parseInt(jobLimit),
        resumeSearchEnabled: !!resumeSearchEnabled,
        xraySearchEnabled: !!xraySearchEnabled,
        razorpayPlanId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
