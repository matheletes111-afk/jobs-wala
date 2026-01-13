import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    // Check if token has expired
    if (
      !user.emailVerificationTokenExpiry ||
      user.emailVerificationTokenExpiry < new Date()
    ) {
      return NextResponse.redirect(
        new URL("/login?error=token_expired", req.url)
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/login?verified=true", req.url)
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/login?verified=true", req.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", req.url)
    );
  }
}

