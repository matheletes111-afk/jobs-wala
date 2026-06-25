import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPayment } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment response parameters" },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      // Update lead status to FAILED
      await prisma.careerPurchaseLead.updateMany({
        where: { razorpayOrderId },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update lead status to PAID
    // Find the lead first
    const lead = await prisma.careerPurchaseLead.findFirst({
      where: { razorpayOrderId },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead matching the order ID not found" },
        { status: 404 }
      );
    }

    const updatedLead = await prisma.careerPurchaseLead.update({
      where: { id: lead.id },
      data: {
        status: "PAID",
        razorpayPaymentId,
        razorpaySignature,
      },
      include: {
        package: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
