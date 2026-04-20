import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface User {
    role: Role;
    status: import("@prisma/client").AccountStatus;
    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      status: import("@prisma/client").AccountStatus;
      firstName: string;
      lastName: string;
      image?: string | null;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    role: Role;
    status: import("@prisma/client").AccountStatus;
    firstName: string;
    lastName: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Account is not active. Please verify your email.");
        }

        // CRITICAL FIX #8: Check if account is locked due to failed login attempts
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockedUntil.getTime() - new Date().getTime()) / (60 * 1000)
          );
          throw new Error(
            `Account is locked. Please try again in ${minutesLeft} minute(s).`
          );
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          // CRITICAL FIX #8: Increment failed login attempts and lockout if threshold exceeded
          const failedCount = (user.failedLoginAttempts || 0) + 1;
          const shouldLock = failedCount >= 5;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedCount,
              lockedUntil: shouldLock
                ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                : null,
            },
          });

          // Log failed attempt
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "FAILED_LOGIN",
              entity: "User",
              entityId: user.id,
              details: {
                attemptCount: failedCount,
                locked: shouldLock,
                lockedUntil: shouldLock
                  ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                  : null,
              },
            },
          });

          throw new Error("Invalid email or password");
        }

        // Successful login: reset failed attempts and unlock account
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null, // Clear lock on successful login
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.avatar,
        };
      },
    }),
  ],
});
