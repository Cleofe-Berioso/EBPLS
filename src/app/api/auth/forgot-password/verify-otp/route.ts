import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetOtp } from "@/lib/password-reset";
import {
  checkRateLimit,
  rateLimitResponse,
  OTP_VERIFY_IP_RATE_LIMIT,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-client-ip";

export async function POST(request: NextRequest) {
  const ipLimit = checkRateLimit(
    `otp-verify:ip:${getClientIp(request)}`,
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
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyPasswordResetOtp(email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "OTP verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error verifying OTP:", error);
    }
    return NextResponse.json(
      { error: "Failed to verify OTP. Please try again later." },
      { status: 500 }
    );
  }
}
