import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api");

  // Create request headers to pass pathname
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", path);

  const next = () => NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });

  // Public routes
  const publicRoutes = [
    "/", 
    "/login", 
    "/register", 
    "/api/auth", 
    "/jobs", 
    "/about-us", 
    "/contact", 
    "/career-services", 
    "/faq", 
    "/jobs/browse", 
    "/api/user/jobs", 
    "/api/categories", 
    "/api/jobs",
    "/ats",
    "/executive-search",
    "/api/career/packages"
  ];
  if (publicRoutes.some((route) => path === route || path.startsWith(route + "/") || path.startsWith("/jobs/"))) {
    return next();
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const isSecure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";

  // Get session token with secureCookie detection and fallbacks for NextAuth v5 / v4 cookie names & proxy environments
  let token = await getToken({ req, secret, secureCookie: isSecure });
  if (!token) {
    token = await getToken({ req, secret, secureCookie: !isSecure });
  }
  if (!token) {
    const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
    token = await getToken({ req, secret, cookieName, secureCookie: isSecure });
  }
  if (!token) {
    const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
    token = await getToken({ req, secret, cookieName, secureCookie: isSecure });
  }

  // Protected routes require authentication
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string;

  // Admin routes
  if (path.startsWith("/admin")) {
    if (role !== "ADMIN") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Employer routes
  if (path.startsWith("/employer")) {
    if (role !== "EMPLOYER" && role !== "ADMIN") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // User/Job Seeker routes
  if (path.startsWith("/user")) {
    if (role !== "JOB_SEEKER" && role !== "ADMIN") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)",
  ],
};

