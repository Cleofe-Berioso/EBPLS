import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetOtp } from "@/lib/password-reset";
import {
  checkRateLimit,
  rateLimitResponse,
  OTP_VERIFY_IP_RATE_LIMIT,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-client-ip";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const ipLimit = checkRateLimit(
    `reg-otp-verify:ip:${getClientIp(request)}`,
    OTP_VERIFY_IP_RATE_LIMIT
  );
  if (!ipLimit.ok) {
    return rateLimitResponse(ipLimit.resetAt);
  }

  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();

    // Validate inputs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address format." },
        { status: 400 }
      );
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "OTP must be 6 digits." },
        { status: 400 }
      );
    }

    // Guard: reject if the email is already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Unable to create account. If you already have an account, try signing in." },
        { status: 409 }
      );
    }

    // Verify OTP using the same helper as forgot-password
    const result = await verifyPasswordResetOtp(email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid OTP." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Email verified successfully." },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error verifying registration OTP:", error);
    }
    return NextResponse.json(
      { error: "Failed to verify OTP. Please try again later." },
      { status: 500 }
    );
  }
}
