import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getUserByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/db";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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

        const user = await getUserByEmail(email);
        if (!user) return null;
        if (!user.isActive) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
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
          select: { id: true, role: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as Role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
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
  },
});
