import { NextRequest, NextResponse } from "next/server";
import { requestPasswordResetOtp } from "@/lib/password-reset";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  rateLimitResponse,
  OTP_REQUEST_IP_RATE_LIMIT,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-client-ip";

export async function POST(request: NextRequest) {
  const ipLimit = checkRateLimit(
    `otp-request:ip:${getClientIp(request)}`,
    OTP_REQUEST_IP_RATE_LIMIT
  );
  if (!ipLimit.ok) {
    return rateLimitResponse(ipLimit.resetAt);
  }

  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    // Validate email format
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists (but don't reveal this in response)
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    // Generate and send OTP if user exists
    if (userExists) {
      try {
        const plainOtp = await requestPasswordResetOtp(email);
        const expirationMinutes = parseInt(
          process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES || "10"
        );

        // plainOtp is empty when the 60-second cooldown is still active.
        // Skip sending another email to prevent inbox flooding.
        if (plainOtp) {
          const emailHtml = generatePasswordResetEmailHtml(plainOtp, expirationMinutes);
          await sendEmail({
            to: email,
            subject: "Business Permit Online System — Password Reset OTP",
            html: emailHtml,
          });
        }
      } catch (emailError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error sending password reset email:", emailError);
        }
      }
    }

    // Always return success message (don't reveal whether email exists)
    return NextResponse.json(
      {
        message:
          "If this email is registered with the Business Permit Online System, an OTP has been sent. Please check your inbox and spam folder.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in password reset request:", error);
    }
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
