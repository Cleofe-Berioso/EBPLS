import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { canAccess, isProtectedRoute, ROLE_HOME } from "@/lib/rbac";
import type { Role } from "@/lib/db";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role as Role | undefined;

  // Redirect logged-in users away from the login page
  if (isLoggedIn && pathname === "/login") {
    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  // Protect dashboard routes — unauthenticated → login
  if (!isLoggedIn && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role mismatch — send to own dashboard
  if (isLoggedIn && isProtectedRoute(pathname) && !canAccess(pathname, role)) {
    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image, favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
