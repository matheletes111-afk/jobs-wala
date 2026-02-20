import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

/** Password reset link is valid for this many hours */
const PASSWORD_RESET_LINK_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + PASSWORD_RESET_LINK_EXPIRY_HOURS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetTokenExpiry: expiry,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const encodedToken = encodeURIComponent(token);
    const resetLink = `${baseUrl}/reset-password?token=${encodedToken}`;

    const name = user.jobSeekerProfile
      ? `${user.jobSeekerProfile.firstName} ${user.jobSeekerProfile.lastName}`
      : user.employerProfile?.companyName || undefined;

    let emailResult: { success?: boolean; error?: unknown };
    try {
      emailResult = await sendPasswordResetEmail({
        to: user.email,
        resetLink,
        name,
      });
    } catch (emailErr) {
      console.error("[FORGOT-PASSWORD] Email send threw:", emailErr);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetTokenExpiry: null },
      });
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    // If email returned success: false (e.g. no provider configured)
    if (emailResult && "success" in emailResult && !emailResult.success) {
      console.error("[FORGOT-PASSWORD] Email send failed:", (emailResult as { error?: unknown }).error);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetTokenExpiry: null },
      });
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "A password reset link has been sent to your email.",
    });
  } catch (err) {
    console.error("[FORGOT-PASSWORD] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
