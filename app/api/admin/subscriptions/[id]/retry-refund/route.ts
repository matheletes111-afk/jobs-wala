import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundRazorpayPayment } from "@/lib/razorpay";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.refundStatus !== "FAILED") {
      return NextResponse.json(
        { error: "Refund is not in FAILED status" },
        { status: 400 }
      );
    }

    if (!subscription.razorpayPaymentId || !subscription.refundAmount) {
      return NextResponse.json(
        { error: "Invalid refund details on this subscription" },
        { status: 400 }
      );
    }

    // Call Razorpay API to retry the refund using the pre-calculated amount
    try {
      const refund = await refundRazorpayPayment(
        subscription.razorpayPaymentId,
        Math.round(subscription.refundAmount * 100),
        { reason: "Admin retry of prorated refund" }
      );

      // Update Database Subscription
      const updatedSub = await prisma.subscription.update({
        where: { id },
        data: {
          refundStatus: "SUCCESS",
          refundId: refund.id,
          refundedAt: new Date(),
          refundError: null,
        },
      });

      return NextResponse.json({ success: true, subscription: updatedSub });
    } catch (err: any) {
      console.error("Retry refund failed:", err);
      
      // Update with the latest failure reason
      const updatedSub = await prisma.subscription.update({
        where: { id },
        data: {
          refundStatus: "FAILED",
          refundError: err?.message || "Unknown Razorpay error during retry",
        },
      });

      return NextResponse.json(
        { error: err?.message || "Refund failed again", subscription: updatedSub },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Retry handler error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
