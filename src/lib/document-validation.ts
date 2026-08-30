import type { DocumentValidationStatus as PrismaDocumentValidationStatus } from "@prisma/client";
import {
  getMissingRequiredDocuments,
  normalizeDocumentName,
  resolveRequiredDocuments,
} from "@/lib/required-documents";
import type { ApplicationType, BusinessInfo } from "@/lib/applicant-types";

export type DocumentValidationUiStatus =
  | "Pending Review"
  | "Valid"
  | "Invalid"
  | "Incomplete"
  | "Requires Resubmission";

export const DOCUMENT_VALIDATION_UI_STATUSES: DocumentValidationUiStatus[] = [
  "Pending Review",
  "Valid",
  "Invalid",
  "Incomplete",
  "Requires Resubmission",
];

const DB_TO_UI: Record<PrismaDocumentValidationStatus, DocumentValidationUiStatus> = {
  PENDING_REVIEW: "Pending Review",
  VALID: "Valid",
  INVALID: "Invalid",
  INCOMPLETE: "Incomplete",
  REQUIRES_RESUBMISSION: "Requires Resubmission",
};

const UI_TO_DB: Record<DocumentValidationUiStatus, PrismaDocumentValidationStatus> = {
  "Pending Review": "PENDING_REVIEW",
  Valid: "VALID",
  Invalid: "INVALID",
  Incomplete: "INCOMPLETE",
  "Requires Resubmission": "REQUIRES_RESUBMISSION",
};

export function mapDocumentValidationStatusToUi(
  status: PrismaDocumentValidationStatus | string | null | undefined
): DocumentValidationUiStatus {
  if (!status) return "Pending Review";
  const key = status as PrismaDocumentValidationStatus;
  return DB_TO_UI[key] ?? "Pending Review";
}

export function mapDocumentValidationStatusToDb(
  status: DocumentValidationUiStatus | string
): PrismaDocumentValidationStatus {
  const normalized = status.trim();
  if (UI_TO_DB[normalized as DocumentValidationUiStatus]) {
    return UI_TO_DB[normalized as DocumentValidationUiStatus];
  }
  if (DB_TO_UI[normalized as PrismaDocumentValidationStatus]) {
    return normalized as PrismaDocumentValidationStatus;
  }
  throw new Error("Invalid document validation status");
}

export function remarksRequiredForValidationStatus(
  status: PrismaDocumentValidationStatus | DocumentValidationUiStatus
): boolean {
  const ui =
    typeof status === "string" && status.includes(" ")
      ? (status as DocumentValidationUiStatus)
      : mapDocumentValidationStatusToUi(status as PrismaDocumentValidationStatus);
  return ui === "Invalid" || ui === "Incomplete" || ui === "Requires Resubmission";
}

export function isDocumentApprovalReady(
  status: PrismaDocumentValidationStatus | DocumentValidationUiStatus | null | undefined
): boolean {
  if (!status) return false;
  if (status === "Valid" || status === "VALID") return true;
  const ui =
    typeof status === "string" && status.includes(" ")
      ? (status as DocumentValidationUiStatus)
      : mapDocumentValidationStatusToUi(status as PrismaDocumentValidationStatus);
  return ui === "Valid";
}

export interface DocumentValidationBlocker {
  documentName: string;
  validationStatus: DocumentValidationUiStatus;
  validationRemarks: string | null;
  reason: "missing" | "not_valid";
}

export interface RequiredDocumentsValidationResult {
  ready: boolean;
  blockers: DocumentValidationBlocker[];
}

export function evaluateRequiredDocumentsValidation(input: {
  applicationType: ApplicationType;
  formData: BusinessInfo;
  documents: Array<{
    documentName: string;
    validationStatus: PrismaDocumentValidationStatus;
    validationRemarks?: string | null;
  }>;
}): RequiredDocumentsValidationResult {
  const required = resolveRequiredDocuments({
    applicationType: input.applicationType,
    formData: input.formData,
  });

  const uploadedByName = new Map(
    input.documents.map((doc) => [normalizeDocumentName(doc.documentName), doc])
  );

  const missing = getMissingRequiredDocuments(
    required,
    input.documents.map((doc) => doc.documentName)
  );

  const blockers: DocumentValidationBlocker[] = missing.map((documentName) => ({
    documentName,
    validationStatus: "Pending Review",
    validationRemarks: null,
    reason: "missing",
  }));

  for (const requiredName of required) {
    const doc = uploadedByName.get(normalizeDocumentName(requiredName));
    if (!doc) continue;
    if (!isDocumentApprovalReady(doc.validationStatus)) {
      blockers.push({
        documentName: requiredName,
        validationStatus: mapDocumentValidationStatusToUi(doc.validationStatus),
        validationRemarks: doc.validationRemarks ?? null,
        reason: "not_valid",
      });
    }
  }

  const uniqueBlockers = Array.from(
    new Map(blockers.map((item) => [normalizeDocumentName(item.documentName), item])).values()
  );

  return {
    ready: uniqueBlockers.length === 0,
    blockers: uniqueBlockers,
  };
}

export function validationStatusBadgeClass(status: DocumentValidationUiStatus): string {
  switch (status) {
    case "Valid":
      return "ui-badge border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]";
    case "Invalid":
      return "ui-badge border-[var(--border-color)] bg-[var(--danger-soft)] text-[var(--danger)]";
    case "Incomplete":
      return "ui-badge border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]";
    case "Requires Resubmission":
      return "ui-badge border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--warning)]";
    default:
      return "ui-badge border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]";
  }
}
