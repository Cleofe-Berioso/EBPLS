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
  if (/expired transaction|transaction.*timeout/i.test(error.message)) {
    return "Upload took too long. Please try again — large document sets may need a second attempt.";
  }
  return fallback;
}
