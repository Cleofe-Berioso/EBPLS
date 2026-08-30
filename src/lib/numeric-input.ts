/** Strip non-digits — for counts (employees, vehicles). */
export function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, "");
}

/** Allow digits and one decimal point — for amounts and areas. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) return cleaned;
  const whole = cleaned.slice(0, dotIndex);
  const fraction = cleaned.slice(dotIndex + 1).replace(/\./g, "");
  return `${whole}.${fraction}`;
}

export type NumericInputKind = "integer" | "decimal";

export function sanitizeNumericInput(value: string, kind: NumericInputKind): string {
  return kind === "integer" ? sanitizeIntegerInput(value) : sanitizeDecimalInput(value);
}
