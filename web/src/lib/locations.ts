// Default map center coordinates for EB Magalona
export const DEFAULT_MAP_CENTER: [number, number] = [
  10.877893290764273,
  122.97788094358054,
];

// EB Magalona geographic constants (updated with new default center)
export const EB_MAGALONA = {
  center: { lat: DEFAULT_MAP_CENTER[0], lon: DEFAULT_MAP_CENTER[1] },
  bounds: {
    north: 10.920893,
    south: 10.834893,
    east: 123.019881,
    west: 122.935881,
  },
  zoom: 15,
};

export const BUSINESS_TYPE_COLORS: Record<string, string> = {
  Retail: "#3B82F6",
  Service: "#10B981",
  Manufacturing: "#EF4444",
  Construction: "#F59E0B",
  Food: "#EC4899",
  default: "#6B7280",
};

export function getMarkerColor(businessType?: string | null): string {
  if (!businessType) return BUSINESS_TYPE_COLORS.default;
  return (
    BUSINESS_TYPE_COLORS[businessType as keyof typeof BUSINESS_TYPE_COLORS] ||
    BUSINESS_TYPE_COLORS.default
  );
}
