import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import {
  inferMapBusinessCategory,
  MAP_CATEGORY_META,
  type MapBusinessCategory,
} from "@/lib/business-map-categories";

export const EB_MAGALONA_CENTER = {
  latitude: 10.878586296466974,
  longitude: 122.97887569230781,
} as const;

export const EB_MAGALONA_BOUNDS = {
  southWest: { latitude: 10.82, longitude: 122.97 },
  northEast: { latitude: 10.95, longitude: 123.11 },
} as const;

export function isWithinEbMagalona(latitude: number, longitude: number): boolean {
  return (
    latitude >= EB_MAGALONA_BOUNDS.southWest.latitude &&
    latitude <= EB_MAGALONA_BOUNDS.northEast.latitude &&
    longitude >= EB_MAGALONA_BOUNDS.southWest.longitude &&
    longitude <= EB_MAGALONA_BOUNDS.northEast.longitude
  );
}

type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";
type BusinessMapApplicationType = "NEW" | "RENEWAL";
type LocationStatus = "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";

export interface ApplicantBusinessLocationRow {
  businessRecordId: string;
  businessName: string;
  registrationNumber: string;
  applicationNumber: string;
  applicationType: ApplicationType;
  permitOrCertificateNumber: string | null;
  permitValidUntil: string | null;
  location: {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    barangay: string | null;
    status: LocationStatus;
    remarks: string | null;
    updatedAt: string;
  } | null;
  canEditLocation: boolean;
}

export interface BusinessLocationMapRow {
  locationId: string;
  businessRecordId: string;
  applicationId: string;
  applicantName: string;
  tradeName: string | null;
  businessName: string;
  businessType: string | null;
  ownerName: string;
  businessCategory: MapBusinessCategory;
  businessCategoryLabel: string;
  businessCategoryColor: string;
  applicationNumber: string;
  applicationType: BusinessMapApplicationType;
  submittedAt: string | null;
  permitOrCertificateNumber: string | null;
  permitValidUntil: string | null;
  lineOfBusiness: string | null;
  applicationStatus: string;
  bploRemarks: string | null;
  documents: Array<{
    id: string;
    documentName: string;
    fileName: string;
    uploadedAt: string;
  }>;
  latitude: number;
  longitude: number;
  address: string | null;
  barangay: string | null;
  status: LocationStatus;
  remarks: string | null;
  updatedAt: string;
}

export interface BusinessMapFilters {
  type?: "ALL" | BusinessMapApplicationType;
  owner?: string;
  category?: "ALL" | MapBusinessCategory;
  search?: string;
}

const ACTIVE_PERMITTED_MAP_APP_STATUSES = ["RELEASED"] as const;

function parseCoordinate(input: unknown, kind: "latitude" | "longitude"): number {
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value)) {
    throw new Error(`${kind} must be a valid number`);
  }

  if (kind === "latitude" && (value < -90 || value > 90)) {
    throw new Error("latitude must be between -90 and 90");
  }

  if (kind === "longitude" && (value < -180 || value > 180)) {
    throw new Error("longitude must be between -180 and 180");
  }

  return Math.round(value * 1_000_000) / 1_000_000;
}

function toOptionalTrimmedString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  return value.length > 0 ? value : null;
}

function isLocationEditable(status: LocationStatus): boolean {
  return status !== "VERIFIED";
}

function toApplicantRow(record: {
  id: string;
  businessName: string;
  registrationNumber: string;
  permitExpirationDate: Date | null;
  location: {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    barangay: string | null;
    status: LocationStatus;
    remarks: string | null;
    updatedAt: Date;
  } | null;
  releasedApplication: {
    applicationNumber: string;
    applicationType: ApplicationType;
    permitOrCertificateNumber: string | null;
  };
}): ApplicantBusinessLocationRow {
  return {
    businessRecordId: record.id,
    businessName: record.businessName,
    registrationNumber: record.registrationNumber,
    applicationNumber: record.releasedApplication.applicationNumber,
    applicationType: record.releasedApplication.applicationType,
    permitOrCertificateNumber: record.releasedApplication.permitOrCertificateNumber,
    permitValidUntil: record.permitExpirationDate ? record.permitExpirationDate.toISOString() : null,
    location: record.location
      ? {
          id: record.location.id,
          latitude: record.location.latitude,
          longitude: record.location.longitude,
          address: record.location.address,
          barangay: record.location.barangay,
          status: record.location.status,
          remarks: record.location.remarks,
          updatedAt: record.location.updatedAt.toISOString(),
        }
      : null,
    canEditLocation: record.location ? isLocationEditable(record.location.status) : true,
  };
}

async function resolveLatestReleasedByBusinessRecord(
  businessRecordIds: string[]
): Promise<
  Map<
    string,
    {
      applicationNumber: string;
      applicationType: ApplicationType;
      permitOrCertificateNumber: string | null;
    }
  >
> {
  if (businessRecordIds.length === 0) {
    return new Map();
  }

  const releasedApplications = await prisma.businessApplication.findMany({
    where: {
      status: "RELEASED",
      businessRecordId: {
        in: businessRecordIds,
      },
    },
    select: {
      businessRecordId: true,
      applicationNumber: true,
      applicationType: true,
      updatedAt: true,
      permitIssuance: {
        select: {
          documentNumber: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const byRecord = new Map<
    string,
    {
      applicationNumber: string;
      applicationType: ApplicationType;
      permitOrCertificateNumber: string | null;
    }
  >();

  for (const row of releasedApplications) {
    if (!row.businessRecordId) continue;
    if (byRecord.has(row.businessRecordId)) continue;

    byRecord.set(row.businessRecordId, {
      applicationNumber: row.applicationNumber,
      applicationType: row.applicationType as ApplicationType,
      permitOrCertificateNumber: row.permitIssuance?.documentNumber ?? null,
    });
  }

  return byRecord;
}

export async function listApplicantReleasedBusinessLocations(
  applicantId: string
): Promise<ApplicantBusinessLocationRow[]> {
  const records = await prisma.businessRecord.findMany({
    where: {
      applicantId,
      businessStatus: "ACTIVE",
      applications: {
        some: {
          status: "RELEASED",
        },
      },
    },
    select: {
      id: true,
      businessName: true,
      registrationNumber: true,
      permitExpirationDate: true,
      location: {
        select: {
          id: true,
          latitude: true,
          longitude: true,
          address: true,
          barangay: true,
          status: true,
          remarks: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const releasedMeta = await resolveLatestReleasedByBusinessRecord(
    records.map((row: (typeof records)[number]) => row.id)
  );

  return records
    .filter((row: (typeof records)[number]) => releasedMeta.has(row.id))
    .map((row: (typeof records)[number]) =>
      toApplicantRow({
        ...row,
        location: row.location
          ? {
              ...row.location,
              status: row.location.status as LocationStatus,
            }
          : null,
        releasedApplication: releasedMeta.get(row.id) as {
          applicationNumber: string;
          applicationType: ApplicationType;
          permitOrCertificateNumber: string | null;
        },
      })
    );
}

export async function submitApplicantBusinessLocation(
  applicantId: string,
  businessRecordId: string,
  payload: {
    latitude: unknown;
    longitude: unknown;
    address?: unknown;
    barangay?: unknown;
  }
): Promise<ApplicantBusinessLocationRow> {
  const latitude = parseCoordinate(payload.latitude, "latitude");
  const longitude = parseCoordinate(payload.longitude, "longitude");
  const address = toOptionalTrimmedString(payload.address);
  const barangay = toOptionalTrimmedString(payload.barangay);

  if (!address) {
    throw new Error("businessLocationAddress is required");
  }

  const record = await prisma.businessRecord.findFirst({
    where: {
      id: businessRecordId,
      applicantId,
      applications: {
        some: {
          status: "RELEASED",
        },
      },
    },
    select: {
      id: true,
      businessName: true,
      registrationNumber: true,
      location: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!record) {
    throw new Error("Released business record not found");
  }

  if (record.location?.status === "VERIFIED") {
    throw new Error("Verified location cannot be edited unless returned for correction");
  }

  await prisma.businessLocation.upsert({
    where: {
      businessRecordId,
    },
    create: {
      businessRecordId,
      latitude,
      longitude,
      address,
      barangay,
      status: "PENDING",
      submittedById: applicantId,
    },
    update: {
      latitude,
      longitude,
      address,
      barangay,
      status: "PENDING",
      submittedById: applicantId,
      verifiedById: null,
      remarks: null,
    },
  });

  const [updated] = await listApplicantReleasedBusinessLocations(applicantId).then((rows) =>
    rows.filter((row: ApplicantBusinessLocationRow) => row.businessRecordId === businessRecordId)
  );

  if (!updated) {
    throw new Error("Unable to load updated location");
  }

  return updated;
}

export async function upsertBusinessLocationForBusinessRecord(
  dbClient: typeof prisma = prisma,
  params: {
    businessRecordId: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    barangay?: string | null;
    submittedById: string;
  }
): Promise<void> {
  const { businessRecordId, latitude, longitude, address, barangay, submittedById } = params;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return;
  }

  if (!isWithinEbMagalona(latitude, longitude)) {
    return;
  }

  await dbClient.businessLocation.upsert({
    where: { businessRecordId },
    create: {
      businessRecordId,
      latitude,
      longitude,
      address: address ?? null,
      barangay: barangay ?? null,
      status: "PENDING",
      submittedById,
    },
    update: {
      latitude,
      longitude,
      address: address ?? null,
      barangay: barangay ?? null,
      status: "PENDING",
      submittedById,
      verifiedById: null,
      remarks: null,
    },
  });
}

export async function listActivePermittedBusinessLocations(
  filters: BusinessMapFilters = {}
): Promise<BusinessLocationMapRow[]> {
  const locations = await prisma.businessLocation.findMany({
    where: {
      businessRecord: {
        businessStatus: "ACTIVE",
        applications: {
          some: {
            status: { in: [...ACTIVE_PERMITTED_MAP_APP_STATUSES] },
            applicationType: { in: ["NEW", "RENEWAL"] },
          },
        },
      },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      address: true,
      barangay: true,
      status: true,
      remarks: true,
      updatedAt: true,
      businessRecord: {
        select: {
          id: true,
          businessName: true,
          tradeName: true,
          ownerName: true,
          lineOfBusiness: true,
          permitExpirationDate: true,
          applicant: {
            select: {
              name: true,
            },
          },
          applications: {
            where: {
              status: { in: [...ACTIVE_PERMITTED_MAP_APP_STATUSES] },
              applicationType: { in: ["NEW", "RENEWAL"] },
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              applicationNumber: true,
              applicationType: true,
              status: true,
              submittedAt: true,
              formData: true,
              documents: {
                select: {
                  id: true,
                  documentName: true,
                  fileName: true,
                  uploadedAt: true,
                },
                orderBy: {
                  uploadedAt: "desc",
                },
              },
              history: {
                where: {
                  actorRole: "BPLO",
                  remarks: {
                    not: null,
                  },
                },
                select: {
                  remarks: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
              },
              permitIssuance: {
                select: {
                  documentNumber: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const rows = locations
    .map((location: (typeof locations)[number]) => {
      const latestApplication = location.businessRecord.applications[0];
      if (!latestApplication) return null;

      const lineOfBusiness =
        typeof latestApplication.formData === "object" && latestApplication.formData
          ? ((latestApplication.formData as Record<string, unknown>).lineOfBusiness as string | undefined)
          : undefined;

      const businessType =
        typeof latestApplication.formData === "object" && latestApplication.formData
          ? ((latestApplication.formData as Record<string, unknown>).businessType as string | undefined)
          : undefined;

      const tradeName =
        typeof latestApplication.formData === "object" && latestApplication.formData
          ? ((latestApplication.formData as Record<string, unknown>).tradeName as string | undefined)
          : undefined;

      const ownerNameFromForm =
        typeof latestApplication.formData === "object" && latestApplication.formData
          ? ((latestApplication.formData as Record<string, unknown>).ownerName as string | undefined)
          : undefined;

      const category = inferMapBusinessCategory({
        businessType: businessType ?? null,
        lineOfBusiness: (lineOfBusiness ?? location.businessRecord.lineOfBusiness ?? "").trim(),
      });
      const categoryMeta = MAP_CATEGORY_META[category];

      return {
        locationId: location.id,
        businessRecordId: location.businessRecord.id,
        applicationId: latestApplication.id,
        applicantName: location.businessRecord.applicant?.name ?? "-",
        tradeName: (tradeName ?? location.businessRecord.tradeName ?? null)?.trim() || null,
        businessName: location.businessRecord.businessName,
        businessType: businessType?.trim() || null,
        ownerName: (ownerNameFromForm ?? location.businessRecord.ownerName).trim(),
        businessCategory: category,
        businessCategoryLabel: categoryMeta.label,
        businessCategoryColor: categoryMeta.color,
        applicationNumber: latestApplication.applicationNumber,
        applicationType: latestApplication.applicationType as BusinessMapApplicationType,
        submittedAt: latestApplication.submittedAt ? latestApplication.submittedAt.toISOString() : null,
        permitOrCertificateNumber: latestApplication.permitIssuance?.documentNumber ?? null,
        permitValidUntil: location.businessRecord.permitExpirationDate
          ? location.businessRecord.permitExpirationDate.toISOString()
          : null,
        lineOfBusiness: (lineOfBusiness ?? location.businessRecord.lineOfBusiness ?? null)?.trim() || null,
        applicationStatus: mapDbStatusToUi(latestApplication.status),
        bploRemarks: latestApplication.history[0]?.remarks?.trim() || null,
        documents: latestApplication.documents.map((doc) => ({
          id: doc.id,
          documentName: doc.documentName,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt.toISOString(),
        })),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        barangay: location.barangay,
        status: location.status as LocationStatus,
        remarks: location.remarks,
        updatedAt: location.updatedAt.toISOString(),
      } satisfies BusinessLocationMapRow;
    })
    .filter((row: BusinessLocationMapRow | null): row is BusinessLocationMapRow => Boolean(row));

  let filtered = rows;

  if (filters.type && filters.type !== "ALL") {
    filtered = filtered.filter((row: BusinessLocationMapRow) => row.applicationType === filters.type);
  }

  if (filters.category && filters.category !== "ALL") {
    filtered = filtered.filter((row: BusinessLocationMapRow) => row.businessCategory === filters.category);
  }

  if (filters.owner?.trim()) {
    const owner = filters.owner.trim().toLowerCase();
    filtered = filtered.filter((row: BusinessLocationMapRow) => row.ownerName.toLowerCase().includes(owner));
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (row: BusinessLocationMapRow) =>
        row.businessName.toLowerCase().includes(search) ||
        row.ownerName.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export async function listBploBusinessLocations(
  filters: BusinessMapFilters = {}
): Promise<BusinessLocationMapRow[]> {
  return listActivePermittedBusinessLocations(filters);
}

export async function verifyBusinessLocation(
  businessLocationId: string,
  verifierId: string,
  remarks?: unknown
): Promise<BusinessLocationMapRow> {
  const existing = await prisma.businessLocation.findUnique({
    where: {
      id: businessLocationId,
    },
    select: {
      id: true,
      businessRecordId: true,
    },
  });

  if (!existing) {
    throw new Error("Business location not found");
  }

  const hasValidApplication = await prisma.businessRecord.findFirst({
    where: {
      id: existing.businessRecordId,
      businessStatus: "ACTIVE",
      applications: {
        some: {
          status: { in: [...ACTIVE_PERMITTED_MAP_APP_STATUSES] },
        },
      },
    },
    select: { id: true },
  });

  if (!hasValidApplication) {
    throw new Error("Business location is not associated with a releasable business application");
  }

  await prisma.businessLocation.update({
    where: {
      id: businessLocationId,
    },
    data: {
      status: "VERIFIED",
      verifiedById: verifierId,
      remarks: toOptionalTrimmedString(remarks),
    },
  });

  const rows = await listBploBusinessLocations();
  const updated = rows.find((row) => row.locationId === businessLocationId);
  if (!updated) {
    throw new Error("Unable to load verified location");
  }

  return updated;
}

export async function returnBusinessLocationForCorrection(
  businessLocationId: string,
  verifierId: string,
  remarks: unknown
): Promise<BusinessLocationMapRow> {
  const correctionRemarks = toOptionalTrimmedString(remarks);
  if (!correctionRemarks) {
    throw new Error("Remarks are required when returning location for correction");
  }

  const existing = await prisma.businessLocation.findUnique({
    where: {
      id: businessLocationId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Business location not found");
  }

  const hasValidApplication = await prisma.businessLocation.findFirst({
    where: {
      id: businessLocationId,
      businessRecord: {
        businessStatus: "ACTIVE",
        applications: {
          some: {
            status: { in: [...ACTIVE_PERMITTED_MAP_APP_STATUSES] },
          },
        },
      },
    },
    select: { id: true },
  });

  if (!hasValidApplication) {
    throw new Error("Business location is not associated with a releasable business application");
  }

  await prisma.businessLocation.update({
    where: {
      id: businessLocationId,
    },
    data: {
      status: "NEEDS_CORRECTION",
      verifiedById: verifierId,
      remarks: correctionRemarks,
    },
  });

  const rows = await listBploBusinessLocations();
  const updated = rows.find((row) => row.locationId === businessLocationId);
  if (!updated) {
    throw new Error("Unable to load updated location");
  }

  return updated;
}

export async function listSuperAdminBusinessLocations(): Promise<BusinessLocationMapRow[]> {
  return listBploBusinessLocations();
}
