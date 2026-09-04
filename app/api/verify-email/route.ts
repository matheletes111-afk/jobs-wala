import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawToken = searchParams.get("token") || "";

    if (!rawToken || !rawToken.trim()) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    const token = rawToken.trim();
    let decodedToken = token;
    try {
      decodedToken = decodeURIComponent(token).trim();
    } catch {
      // ignore decode error if token wasn't encoded
    }

    // Find user with this verification token (check exact and decoded variants)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { emailVerificationToken: token },
          { emailVerificationToken: decodedToken },
        ],
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    // Check if token has expired
    if (
      user.emailVerificationTokenExpiry &&
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
