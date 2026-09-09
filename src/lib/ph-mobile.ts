/**
 * Philippine mobile number helpers.
 * Canonical UI format: 09XXXXXXXXX (11 digits, numbers only).
 */

export const PH_MOBILE_REGEX = /^(\+63|0)9\d{9}$/;
export const PH_MOBILE_HINT = "Use 09XXXXXXXXX (11 digits). Numbers only.";
export const PH_MOBILE_REQUIRED_ERROR = "Mobile Number is required.";
export const PH_MOBILE_FORMAT_ERROR =
  "Enter a valid Philippine mobile number (09XXXXXXXXX).";

const PH_MOBILE_NAV_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

/** Strip non-digits and normalize 63… / 9… input toward 09XXXXXXXXX while typing. */
export function sanitizePhMobileInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("63") && digits.length >= 2) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.startsWith("9") && !digits.startsWith("09")) {
    digits = `0${digits}`;
  }

  return digits.slice(0, 11);
}

/** Block letter / symbol keypresses; allow digits and navigation/shortcuts. */
export function handlePhMobileKeyDown(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "preventDefault">
): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (PH_MOBILE_NAV_KEYS.has(event.key)) return;
  if (event.key.length === 1 && !/\d/.test(event.key)) {
    event.preventDefault();
  }
}

/** Block non-digit typed inserts; paste/autofill still go through sanitize on change. */
export function handlePhMobileBeforeInput(
  event: Pick<InputEvent, "inputType" | "data" | "preventDefault">
): void {
  if (event.inputType !== "insertText" || !event.data) return;
  if (/\D/.test(event.data)) event.preventDefault();
}

export function compactPhMobile(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[\s-]/g, "").trim();
}

/** Normalize to E.164 (+639XXXXXXXXX) when valid; otherwise null. */
export function normalizePhMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const compact = compactPhMobile(raw);
  if (/^\+639\d{9}$/.test(compact)) return compact;
  if (/^09\d{9}$/.test(compact)) return `+63${compact.slice(1)}`;
  if (/^639\d{9}$/.test(compact)) return `+${compact}`;
  return null;
}

export function isValidPhMobile(raw: string | null | undefined): boolean {
  const compact = compactPhMobile(raw);
  if (!compact) return false;
  return PH_MOBILE_REGEX.test(compact) || normalizePhMobile(compact) !== null;
}

/** Returns an error message, or null when the value is a valid PH mobile. */
export function phMobileFieldError(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return PH_MOBILE_REQUIRED_ERROR;
  if (!isValidPhMobile(trimmed)) return PH_MOBILE_FORMAT_ERROR;
  return null;
}
