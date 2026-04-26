export const DEFAULT_MAP_CENTER: [number, number] = [
  10.877893290764273,
  122.97788094358054,
];

export const EB_MAGALONA = {
  center: { lat: DEFAULT_MAP_CENTER[0], lon: DEFAULT_MAP_CENTER[1] },
  bounds: {
    north: 10.920893,
    south: 10.834893,
    east: 123.019881,
    west: 122.935881,
  },
  zoom: 15,
} as const;

export const EB_MAGALONA_LEAFLET_BOUNDS: [[number, number], [number, number]] = [
  [EB_MAGALONA.bounds.south, EB_MAGALONA.bounds.west],
  [EB_MAGALONA.bounds.north, EB_MAGALONA.bounds.east],
];

export const EB_MAGALONA_DB_FILTER = {
  latitude: {
    gte: EB_MAGALONA.bounds.south,
    lte: EB_MAGALONA.bounds.north,
  },
  longitude: {
    gte: EB_MAGALONA.bounds.west,
    lte: EB_MAGALONA.bounds.east,
  },
} as const;

export const EB_MAGALONA_OUTSIDE_DB_FILTER = {
  OR: [
    { latitude: { lt: EB_MAGALONA.bounds.south } },
    { latitude: { gt: EB_MAGALONA.bounds.north } },
    { longitude: { lt: EB_MAGALONA.bounds.west } },
    { longitude: { gt: EB_MAGALONA.bounds.east } },
  ],
};

export const LOCATION_ELIGIBLE_APPLICATION_STATUSES = ["RELEASED", "COMPLETED"] as const;
export const LOCATION_REVIEWABLE_STATUSES = ["SUBMITTED", "REJECTED"] as const;
const LOCATION_ELIGIBLE_APPLICATION_STATUS_SET = new Set<string>(LOCATION_ELIGIBLE_APPLICATION_STATUSES);

export const BUSINESS_CATEGORY_VALUES = [
  "FOOD",
  "RETAIL",
  "SERVICES",
  "MANUFACTURING",
  "AGRICULTURE",
  "FINANCE",
  "OTHER",
] as const;

export type GeoMapPinTone = (typeof BUSINESS_CATEGORY_VALUES)[number];

export const GEO_MAP_PIN_COLORS: Record<GeoMapPinTone, string> = {
  FOOD: "#F97316",
  RETAIL: "#2563EB",
  SERVICES: "#16A34A",
  MANUFACTURING: "#9333EA",
  AGRICULTURE: "#EAB308",
  FINANCE: "#DC2626",
  OTHER: "#6B7280",
};

export const GEO_MAP_CATEGORY_LABELS: Record<GeoMapPinTone, string> = {
  FOOD: "Food / Restaurant",
  RETAIL: "Retail / Store",
  SERVICES: "Services",
  MANUFACTURING: "Manufacturing",
  AGRICULTURE: "Agriculture",
  FINANCE: "Finance",
  OTHER: "Other",
};

export const GEO_MAP_LEGEND = BUSINESS_CATEGORY_VALUES.map((tone) => ({
  tone,
  label: GEO_MAP_CATEGORY_LABELS[tone],
})) as ReadonlyArray<{ tone: GeoMapPinTone; label: string }>;

export interface GeoMapApplicationSummary {
  id: string;
  applicationNumber: string | null;
  businessName: string | null;
  businessType: string | null;
  lineOfBusiness: string | null;
  businessAddress: string | null;
  type: string | null;
  status: string | null;
  permit: {
    status: string | null;
  } | null;
}

export interface GeoMapSourceLocation {
  id: string;
  applicationId: string;
  latitude: number;
  longitude: number;
  businessCategory?: string | null;
  label: string | null;
  businessType: string | null;
  markerColor: string | null;
  status: string | null;
  submittedAt?: string | Date | null;
  reviewedAt?: string | Date | null;
  reviewedById?: string | null;
  reviewNotes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  application?: GeoMapApplicationSummary | null;
}

export interface GeoMapLocationRecord extends GeoMapSourceLocation {
  pinTone: GeoMapPinTone;
  pinColor: string;
  businessCategory: GeoMapPinTone;
  businessCategoryLabel: string;
  applicationStatusLabel: string;
  locationStatusLabel: string;
  isWithinBoundary: boolean;
  canAppearOnMap: boolean;
  canApplicantSubmit: boolean;
}

export const GEO_MAP_LOCATION_INCLUDE = {
  application: {
    select: {
      id: true,
      applicationNumber: true,
      businessName: true,
      businessType: true,
      lineOfBusiness: true,
      businessAddress: true,
      type: true,
      status: true,
      permit: {
        select: {
          status: true,
        },
      },
    },
  },
} as const;

export function isWithinEbMagalona(latitude: number, longitude: number): boolean {
  return (
    latitude >= EB_MAGALONA.bounds.south &&
    latitude <= EB_MAGALONA.bounds.north &&
    longitude >= EB_MAGALONA.bounds.west &&
    longitude <= EB_MAGALONA.bounds.east
  );
}

function normalizeBusinessCategory(category?: string | null): GeoMapPinTone {
  const normalized = category?.trim().toUpperCase();
  if (normalized && BUSINESS_CATEGORY_VALUES.includes(normalized as GeoMapPinTone)) {
    return normalized as GeoMapPinTone;
  }

  return "OTHER";
}

export function canSubmitBusinessLocation(applicationStatus?: string | null): boolean {
  return LOCATION_ELIGIBLE_APPLICATION_STATUS_SET.has(
    applicationStatus?.trim().toUpperCase() ?? ""
  );
}

export function canLocationAppearOnMap(input: {
  locationStatus?: string | null;
  applicationStatus?: string | null;
  latitude: number;
  longitude: number;
}): boolean {
  const locationStatus = input.locationStatus?.trim().toUpperCase();
  return (
    locationStatus === "APPROVED" &&
    canSubmitBusinessLocation(input.applicationStatus) &&
    isWithinEbMagalona(input.latitude, input.longitude)
  );
}

export function getGeoMapPinTone(input: {
  businessCategory?: string | null;
}): GeoMapPinTone {
  return normalizeBusinessCategory(input.businessCategory);
}

export function getGeoMapPinColor(input: {
  businessCategory?: string | null;
}): string {
  return GEO_MAP_PIN_COLORS[getGeoMapPinTone(input)];
}

export function getGeoMapBusinessCategoryLabel(input: {
  businessCategory?: string | null;
}): string {
  return GEO_MAP_CATEGORY_LABELS[getGeoMapPinTone(input)];
}

export function getApplicationStatusLabel(input: {
  applicationStatus?: string | null;
  permitStatus?: string | null;
}): string {
  const permitStatus = input.permitStatus?.trim().toUpperCase();
  if (permitStatus === "ACTIVE") return "ACTIVE PERMIT";
  if (permitStatus) return permitStatus.replace(/_/g, " ");

  const applicationStatus = input.applicationStatus?.trim().toUpperCase();
  if (applicationStatus) return applicationStatus.replace(/_/g, " ");

  return "UNKNOWN";
}

export function getLocationStatusLabel(status?: string | null): string {
  const normalized = status?.trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Rejected";
  if (normalized === "SUBMITTED") return "Submitted for BPLO review";
  return "Unknown";
}

export function normalizeGeoMapLocation(
  location: GeoMapSourceLocation
): GeoMapLocationRecord {
  const businessType = location.application?.businessType ?? location.businessType ?? null;
  const applicationStatus = location.application?.status ?? null;
  const permitStatus = location.application?.permit?.status ?? null;
  const businessCategory = normalizeBusinessCategory(location.businessCategory);

  return {
    ...location,
    businessType,
    businessCategory,
    pinTone: businessCategory,
    pinColor: GEO_MAP_PIN_COLORS[businessCategory],
    businessCategoryLabel: GEO_MAP_CATEGORY_LABELS[businessCategory],
    applicationStatusLabel: getApplicationStatusLabel({
      applicationStatus,
      permitStatus,
    }),
    locationStatusLabel: getLocationStatusLabel(location.status),
    isWithinBoundary: isWithinEbMagalona(location.latitude, location.longitude),
    canAppearOnMap: canLocationAppearOnMap({
      locationStatus: location.status,
      applicationStatus,
      latitude: location.latitude,
      longitude: location.longitude,
    }),
    canApplicantSubmit: canSubmitBusinessLocation(applicationStatus),
  };
}
