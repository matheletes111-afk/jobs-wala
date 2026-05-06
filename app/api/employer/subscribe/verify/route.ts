import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySubscription, cancelRazorpaySubscription, getRazorpaySubscription } from "@/lib/razorpay";
import { addDays } from "date-fns";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planId } = await req.json();

    const isValid = verifyRazorpaySubscription(
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const userId = session.user.id;
    const razorpaySub = await getRazorpaySubscription(razorpay_subscription_id);
    
    console.log("Verify Debug - Razorpay Sub Status:", razorpaySub.status);
    console.log("Verify Debug - Razorpay Sub StartAt (Unix):", razorpaySub.start_at);

    // Check if the subscription is scheduled for the future
    const startAt = razorpaySub.start_at ? new Date(razorpaySub.start_at * 1000) : new Date();
    const now = new Date();
    
    // It's future dated if start_at is more than 60 seconds from now OR if status is not 'active'
    const isFutureDated = (startAt.getTime() > (now.getTime() + 60000)) || 
                         (razorpaySub.status === "authenticated") || 
                         (razorpaySub.status === "created");

    console.log("Verify Debug - Is Future Dated:", isFutureDated);

    if (isFutureDated) {
      // Find the existing active subscription to attach the scheduled plan
      const existingSub = await prisma.subscription.findFirst({
        where: { employerId: userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" }
      });

      console.log("Verify Debug - Existing Active Sub Found:", !!existingSub);

      if (existingSub) {
        // Create a record for the future subscription so the webhook can find it later
        await prisma.subscription.create({
          data: {
            employerId: userId,
            planId: planId,
            status: "SCHEDULED",
            startDate: startAt,
            endDate: addDays(startAt, plan.durationDays),
            razorpaySubscriptionId: razorpay_subscription_id,
            razorpayPaymentId: razorpay_payment_id,
          }
        });

        const updatedSub = await prisma.subscription.update({
          where: { id: existingSub.id },
          data: { scheduledPlanId: planId },
        });

        // CRITICAL RACE CONDITION FIX:
        // Tell Razorpay to cancel the OLD subscription exactly at the end of its current billing cycle.
        // This ensures Razorpay will NOT try to charge the old plan on the exact same day the new plan starts.
        if (existingSub.razorpaySubscriptionId) {
          try {
            await cancelRazorpaySubscription(existingSub.razorpaySubscriptionId, true);
            console.log(`Verify Debug - Set old Razorpay sub ${existingSub.razorpaySubscriptionId} to cancel at cycle end`);
          } catch (e) {
            console.error(`Verify Debug - Failed to set cycle-end cancellation for old sub`, e);
          }
        }

        console.log("Verify Debug - Updated Existing Sub scheduledPlanId:", updatedSub.scheduledPlanId);
        
        return NextResponse.json({ success: true, isUpgradeScheduled: true });
      }
    }

    const subscription = await prisma.subscription.create({
      data: {
        employerId: userId,
        planId: plan.id,
        status: "ACTIVE",
        startDate: startAt,
        endDate: addDays(startAt, plan.durationDays),
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayPaymentId: razorpay_payment_id,
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

    // Cleanup: If the user had previous ACTIVE subscriptions (e.g. from a UPI fallback where upgrade wasn't possible)
    // we MUST cancel them now so they don't get double billed!
    const oldSubscriptions = await prisma.subscription.findMany({
      where: {
        employerId: userId,
        status: "ACTIVE",
        id: { not: subscription.id }
      }
    });

    for (const oldSub of oldSubscriptions) {
      if (oldSub.razorpaySubscriptionId) {
        try {
          await cancelRazorpaySubscription(oldSub.razorpaySubscriptionId);
        } catch (e) {
          console.error("Failed to cancel old Razorpay subscription during fallback cleanup:", e);
        }
      }
      await prisma.subscription.update({
        where: { id: oldSub.id },
        data: { status: "CANCELLED" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to verify subscription" }, { status: 500 });
  }
}
