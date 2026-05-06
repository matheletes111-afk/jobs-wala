import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const PASSWORD_MIN_LENGTH = 8;
const passwordSchema = {
  minLength: PASSWORD_MIN_LENGTH,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "Password must be at least 8 characters";
  }
  if (!passwordSchema.hasUpper.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!passwordSchema.hasLower.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!passwordSchema.hasNumber.test(password)) {
    return "Password must contain at least one number";
  }
  if (!passwordSchema.hasSpecial.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let token =
      typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    try {
      token = decodeURIComponent(token);
    } catch {
      // use as-is
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetTokenExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > user.passwordResetTokenExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetTokenExpiry: null },
      });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
