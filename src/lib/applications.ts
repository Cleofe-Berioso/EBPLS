import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi, isEditableStatus } from "@/lib/application-mappers";
import { getMissingRequiredDocuments, resolveRequiredDocuments } from "@/lib/required-documents";
import { toMoneyNumber } from "@/lib/money";
import { resolveBucketByMimeType } from "@/lib/document-storage";
import { removeApplicantDocument, storeApplicantDocument } from "@/lib/document-storage";
import {
  DOCUMENT_UPLOAD_ERROR_MAX_SIZE,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  validateDocumentFileUpload,
} from "@/lib/document-upload-rules";
import { APPLICANT_ACCOUNT_NOT_FOUND_MESSAGE } from "@/lib/applicant-api";
import {
  applyLockedBusinessFields,
  BUSINESS_ACTIVITY_OPTIONS,
  resolveBusinessBarangayFromFormState,
  isRecognizedEbMagalonaBarangay as isRecognizedEbMagalonaBarangayFromRules,
  normalizeBusinessInfo,
  validateBusinessIdentityFormats,
} from "@/lib/business-rules";
import {
  EB_MAGALONA_CITY,
  EB_MAGALONA_COUNTRY,
  EB_MAGALONA_COUNTRY_CODE,
  EB_MAGALONA_PROVINCE,
  buildEbMagalonaBusinessAddress,
  isEbMagalonaCity,
  isEbMagalonaProvince,
  isPhilippinesCountry,
} from "@/lib/address-options";
import { isValidLineOfBusiness } from "@/lib/business-options";
import { isWithinEbMagalona } from "@/lib/eb-magalona";
import { resolveRenewalEligibilityForBusiness } from "@/lib/renewal-eligibility";
import { resolveClosureEligibilityForBusiness } from "@/lib/closure-eligibility";
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
  bucket?: string;
  filePath?: string;
  originalName?: string;
  mimeType: string;
  sizeBytes: number;
  fileSize?: number;
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

function parsePositiveAmount(value: string): number | null {
  const normalized = value.replace(/[,\s]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNonNegativeAmount(value: string): number | null {
  const normalized = value.replace(/[,\s]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeEmployeeCountInput(value: string): string {
  const compact = value.replace(/[,\s]/g, "").trim();
  if (!compact) return "";

  // Accept integer-like strings (e.g., "12", "12.0") and normalize to canonical integer string.
  if (/^\d+(?:\.0+)?$/.test(compact)) {
    return String(Number(compact));
  }

  return value.trim();
}

export function resolveBusinessBarangaySelection(
  input: Pick<
    BusinessInfo,
    | "barangay"
    | "businessBarangay"
    | "sameAsMainOffice"
    | "mainOfficeBarangay"
    | "mainOfficeCountry"
    | "mainOfficeCountryCode"
    | "mainOfficeProvince"
    | "mainOfficeCityMunicipality"
  >
): string {
  return resolveBusinessBarangayFromFormState(input);
}

export function isRecognizedEbMagalonaBarangay(value: string): boolean {
  return isRecognizedEbMagalonaBarangayFromRules(value);
}

function normalizeSubmitFormDataCandidate(input: BusinessInfo, applicantEmail: string | null): BusinessInfo {
  const formEmail = input.email.trim();
  const fallbackEmail = applicantEmail?.trim() ?? "";
  const resolvedEmail = formEmail || fallbackEmail;

  const resolvedBarangay = resolveBusinessBarangaySelection(input);
  const resolvedTotalEmployees = normalizeEmployeeCountInput(input.totalEmployees ?? "");
  const resolvedAssetSize = (input.assetSize?.trim() || input.capitalInvestment?.trim() || "").trim();
  const resolvedStreetAddress = (input.businessStreetAddress?.trim() || input.streetAddress?.trim() || "").trim();

  return normalizeBusinessInfo({
    ...input,
    email: resolvedEmail,
    streetAddress: resolvedStreetAddress,
    businessStreetAddress: resolvedStreetAddress,
    barangay: resolvedBarangay,
    businessBarangay: resolvedBarangay,
    businessAddress: buildEbMagalonaBusinessAddress({
      streetAddress: resolvedStreetAddress,
      barangay: resolvedBarangay,
    }),
    totalEmployees: resolvedTotalEmployees,
    assetSize: resolvedAssetSize,
  });
}

function parseBusinessActivity(value: string): { selected: string; otherText: string } {
  const trimmed = value.trim();
  if (!trimmed) return { selected: "", otherText: "" };

  if (trimmed.startsWith("Others:")) {
    return {
      selected: "Others, please specify",
      otherText: trimmed.slice("Others:".length).trim(),
    };
  }

  if (trimmed === "Others, please specify") {
    return { selected: trimmed, otherText: "" };
  }

  if ((BUSINESS_ACTIVITY_OPTIONS as readonly string[]).includes(trimmed)) {
    return { selected: trimmed, otherText: "" };
  }

  return { selected: "Others, please specify", otherText: trimmed };
}

function resolveRenewalLineOfBusiness(source: BusinessInfo | null, candidate: string): string {
  const sourceLineOfBusiness = source?.lineOfBusiness?.trim() ?? "";
  if (isValidLineOfBusiness(sourceLineOfBusiness)) {
    return sourceLineOfBusiness;
  }
  return candidate.trim();
}

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

  // Check BusinessApplication formData JSON for duplicate registrationNumber.
  // Exclude REJECTED/REVOKED statuses and the current application being edited.
  // For renewals/closures, also exclude applications linked to same business record.
  const regNumDup = await prisma.businessApplication.findFirst({
    where: {
      formData: {
        path: ["registrationNumber"],
        equals: registrationNumber,
      },
      status: { notIn: ["REJECTED", "REVOKED"] },
      ...(excludeAppId ? { id: { not: excludeAppId } } : {}),
      ...(excludeRecordId
        ? {
            OR: [{ businessRecordId: null }, { businessRecordId: { not: excludeRecordId } }],
          }
        : {}),
    },
    select: { id: true },
  });
  if (regNumDup) {
    throw new DuplicateBusinessIdentityError("registrationNumber");
  }

  // Check BusinessApplication formData JSON for duplicate TIN.
  const tinDup = await prisma.businessApplication.findFirst({
    where: {
      formData: {
        path: ["tin"],
        equals: tin,
      },
      status: { notIn: ["REJECTED", "REVOKED"] },
      ...(excludeAppId ? { id: { not: excludeAppId } } : {}),
      ...(excludeRecordId
        ? {
            OR: [{ businessRecordId: null }, { businessRecordId: { not: excludeRecordId } }],
          }
        : {}),
    },
    select: { id: true },
  });
  if (tinDup) {
    throw new DuplicateBusinessIdentityError("tin");
  }
}

const ELIGIBLE_EXISTING_BUSINESS_STATUSES: DbApplicationStatus[] = [
  "PAID",
  "FOR_RELEASE",
  "RELEASED",
];

type ClosureTypeValue = "RETIREMENT" | "NON_COMPLIANT_RELATED" | "OTHERS";

function normalizeClosureType(value?: string | null): ClosureTypeValue | null {
  if (value === "RETIREMENT" || value === "NON_COMPLIANT_RELATED" || value === "OTHERS") {
    return value;
  }
  return null;
}

function validateClosureSubmissionRules(input: SaveApplicationInput, closureEligibility: { isComplianceForcedClosure: boolean } | null) {
  const closureType = normalizeClosureType(input.closureType);
  const otherReason = input.closureTypeOtherReason?.trim() ?? "";

  if (!closureType) {
    throw new Error("Closure type is required");
  }

  if (closureEligibility?.isComplianceForcedClosure && closureType !== "NON_COMPLIANT_RELATED") {
    throw new Error("This business requires non-compliant related closure processing.");
  }

  if (closureType === "OTHERS" && !otherReason) {
    throw new Error("Please specify the closure reason when selecting Others.");
  }

  // Validate closure operation fields stored in formData
  const fd = input.formData;
  const closureMissing: string[] = [];

  if (!fd.closureLineOfBusiness?.trim()) {
    closureMissing.push("closureLineOfBusiness");
  }

  const rawActivity = fd.closureBusinessActivity?.trim() ?? "";
  if (!rawActivity) {
    closureMissing.push("closureBusinessActivity");
  } else if (rawActivity.startsWith("Others:") && rawActivity.substring(7).trim().length === 0) {
    closureMissing.push("closureBusinessActivity (specify is required when Others is selected)");
  }

  if (!fd.closureLastDateOfOperation?.trim()) {
    closureMissing.push("closureLastDateOfOperation");
  } else {
    const parsed = new Date(fd.closureLastDateOfOperation.trim());
    if (!Number.isFinite(parsed.getTime())) {
      closureMissing.push("closureLastDateOfOperation (invalid date)");
    } else if (parsed.getTime() > Date.now()) {
      closureMissing.push("closureLastDateOfOperation (cannot be in the future)");
    }
  }

  if (closureMissing.length > 0) {
    throw new SubmitValidationError({ missingFields: closureMissing, missingDocuments: [] });
  }
}

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

  if (input.applicationType === "RENEWAL") {
    const eligibility = await resolveRenewalEligibilityForBusiness(applicantId, input.businessRecordId);
    if (!eligibility.eligible) {
      throw new ApplicantEligibilityError(
        eligibility.userFriendlyReason ??
          "Selected business record is not yet eligible for renewal or closure. Complete business verification first.",
        eligibility.reasonCode === "BUSINESS_CLOSED" || eligibility.reasonCode === "EXISTING_RENEWAL_RULE_FAILED"
          ? 403
          : 409
      );
    }
    return;
  }

  if (input.applicationType === "CLOSURE") {
    const eligibility = await resolveClosureEligibilityForBusiness(applicantId, input.businessRecordId);
    if (!eligibility.eligible) {
      throw new ApplicantEligibilityError(
        eligibility.userFriendlyReason ??
          "Selected business record is not yet eligible for closure. Complete business verification first.",
        403
      );
    }
    return;
  }

  const businessRecord = await prisma.businessRecord.findFirst({
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
    },
  });

  if (!businessRecord) {
    throw new ApplicantEligibilityError(
      "Selected business record was not found for this applicant.",
      403
    );
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
    updatedAt: app.updatedAt.toISOString(),
    canEdit: isEditableStatus(app.status),
  };
}

function mapSavedApplicationToRow(input: {
  id: string;
  applicationNumber: string;
  applicationType: ApplicantApplicationRow["applicationType"];
  status: DbApplicationStatus;
  submittedAt: Date | null;
  updatedAt: Date;
  formData: BusinessInfo;
}): ApplicantApplicationRow {
  return {
    id: input.id,
    applicationNumber: input.applicationNumber,
    businessName: resolveBusinessName(input.formData, null),
    applicationType: input.applicationType,
    status: mapDbStatusToUi(input.status),
    dateSubmitted: input.submittedAt ? toDateOnly(input.submittedAt) : "-",
    updatedAt: input.updatedAt.toISOString(),
    canEdit: isEditableStatus(input.status),
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
      documentType: doc.documentType,
      documentName: doc.documentName.trim(),
      fileName: doc.fileName.trim(),
      storagePath: doc.storagePath,
      bucket: doc.bucket,
      filePath: doc.filePath,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      fileSize: doc.fileSize,
    }));
}

function sanitizeSubmitFiles(submitFiles: SubmitFileInput[]) {
  const sanitized = submitFiles
    .filter((entry) => entry.documentName.trim().length > 0)
    .map((entry) => ({
      documentName: entry.documentName.trim(),
      file: entry.file,
    }));

  const oversized = sanitized.find((entry) => entry.file.size > MAX_DOCUMENT_FILE_SIZE_BYTES);
  if (oversized) {
    throw new Error(DOCUMENT_UPLOAD_ERROR_MAX_SIZE);
  }

  for (const entry of sanitized) {
    const fileValidationError = validateDocumentFileUpload(entry.file);
    if (fileValidationError) {
      throw new Error(fileValidationError);
    }
  }

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
    birthDate: "",
    ownerAge: "",
    capitalInvestment: "",
    grossProfit: "",
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
  const fieldErrors: Record<string, string> = {};
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

  // For CLOSURE applications, businessAddress, lineOfBusiness, and businessActivity
  // are sourced from the existing business record and are not re-entered in the form.
  const closureExcludedKeys = new Set<keyof BusinessInfo>(
    input.applicationType === "CLOSURE"
      ? ["businessAddress", "lineOfBusiness", "businessActivity"]
      : []
  );

  const missingFields = REQUIRED_FIELD_KEYS.filter((key) => {
    if (closureExcludedKeys.has(key)) return false;
    const value = normalizedFormData[key];
    return typeof value !== "string" || value.trim().length === 0;
  }).map((key) => String(key));

  const identityFormats = validateBusinessIdentityFormats(normalizedFormData);
  if (!identityFormats.registrationNumber || !identityFormats.tin) {
    throw new Error("Wrong Format");
  }

  if (input.applicationType === "NEW") {
    const capitalRaw = normalizedFormData.capitalInvestment?.trim() ?? "";
    if (!capitalRaw) {
      missingFields.push("capitalInvestment");
    } else if (parsePositiveAmount(capitalRaw) == null) {
      missingFields.push("capitalInvestment (must be a positive number)");
    }
  }

  if (input.applicationType === "RENEWAL") {
    const grossRaw = normalizedFormData.grossProfit?.trim() ?? "";
    if (!grossRaw) {
      missingFields.push("grossProfit");
    } else if (parseNonNegativeAmount(grossRaw) == null) {
      missingFields.push("grossProfit (must be a non-negative number)");
    }

    const activity = parseBusinessActivity(normalizedFormData.businessActivity ?? "");
    if (!activity.selected) {
      missingFields.push("businessActivity");
    } else if (activity.selected === "Others, please specify" && !activity.otherText) {
      missingFields.push("businessActivity (specify activity is required when Others is selected)");
    }
  }

  if (input.applicationType === "NEW" || input.applicationType === "RENEWAL") {
    const normalizedNationality = normalizedFormData.nationality.trim();
    if (normalizedNationality.length === 0) {
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

    const assetSizeRaw = normalizedFormData.assetSize.trim();
    if (!assetSizeRaw) {
      missingFields.push("assetSize");
    } else if (parseNonNegativeAmount(assetSizeRaw) == null) {
      missingFields.push("assetSize (must be a non-negative number)");
    }
  }

  if (input.applicationType === "NEW" || input.applicationType === "RENEWAL") {
    const mainOfficePhilippines = isPhilippinesCountry(
      normalizedFormData.mainOfficeCountry,
      normalizedFormData.mainOfficeCountryCode
    );
    const requiredAddressFields: Array<keyof BusinessInfo> = [
      "mainOfficeCountry",
      "mainOfficeProvince",
      "mainOfficeCityMunicipality",
      "mainOfficeAddress",
    ];

    requiredAddressFields.push(
      mainOfficePhilippines ? "mainOfficeBarangay" : "mainOfficeStreetAddress"
    );

    for (const key of requiredAddressFields) {
      const value = normalizedFormData[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        missingFields.push(String(key));
      }
    }
  }

  if (input.applicationType === "NEW" || input.applicationType === "RENEWAL") {
    if (!normalizedFormData.lineOfBusiness.trim()) {
      missingFields.push("lineOfBusiness");
    } else if (!isValidLineOfBusiness(normalizedFormData.lineOfBusiness)) {
      missingFields.push("lineOfBusiness (must be one of the allowed options)");
    }

    if (normalizedFormData.country.trim() !== EB_MAGALONA_COUNTRY) {
      missingFields.push(`country (must be ${EB_MAGALONA_COUNTRY})`);
    }

    if (normalizedFormData.countryCode.trim().toUpperCase() !== EB_MAGALONA_COUNTRY_CODE) {
      missingFields.push(`countryCode (must be ${EB_MAGALONA_COUNTRY_CODE})`);
    }

    if (!isEbMagalonaProvince(normalizedFormData.province)) {
      missingFields.push(`province (must be ${EB_MAGALONA_PROVINCE})`);
    }

    if (!isEbMagalonaCity(normalizedFormData.cityMunicipality)) {
      missingFields.push(`cityMunicipality (must be ${EB_MAGALONA_CITY})`);
    }

    if (!normalizedFormData.streetAddress?.trim()) {
      missingFields.push("streetAddress");
    }

    const resolvedBarangay = resolveBusinessBarangaySelection(normalizedFormData);
    normalizedFormData.barangay = resolvedBarangay;
    normalizedFormData.businessBarangay = resolvedBarangay;

    if (!resolvedBarangay) {
      missingFields.push("barangay");
    } else if (
      !isRecognizedEbMagalonaBarangay(resolvedBarangay)
    ) {
      fieldErrors.barangay = "Business Barangay is not recognized. Please select from the EB Magalona barangay list.";
    }
  }

  if (input.applicationType === "NEW" || input.applicationType === "RENEWAL") {
    if (
      isPhilippinesCountry(
        normalizedFormData.mainOfficeCountry,
        normalizedFormData.mainOfficeCountryCode
      )
    ) {
      if (!normalizedFormData.mainOfficeBarangay?.trim()) {
        missingFields.push("mainOfficeBarangay");
      }
    } else if (!normalizedFormData.mainOfficeStreetAddress?.trim()) {
      missingFields.push("mainOfficeStreetAddress");
    }
  }

  if (input.applicationType === "NEW" || input.applicationType === "RENEWAL") {
    const totalEmployeesRaw = normalizedFormData.totalEmployees.trim();
    if (!totalEmployeesRaw) {
      missingFields.push("totalEmployees");
    } else {
      const employees = Number(totalEmployeesRaw.replace(/[,\s]/g, ""));
      if (!Number.isFinite(employees) || employees < 0 || !Number.isInteger(employees)) {
        missingFields.push("totalEmployees (must be a non-negative integer)");
      }
    }
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

  const oversizedDocuments = mergedDocuments
    .filter((doc) => {
      const size =
        typeof doc.sizeBytes === "number"
          ? doc.sizeBytes
          : typeof doc.fileSize === "number"
            ? doc.fileSize
            : 0;
      return size > MAX_DOCUMENT_FILE_SIZE_BYTES;
    })
    .map((doc) => `${doc.documentName} (exceeds 10MB max file size)`);

  if (
    missingFields.length ||
    Object.keys(fieldErrors).length > 0 ||
    missingDocuments.length ||
    invalidDocumentMetadata.length ||
    oversizedDocuments.length
  ) {
    throw new SubmitValidationError({
      missingFields: [...missingFields, ...invalidDocumentMetadata, ...oversizedDocuments],
      missingDocuments,
      fieldErrors,
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
    closureType: app.closureType ?? null,
    closureTypeOtherReason: app.closureTypeOtherReason ?? null,
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
  const applicantUser = await prisma.user.findUnique({
    where: { id: applicantId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (
    !applicantUser ||
    applicantUser.role !== "APPLICANT" ||
    !applicantUser.isActive
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ApplicantSubmission] invalid-applicant", {
        requestedApplicantId: applicantId,
        resolvedApplicantId: applicantUser?.id ?? null,
        resolvedApplicantEmail: applicantUser?.email ?? null,
        resolvedApplicantRole: applicantUser?.role ?? null,
        resolvedApplicantActive: applicantUser?.isActive ?? null,
      });
    }

    throw new ApplicantEligibilityError(APPLICANT_ACCOUNT_NOT_FOUND_MESSAGE, 401);
  }

  const nextStatus = input.mode === "SUBMIT" ? "SUBMITTED" : "DRAFT";
  const normalizedInputFormData = normalizeSubmitFormDataCandidate(input.formData, applicantUser.email);
  const documents = sanitizeDocuments(input.documents);
  const normalizedSubmitFiles = sanitizeSubmitFiles(submitFiles);

  // For DRAFT: only validate format for non-empty fields (allow partial data).
  // For SUBMIT: both fields must be present and valid (format check runs in full).
  const rawRegNum = (normalizedInputFormData.registrationNumber ?? "").trim();
  const rawTin = (normalizedInputFormData.tin ?? "").trim();
  if (rawRegNum || rawTin || input.mode === "SUBMIT") {
    const rawIdentityFormats = validateBusinessIdentityFormats({
      businessType: normalizedInputFormData.businessType,
      registrationNumber: normalizedInputFormData.registrationNumber,
      tin: normalizedInputFormData.tin,
    });
    if (input.mode === "SUBMIT") {
      if (!rawIdentityFormats.registrationNumber || !rawIdentityFormats.tin) {
        throw new Error("Wrong Format");
      }
    } else {
      if (rawRegNum && !rawIdentityFormats.registrationNumber) throw new Error("Wrong Format");
      if (rawTin && !rawIdentityFormats.tin) throw new Error("Wrong Format");
    }
  }

  if (input.applicationType === "RENEWAL") {
    await assertEligibleBusinessRecord(applicantId, input);
  } else if (input.applicationType === "CLOSURE") {
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
    throw new Error("This application has already been submitted and is now locked for review.");
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
    normalizedInputFormData,
    sourceBusinessInfo
  );

  if (process.env.NODE_ENV !== "production" && input.mode === "SUBMIT") {
    console.info("[ApplicantSubmission] submit-field-values", {
      applicationType: input.applicationType,
      usedEmailFallback:
        normalizedInputFormData.email.trim().length > 0 &&
        input.formData.email.trim().length === 0,
      rawBarangay: input.formData.barangay ?? null,
      rawBusinessBarangay: input.formData.businessBarangay ?? null,
      canonicalBarangay: normalizedFormData.barangay ?? null,
      barangayValidationState: normalizedFormData.barangay
        ? isRecognizedEbMagalonaBarangay(normalizedFormData.barangay)
          ? "valid"
          : "invalid"
        : "missing",
      cityValueUsedForValidation: normalizedFormData.cityMunicipality,
      email: normalizedFormData.email,
      assetSize: normalizedFormData.assetSize,
      barangay: normalizedFormData.barangay,
      businessBarangay: normalizedFormData.businessBarangay ?? null,
      totalEmployees: normalizedFormData.totalEmployees,
    });
  }

  const closureEligibility =
    input.applicationType === "CLOSURE" && input.businessRecordId
      ? await resolveClosureEligibilityForBusiness(applicantId, input.businessRecordId)
      : null;

  if (input.applicationType === "RENEWAL") {
    normalizedFormData.lineOfBusiness = resolveRenewalLineOfBusiness(
      sourceBusinessInfo,
      normalizedFormData.lineOfBusiness
    );
  }

  const normalizedRegNum = normalizedFormData.registrationNumber.trim();
  const normalizedTin = normalizedFormData.tin.trim();
  if (normalizedRegNum || normalizedTin || input.mode === "SUBMIT") {
    const identityFormats = validateBusinessIdentityFormats(normalizedFormData);
    if (input.mode === "SUBMIT") {
      if (!identityFormats.registrationNumber || !identityFormats.tin) {
        throw new Error("Wrong Format");
      }
    } else {
      if (normalizedRegNum && !identityFormats.registrationNumber) throw new Error("Wrong Format");
      if (normalizedTin && !identityFormats.tin) throw new Error("Wrong Format");
    }
  }

  await assertUniqueBusinessIdentity({
    registrationNumber: normalizedFormData.registrationNumber,
    tin: normalizedFormData.tin,
    excludeBusinessRecordId: input.businessRecordId ?? null,
    excludeApplicationId: existing?.id ?? null,
  });

  if (input.mode === "SUBMIT") {
    if (input.applicationType === "CLOSURE") {
      validateClosureSubmissionRules(input, closureEligibility);
    }
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

  const writtenStoragePaths: string[] = [];
  const replacedStoragePaths: string[] = [];

  try {
    const buildNewDocumentsByName = async (applicationId: string): Promise<Map<string, StagedSubmitDocument>> => {
      const newDocumentsByName = new Map<string, StagedSubmitDocument>();

      for (const doc of persistedPayloadDocuments) {
        newDocumentsByName.set(doc.documentName.toLowerCase(), {
          documentName: doc.documentName,
          fileName: doc.fileName,
          storagePath: doc.storagePath ?? "",
          bucket: doc.bucket ?? resolveBucketByMimeType(doc.mimeType ?? ""),
          filePath: doc.filePath ?? doc.storagePath ?? "",
          originalName: doc.originalName ?? doc.fileName,
          mimeType: doc.mimeType ?? "",
          sizeBytes: doc.sizeBytes ?? 0,
          fileSize: doc.fileSize ?? doc.sizeBytes ?? 0,
        });
      }

      if (input.mode === "SUBMIT") {
        for (const entry of normalizedSubmitFiles) {
          const stored = await storeApplicantDocument(entry.file, {
            applicationId,
            documentType: entry.documentName,
            applicantName: normalizedFormData.ownerName,
          });
          writtenStoragePaths.push(stored.storagePath);
          newDocumentsByName.set(entry.documentName.toLowerCase(), {
            documentName: entry.documentName,
            fileName: stored.fileName,
            storagePath: stored.storagePath,
            bucket: stored.bucket,
            filePath: stored.storagePath,
            originalName: entry.file.name || stored.fileName,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            fileSize: stored.sizeBytes,
          });
        }
      }

      return newDocumentsByName;
    };

    if (existing) {
      const updated = await prisma.$transaction(async (tx: any) => {
        const row = await tx.businessApplication.update({
          where: { id: existing.id },
          data: {
            applicationType: input.applicationType,
            businessRecordId: input.businessRecordId ?? null,
            closureType:
              input.applicationType === "CLOSURE" ? normalizeClosureType(input.closureType) : null,
            closureTypeOtherReason:
              input.applicationType === "CLOSURE"
                ? normalizeClosureType(input.closureType) === "OTHERS"
                  ? input.closureTypeOtherReason?.trim() || null
                  : null
                : null,
            status: nextStatus,
            formData: normalizedFormData,
            submittedAt: input.mode === "SUBMIT" ? new Date() : null,
          },
        });

        if (input.mode === "SUBMIT") {
          const newDocumentsByName = await buildNewDocumentsByName(existing.id);

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
                  bucket: doc.bucket,
                  filePath: doc.filePath,
                  originalName: doc.originalName,
                  mimeType: doc.mimeType,
                  sizeBytes: doc.sizeBytes,
                  fileSize: doc.fileSize,
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
                  bucket: doc.bucket,
                  filePath: doc.filePath,
                  originalName: doc.originalName,
                  mimeType: doc.mimeType,
                  sizeBytes: doc.sizeBytes,
                  fileSize: doc.fileSize,
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

      return mapSavedApplicationToRow({
        id: updated.id,
        applicationNumber: updated.applicationNumber,
        applicationType: input.applicationType,
        status: updated.status,
        submittedAt: updated.submittedAt,
        updatedAt: updated.updatedAt,
        formData: normalizedFormData,
      });
    }

    const applicationNumber = await generateApplicationNumber();

    const created = await prisma.$transaction(async (tx: any) => {
      const row = await tx.businessApplication.create({
        data: {
          applicationNumber,
          applicantId,
          businessRecordId: input.businessRecordId ?? null,
          applicationType: input.applicationType,
          closureType:
            input.applicationType === "CLOSURE" ? normalizeClosureType(input.closureType) : null,
          closureTypeOtherReason:
            input.applicationType === "CLOSURE"
              ? normalizeClosureType(input.closureType) === "OTHERS"
                ? input.closureTypeOtherReason?.trim() || null
                : null
              : null,
          status: nextStatus,
          formData: normalizedFormData,
          submittedAt: input.mode === "SUBMIT" ? new Date() : null,
        },
      });

      if (input.mode === "SUBMIT") {
          const newDocumentsByName = await buildNewDocumentsByName(row.id);

        for (const doc of newDocumentsByName.values()) {
          await tx.applicationDocument.create({
            data: {
              applicationId: row.id,
              documentName: doc.documentName,
              fileName: doc.fileName,
              storagePath: doc.storagePath,
              bucket: doc.bucket,
              filePath: doc.filePath,
              originalName: doc.originalName,
              mimeType: doc.mimeType,
              sizeBytes: doc.sizeBytes,
              fileSize: doc.fileSize,
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

    return mapSavedApplicationToRow({
      id: created.id,
      applicationNumber: created.applicationNumber,
      applicationType: input.applicationType,
      status: created.status,
      submittedAt: created.submittedAt,
      updatedAt: created.updatedAt,
      formData: normalizedFormData,
    });
  } catch (error) {
    for (const storagePath of writtenStoragePaths) {
      await removeApplicantDocument(storagePath);
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
    bucket?: string;
    filePath?: string;
    originalName?: string;
    mimeType: string;
    sizeBytes: number;
    fileSize?: number;
  }
) {
  const application = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      applicantId,
    },
  });

  if (!application) throw new Error("Application not found");
  if (!isEditableStatus(application.status)) {
    throw new Error("This application has already been submitted and is now locked for review.");
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
        bucket: input.bucket ?? resolveBucketByMimeType(input.mimeType),
        filePath: input.filePath ?? input.storagePath,
        originalName: input.originalName ?? input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        fileSize: input.fileSize ?? input.sizeBytes,
        uploadedAt: new Date(),
      },
    } as any);
    return updated;
  }

  const created = await prisma.applicationDocument.create({
    data: {
      applicationId,
      documentName: input.documentName,
      fileName: input.fileName,
      storagePath: input.storagePath,
      bucket: input.bucket ?? resolveBucketByMimeType(input.mimeType),
      filePath: input.filePath ?? input.storagePath,
      originalName: input.originalName ?? input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      fileSize: input.fileSize ?? input.sizeBytes,
    },
  } as any);

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
  if (!isEditableStatus(application.status)) {
    throw new Error("This application has already been submitted and is now locked for review.");
  }

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

// Map a DB application status to a NotificationType for the notification dropdown.
function dbStatusToNotificationType(
  dbStatus: string
): "APPLICATION_SUBMITTED" | "RETURNED_FOR_CORRECTION" | "APPROVED_FOR_PAYMENT" | "REJECTED" | "ASSESSMENT_GENERATED" | "PAYMENT_VERIFIED" | "PERMIT_RELEASED" | "CLOSURE_APPROVED" | "INSPECTION_RELATED" {
  switch (dbStatus) {
    case "SUBMITTED":
      return "APPLICATION_SUBMITTED";
    case "RETURNED_FOR_CORRECTION":
      return "RETURNED_FOR_CORRECTION";
    case "ASSESSED":
    case "APPROVED_FOR_PAYMENT":
      return "APPROVED_FOR_PAYMENT";
    case "REJECTED":
    case "REVOKED":
      return "REJECTED";
    case "PAID":
    case "FOR_RELEASE":
      return "PAYMENT_VERIFIED";
    case "RELEASED":
      return "PERMIT_RELEASED";
    default:
      return "APPLICATION_SUBMITTED";
  }
}

// Build a human-readable title and message for a history event.
function buildNotificationContent(
  dbStatus: string,
  applicationNumber: string,
  remarks: string | null
): { title: string; message: string } {
  const appNum = applicationNumber ?? "your application";
  switch (dbStatus) {
    case "SUBMITTED":
      return {
        title: "Application Submitted",
        message: `Your application ${appNum} has been successfully submitted for review.`,
      };
    case "RETURNED_FOR_CORRECTION":
      return {
        title: "Returned for Correction",
        message: remarks
          ? `Application ${appNum} was returned: ${remarks}`
          : `Application ${appNum} has been returned. Please review the remarks and resubmit.`,
      };
    case "ASSESSED":
      return {
        title: "Assessment Generated",
        message: `Fee assessment for application ${appNum} is now available for review.`,
      };
    case "APPROVED_FOR_PAYMENT":
      return {
        title: "Approved for Payment",
        message: `Application ${appNum} has been assessed. Please proceed to payment.`,
      };
    case "PAID":
      return {
        title: "Payment Verified",
        message: `Payment for application ${appNum} has been verified successfully.`,
      };
    case "FOR_RELEASE":
      return {
        title: "Ready for Release",
        message: `Your permit for application ${appNum} is being prepared for release.`,
      };
    case "RELEASED":
      return {
        title: "Permit Released",
        message: `Your business permit for application ${appNum} is now available for pickup.`,
      };
    case "REJECTED":
      return {
        title: "Application Rejected",
        message: remarks
          ? `Application ${appNum} was rejected: ${remarks}`
          : `Application ${appNum} has been rejected. Please contact BPLO for details.`,
      };
    case "REVOKED":
      return {
        title: "Permit Revoked",
        message: remarks
          ? `Permit for application ${appNum} was revoked: ${remarks}`
          : `Your business permit for application ${appNum} has been revoked.`,
      };
    case "UNDER_REVIEW":
    case "DEPARTMENT_HEAD_REVIEW":
    case "DEPARTMENT_HEAD_APPROVED":
    case "REVOCATION_REVIEW":
      return {
        title: "Application Under Review",
        message: `Application ${appNum} is currently being reviewed by the BPLO.`,
      };
    default:
      return {
        title: "Application Updated",
        message: `There has been an update to your application ${appNum}.`,
      };
  }
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
    app.history.map((item: any) => {
      const { title, message } = buildNotificationContent(
        item.toStatus,
        app.applicationNumber,
        item.remarks ?? null
      );
      return {
        id: item.id,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        type: dbStatusToNotificationType(item.toStatus),
        title,
        message,
        timestamp: item.createdAt.toISOString(),
        isRead: false,
      };
    })
  );

  return notifications.sort(
    (a: { timestamp: string }, b: { timestamp: string }) =>
      b.timestamp.localeCompare(a.timestamp)
  );
});

export async function listApplicantNotifications(applicantId: string) {
  return getCachedApplicantNotifications(applicantId);
}

export async function getApplicantTopSummary(applicantId: string) {
  // Fetch ALL applications for this applicant that have a GENERATED TOP (feeAssessment.status === "GENERATED").
  // This covers NEW, RENEWAL, and CLOSURE application types.
  // We do NOT filter on application status here so that the applicant can still see their TOP
  // after payment is verified and application moves to PAID / FOR_RELEASE / RELEASED.
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
        select: {
          id: true,
          assessmentNumber: true,
          status: true,
          paymentFrequency: true,
          annualAssessedAmount: true,
          releasePaymentAmount: true,
          amountPaid: true,
          remainingBalance: true,
          paymentStatus: true,
          mayorsPermitFee: true,
          regulatoryFees: true,
          additionalCharges: true,
          penalties: true,
          surcharge: true,
          interest: true,
          closureCertificateFee: true,
          arrears: true,
          otherCharges: true,
          closurePaymentDues: true,
          totalAmount: true,
          remarks: true,
          generatedAt: true,
          reassessmentRequestedAt: true,
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
      reassessmentRequestedAt: Date | null;
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
      reassessmentRequestedAt: fa?.reassessmentRequestedAt ? fa.reassessmentRequestedAt.toISOString() : null,
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

  // Priority for bestActiveSummary:
  // 1. APPROVED_FOR_PAYMENT app with no payment ref yet (applicant hasn't submitted OR)
  // 2. APPROVED_FOR_PAYMENT app with a REJECTED payment ref (needs resubmission)
  // 3. APPROVED_FOR_PAYMENT app with a PENDING payment ref (awaiting BPLO review)
  // 4. Any APPROVED_FOR_PAYMENT app (fallback)
  // 5. Any summary with the most recent activity (for post-payment visibility)
  //
  // This logic applies to ALL application types (NEW, RENEWAL, CLOSURE) equally.
  // CLOSURE apps that have a GENERATED TOP and are in APPROVED_FOR_PAYMENT will
  // match the same priority buckets as NEW/RENEWAL apps.
  const approvedSummaries = summaries.filter((s: { rawStatus: string }) => s.rawStatus === "APPROVED_FOR_PAYMENT");
  const bestActiveSummary =
    approvedSummaries.find((s: { paymentReference: { status?: string } | null }) => !s.paymentReference) ??
    approvedSummaries.find((s: { paymentReference: { status?: string } | null }) => s.paymentReference?.status === "REJECTED") ??
    approvedSummaries.find((s: { paymentReference: { status?: string } | null }) => s.paymentReference?.status === "PENDING") ??
    approvedSummaries[0] ??
    summaries[0];

  return {
    activeSummary: bestActiveSummary,
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
    proofBucket?: string;
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

  if (application.feeAssessment.reassessmentRequestedAt) {
    throw new Error(
      "Your assessment is under re-assessment request. Please wait for BPLO to review before submitting payment."
    );
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
        proofBucket: proof.proofBucket ?? resolveBucketByMimeType(proof.proofMimeType),
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
