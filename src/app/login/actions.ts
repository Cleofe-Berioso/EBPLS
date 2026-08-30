"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { error: "Invalid email or password." };
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await getUserByEmail(normalizedEmail);
    if (existing && !existing.isActive) {
      const passwordMatch = await bcrypt.compare(password, existing.passwordHash);
      if (passwordMatch) {
        return {
          error:
            "Your account has been disabled. Please contact the system administrator.",
        };
      }
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/auth/redirect",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }

      return { error: "Unable to sign in right now. Please try again." };
    }
    // Re-throw NEXT_REDIRECT — Next.js uses this for successful navigation
    throw error;
  }
  return null;
}

export async function googleSignInAction(): Promise<void> {
  await signIn("google", {
    redirectTo: "/auth/redirect",
  });
}
