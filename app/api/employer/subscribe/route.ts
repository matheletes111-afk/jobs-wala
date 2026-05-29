import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpaySubscription, updateRazorpaySubscription, cancelRazorpaySubscription } from "@/lib/razorpay";
import { addDays } from "date-fns";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await req.json();

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        employerId: userId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingSubscription?.scheduledPlanId) {
      return NextResponse.json(
        { error: "You already have a pending upgrade scheduled. Please wait for it to activate before switching plans again." },
        { status: 400 }
      );
    }

    // Handle seamless upgrades if there is an active paid Razorpay subscription
    if (
      existingSubscription &&
      existingSubscription.razorpaySubscriptionId &&
      plan.amount > 0 &&
      plan.razorpayPlanId
    ) {
      try {
        // It's an upgrade!
        await updateRazorpaySubscription(
          existingSubscription.razorpaySubscriptionId,
          plan.razorpayPlanId
        );

        // Store the pending upgrade in DB
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { scheduledPlanId: plan.id },
        });

        return NextResponse.json({ success: true, isUpgradeScheduled: true });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.warn("Seamless update rejected by Razorpay (likely UPI mode). Falling back to new subscription creation.", errorMessage);
        // Do nothing here: let the code fall through to create a NEW Razorpay subscription below.
        // The old subscription will be automatically cancelled in the /verify route once the new one is paid.
      }
    }

    // Handle Free Plan (0 Amount)
    if (plan.amount === 0) {
      // Check if the user has ever had a Free Plan before
      const hadFreePlan = await prisma.subscription.findFirst({
        where: {
          employerId: userId,
          plan: {
            amount: 0,
          },
        },
      });

      if (hadFreePlan) {
        return NextResponse.json(
          { error: "You have already used the Free Plan once. Please subscribe to a premium plan." },
          { status: 400 }
        );
      }

      if (existingSubscription?.razorpaySubscriptionId) {
        // Cancel the old paid subscription to stop billing
        try {
          await cancelRazorpaySubscription(existingSubscription.razorpaySubscriptionId);
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { status: "CANCELLED" }
          });
        } catch (e) {
          console.error("Failed to cancel old subscription", e);
        }
      }

      const subscription = await prisma.subscription.create({
        data: {
          employerId: userId,
          planId: plan.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: addDays(new Date(), plan.durationDays),
        },
      });

      // Update Employer Profile
      await prisma.employerProfile.update({
        where: { userId },
        data: {
          subscriptionId: subscription.id,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiry: subscription.endDate,
          resumeSearchEnabled: plan.resumeSearchEnabled,
          xraySearchEnabled: plan.xraySearchEnabled,
        },
      });

      return NextResponse.json({ success: true, subscription });
    }

    // Handle Paid Plan (Create Razorpay Subscription)
    if (!plan.razorpayPlanId) {
      return NextResponse.json({ error: "Plan not synced with payment gateway" }, { status: 500 });
    }

    const startAt = existingSubscription 
      ? Math.max(Math.floor(new Date(existingSubscription.endDate).getTime() / 1000) + 60, Math.floor(Date.now() / 1000) + 60)
      : undefined;

    console.log("Initiating Razorpay Subscription:", {
      userId,
      planId: plan.id,
      razorpayPlanId: plan.razorpayPlanId,
      startAt
    });

    const razorpaySubscription = await createRazorpaySubscription({
      planId: plan.razorpayPlanId,
      totalCount: 12, // Recurring for 12 cycles
      startAt: startAt,
      notes: {
        employerId: userId,
        planId: plan.id,
      },
    });

    console.log("Razorpay Subscription Created:", razorpaySubscription.id);

    return NextResponse.json({
      success: true,
      subscriptionId: razorpaySubscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Subscription initiation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error && typeof error === 'object' ? JSON.stringify(error) : "No extra details";
    
    return NextResponse.json({ 
      error: "Failed to initiate subscription",
      details: errorMessage,
      raw: errorDetails
    }, { status: 500 });
  }
}
