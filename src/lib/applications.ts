import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi, isEditableStatus } from "@/lib/application-mappers";
import { getMissingRequiredDocuments, resolveRequiredDocuments } from "@/lib/required-documents";
import { toMoneyNumber } from "@/lib/money";
import { removeApplicantDocument, storeApplicantDocument } from "@/lib/document-storage";
import {
  applyLockedBusinessFields,
  isCorporation,
  isCorporationOwnershipClassification,
  normalizeBusinessInfo,
  validateBusinessIdentityFormats,
} from "@/lib/business-rules";
import { isWithinEbMagalona } from "@/lib/business-location";
import type {
  ApplicantApplicationRow,
  ApplicationDocumentInput,
  BusinessInfo,
  SaveApplicationInput,
  SubmitValidationErrorDetail,
} from "@/lib/applicant-types";

type DbApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSESSED"
  | "APPROVED_FOR_PAYMENT"
  | "PAID"
  | "FOR_RELEASE"
  | "RELEASED"
  | "RETURNED_FOR_CORRECTION"
  | "REJECTED";

type ApplicationWithDocs = {
  id: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  status: DbApplicationStatus;
  formData: unknown;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  documents: Array<{
    id: string;
    documentName: string;
    fileName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
  }>;
  businessRecord: { businessName: string } | null;
};

interface SafeApplicantDocument {
  id: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

interface SubmitFileInput {
  documentName: string;
  file: File;
}

interface StagedSubmitDocument {
  documentName: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

function toSafeApplicantDocument(doc: {
  id: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}): SafeApplicantDocument {
  return {
    id: doc.id,
    documentName: doc.documentName,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedAt: doc.uploadedAt,
  };
}

const REQUIRED_FIELD_KEYS: Array<keyof BusinessInfo> = [
  "businessType",
  "registrationNumber",
  "tin",
  "businessName",
  "ownerName",
  "email",
  "phone",
  "businessAddress",
  "lineOfBusiness",
  "businessActivity",
];

const PH_MOBILE_REGEX = /^(\+63|0)9\d{9}$/;
const ALLOWED_PAYMENT_FREQUENCIES = ["ANNUAL", "BI_ANNUAL", "QUARTERLY"] as const;

export class SubmitValidationError extends Error {
  detail: SubmitValidationErrorDetail;

  constructor(detail: SubmitValidationErrorDetail) {
    super("Submit validation failed");
    this.name = "SubmitValidationError";
    this.detail = detail;
  }
}

export class ApplicantEligibilityError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "ApplicantEligibilityError";
    this.status = status;
  }
}

export class DuplicateBusinessIdentityError extends Error {
  field: "registrationNumber" | "tin";

  constructor(field: "registrationNumber" | "tin") {
    super("This already exist");
    this.name = "DuplicateBusinessIdentityError";
    this.field = field;
  }
}

async function assertUniqueBusinessIdentity(params: {
  registrationNumber: string;
  tin: string;
  excludeBusinessRecordId?: string | null;
  excludeApplicationId?: string | null;
}): Promise<void> {
  const { registrationNumber, tin } = params;
  const excludeRecordId = params.excludeBusinessRecordId ?? "";
  const excludeAppId = params.excludeApplicationId ?? "";

  // Check BusinessRecord for duplicate registrationNumber
  const dupRecord = await prisma.businessRecord.findFirst({
    where: {
      registrationNumber,
      ...(excludeRecordId ? { NOT: { id: excludeRecordId } } : {}),
    },
    select: { id: true },
  });
  if (dupRecord) {
    throw new DuplicateBusinessIdentityError("registrationNumber");
  }

  // Check BusinessRecord for duplicate TIN
  const dupTinRecord = await prisma.businessRecord.findFirst({
    where: {
      tin,
      ...(excludeRecordId ? { NOT: { id: excludeRecordId } } : {}),
    },
    select: { id: true },
  });
  if (dupTinRecord) {
    throw new DuplicateBusinessIdentityError("tin");
  }

  // Check BusinessApplication formData JSON for duplicate registrationNumber
  // Exclude REJECTED/REVOKED statuses and the current application being edited
  // excludeAppId = "" means no exclusion (empty string never matches a CUID)
  const regNumDup = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "BusinessApplication"
    WHERE json_extract(formData, '$.registrationNumber') = ${registrationNumber}
    AND status NOT IN ('REJECTED', 'REVOKED')
    AND id != ${excludeAppId}
    LIMIT 1
  `;
  if (regNumDup.length > 0) {
    throw new DuplicateBusinessIdentityError("registrationNumber");
  }

  // Check BusinessApplication formData JSON for duplicate TIN
  const tinDup = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "BusinessApplication"
    WHERE json_extract(formData, '$.tin') = ${tin}
    AND status NOT IN ('REJECTED', 'REVOKED')
    AND id != ${excludeAppId}
    LIMIT 1
  `;
  if (tinDup.length > 0) {
    throw new DuplicateBusinessIdentityError("tin");
  }
}

const ELIGIBLE_EXISTING_BUSINESS_STATUSES: DbApplicationStatus[] = [
  "PAID",
  "FOR_RELEASE",
  "RELEASED",
];

const RENEWAL_REVOKED_MESSAGE =
  "Renewal is not allowed because this business permit has been revoked. Re-application is required.";

async function assertEligibleBusinessRecord(
  applicantId: string,
  input: SaveApplicationInput
): Promise<void> {
  if (input.applicationType === "NEW") return;

  if (!input.businessRecordId) {
    throw new ApplicantEligibilityError(
      "Renewal and closure submissions require an existing business record.",
      400
    );
  }

  const businessRecord = (await prisma.businessRecord.findFirst({
    where: {
      id: input.businessRecordId,
      applicantId,
    },
    select: {
      id: true,
      businessStatus: true,
      location: {
        select: {
          status: true,
        },
      },
      applications: {
        where: {
          status: {
            in: ELIGIBLE_EXISTING_BUSINESS_STATUSES,
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
      revokedApplications: {
        where: {
          status: "REVOKED",
        },
        select: {
          id: true,
        },
        take: 1,
      },
    } as any,
  })) as unknown as {
    id: string;
    businessStatus?: "ACTIVE" | "INACTIVE" | "CLOSED" | null;
    location?: { status: string } | null;
    applications: Array<{ id: string }>;
    revokedApplications: Array<{ id: string }>;
  } | null;

  if (!businessRecord) {
    throw new ApplicantEligibilityError(
      "Selected business record was not found for this applicant.",
      403
    );
  }

  if (
    input.applicationType === "RENEWAL" &&
    (businessRecord.businessStatus === "INACTIVE" || businessRecord.revokedApplications.length > 0)
  ) {
    throw new ApplicantEligibilityError(RENEWAL_REVOKED_MESSAGE, 409);
  }

  if (businessRecord.businessStatus === "CLOSED") {
    throw new ApplicantEligibilityError(
      "This business has already been closed and cannot be submitted for renewal or closure again.",
      403
    );
  }

  const hasVerifiedLocation = businessRecord.location?.status === "VERIFIED";
  const hasEligibleHistory = businessRecord.applications.length > 0;

  if (!hasVerifiedLocation && !hasEligibleHistory) {
    throw new ApplicantEligibilityError(
      "Selected business record is not yet eligible for renewal or closure. Complete business verification first.",
      403
    );
  }
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const data = (formData ?? {}) as Record<string, unknown>;
  const fromForm =
    typeof data.businessName === "string" && data.businessName.trim().length > 0
      ? data.businessName.trim()
      : null;
  return fromForm ?? fallback ?? "-";
}

function mapApplicationToRow(app: ApplicationWithDocs): ApplicantApplicationRow {
  const formData = app.formData as unknown as Partial<BusinessInfo>;

  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    businessName: formData.businessName ?? app.businessRecord?.businessName ?? "-",
    applicationType: app.applicationType as ApplicantApplicationRow["applicationType"],
    status: mapDbStatusToUi(app.status),
    dateSubmitted: app.submittedAt ? toDateOnly(app.submittedAt) : "-",
    canEdit: isEditableStatus(app.status),
  };
}

async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const countThisYear = await prisma.businessApplication.count({
    where: {
      createdAt: {
        gte: yearStart,
        lt: yearEnd,
      },
    },
  });

  return `EBPLS-${year}-${String(countThisYear + 1).padStart(4, "0")}`;
}

function sanitizeDocuments(documents: SaveApplicationInput["documents"]) {
  return documents
    .filter((doc) => doc.documentName.trim() && doc.fileName.trim())
    .map((doc) => ({
      id: doc.id,
      documentName: doc.documentName.trim(),
      fileName: doc.fileName.trim(),
      storagePath: doc.storagePath,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
    }));
}

function sanitizeSubmitFiles(submitFiles: SubmitFileInput[]) {
  const sanitized = submitFiles
    .filter((entry) => entry.documentName.trim().length > 0)
    .map((entry) => ({
      documentName: entry.documentName.trim(),
      file: entry.file,
    }));

  const seen = new Set<string>();
  for (const entry of sanitized) {
    const normalizedName = entry.documentName.toLowerCase();
    if (seen.has(normalizedName)) {
      throw new Error(`Duplicate uploaded document entry for ${entry.documentName}.`);
    }
    seen.add(normalizedName);
  }

  return sanitized;
}

function buildBusinessInfoFromRecord(record: any): BusinessInfo {
  return normalizeBusinessInfo({
    businessType: record.businessType as BusinessInfo["businessType"],
    registrationNumber: record.registrationNumber,
    paymentFrequency: "ANNUAL",
    tin: record.tin,
    businessName: record.businessName,
    tradeName: record.tradeName,
    ownerName: record.ownerName,
    sex: record.sex ?? undefined,
    nationality: record.nationality,
    email: record.email,
    phone: record.phone,
    mainOfficeAddress: record.mainOfficeAddress,
    businessAddress: record.businessAddress,
    businessLatitude: record.location?.latitude ?? null,
    businessLongitude: record.location?.longitude ?? null,
    sameAsMainOffice: record.sameAsMainOffice,
    businessArea: record.businessArea ?? "",
    totalFloorArea: record.totalFloorArea ?? "",
    totalEmployees: record.totalEmployees ?? "",
    maleEmployees: record.maleEmployees ?? "",
    femaleEmployees: record.femaleEmployees ?? "",
    employeesWithinMunicipality: record.employeesWithinMunicipality ?? "",
    deliveryVehicles: record.deliveryVehicles ?? "",
    propertyOwnership: (record.propertyOwnership as BusinessInfo["propertyOwnership"]) ?? "Owned",
    taxDeclarationNumber: record.taxDeclarationNumber ?? "",
    propertyIdentificationNumber: record.propertyIdentificationNumber ?? "",
    taxIncentives: record.taxIncentives ?? "",
    businessActivity: record.businessActivity ?? "",
    lineOfBusiness: record.lineOfBusiness ?? "",
    assetSize: record.assetSize ?? "",
    isMarket: Boolean(record.isMarket),
    isAgriculture: Boolean(record.isAgriculture),
    isLiquorOrTobacco: Boolean(record.isLiquorOrTobacco),
  });
}

async function getApplicantBusinessRecordSource(applicantId: string, businessRecordId?: string | null) {
  if (!businessRecordId) {
    return null;
  }

  const record = await prisma.businessRecord.findFirst({
    where: {
      id: businessRecordId,
      applicantId,
    },
  });

  return record ? buildBusinessInfoFromRecord(record) : null;
}

function validateSubmitPayload(
  input: SaveApplicationInput,
  normalizedFormData: BusinessInfo,
  mergedDocuments: ApplicationDocumentInput[]
) {
  const pinRequired = input.applicationType === "NEW" || input.applicationType === "RENEWAL";

  if (pinRequired) {
    if (
      typeof normalizedFormData.businessLatitude !== "number" ||
      typeof normalizedFormData.businessLongitude !== "number" ||
      !isWithinEbMagalona(normalizedFormData.businessLatitude, normalizedFormData.businessLongitude)
    ) {
      throw new Error("Please pin the business location inside EB Magalona.");
    }
  }

  const missingFields = REQUIRED_FIELD_KEYS.filter((key) => {
    const value = normalizedFormData[key];
    return typeof value !== "string" || value.trim().length === 0;
  }).map((key) => String(key));

  const identityFormats = validateBusinessIdentityFormats(normalizedFormData);
  if (!identityFormats.registrationNumber || !identityFormats.tin) {
    throw new Error("Wrong Format");
  }

  const normalizedNationality = normalizedFormData.nationality.trim();
  if (isCorporation(normalizedFormData.businessType)) {
    if (!isCorporationOwnershipClassification(normalizedNationality)) {
      missingFields.push("nationality (select a corporation ownership classification)");
    }
  } else if (normalizedNationality.length === 0) {
    missingFields.push("nationality");
  }

  if (!ALLOWED_PAYMENT_FREQUENCIES.includes(normalizedFormData.paymentFrequency)) {
    missingFields.push("paymentFrequency (must be ANNUAL, BI_ANNUAL, or QUARTERLY)");
  }

  const normalizedPhone = normalizedFormData.phone.replace(/[\s-]/g, "");
  if (!PH_MOBILE_REGEX.test(normalizedPhone)) {
    missingFields.push("phone (must be a valid Philippine mobile number)");
  }

  const email = normalizedFormData.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    missingFields.push("email (invalid format)");
  }

  const assetValue = Number(normalizedFormData.assetSize.replace(/[₱,\s]/g, ""));
  if (!Number.isFinite(assetValue) || assetValue < 0) {
    missingFields.push("assetSize (must be a non-negative number)");
  }

  if (input.applicationType === "NEW") {
    const requiredAddressFields: Array<keyof BusinessInfo> = [
      "country",
      "countryCode",
      "province",
      "provinceCode",
      "cityMunicipality",
      "streetAddress",
    ];

    for (const key of requiredAddressFields) {
      const value = normalizedFormData[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        missingFields.push(String(key));
      }
    }
  }

  const employees = Number(normalizedFormData.totalEmployees.replace(/[,\s]/g, ""));
  if (!Number.isFinite(employees) || employees < 0 || !Number.isInteger(employees)) {
    missingFields.push("totalEmployees (must be a non-negative integer)");
  }

  if ((input.applicationType === "RENEWAL" || input.applicationType === "CLOSURE") && !input.businessRecordId) {
    missingFields.push("businessRecordId");
  }

  const requiredDocs = resolveRequiredDocuments({
    applicationType: input.applicationType,
    formData: normalizedFormData,
  });

  const missingDocuments = getMissingRequiredDocuments(
    requiredDocs,
    mergedDocuments.map((doc) => doc.documentName)
  );

  const invalidDocumentMetadata = requiredDocs
    .filter((requiredDoc) => {
      const candidates = mergedDocuments.filter(
        (doc) => doc.documentName.trim().toLowerCase() === requiredDoc.trim().toLowerCase()
      );

      if (candidates.length === 0) return false;

      return !candidates.some(
        (doc) =>
          doc.fileName?.trim() &&
          doc.mimeType?.trim() &&
          typeof doc.sizeBytes === "number" &&
          doc.sizeBytes > 0
      );
    })
    .map((doc) => `${doc} (invalid file metadata)`);

  if (missingFields.length || missingDocuments.length || invalidDocumentMetadata.length) {
    throw new SubmitValidationError({
      missingFields: [...missingFields, ...invalidDocumentMetadata],
      missingDocuments,
    });
  }
}

// Cached query for applicant applications - deduplicates per-request
const getCachedApplicantApplications = cache(
  async (applicantId: string): Promise<ApplicantApplicationRow[]> => {
    const applications = await prisma.businessApplication.findMany({
      where: { applicantId },
      include: {
        documents: true,
        businessRecord: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return (applications as ApplicationWithDocs[]).map(mapApplicationToRow);
  }
);

export async function listApplicantApplications(applicantId: string): Promise<ApplicantApplicationRow[]> {
  return getCachedApplicantApplications(applicantId);
}

export async function getApplicantApplicationDetail(applicantId: string, applicationId: string) {
  const app = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      applicantId,
    },
    include: {
      documents: true,
      history: {
        orderBy: {
          createdAt: "desc",
        },
      },
      businessRecord: true,
      permitIssuance: {
        select: {
          documentNumber: true,
          documentType: true,
          status: true,
          issuedAt: true,
          releasedAt: true,
        },
      },
    },
  });

  if (!app) return null;

  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    applicationType: app.applicationType as ApplicantApplicationRow["applicationType"],
    businessRecordId: app.businessRecordId,
    status: mapDbStatusToUi(app.status),
    canEdit: isEditableStatus(app.status),
    submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    formData: app.formData,
    documents: app.documents.map((doc: any) => ({
      id: doc.id,
      documentName: doc.documentName,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt.toISOString(),
    })),
    history: app.history.map((item: any) => ({
      id: item.id,
      fromStatus: item.fromStatus ? mapDbStatusToUi(item.fromStatus) : null,
      toStatus: mapDbStatusToUi(item.toStatus),
      remarks: item.remarks,
      createdAt: item.createdAt.toISOString(),
    })),
    permitIssuance: app.permitIssuance
      ? {
          documentNumber: app.permitIssuance.documentNumber,
          documentType: app.permitIssuance.documentType,
          status: app.permitIssuance.status,
          issuedAt: app.permitIssuance.issuedAt.toISOString(),
          releasedAt: app.permitIssuance.releasedAt
            ? app.permitIssuance.releasedAt.toISOString()
            : null,
        }
      : null,
  };
}

export async function saveApplicantApplication(
  applicantId: string,
  input: SaveApplicationInput,
  submitFiles: SubmitFileInput[] = []
) {
  const nextStatus = input.mode === "SUBMIT" ? "SUBMITTED" : "DRAFT";
  const documents = sanitizeDocuments(input.documents);
  const normalizedSubmitFiles = sanitizeSubmitFiles(submitFiles);

  const rawIdentityFormats = validateBusinessIdentityFormats({
    businessType: input.formData.businessType,
    registrationNumber: input.formData.registrationNumber,
    tin: input.formData.tin,
  });

  if (!rawIdentityFormats.registrationNumber || !rawIdentityFormats.tin) {
    throw new Error("Wrong Format");
  }

  if (input.applicationType === "RENEWAL") {
    await assertEligibleBusinessRecord(applicantId, input);
  } else if (input.mode === "SUBMIT") {
    await assertEligibleBusinessRecord(applicantId, input);
  }

  const existing = input.applicationId
    ? await prisma.businessApplication.findFirst({
        where: {
          id: input.applicationId,
          applicantId,
        },
      })
    : null;

  if (input.applicationId && !existing) {
    throw new Error("Application not found");
  }

  if (existing && !isEditableStatus(existing.status)) {
    throw new Error("Only draft or returned applications can be edited");
  }

  const existingDocuments = existing
    ? await prisma.applicationDocument.findMany({
        where: { applicationId: existing.id },
      })
    : [];

  const submitFileDocuments: ApplicationDocumentInput[] = normalizedSubmitFiles.map((entry) => ({
    documentName: entry.documentName,
    fileName: entry.file.name,
    mimeType: entry.file.type,
    sizeBytes: entry.file.size,
  }));

  const mergedDocuments: ApplicationDocumentInput[] = [
    ...existingDocuments.map((doc: any) => ({
      id: doc.id,
      documentName: doc.documentName,
      fileName: doc.fileName,
      storagePath: doc.storagePath,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt ? doc.uploadedAt.toISOString() : undefined,
    })),
    ...documents,
    ...submitFileDocuments,
  ];

  const sourceBusinessInfo = await getApplicantBusinessRecordSource(applicantId, input.businessRecordId);
  const normalizedFormData = applyLockedBusinessFields(
    input.applicationType,
    input.formData,
    sourceBusinessInfo
  );

  const identityFormats = validateBusinessIdentityFormats(normalizedFormData);
  if (!identityFormats.registrationNumber || !identityFormats.tin) {
    throw new Error("Wrong Format");
  }

  await assertUniqueBusinessIdentity({
    registrationNumber: normalizedFormData.registrationNumber,
    tin: normalizedFormData.tin,
    excludeBusinessRecordId: input.businessRecordId ?? null,
    excludeApplicationId: existing?.id ?? null,
  });

  if (input.mode === "SUBMIT") {
    validateSubmitPayload(input, normalizedFormData, mergedDocuments);
  }

  const persistedPayloadDocuments = documents.filter(
    (doc) =>
      typeof doc.storagePath === "string" &&
      doc.storagePath.trim().length > 0 &&
      typeof doc.mimeType === "string" &&
      doc.mimeType.trim().length > 0 &&
      typeof doc.sizeBytes === "number" &&
      doc.sizeBytes > 0
  );

  const stagedDocuments: StagedSubmitDocument[] = [];
  const replacedStoragePaths: string[] = [];

  try {
    if (input.mode === "SUBMIT") {
      for (const entry of normalizedSubmitFiles) {
        const stored = await storeApplicantDocument(entry.file);
        stagedDocuments.push({
          documentName: entry.documentName,
          fileName: stored.fileName,
          storagePath: stored.storagePath,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
        });
      }
    }

    const newDocumentsByName = new Map<string, StagedSubmitDocument>();
    for (const doc of [...persistedPayloadDocuments, ...stagedDocuments]) {
      newDocumentsByName.set(doc.documentName.toLowerCase(), {
        documentName: doc.documentName,
        fileName: doc.fileName,
        storagePath: doc.storagePath ?? "",
        mimeType: doc.mimeType ?? "",
        sizeBytes: doc.sizeBytes ?? 0,
      });
    }

    if (existing) {
      const updated = await prisma.$transaction(async (tx: any) => {
        const row = await tx.businessApplication.update({
          where: { id: existing.id },
          data: {
            applicationType: input.applicationType,
            businessRecordId: input.businessRecordId ?? null,
            status: nextStatus,
            formData: normalizedFormData,
            submittedAt: input.mode === "SUBMIT" ? new Date() : null,
          },
        });

        if (input.mode === "SUBMIT") {
          for (const doc of newDocumentsByName.values()) {
            const existingDoc = await tx.applicationDocument.findFirst({
              where: {
                applicationId: existing.id,
                documentName: doc.documentName,
              },
            });

            if (existingDoc) {
              if (existingDoc.storagePath !== doc.storagePath) {
                replacedStoragePaths.push(existingDoc.storagePath);
              }

              await tx.applicationDocument.update({
                where: { id: existingDoc.id },
                data: {
                  fileName: doc.fileName,
                  storagePath: doc.storagePath,
                  mimeType: doc.mimeType,
                  sizeBytes: doc.sizeBytes,
                  uploadedAt: new Date(),
                },
              });
            } else {
              await tx.applicationDocument.create({
                data: {
                  applicationId: existing.id,
                  documentName: doc.documentName,
                  fileName: doc.fileName,
                  storagePath: doc.storagePath,
                  mimeType: doc.mimeType,
                  sizeBytes: doc.sizeBytes,
                },
              });
            }
          }
        }

        await tx.applicationHistory.create({
          data: {
            applicationId: existing.id,
            actorId: applicantId,
            actorRole: "APPLICANT",
            fromStatus: existing.status,
            toStatus: nextStatus,
            remarks: input.mode === "SUBMIT" ? "Applicant submitted application" : "Applicant saved draft",
          },
        });

        return row;
      });

      for (const storagePath of replacedStoragePaths) {
        await removeApplicantDocument(storagePath);
      }

      if (process.env.NODE_ENV !== "production") {
        console.info("[ApplicantSubmission] update", {
          applicantId,
          applicationId: updated.id,
          applicationNumber: updated.applicationNumber,
          mode: input.mode,
          applicationType: input.applicationType,
          status: updated.status,
          submittedAt: updated.submittedAt ? updated.submittedAt.toISOString() : null,
        });
      }

      return {
        id: updated.id,
        applicationNumber: updated.applicationNumber,
        status: mapDbStatusToUi(updated.status),
        submittedAt: updated.submittedAt ? updated.submittedAt.toISOString() : null,
      };
    }

    const applicationNumber = await generateApplicationNumber();

    const created = await prisma.$transaction(async (tx: any) => {
      const row = await tx.businessApplication.create({
        data: {
          applicationNumber,
          applicantId,
          businessRecordId: input.businessRecordId ?? null,
          applicationType: input.applicationType,
          status: nextStatus,
          formData: normalizedFormData,
          submittedAt: input.mode === "SUBMIT" ? new Date() : null,
        },
      });

      if (input.mode === "SUBMIT") {
        for (const doc of newDocumentsByName.values()) {
          await tx.applicationDocument.create({
            data: {
              applicationId: row.id,
              documentName: doc.documentName,
              fileName: doc.fileName,
              storagePath: doc.storagePath,
              mimeType: doc.mimeType,
              sizeBytes: doc.sizeBytes,
            },
          });
        }
      }

      await tx.applicationHistory.create({
        data: {
          applicationId: row.id,
          actorId: applicantId,
          actorRole: "APPLICANT",
          fromStatus: null,
          toStatus: nextStatus,
          remarks: input.mode === "SUBMIT" ? "Applicant submitted application" : "Applicant saved draft",
        },
      });

      return row;
    });

    if (process.env.NODE_ENV !== "production") {
      console.info("[ApplicantSubmission] create", {
        applicantId,
        applicationId: created.id,
        applicationNumber: created.applicationNumber,
        mode: input.mode,
        applicationType: input.applicationType,
        status: created.status,
        submittedAt: created.submittedAt ? created.submittedAt.toISOString() : null,
      });
    }

    return {
      id: created.id,
      applicationNumber: created.applicationNumber,
      status: mapDbStatusToUi(created.status),
      submittedAt: created.submittedAt ? created.submittedAt.toISOString() : null,
    };
  } catch (error) {
    for (const doc of stagedDocuments) {
      await removeApplicantDocument(doc.storagePath);
    }
    throw error;
  }
}

export async function createApplicantDocument(
  applicantId: string,
  applicationId: string,
  input: {
    documentName: string;
    fileName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
  }
) {
  const application = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      applicantId,
    },
  });

  if (!application) throw new Error("Application not found");
  if (application.status !== "SUBMITTED") {
    throw new Error("Documents can only be uploaded after application submission.");
  }

  const existing = await prisma.applicationDocument.findFirst({
    where: {
      applicationId,
      documentName: input.documentName,
    },
  });

  if (existing) {
    const updated = await prisma.applicationDocument.update({
      where: { id: existing.id },
      data: {
        fileName: input.fileName,
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploadedAt: new Date(),
      },
    });
    return updated;
  }

  const created = await prisma.applicationDocument.create({
    data: {
      applicationId,
      documentName: input.documentName,
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
  });

  return created;
}

export async function listApplicantDocuments(applicantId: string, applicationId: string) {
  const application = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      applicantId,
    },
    include: {
      documents: true,
    },
  });

  if (!application) throw new Error("Application not found");

  return application.documents.map(toSafeApplicantDocument);
}

export async function getApplicantOwnedDocument(applicantId: string, applicationId: string, documentId: string) {
  const document = await prisma.applicationDocument.findFirst({
    where: {
      id: documentId,
      applicationId,
      application: {
        applicantId,
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
}

export async function deleteApplicantDocument(applicantId: string, applicationId: string, documentId: string) {
  const application = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      applicantId,
    },
  });

  if (!application) throw new Error("Application not found");
  if (!isEditableStatus(application.status)) throw new Error("Only draft or returned applications can be edited");

  const doc = await prisma.applicationDocument.findFirst({
    where: {
      id: documentId,
      applicationId,
    },
  });

  if (!doc) throw new Error("Document not found");

  await prisma.applicationDocument.delete({ where: { id: doc.id } });
  return doc;
}

// Cached query for applicant notifications - deduplicates per-request
const getCachedApplicantNotifications = cache(async (applicantId: string) => {
  const apps = await prisma.businessApplication.findMany({
    where: { applicantId },
    select: {
      id: true,
      applicationNumber: true,
      applicationType: true,
      history: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const notifications = apps.flatMap((app: any) =>
    app.history.map((item: any) => ({
      id: item.id,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      applicationType: app.applicationType,
      toStatus: mapDbStatusToUi(item.toStatus),
      remarks: item.remarks,
      createdAt: item.createdAt.toISOString(),
    }))
  );

  return notifications.sort((a: { createdAt: string }, b: { createdAt: string }) =>
    b.createdAt.localeCompare(a.createdAt)
  );
});

export async function listApplicantNotifications(applicantId: string) {
  return getCachedApplicantNotifications(applicantId);
}

export async function getApplicantTopSummary(applicantId: string) {
  const applications = await prisma.businessApplication.findMany({
    where: {
      applicantId,
      feeAssessment: {
        is: {
          status: "GENERATED",
        },
      },
    },
    include: {
      businessRecord: {
        select: {
          businessName: true,
        },
      },
      feeAssessment: {
        include: {
          lineItems: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      paymentReferences: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (applications.length === 0) return null;

  const summaries = applications.map((application: any) => {
    const payment = application.paymentReferences[0] ?? null;
    const fa = application.feeAssessment as {
      assessmentNumber: string;
      status: string;
      paymentFrequency: string;
      annualAssessedAmount: any;
      releasePaymentAmount: any;
      amountPaid: any;
      remainingBalance: any;
      paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
      mayorsPermitFee: any;
      regulatoryFees: any;
      additionalCharges: any;
      penalties: any;
      surcharge: any;
      interest: any;
      closureCertificateFee: any;
      arrears: any;
      otherCharges: any;
      closurePaymentDues: any;
      totalAmount: any;
      remarks: string | null;
      generatedAt: Date | null;
      lineItems: Array<{
        id: string;
        description: string;
        amount: any;
        isSystemGenerated: boolean;
      }>;
    } | null;

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      businessName: resolveBusinessName(application.formData, application.businessRecord?.businessName ?? null),
      applicationType: application.applicationType as string,
      status: mapDbStatusToUi(application.status),
      rawStatus: application.status,
      topNumber: fa?.assessmentNumber ?? null,
      assessmentStatus: (fa?.status ?? null) as "DRAFT" | "GENERATED" | null,
      paymentFrequency: (fa?.paymentFrequency ?? null) as "ANNUAL" | "BI_ANNUAL" | "QUARTERLY" | null,
      annualAssessedAmount: toMoneyNumber(fa?.annualAssessedAmount),
      releasePaymentAmount: toMoneyNumber(fa?.releasePaymentAmount),
      amountPaid: toMoneyNumber(fa?.amountPaid),
      remainingBalance: toMoneyNumber(fa?.remainingBalance),
      paymentStatus: fa?.paymentStatus ?? "UNPAID",
      mayorsPermitFee: toMoneyNumber(fa?.mayorsPermitFee),
      regulatoryFees: toMoneyNumber(fa?.regulatoryFees),
      additionalCharges: toMoneyNumber(fa?.additionalCharges),
      penalties: toMoneyNumber(fa?.penalties),
      surcharge: toMoneyNumber(fa?.surcharge),
      interest: toMoneyNumber(fa?.interest),
      closurePaymentDues: toMoneyNumber(fa?.closurePaymentDues),
      closureCertificateFee: toMoneyNumber(fa?.closureCertificateFee),
      arrears: toMoneyNumber(fa?.arrears),
      otherCharges: toMoneyNumber(fa?.otherCharges),
      totalAmount: toMoneyNumber(fa?.totalAmount),
      remarks: fa?.remarks ?? null,
      generatedAt: fa?.generatedAt ? fa.generatedAt.toISOString() : null,
      lineItems: (fa?.lineItems ?? []).map((item) => ({
        id: item.id,
        description: item.description,
        amount: toMoneyNumber(item.amount),
        isSystemGenerated: item.isSystemGenerated,
      })),
      paymentReference: payment
        ? {
            id: payment.id,
            transactionNumber: payment.transactionNumber,
            officialReceiptNumber: payment.transactionNumber,
            amountPaid: toMoneyNumber(payment.amountPaid),
            paymentDate: payment.paymentDate.toISOString(),
            submittedAt: payment.submittedAt.toISOString(),
            status: payment.status,
            reviewerRemarks: payment.reviewerRemarks,
            reviewedAt: payment.reviewedAt ? payment.reviewedAt.toISOString() : null,
            proofFileName: payment.proofFileName,
          }
        : null,
    };
  });

  return {
    activeSummary: summaries.find(
      (summary: { rawStatus: string }) => summary.rawStatus === "APPROVED_FOR_PAYMENT"
    ) ?? summaries[0],
    records: summaries,
  };
}

export async function submitApplicantPaymentReference(
  applicantId: string,
  applicationId: string,
  transactionNumber: string,
  proof: {
    proofFileName: string;
    proofStoragePath: string;
    proofMimeType: string;
    proofSizeBytes: number;
  }
) {
  const application = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      applicantId,
    },
    include: {
      feeAssessment: true,
    },
  });

  if (!application) throw new Error("Application not found");

  if (application.status !== "APPROVED_FOR_PAYMENT") {
    throw new Error("Payment reference can only be submitted once the Tax Order of Payment has been generated");
  }

  if (!application.feeAssessment || application.feeAssessment.status !== "GENERATED") {
    throw new Error("Generated TOP is required before submitting payment reference");
  }

  const duplicate = await prisma.paymentReference.findUnique({
    where: { transactionNumber: transactionNumber.trim() },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("This OR number has already been submitted. Please check your payment details.");
  }

  const latest = await prisma.paymentReference.findFirst({
    where: { applicationId: application.id },
    orderBy: { submittedAt: "desc" },
    select: { status: true },
  });

  if (latest?.status === "PENDING") {
    throw new Error("An OR submission is already pending verification");
  }

  if (latest?.status === "VERIFIED") {
    throw new Error("Payment has already been verified and is read-only");
  }

  const parsedPaymentDate = new Date();

  const normalizedAmountPaid = Math.round(Math.max(0, toMoneyNumber(application.feeAssessment.totalAmount)) * 100) / 100;
  if (normalizedAmountPaid <= 0) {
    throw new Error("TOP amount is invalid for payment submission");
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    await tx.paymentReference.create({
      data: {
        applicationId: application.id,
        transactionNumber: transactionNumber.trim(),
        amountPaid: normalizedAmountPaid,
        paymentDate: parsedPaymentDate,
        proofFileName: proof.proofFileName,
        proofStoragePath: proof.proofStoragePath,
        proofMimeType: proof.proofMimeType,
        proofSizeBytes: proof.proofSizeBytes,
        status: "PENDING",
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: application.id,
        actorId: applicantId,
        actorRole: "APPLICANT",
        fromStatus: application.status,
        toStatus: application.status,
        remarks: `Applicant submitted OR number ${transactionNumber.trim()} with amount ₱${toMoneyNumber(normalizedAmountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      },
    });

    return tx.businessApplication.findUniqueOrThrow({
      where: { id: application.id },
      select: { id: true, applicationNumber: true, status: true },
    });
  });

  return {
    applicationId: updated.id,
    applicationNumber: updated.applicationNumber,
    status: mapDbStatusToUi(updated.status),
  };
}

export async function listApplicantBusinessRecords(applicantId: string) {
  const rows = await prisma.businessRecord.findMany({
    where: { applicantId },
    include: {
      applications: {
        select: {
          status: true,
        },
      },
      location: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rows.map((row: any) => ({
    id: row.id,
    registrationNumber: row.registrationNumber,
    businessName: row.businessName,
    businessStatus: row.businessStatus as "ACTIVE" | "INACTIVE" | "CLOSED",
    hasRevokedPermit: row.applications.some((application: any) => application.status === "REVOKED"),
    closedAt: row.closedAt ? (row.closedAt as Date).toISOString() : null,
    businessInfo: {
      businessType: row.businessType as BusinessInfo["businessType"],
      registrationNumber: row.registrationNumber,
      paymentFrequency: "ANNUAL",
      tin: row.tin,
      businessName: row.businessName,
      tradeName: row.tradeName,
      ownerName: row.ownerName,
      nationality: row.nationality,
      email: row.email,
      phone: row.phone,
      mainOfficeAddress: row.mainOfficeAddress,
      businessAddress: row.businessAddress,
      businessLatitude: row.location?.latitude ?? null,
      businessLongitude: row.location?.longitude ?? null,
      sameAsMainOffice: row.sameAsMainOffice,
      businessArea: row.businessArea ?? "",
      totalFloorArea: row.totalFloorArea ?? "",
      totalEmployees: row.totalEmployees ?? "",
      maleEmployees: row.maleEmployees ?? "",
      femaleEmployees: row.femaleEmployees ?? "",
      employeesWithinMunicipality: row.employeesWithinMunicipality ?? "",
      deliveryVehicles: row.deliveryVehicles ?? "",
      propertyOwnership: (row.propertyOwnership as BusinessInfo["propertyOwnership"]) ?? "Owned",
      taxDeclarationNumber: row.taxDeclarationNumber ?? "",
      propertyIdentificationNumber: row.propertyIdentificationNumber ?? "",
      taxIncentives: row.taxIncentives ?? "",
      businessActivity: row.businessActivity ?? "",
      lineOfBusiness: row.lineOfBusiness ?? "",
      assetSize: row.assetSize ?? "",
      isMarket: Boolean(row.isMarket),
      isAgriculture: Boolean(row.isAgriculture),
      isLiquorOrTobacco: Boolean(row.isLiquorOrTobacco),
    } satisfies BusinessInfo,
    permitExpirationDate: row.permitExpirationDate ? (row.permitExpirationDate as Date).toISOString() : null,
  }));
}
