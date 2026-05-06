import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { addDays } from "date-fns";
import { cancelRazorpaySubscription } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle Subscription Charged (Recurring payment success)
    if (event.event === "subscription.charged") {
      const subscriptionData = event.payload.subscription.entity;
      const paymentData = event.payload.payment.entity;
      
      const razorpaySubscriptionId = subscriptionData.id;

      const existingSubscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId },
        include: { plan: true },
      });

      if (existingSubscription) {
        // If this is the first charge of a SCHEDULED subscription, activate it
        if (existingSubscription.status === "SCHEDULED") {
          
          // First, find all other active subscriptions for this employer
          const oldSubscriptions = await prisma.subscription.findMany({
            where: {
              employerId: existingSubscription.employerId,
              status: "ACTIVE",
              id: { not: existingSubscription.id }
            }
          });

          // Cancel them in Razorpay to prevent double billing!
          for (const sub of oldSubscriptions) {
            if (sub.razorpaySubscriptionId) {
              try {
                await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
                console.log(`Webhook: Successfully cancelled old Razorpay sub ${sub.razorpaySubscriptionId}`);
              } catch (e) {
                console.error(`Webhook: Failed to cancel old razorpay subscription ${sub.razorpaySubscriptionId}`, e);
              }
            }
          }

          // Expire them in our local DB
          await prisma.subscription.updateMany({
            where: {
              employerId: existingSubscription.employerId,
              status: "ACTIVE",
              id: { not: existingSubscription.id }
            },
            data: { 
              status: "EXPIRED",
              scheduledPlanId: null 
            }
          });

          // Activate this one
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { 
              status: "ACTIVE",
              razorpayPaymentId: paymentData.id,
            }
          });

          // Update Employer Profile
          await prisma.employerProfile.update({
            where: { userId: existingSubscription.employerId },
            data: {
              subscriptionId: existingSubscription.id,
              subscriptionStatus: "ACTIVE",
              subscriptionExpiry: existingSubscription.endDate,
              resumeSearchEnabled: existingSubscription.plan.resumeSearchEnabled,
              xraySearchEnabled: existingSubscription.plan.xraySearchEnabled,
            },
          });

          return NextResponse.json({ received: true });
        }

        // Extract the actual plan ID from the Razorpay payload
        const actualRazorpayPlanId = subscriptionData.plan_id;

        // If the plan has been upgraded/switched, we need to find the internal plan ID
        let currentPlanId = existingSubscription.planId;
        let newScheduledPlanId = existingSubscription.scheduledPlanId;

        if (existingSubscription.plan.razorpayPlanId !== actualRazorpayPlanId) {
          const newPlan = await prisma.plan.findFirst({
            where: { razorpayPlanId: actualRazorpayPlanId }
          });
          if (newPlan) {
            currentPlanId = newPlan.id;
            newScheduledPlanId = null; // Upgrade complete
          }
        }

        // Extend the end date by the plan duration
        // (If the plan changed, use the new plan's duration, otherwise use the existing)
        const activePlan = await prisma.plan.findUnique({ where: { id: currentPlanId } });
        const durationDays = activePlan ? activePlan.durationDays : existingSubscription.plan.durationDays;
        const newEndDate = addDays(new Date(existingSubscription.endDate), durationDays);
        
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: currentPlanId,
            scheduledPlanId: newScheduledPlanId,
            endDate: newEndDate,
            status: "ACTIVE",
            razorpayPaymentId: paymentData.id,
          },
        });

        // Also update Employer Profile
        await prisma.employerProfile.update({
          where: { userId: existingSubscription.employerId },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionExpiry: newEndDate,
            resumeSearchEnabled: activePlan ? activePlan.resumeSearchEnabled : existingSubscription.plan.resumeSearchEnabled,
            xraySearchEnabled: activePlan ? activePlan.xraySearchEnabled : existingSubscription.plan.xraySearchEnabled,
          },
        });
      }
    }

    // Handle Subscription Cancelled/Completed/Halted
    const terminalEvents = ["subscription.cancelled", "subscription.completed", "subscription.halted"];
    if (terminalEvents.includes(event.event)) {
      const subscriptionData = event.payload.subscription.entity;
      const razorpaySubscriptionId = subscriptionData.id;

      const sub = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId },
      });

      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });

        await prisma.employerProfile.update({
          where: { userId: sub.employerId },
          data: { 
            subscriptionStatus: "EXPIRED",
            resumeSearchEnabled: false,
            xraySearchEnabled: false 
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
