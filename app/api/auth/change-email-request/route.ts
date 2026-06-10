import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmailChangeVerificationEmail } from "@/lib/email";

const EMAIL_CHANGE_LINK_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const newEmail =
      typeof body.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";

    if (!newEmail) {
      return NextResponse.json(
        { error: "New email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (newEmail === user.email) {
      return NextResponse.json(
        { error: "New email is the same as your current email" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please use a different email." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + EMAIL_CHANGE_LINK_EXPIRY_HOURS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: newEmail,
        emailChangeToken: token,
        emailChangeTokenExpiry: expiry,
      },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;
    const encodedToken = encodeURIComponent(token);
    const verifyLink = `${baseUrl}/api/auth/verify-email-change?token=${encodedToken}`;

    const emailResult = await sendEmailChangeVerificationEmail({
      to: newEmail,
      verifyLink,
      currentEmail: user.email ?? undefined,
    });

    if (emailResult && "success" in emailResult && !emailResult.success) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeTokenExpiry: null,
        },
      });
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification link sent. Check the new email address to confirm the change.",
      sentTo: newEmail,
    });
  } catch (err) {
    console.error("[CHANGE-EMAIL-REQUEST] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
