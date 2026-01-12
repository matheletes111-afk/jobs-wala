import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
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

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
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

