import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySubscription, cancelRazorpaySubscription, getRazorpaySubscription, refundRazorpayPayment } from "@/lib/razorpay";
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

    const startAt = razorpaySub.start_at ? new Date(razorpaySub.start_at * 1000) : new Date();
    const now = new Date();

    // Check if the user has an existing active subscription
    const existingSub = await prisma.subscription.findFirst({
      where: {
        employerId: userId,
        status: "ACTIVE",
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    let refundAmount = null;
    let refundStatus = null;
    let refundId = null;
    let refundError = null;

    if (existingSub) {
      const totalDurationMs = new Date(existingSub.endDate).getTime() - new Date(existingSub.startDate).getTime();
      const remainingMs = new Date(existingSub.endDate).getTime() - now.getTime();
      const proratedAmount = totalDurationMs > 0 ? (remainingMs / totalDurationMs) * existingSub.plan.amount : 0;

      if (proratedAmount > 0 && existingSub.razorpayPaymentId) {
        try {
          // Cancel old subscription first immediately (not cycle end)
          if (existingSub.razorpaySubscriptionId) {
            await cancelRazorpaySubscription(existingSub.razorpaySubscriptionId, false);
          }
          
          // Issue refund
          const refund = await refundRazorpayPayment(existingSub.razorpayPaymentId, Math.round(proratedAmount * 100), {
            reason: "Prorated refund for plan switch"
          });
          refundId = refund.id;
          refundStatus = "SUCCESS";
        } catch (err: any) {
          console.error("Razorpay refund failed:", err);
          refundStatus = "FAILED";
          refundError = err?.message || "Unknown Razorpay error";
        }
      } else {
        // If amount is 0 or no payment id exists, we still cancel the old subscription
        if (existingSub.razorpaySubscriptionId) {
          try {
            await cancelRazorpaySubscription(existingSub.razorpaySubscriptionId, false);
          } catch (e) {
            console.error("Failed to cancel old subscription during switch:", e);
          }
        }
        refundStatus = "SUCCESS";
      }

      // Cancel old subscription in database and save refund details
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          status: "CANCELLED",
          refundAmount: proratedAmount > 0 ? proratedAmount : null,
          refundedAt: proratedAmount > 0 ? new Date() : null,
          refundId,
          refundStatus,
          refundError
        }
      });
    }

    // Create the new subscription immediately
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

    // Cleanup: double-billing safeguard loop
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
          await cancelRazorpaySubscription(oldSub.razorpaySubscriptionId, false);
        } catch (e) {
          console.error("Failed to cancel old Razorpay subscription during cleanup:", e);
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
