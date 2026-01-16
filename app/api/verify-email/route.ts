import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let token = searchParams.get("token");

    console.log("[VERIFY DEBUG] Verification attempt");
    console.log("[VERIFY DEBUG] Raw token from URL:", token);
    console.log("[VERIFY DEBUG] Token length:", token?.length);

    if (!token) {
      console.error("[VERIFY DEBUG] ❌ No token provided");
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    // Decode URL-encoded token (in case email client encoded it)
    try {
      token = decodeURIComponent(token);
      console.log("[VERIFY DEBUG] Decoded token:", token.substring(0, 20) + "...");
    } catch (decodeError) {
      console.log("[VERIFY DEBUG] Token not URL encoded, using as-is");
    }

    // Find user with this verification token
    console.log("[VERIFY DEBUG] Searching for user with token...");
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      console.error("[VERIFY DEBUG] ❌ User not found with this token");
      
      // Try to find any users with similar tokens (for debugging)
      const allUsers = await prisma.user.findMany({
        where: { 
          emailVerificationToken: { not: null }
        },
        select: {
          email: true,
          emailVerificationToken: true,
          emailVerificationTokenExpiry: true,
        },
        take: 5,
      });
      console.log("[VERIFY DEBUG] Found users with tokens:", allUsers.map(u => ({
        email: u.email,
        tokenLength: u.emailVerificationToken?.length,
        tokenPrefix: u.emailVerificationToken?.substring(0, 10),
        expiry: u.emailVerificationTokenExpiry,
      })));
      
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    console.log("[VERIFY DEBUG] ✅ User found:", user.email);

    // Check if token has expired
    console.log("[VERIFY DEBUG] Checking token expiry...");
    console.log("[VERIFY DEBUG] Token expiry:", user.emailVerificationTokenExpiry);
    console.log("[VERIFY DEBUG] Current time:", new Date());
    
    if (
      !user.emailVerificationTokenExpiry ||
      user.emailVerificationTokenExpiry < new Date()
    ) {
      console.error("[VERIFY DEBUG] ❌ Token expired");
      return NextResponse.redirect(
        new URL("/login?error=token_expired", req.url)
      );
    }

    // Check if already verified
    console.log("[VERIFY DEBUG] Email verified status:", user.emailVerified);
    if (user.emailVerified) {
      console.log("[VERIFY DEBUG] ✅ Already verified, redirecting");
      return NextResponse.redirect(
        new URL("/login?verified=true", req.url)
      );
    }

    // Verify the user
    console.log("[VERIFY DEBUG] Updating user to verified...");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    console.log("[VERIFY DEBUG] ✅ Email verified successfully!");
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

