import "server-only";

import { LINE_OF_BUSINESS_OPTIONS, isValidLineOfBusiness } from "@/lib/business-options";
import { listCustomFeeCategories } from "@/lib/fee-settings";

/**
 * Built-in LOB labels plus active custom Super Admin fee category labels.
 * Server-only — must not be imported from client components.
 */
export async function getLineOfBusinessOptions(): Promise<string[]> {
  const custom = await listCustomFeeCategories();

  const seen = new Set<string>();
  const options: string[] = [];

  for (const label of LINE_OF_BUSINESS_OPTIONS) {
    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    options.push(trimmed);
  }

  for (const category of custom) {
    const trimmed = category.label.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    options.push(trimmed);
  }

  return options;
}

export async function isAllowedLineOfBusiness(value: string | null | undefined): Promise<boolean> {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  if (!normalized) return false;
  if (isValidLineOfBusiness(normalized)) return true;
  const options = await getLineOfBusinessOptions();
  return options.includes(normalized);
}
