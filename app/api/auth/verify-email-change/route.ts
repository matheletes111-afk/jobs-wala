import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    try {
      token = decodeURIComponent(token);
    } catch {
      // use as-is
    }

    const user = await prisma.user.findFirst({
      where: { emailChangeToken: token },
    });

    if (!user || !user.pendingEmail || !user.emailChangeTokenExpiry) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", req.url)
      );
    }

    const redirectBase =
      user.role === "EMPLOYER"
        ? "/employer/profile"
        : user.role === "JOB_SEEKER"
          ? "/user/profile"
          : "/dashboard";

    if (new Date() > user.emailChangeTokenExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeTokenExpiry: null,
        },
      });
      return NextResponse.redirect(
        new URL(`${redirectBase}?error=token_expired`, req.url)
      );
    }

    const newEmail = user.pendingEmail;

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeTokenExpiry: null,
        },
      });
      return NextResponse.redirect(
        new URL(`${redirectBase}?error=email_taken`, req.url)
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeTokenExpiry: null,
      },
    });

    return NextResponse.redirect(
      new URL(`${redirectBase}?email_changed=true`, req.url)
    );
  } catch (error) {
    console.error("Verify email change error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", req.url)
    );
  }
}
