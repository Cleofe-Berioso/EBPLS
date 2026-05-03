"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/auth/redirect",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password. Please try again." };
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
