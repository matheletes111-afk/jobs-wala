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
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (existingSubscription && existingSubscription.planId === planId) {
      return NextResponse.json(
        { error: "You are already subscribed to this plan." },
        { status: 400 }
      );
    }

    // Handle Free Plan (0 Amount)
    if (plan.amount === 0) {
      // Check if the user is currently on an active premium plan
      if (existingSubscription && existingSubscription.plan.amount > 0) {
        return NextResponse.json(
          { error: "You cannot switch to the Free Plan while you have an active premium subscription." },
          { status: 400 }
        );
      }

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

    console.log("Initiating Razorpay Subscription:", {
      userId,
      planId: plan.id,
      razorpayPlanId: plan.razorpayPlanId,
    });

    const razorpaySubscription = await createRazorpaySubscription({
      planId: plan.razorpayPlanId,
      totalCount: 12, // Recurring for 12 cycles
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
