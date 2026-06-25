import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { name, email, mobile, packageId } = await req.json();

    if (!name || !email || !mobile || !packageId) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, mobile, packageId)" },
        { status: 400 }
      );
    }

    const careerPackage = await prisma.careerPackage.findUnique({
      where: { id: packageId },
    });

    if (!careerPackage) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Razorpay amount in paise (Rupees * 100)
    const amountInPaise = Math.round(careerPackage.price * 100);

    // Create Razorpay Order
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: amountInPaise,
        currency: "INR",
        notes: {
          name,
          email,
          mobile,
          packageId,
          packageName: careerPackage.name,
        },
      });
    } catch (err: any) {
      console.error("Razorpay order creation failed:", err);
      return NextResponse.json(
        { error: "Razorpay initialization failed: " + (err.message || err) },
        { status: 500 }
      );
    }

    // Save lead record in database as PENDING
    const lead = await prisma.careerPurchaseLead.create({
      data: {
        name,
        email,
        mobile,
        packageId,
        amount: careerPackage.price,
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      leadId: lead.id,
      keyId: process.env.RAZORPAY_KEY_ID, // Frontend needs key ID to open Razorpay checkout
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
