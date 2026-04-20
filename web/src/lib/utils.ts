import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique application number
 * Format: BP-YYYY-XXXXXX (e.g., BP-2026-000001)
 */
export function generateApplicationNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(6, "0");
  return `BP-${year}-${paddedSequence}`;
}

/**
 * Generate a unique permit number
 * Format: PERMIT-YYYY-XXXXXX
 */
export function generatePermitNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(6, "0");
  return `PERMIT-${year}-${paddedSequence}`;
}

/**
 * Generate a unique claim reference number
 * Format: CLM-YYYYMMDD-XXXX
 */
export function generateClaimReference(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CLM-${dateStr}-${random}`;
}

/**
 * Format currency (Philippine Peso)
 * Safely handles Decimal, number, string, and null/undefined values
 * @param amount - any numeric value (Decimal, number, string)
 * @returns formatted currency string
 */
export function formatCurrency(amount: any): string {
  if (amount === null || amount === undefined) {
    return "₱0.00";
  }

  // Convert Decimal to number safely
  let numValue: number;
  if (typeof amount === "string") {
    numValue = parseFloat(amount);
  } else if (typeof amount === "number") {
    numValue = amount;
  } else if (typeof amount === "object" && amount.toNumber) {
    // Prisma Decimal type has toNumber() method
    numValue = amount.toNumber();
  } else if (typeof amount === "object" && amount.toString) {
    // Fallback: convert to string then to number
    numValue = parseFloat(amount.toString());
  } else {
    return "₱0.00";
  }

  // Handle NaN case
  if (isNaN(numValue)) {
    return "₱0.00";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Format date for Philippine locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Validate Philippine phone number
 */
export function isValidPhPhone(phone: string): boolean {
  const phPhoneRegex = /^(\+63|0)(9\d{9})$/;
  return phPhoneRegex.test(phone.replace(/[\s-]/g, ""));
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Status color mapping for UI badges
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-500",
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-orange-100 text-orange-800",
    ISSUED: "bg-blue-100 text-blue-800",
    RELEASED: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-green-100 text-green-800",
    UPLOADED: "bg-blue-100 text-blue-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Allowed file types for document upload
 */
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: PDF, JPEG, PNG, WebP",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size exceeds 10MB limit",
    };
  }  return { valid: true };
}

/**
 * Remove sensitive fields (password, etc.) from a user object before sending in API responses.
 */
export function sanitizeUser<T extends Record<string, unknown>>(
  user: T
): Omit<T, "password"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = user;
  return safe as Omit<T, "password">;
}

/**
 * Generate QR code as base64 data URL
 * Used for claim references, permits, etc.
 */
export async function generateQrCode(data: string): Promise<string> {
  const qrcode = await import("qrcode");
  return qrcode.toDataURL(data, {
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
