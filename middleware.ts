import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default auth((req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/", "/login", "/register", "/api/auth"];
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes
  if (path.startsWith("/admin")) {
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Employer routes
  if (path.startsWith("/employer")) {
    if (session.user.role !== UserRole.EMPLOYER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // User/Job Seeker routes
  if (path.startsWith("/user")) {
    if (session.user.role !== UserRole.JOB_SEEKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/employer/:path*",
    "/user/:path*",
    "/dashboard/:path*",
    "/api/:path*((?!auth).*)",
  ],
};

