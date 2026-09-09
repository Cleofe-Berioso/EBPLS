import type { Role } from "@/lib/db";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    isActive?: boolean;
    roleCheckedAt?: number;
    rememberMe?: boolean;
    /** Absolute session end (ms since epoch). Enforces short sessions when Remember me is off. */
    sessionExpiresAt?: number;
  }
}
