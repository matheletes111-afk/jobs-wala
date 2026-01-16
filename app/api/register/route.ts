import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    role: z.nativeEnum(UserRole),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === UserRole.JOB_SEEKER) {
        return data.firstName && data.firstName.length > 0 && data.lastName && data.lastName.length > 0;
      }
      return true;
    },
    {
      message: "First name and last name are required for job seekers",
      path: ["firstName"],
    }
  )
  .refine(
    (data) => {
      if (data.role === UserRole.EMPLOYER) {
        return data.companyName && data.companyName.length > 0;
      }
      return true;
    },
    {
      message: "Company name is required for employers",
      path: ["companyName"],
    }
  );

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours expiry

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
      },
    });

    // Create profile based on role
    try {
      if (validatedData.role === UserRole.JOB_SEEKER) {
        if (!validatedData.firstName || !validatedData.lastName) {
          // Clean up user if profile creation fails
          await prisma.user.delete({ where: { id: user.id } });
          return NextResponse.json(
            { error: "First name and last name are required for job seekers" },
            { status: 400 }
          );
        }
        await prisma.jobSeekerProfile.create({
          data: {
            userId: user.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
          },
        });
      } else if (validatedData.role === UserRole.EMPLOYER) {
        if (!validatedData.companyName) {
          // Clean up user if profile creation fails
          await prisma.user.delete({ where: { id: user.id } });
          return NextResponse.json(
            { error: "Company name is required for employers" },
            { status: 400 }
          );
        }
        await prisma.employerProfile.create({
          data: {
            userId: user.id,
            companyName: validatedData.companyName,
          },
        });
      }
    } catch (profileError) {
      // Clean up user if profile creation fails
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {
        // Ignore cleanup errors
      });
      console.error("Profile creation error:", profileError);
      throw profileError;
    }

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;
    
    const userName = validatedData.role === UserRole.JOB_SEEKER
      ? `${validatedData.firstName} ${validatedData.lastName}`
      : validatedData.companyName || validatedData.email;

    console.log("[REGISTER DEBUG] Preparing to send verification email");
    console.log("[REGISTER DEBUG] Email:", validatedData.email);
    console.log("[REGISTER DEBUG] Verification link:", verificationLink);
    console.log("[REGISTER DEBUG] User name:", userName);

    let emailResult;
    try {
      emailResult = await sendVerificationEmail({
        to: validatedData.email,
        verificationLink,
        name: userName,
      });
      
      console.log("[REGISTER DEBUG] Email send result:", JSON.stringify(emailResult, null, 2));
      
      if (!emailResult.success) {
        // Type guard: check if error property exists
        const error = 'error' in emailResult ? emailResult.error : undefined;
        console.error("[REGISTER DEBUG] ❌ Email failed to send:", error);
        // Don't fail registration if email fails, but log it
      } else {
        console.log("[REGISTER DEBUG] ✅ Email sent successfully!");
      }
    } catch (emailError) {
      console.error("[REGISTER DEBUG] ❌ Exception while sending email:", emailError);
      console.error("[REGISTER DEBUG] Error details:", emailError instanceof Error ? emailError.message : String(emailError));
      emailResult = { success: false, error: emailError };
      // Don't fail registration if email fails, but log it
    }

    // Serialize error for JSON response
    let emailErrorString: string | undefined = undefined;
    if (emailResult?.success === false && 'error' in emailResult && emailResult.error) {
      const error = emailResult.error;
      if (typeof error === 'string') {
        emailErrorString = error;
      } else if (error instanceof Error) {
        emailErrorString = error.message;
      } else if (typeof error === 'object') {
        emailErrorString = JSON.stringify(error);
      } else {
        emailErrorString = String(error);
      }
    }

    return NextResponse.json(
      { 
        message: "User registered successfully. Please check your email to verify your account.",
        userId: user.id,
        emailSent: emailResult?.success || false,
        ...(emailErrorString && { emailError: emailErrorString }),
        // Include debug info in development
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            emailSent: emailResult?.success || false,
            hasApiKey: !!process.env.RESEND_API_KEY,
            fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A",
          },
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    
    // Return more detailed error information in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

