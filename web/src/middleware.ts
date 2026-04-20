import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

// Rate limit configs per route category
const RATE_LIMITS = {
  auth: { maxRequests: 10, windowSeconds: 60 },
  api: { maxRequests: 100, windowSeconds: 60 },
  otp: { maxRequests: 5, windowSeconds: 900 },
  upload: { maxRequests: 20, windowSeconds: 60 },
  payment: { maxRequests: 5, windowSeconds: 60 },
} as const;

function getRateLimitCategory(pathname: string): keyof typeof RATE_LIMITS | null {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (pathname.startsWith("/api/documents/upload")) return "upload";
  if (pathname.startsWith("/api/payments")) return "payment";
  if (pathname.match(/\/api\/auth\/.*otp|\/api\/auth\/2fa/)) return "otp";
  if (pathname.startsWith("/api/")) return "api";
  return null;
}

function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");

  // ── Rate Limiting for API routes ─────────────────────────────────────
  if (isApiRoute) {
    const category = getRateLimitCategory(pathname);
    if (category) {
      const ip = getClientIp(req);
      const result = checkRateLimit(`${category}:${ip}`, RATE_LIMITS[category]);
      if (!result.allowed) {
        return createRateLimitResponse(result);
      }
    }
  }

  // ── Auth Redirects ───────────────────────────────────────────────────
  // Redirect logged-in users from auth pages to dashboard
  if (
    isLoggedIn &&
    (pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect dashboard routes
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes (except auth, webhooks, and public events)
  if (
    isApiRoute &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/payments/webhook") &&
    !isLoggedIn
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Role-Based Access Control ────────────────────────────────────────
  // Admin routes (BPLO Office only)
  if (pathname.startsWith("/dashboard/admin") && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== "BPLO_OFFICE") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Review & verification routes (BPLO Office only)
  if ((pathname.startsWith("/dashboard/review") || pathname.startsWith("/dashboard/verify-documents")) && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== "BPLO_OFFICE") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Issuance routes (BPLO Office only)
  if (pathname.startsWith("/dashboard/issuance") && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== "BPLO_OFFICE") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Payment routes (MTO only)
  if ((pathname.startsWith("/dashboard/payment") || pathname.startsWith("/dashboard/validate") || pathname.startsWith("/dashboard/receipts")) && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== "MTO") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Analytics routes — BPLO+ only
  if (pathname.startsWith("/api/analytics") && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role === "APPLICANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
