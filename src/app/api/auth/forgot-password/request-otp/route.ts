import { NextRequest, NextResponse } from "next/server";
import { requestPasswordResetOtp } from "@/lib/password-reset";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

        const emailHtml = generatePasswordResetEmailHtml(plainOtp, expirationMinutes);

        await sendEmail({
          to: email,
          subject: "EBPLS Password Reset OTP",
          html: emailHtml,
        });

        console.log(`Password reset OTP sent to: ${email}`);
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Don't expose email errors to client; return generic message
      }
    }

    // Always return success message (don't reveal whether email exists)
    return NextResponse.json(
      {
        message:
          "If this email is registered with EBPLS, an OTP has been sent. Please check your inbox and spam folder.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in password reset request:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
