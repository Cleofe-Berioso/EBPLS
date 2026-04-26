import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomInt } from "crypto";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendOtpEmail, sendWelcomeEmail } from "@/lib/email";
import { sendOtpSms } from "@/lib/sms";
import { captureException } from "@/lib/monitoring";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, middleName, phone } =
      validatedData.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        middleName: middleName || null,
        phone: phone || null,
        role: "APPLICANT",
        status: "PENDING_VERIFICATION",
      },
    });

    // Generate OTP for email verification (cryptographically secure)
    const otp = randomInt(100000, 1000000).toString();

    await prisma.otpToken.create({
      data: {
        token: otp,
        type: "EMAIL_VERIFICATION",
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
        details: { email },
      },
    });    // Send OTP via email
    await sendOtpEmail(email, otp, "verification");

    // Send OTP via SMS if phone number provided
    if (phone) {
      await sendOtpSms(phone, otp);
    }

    return NextResponse.json(
      {
        message: "Account created successfully. Please verify your email.",
        userId: user.id,
      },
      { status: 201 }
    );  } catch (error) {
    captureException(error, { route: "POST /api/auth/register" });
    console.error("Registration error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
