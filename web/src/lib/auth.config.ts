/**
 * Auth Configuration (Edge-compatible)
 *
 * This file contains the NextAuth configuration that is safe to use
 * in the Edge Runtime (middleware). It does NOT import bcryptjs, prisma,
 * or any Node.js-only modules.
 *
 * The full auth config (with Credentials provider) is in auth.ts.
 */
import type { NextAuthConfig } from "next-auth";

// Inline Role type to avoid importing @prisma/client in Edge Runtime
type Role = "APPLICANT" | "BPLO_OFFICE" | "ADMIN";
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export const authConfig = {
  providers: [], // Providers are added in auth.ts (Node.js runtime only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.status = (user as { status: AccountStatus }).status;
        token.firstName = (user as { firstName: string }).firstName;
        token.lastName = (user as { lastName: string }).lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.status = token.status as AccountStatus;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
