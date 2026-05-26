export type MapBusinessCategory =
  | "SOLE_PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "CORPORATION"
  | "COOPERATIVE"
  | "OTHER";

export const MAP_CATEGORY_META: Record<
  MapBusinessCategory,
  { label: string; color: string }
> = {
  SOLE_PROPRIETORSHIP: { label: "Sole Proprietorship", color: "#0f766e" },
  PARTNERSHIP: { label: "Partnership", color: "#2563eb" },
  CORPORATION: { label: "Corporation", color: "#7c3aed" },
  COOPERATIVE: { label: "Cooperative", color: "#ca8a04" },
  OTHER: { label: "Other", color: "#64748b" },
};

export function inferMapBusinessCategory(input: {
  businessType?: string | null;
  lineOfBusiness?: string | null;
}): MapBusinessCategory {
  const businessType = (input.businessType ?? "").toLowerCase().trim();
  const lineOfBusiness = (input.lineOfBusiness ?? "").toLowerCase().trim();

  if (/(sole|single)/.test(businessType)) return "SOLE_PROPRIETORSHIP";
  if (/partnership/.test(businessType)) return "PARTNERSHIP";
  if (/(corporation|corporate|inc\.?|corp\.?)/.test(businessType)) return "CORPORATION";
  if (/cooperative|coop/.test(businessType)) return "COOPERATIVE";

  // Fallback keeps category usable for legacy records where businessType was not saved.
  if (/partnership/.test(lineOfBusiness)) return "PARTNERSHIP";
  if (/(corporation|corporate|inc\.?|corp\.?)/.test(lineOfBusiness)) return "CORPORATION";
  if (/cooperative|coop/.test(lineOfBusiness)) return "COOPERATIVE";

  return "OTHER";
}
