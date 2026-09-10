export const LINE_OF_BUSINESS_OPTIONS = [
  "Manufacturers / Importers / Producers",
  "Banks",
  "Other Financial Institutions",
  "Contractors and Service Providers",
  "Wholesalers / Retailers / Dealers / Distributors",
  "Transportation Operations",
  "Communications",
  "Lessors of Real Estate - Land",
  "Lessors of Real Estate - Commercial Buildings",
  "Hotels / Motels / Pension Houses / Apartelles",
  "Lodging / Boarding Houses",
  "Amusement Places",
  "Restaurants / Cafés / Catering Services",
  "Power Companies / Hydropower Plants",
  "Power Generation and Distribution",
  "Other Industrial Companies",
  "Private Ports / Wharves",
] as const;

export type LineOfBusinessOption = (typeof LINE_OF_BUSINESS_OPTIONS)[number];

/** Legacy LOB labels still accepted on older applications. */
const LEGACY_LINE_OF_BUSINESS_OPTIONS = ["Lessors of Real Estate"] as const;

/** Built-in LOB options only (sync). Prefer `isAllowedLineOfBusiness` when custom fee categories matter. */
export function isValidLineOfBusiness(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return (
    LINE_OF_BUSINESS_OPTIONS.some((option) => option === normalized) ||
    LEGACY_LINE_OF_BUSINESS_OPTIONS.some((option) => option === normalized)
  );
}

/**
 * Built-in LOB labels plus active custom Super Admin fee category labels.
 * Custom fee categories are stored in FeeConfigurationCategory and must appear
 * on applicant / JIT Line of Business dropdowns.
 */
export async function getLineOfBusinessOptions(): Promise<string[]> {
  const { listCustomFeeCategories } = await import("@/lib/fee-settings");
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
