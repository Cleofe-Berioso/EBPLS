/**
 * Returns a safe error message for API responses.
 * In production, always returns the fallback to avoid leaking internal details.
 */
export function safeApiErrorMessage(
  error: unknown,
  fallback: string,
  options?: { forceProduction?: boolean }
): string {
  const isProduction = options?.forceProduction ?? process.env.NODE_ENV === "production";
  if (!isProduction) {
    return error instanceof Error ? error.message : fallback;
  }
  return fallback;
}
