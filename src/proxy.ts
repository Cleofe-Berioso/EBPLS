import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { canAccess, isProtectedRoute, ROLE_HOME } from "@/lib/rbac";
import type { Role } from "@/lib/db";

const authDiagnosticsEnabled = process.env.AUTH_DIAGNOSTICS === "1";

function logAuthRedirect(input: {
  pathname: string;
  userId: string | undefined;
  sessionRole: Role | undefined;
  destination: string;
  reason: string;
}) {
  if (!authDiagnosticsEnabled) return;
  console.info("[auth:proxy] redirect", input);
}

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const acceptHeader = req.headers.get("accept") ?? "";
  const isServerActionRequest = req.headers.has("next-action");
  const isRscRequest = req.headers.get("rsc") === "1" || acceptHeader.includes("text/x-component");
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role as Role | undefined;
  const userId = req.auth?.user?.id;
  const loginError = nextUrl.searchParams.get("error");
  const stayOnLogin =
    loginError === "account-disabled" || loginError === "session-expired";

  // Never redirect/alter response expectations for server action or RSC transport requests.
  if (isServerActionRequest || isRscRequest) {
    return NextResponse.next();
  }

  // Auth callbacks should bypass dashboard role redirects.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from the login page
  if (isLoggedIn && pathname === "/login" && !stayOnLogin) {
    const home = role ? ROLE_HOME[role] : "/login";
    if (home === pathname) {
      return NextResponse.next();
    }
    logAuthRedirect({
      pathname,
      userId,
      sessionRole: role,
      destination: home,
      reason: "logged-in-on-login-page",
    });
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  // Protect dashboard routes — unauthenticated → login
  if (!isLoggedIn && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    logAuthRedirect({
      pathname,
      userId,
      sessionRole: role,
      destination: loginUrl.pathname,
      reason: "unauthenticated-protected-route",
    });
    return NextResponse.redirect(loginUrl);
  }

  // Role mismatch — send to own dashboard
  if (isLoggedIn && isProtectedRoute(pathname) && !canAccess(pathname, role)) {
    const home = role ? ROLE_HOME[role] : "/login";
    if (home === pathname) {
      return NextResponse.next();
    }
    logAuthRedirect({
      pathname,
      userId,
      sessionRole: role,
      destination: home,
      reason: "role-mismatch",
    });
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-ebpls-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - all _next internals, favicon.ico, public assets
     */
    "/((?!_next/|favicon.ico|images/).*)",
  ],
};
