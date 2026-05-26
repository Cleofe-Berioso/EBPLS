export const LINE_OF_BUSINESS_OPTIONS = [
  "Manufacturers / Importers / Producers",
  "Banks",
  "Other Financial Institutions",
  "Contractors and Service Providers",
  "Wholesalers / Retailers / Dealers / Distributors",
  "Transportation Operations",
  "Communications",
  "Lessors of Real Estate",
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

export function isValidLineOfBusiness(value: string | null | undefined): value is LineOfBusinessOption {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return LINE_OF_BUSINESS_OPTIONS.some((option) => option === normalized);
}