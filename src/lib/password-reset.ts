import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Generate a 6-digit random OTP
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP using bcrypt
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Compare plain OTP with hashed OTP
 */
export async function verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
  return bcrypt.compare(plainOtp, hashedOtp);
}

/**
 * Request password reset OTP for an email
 * - Invalidates previous unused OTPs for the same email
 * - Creates and stores a new OTP
 * - Does NOT reveal whether email exists
 */
export async function requestPasswordResetOtp(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const otpExpirationMinutes = parseInt(process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES || "10");

  // Generate OTP
  const plainOtp = generateOtp();
  const otpHash = await hashOtp(plainOtp);

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

  try {
    // Invalidate previous unused OTPs for this email
    await prisma.passwordResetOtp.updateMany({
      where: {
        email: normalizedEmail,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Create new OTP
    await prisma.passwordResetOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        expiresAt,
      },
    });

    console.log(`Password reset OTP requested for: ${normalizedEmail}`);
    return plainOtp;
  } catch (error) {
    console.error("Error creating password reset OTP:", error);
    throw new Error("Failed to generate OTP. Please try again later.");
  }
}

/**
 * Verify password reset OTP
 * - Checks if OTP is valid and not expired
 * - Checks attempt limit
 * - Marks OTP as verified when valid
 */
export async function verifyPasswordResetOtp(
  email: string,
  plainOtp: string
): Promise<{ valid: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const maxAttempts = 5;

  try {
    // Find the latest OTP for this email
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if OTP record exists
    if (!otpRecord) {
      return { valid: false, error: "OTP not found or already used" };
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      return { valid: false, error: "OTP has expired" };
    }

    // Check attempt limit
    if (otpRecord.attempts >= maxAttempts) {
      // Mark as used to prevent further attempts
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
      return { valid: false, error: "Too many failed attempts. Please request a new OTP." };
    }

    // Verify OTP
    const otpMatch = await verifyOtp(plainOtp, otpRecord.otpHash);

    if (!otpMatch) {
      // Increment attempt counter
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      return { valid: false, error: "Invalid OTP" };
    }

    // Mark OTP as verified
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    console.log(`Password reset OTP verified for: ${normalizedEmail}`);
    return { valid: true };
  } catch (error) {
    console.error("Error verifying password reset OTP:", error);
    return { valid: false, error: "Failed to verify OTP. Please try again later." };
  }
}

/**
 * Reset password after OTP verification
 * - Checks if OTP was verified and not used
 * - Updates user password hash
 * - Marks OTP as used
 */
export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find verified OTP for this email
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        verifiedAt: { not: null },
        usedAt: null,
      },
      orderBy: {
        verifiedAt: "desc",
      },
    });

    // Check if verified OTP exists
    if (!otpRecord) {
      return { success: false, error: "No verified OTP found" };
    }

    // Check if OTP is still valid
    if (new Date() > otpRecord.expiresAt) {
      return { success: false, error: "OTP has expired" };
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Hash new password using bcryptjs (same as existing system)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Mark OTP as used
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    console.log(`Password reset completed for: ${normalizedEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password. Please try again later." };
  }
}

/**
 * Cleanup expired OTPs (can be run periodically)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  try {
    const result = await prisma.passwordResetOtp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        usedAt: null,
      },
    });

    console.log(`Cleaned up ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
    return 0;
  }
}
