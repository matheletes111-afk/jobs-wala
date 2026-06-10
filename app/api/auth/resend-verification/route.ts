import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
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
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email address is already verified. You can sign in directly." },
        { status: 400 }
      );
    }

    // Generate new verification token and expiry (24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    // Update user in DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
      },
    });

    // Send verification email with dynamic baseUrl
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;
    const encodedToken = encodeURIComponent(verificationToken);
    const verificationLink = `${baseUrl}/api/verify-email?token=${encodedToken}`;

    const userName = user.role === "JOB_SEEKER"
      ? (user.jobSeekerProfile ? `${user.jobSeekerProfile.firstName} ${user.jobSeekerProfile.lastName}` : user.email)
      : (user.employerProfile?.companyName || user.email);

    const emailResult = await sendVerificationEmail({
      to: user.email,
      verificationLink,
      name: userName,
    });

    if (emailResult && "success" in emailResult && !emailResult.success) {
      const error = "error" in emailResult ? emailResult.error : undefined;
      console.error("[RESEND-VERIFICATION] SendGrid failed:", error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification link sent! Please check your inbox.",
    });
  } catch (err) {
    console.error("[RESEND-VERIFICATION] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
