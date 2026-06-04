import { NextRequest, NextResponse } from "next/server";
import { resetUserPassword } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    // Validate inputs
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Reset password
    const result = await resetUserPassword(email, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reset password" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error resetting password:", error);
    }
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
