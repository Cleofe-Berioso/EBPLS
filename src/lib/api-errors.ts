/**
 * Returns a safe error message for API responses.
 * In production, hides internal details except for known applicant-facing messages.
 */
const APPLICANT_SAFE_ERROR_MESSAGES = new Set([
  "Wrong Format",
  "Please pin the business location inside EB Magalona.",
  "This already exist",
  "Application is incomplete. Complete all required fields and documents before submitting.",
  "This application has already been submitted and is now locked for review.",
  "Application not found",
]);

/** Intentional business-rule messages that staff need to see in production (no secrets). */
const STAFF_SAFE_ERROR_PATTERNS = [
  /^Settlement \/ Outstanding Amount/i,
  /^Custom fee item #/i,
  /^Closure assessment must include/i,
  /^Assessment must include at least one fee item/i,
  /^Payment frequency must be selected/i,
  /^Payment frequency is applicant-selected/i,
  /^Tax Order of Payment can only be generated/i,
  /^Assessment draft can only be saved/i,
  /^Tax Order of Payment has already been generated/i,
];

function isStaffSafeErrorMessage(message: string): boolean {
  return STAFF_SAFE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function safeApiErrorMessage(
  error: unknown,
  fallback: string,
  options?: { forceProduction?: boolean }
): string {
  const isProduction = options?.forceProduction ?? process.env.NODE_ENV === "production";
  if (!(error instanceof Error)) {
    return fallback;
  }
  if (!isProduction) {
    return error.message;
  }
  if (APPLICANT_SAFE_ERROR_MESSAGES.has(error.message)) {
    return error.message;
  }
  if (isStaffSafeErrorMessage(error.message)) {
    return error.message;
  }
  if (/expired transaction|transaction.*timeout/i.test(error.message)) {
    return "The request took too long. Please try again.";
  }
  return fallback;
}
