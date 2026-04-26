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

export type GeoMapPinTone = "green" | "yellow" | "red" | "blue" | "purple" | "gray";

export const GEO_MAP_PIN_COLORS: Record<GeoMapPinTone, string> = {
  green: "#16A34A",
  yellow: "#EAB308",
  red: "#DC2626",
  blue: "#2563EB",
  purple: "#9333EA",
  gray: "#6B7280",
};

export const GEO_MAP_LEGEND = [
  { tone: "green", label: "Active / Released / Completed permit" },
  { tone: "yellow", label: "Under Review / Pending" },
  { tone: "red", label: "Returned / Rejected / Problem application" },
  { tone: "blue", label: "New application" },
  { tone: "purple", label: "Renewal application" },
  { tone: "gray", label: "Draft / Unknown status" },
] as const satisfies ReadonlyArray<{ tone: GeoMapPinTone; label: string }>;

export interface GeoMapApplicationSummary {
  id: string;
  applicationNumber: string | null;
  businessName: string | null;
  businessType: string | null;
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
  label: string | null;
  businessType: string | null;
  markerColor: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  application?: GeoMapApplicationSummary | null;
}

export interface GeoMapLocationRecord extends GeoMapSourceLocation {
  pinTone: GeoMapPinTone;
  pinColor: string;
  statusLabel: string;
  isWithinBoundary: boolean;
}

const GREEN_APPLICATION_STATUSES = new Set(["RELEASED", "COMPLETED"]);
const YELLOW_APPLICATION_STATUSES = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "RESUBMITTED",
  "ASSESSED",
  "PAYMENT_PENDING",
  "PAID",
  "PERMIT_PREPARED",
  "READY_FOR_RELEASE",
]);
const RED_APPLICATION_STATUSES = new Set([
  "RETURNED_FOR_CORRECTION",
  "REJECTED",
  "CANCELLED",
]);
const GRAY_APPLICATION_STATUSES = new Set(["DRAFT"]);
const GREEN_PERMIT_STATUSES = new Set(["ACTIVE", "RENEWED"]);
const RED_PERMIT_STATUSES = new Set(["REVOKED"]);
const GRAY_PERMIT_STATUSES = new Set(["EXPIRED", "CLOSED"]);

export function isWithinEbMagalona(latitude: number, longitude: number): boolean {
  return (
    latitude >= EB_MAGALONA.bounds.south &&
    latitude <= EB_MAGALONA.bounds.north &&
    longitude >= EB_MAGALONA.bounds.west &&
    longitude <= EB_MAGALONA.bounds.east
  );
}

function normalizeStatusValue(status?: string | null): string | null {
  return status?.trim().toUpperCase() ?? null;
}

function legacyMarkerTone(markerColor?: string | null): GeoMapPinTone | null {
  const normalized = markerColor?.trim().toLowerCase();
  switch (normalized) {
    case "green":
    case "yellow":
    case "red":
    case "blue":
    case "purple":
    case "gray":
      return normalized;
    default:
      return null;
  }
}

export function getGeoMapPinTone(input: {
  applicationStatus?: string | null;
  applicationType?: string | null;
  permitStatus?: string | null;
  markerColor?: string | null;
}): GeoMapPinTone {
  const applicationStatus = normalizeStatusValue(input.applicationStatus);
  const applicationType = normalizeStatusValue(input.applicationType);
  const permitStatus = normalizeStatusValue(input.permitStatus);

  if (permitStatus && GREEN_PERMIT_STATUSES.has(permitStatus)) return "green";
  if (permitStatus && RED_PERMIT_STATUSES.has(permitStatus)) return "red";
  if (permitStatus && GRAY_PERMIT_STATUSES.has(permitStatus)) return "gray";

  if (applicationStatus && GREEN_APPLICATION_STATUSES.has(applicationStatus)) return "green";
  if (applicationStatus && RED_APPLICATION_STATUSES.has(applicationStatus)) return "red";
  if (applicationStatus && GRAY_APPLICATION_STATUSES.has(applicationStatus)) return "gray";
  if (applicationStatus && YELLOW_APPLICATION_STATUSES.has(applicationStatus)) return "yellow";

  if (applicationType === "RENEWAL") return "purple";
  if (applicationType === "NEW") return "blue";

  return legacyMarkerTone(input.markerColor) ?? "gray";
}

export function getGeoMapPinColor(input: {
  applicationStatus?: string | null;
  applicationType?: string | null;
  permitStatus?: string | null;
  markerColor?: string | null;
}): string {
  return GEO_MAP_PIN_COLORS[getGeoMapPinTone(input)];
}

export function getGeoMapStatusLabel(input: {
  applicationStatus?: string | null;
  permitStatus?: string | null;
}): string {
  const permitStatus = normalizeStatusValue(input.permitStatus);
  if (permitStatus === "ACTIVE") return "ACTIVE PERMIT";
  if (permitStatus) return permitStatus.replace(/_/g, " ");

  const applicationStatus = normalizeStatusValue(input.applicationStatus);
  if (applicationStatus) return applicationStatus.replace(/_/g, " ");

  return "UNKNOWN";
}

export function normalizeGeoMapLocation(
  location: GeoMapSourceLocation
): GeoMapLocationRecord {
  const businessType = location.application?.businessType ?? location.businessType ?? null;
  const applicationStatus = location.application?.status ?? null;
  const applicationType = location.application?.type ?? null;
  const permitStatus = location.application?.permit?.status ?? null;

  return {
    ...location,
    businessType,
    pinTone: getGeoMapPinTone({
      applicationStatus,
      applicationType,
      permitStatus,
      markerColor: location.markerColor,
    }),
    pinColor: getGeoMapPinColor({
      applicationStatus,
      applicationType,
      permitStatus,
      markerColor: location.markerColor,
    }),
    statusLabel: getGeoMapStatusLabel({
      applicationStatus,
      permitStatus,
    }),
    isWithinBoundary: isWithinEbMagalona(location.latitude, location.longitude),
  };
}
