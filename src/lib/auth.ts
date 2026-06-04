import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getUserByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/db";
import { checkRateLimit, LOGIN_EMAIL_RATE_LIMIT } from "@/lib/rate-limit";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const configuredSecret =
  process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

const authSecret =
  configuredSecret ||
  (process.env.NODE_ENV === "development" ? "dev-only-auth-secret-change-me" : undefined);

// Emit a loud warning at startup so misconfigured deployments are immediately visible.
if (!configuredSecret && process.env.NODE_ENV === "production") {
  console.error(
    "[auth] CRITICAL: Neither AUTH_SECRET nor NEXTAUTH_SECRET is set in production. " +
    "Sessions are signed with an insecure fallback. Set AUTH_SECRET in your environment variables immediately."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: authSecret,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        try {
          const normalizedEmail = email.trim().toLowerCase();
          const emailLimit = checkRateLimit(
            `login:email:${normalizedEmail}`,
            LOGIN_EMAIL_RATE_LIMIT
          );
          if (!emailLimit.ok) return null;

          const user = await getUserByEmail(normalizedEmail);

          if (!user || !user.isActive) return null;

          const passwordMatch = await bcrypt.compare(password, user.passwordHash);
          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Credentials authorize failed unexpectedly", error);
          }
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const profileEmail = typeof profile?.email === "string" ? profile.email : user.email;
      if (!profileEmail) {
        return false;
      }

      const normalizedEmail = profileEmail.trim().toLowerCase();
      const defaultName = user.name?.trim() || normalizedEmail.split("@")[0] || "Google User";

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      if (existingUser && !existingUser.isActive) {
        return false;
      }

      const resolvedUser =
        existingUser ??
        (await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: defaultName,
            role: "APPLICANT",
            // OAuth users do not use credentials password flow; keep a random hash to satisfy schema.
            passwordHash: await bcrypt.hash(randomUUID(), 12),
          },
          select: { id: true, email: true, name: true, role: true },
        }));

      const oauthUser = user as typeof user & AuthUser;
      oauthUser.id = resolvedUser.id;
      oauthUser.email = resolvedUser.email;
      oauthUser.name = resolvedUser.name;
      oauthUser.role = resolvedUser.role as Role;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }

      if ((!token.id || !token.role) && typeof token.email === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true, role: true, isActive: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as Role;
          token.isActive = dbUser.isActive;
        }
      }

      if (typeof token.id === "string" && token.id.length > 0) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, role: true, isActive: true },
        });

        if (!dbUser || !dbUser.isActive) {
          token.isActive = false;
        } else {
          token.id = dbUser.id;
          token.role = dbUser.role as Role;
          token.isActive = true;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.isActive === false) {
          session.user.id = "";
          session.user.role = "APPLICANT";
          return session;
        }

        session.user.id = (token.id as string) ?? "";
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — reduces stale-token window
  },
});
