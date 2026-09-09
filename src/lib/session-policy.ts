/**
 * Session duration policy for credentials login.
 * Cookie upper bound is SESSION_MAX_AGE_REMEMBER_SECONDS so "Remember me" can persist.
 * Shorter sessions are enforced via JWT sessionExpiresAt.
 */
export const SESSION_MAX_AGE_DEFAULT_SECONDS = 8 * 60 * 60; // 8 hours
export const SESSION_MAX_AGE_REMEMBER_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function isRememberMeValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "1" || normalized === "yes";
}

export function sessionMaxAgeSeconds(rememberMe: boolean): number {
  return rememberMe ? SESSION_MAX_AGE_REMEMBER_SECONDS : SESSION_MAX_AGE_DEFAULT_SECONDS;
}
