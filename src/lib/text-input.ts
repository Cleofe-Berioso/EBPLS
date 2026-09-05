/**
 * Live text helpers for form inputs.
 * Avoid .trim() during typing — it blocks multi-word entry (trailing space is removed).
 */

/** Capitalize the first letter of each word; preserve spaces (including trailing). */
export function autoCapitalizeWords(value: string): string {
  return value.replace(/(^|[\s\-_/])(\p{L})/gu, (_match, boundary: string, letter: string) => {
    return `${boundary}${letter.toUpperCase()}`;
  });
}

/** Capitalize only the first letter of the whole string if it is a letter. */
export function autoCapitalizeFirst(value: string): string {
  if (!value) return value;
  const first = value[0];
  if (!/\p{L}/u.test(first)) return value;
  return first.toUpperCase() + value.slice(1);
}
