export type MapBusinessCategory =
  | "FOOD"
  | "RETAIL"
  | "SERVICES"
  | "INDUSTRIAL"
  | "TRANSPORT"
  | "OTHER";

export const MAP_CATEGORY_META: Record<
  MapBusinessCategory,
  { label: string; color: string }
> = {
  FOOD: { label: "Food", color: "#dc2626" },
  RETAIL: { label: "Retail", color: "#2563eb" },
  SERVICES: { label: "Services", color: "#0891b2" },
  INDUSTRIAL: { label: "Industrial", color: "#7c3aed" },
  TRANSPORT: { label: "Transport", color: "#16a34a" },
  OTHER: { label: "Other", color: "#64748b" },
};

export function inferMapBusinessCategory(lineOfBusiness: string): MapBusinessCategory {
  const normalized = lineOfBusiness.toLowerCase();

  if (/(restaurant|cafe|eatery|food|carinderia|canteen|bakery)/.test(normalized)) return "FOOD";
  if (/(retail|wholesale|store|shop|trading|merchandise|grocery|hardware)/.test(normalized)) return "RETAIL";
  if (/(transport|trucking|logistic|delivery|courier|taxi|bus)/.test(normalized)) return "TRANSPORT";
  if (/(manufactur|industrial|factory|processing|plant)/.test(normalized)) return "INDUSTRIAL";
  if (/(service|contractor|consult|repair|clinic|salon|spa|financial)/.test(normalized)) return "SERVICES";

  return "OTHER";
}
