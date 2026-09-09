/**
 * Shared password strength rules for applicant registration.
 * Requires uppercase, lowercase, number, and symbol, min 8 characters.
 */

export const PASSWORD_POLICY_HINT =
  "Must include uppercase, lowercase, number, and symbol (min. 8 characters).";

export const PASSWORD_POLICY_ERROR =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.";

const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /[0-9]/
const HAS_SYMBOL = /[^A-Za-z0-9]/;

export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < 8) {
    return PASSWORD_POLICY_ERROR;
  }
  if (!HAS_UPPER.test(password) || !HAS_LOWER.test(password) || !HAS_NUMBER.test(password) || !HAS_SYMBOL.test(password)) {
    return PASSWORD_POLICY_ERROR;
  }
  return null;
}
