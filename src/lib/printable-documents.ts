import { prisma } from "@/lib/prisma";
import { toMoneyNumber } from "@/lib/money";

export type PrintableDocumentType = "BUSINESS_PERMIT" | "BUSINESS_CLOSURE_CERTIFICATE";

export type ApplicationTypeForPrint = "NEW" | "RENEWAL" | "CLOSURE";

export type ApplicationStatusForPrint =
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

export type PermitIssuanceStatusForPrint = "PREPARED" | "FOR_RELEASE" | "RELEASED";

export interface PrintablePermitIssuanceSnapshot {
  id?: string | null;
  documentNumber?: string | null;
  documentPath?: string | null;
  status?: PermitIssuanceStatusForPrint | null;
}

export interface PrintablePaymentSnapshot {
  // At least one verified payment reference exists.
  hasVerifiedPaymentReference: boolean;
}

export interface PrintableDocumentApplication {
  id: string;
  applicantId: string;
  applicationType: ApplicationTypeForPrint;
  status: ApplicationStatusForPrint;
  permitIssuance?: PrintablePermitIssuanceSnapshot | null;
  payment?: PrintablePaymentSnapshot | null;
}

export interface BploPrintableEligibility {
  canPrint: boolean;
  reasons: string[];
  documentType: PrintableDocumentType;
}

export interface ApplicantPrintableEligibility {
  canPrint: boolean;
  reasons: string[];
  documentType: PrintableDocumentType;
}

export interface BusinessPermitPrintData {
  heading: {
    republic: string;
    province: string;
    municipality: string;
    office: string;
    title: string;
  };
  permitNumber: string;
  applicationNumber: string;
  taxYear: string;
  dateIssued: string | null;
  validUntil: string | null;
  businessName: string;
  tradeName: string;
  ownerOrPresident: string;
  businessType: string;
  registrationNumber: string;
  tin: string;
  businessAddress: string;
  natureOfBusiness: string;
  topNumber: string;
  orNumber: string;
  datePaid: string | null;
  annualAmountPaid: number;
  signatories: {
    bploOfficer: string;
    municipalTreasurer: string;
    mayor: string;
  };
  verificationPlaceholder: string;
  legalNote: string;
}

export type BusinessPermitPrintAccessResult =
  | { ok: true; permit: BusinessPermitPrintData }
  | { ok: false; status: 403 | 404; error: string };

export interface ClosureCertificatePrintData {
  heading: {
    republic: string;
    province: string;
    municipality: string;
    office: string;
    title: string;
  };
  certificateNumber: string;
  applicationNumber: string;
  dateIssued: string | null;
  effectiveClosureDate: string | null;
  businessName: string;
  tradeName: string;
  ownerOrPresident: string;
  businessType: string;
  registrationNumber: string;
  tin: string;
  businessAddress: string;
  reasonForClosure: string;
  topNumber: string;
  orNumber: string;
  datePaid: string | null;
  closureCertificateFee: number;
  paymentDuesPendingFee: number;
  totalPaid: number;
  certificationStatement: string;
  signatories: {
    bploOfficer: string;
    municipalTreasurerOrAuthorizedOfficer: string;
  };
  verificationPlaceholder: string;
}

export type ClosureCertificatePrintAccessResult =
  | { ok: true; certificate: ClosureCertificatePrintData }
  | { ok: false; status: 403 | 404; error: string };

function hasIssuanceRecord(application: PrintableDocumentApplication): boolean {
  return Boolean(application.permitIssuance?.id);
}

function isDocumentReleaseReady(application: PrintableDocumentApplication): boolean {
  if (application.status !== "FOR_RELEASE" && application.status !== "RELEASED") {
    return false;
  }

  const issuanceStatus = application.permitIssuance?.status;
  return issuanceStatus === "FOR_RELEASE" || issuanceStatus === "RELEASED";
}

function readText(formData: unknown, key: string, fallback = "-"): string {
  const record = (formData ?? {}) as Record<string, unknown>;
  const value = record[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function toIsoOrNull(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toYear(value: Date | null | undefined): string {
  const year = value ? value.getFullYear() : new Date().getFullYear();
  return String(year);
}

function toPermitExpiry(value: Date | null | undefined): string | null {
  if (!value) return null;
  return new Date(Date.UTC(value.getUTCFullYear(), 11, 31, 23, 59, 59, 999)).toISOString();
}

function toPrintableSnapshot(app: {
  id: string;
  applicantId: string;
  applicationType: ApplicationTypeForPrint;
  status: ApplicationStatusForPrint;
  permitIssuance: {
    id: string;
    documentNumber: string;
    documentPath: string | null;
    status: PermitIssuanceStatusForPrint;
  } | null;
  paymentReferences: Array<{ id: string }>;
}): PrintableDocumentApplication {
  return {
    id: app.id,
    applicantId: app.applicantId,
    applicationType: app.applicationType,
    status: app.status,
    permitIssuance: app.permitIssuance
      ? {
          id: app.permitIssuance.id,
          documentNumber: app.permitIssuance.documentNumber,
          documentPath: app.permitIssuance.documentPath,
          status: app.permitIssuance.status,
        }
      : null,
    payment: {
      hasVerifiedPaymentReference: app.paymentReferences.length > 0,
    },
  };
}

function toBusinessPermitPrintData(app: {
  applicationNumber: string;
  formData: unknown;
  permitIssuance: {
    documentNumber: string;
    issuedAt: Date;
  } | null;
  feeAssessment: {
    assessmentNumber: string;
    annualAssessedAmount: any;
  } | null;
  paymentReferences: Array<{
    transactionNumber: string;
    paymentDate: Date;
  }>;
}): BusinessPermitPrintData {
  const issuedAt = app.permitIssuance?.issuedAt ?? null;
  const formData = app.formData;

  return {
    heading: {
      republic: "Republic of the Philippines",
      province: readText(formData, "province", "Province"),
      municipality: readText(formData, "cityMunicipality", "Municipality"),
      office: "Office of the Mayor",
      title: "MAYOR'S / BUSINESS PERMIT",
    },
    permitNumber: app.permitIssuance?.documentNumber ?? "-",
    applicationNumber: app.applicationNumber,
    taxYear: toYear(issuedAt),
    dateIssued: toIsoOrNull(issuedAt),
    validUntil: toPermitExpiry(issuedAt),
    businessName: readText(formData, "businessName"),
    tradeName: readText(formData, "tradeName"),
    ownerOrPresident: readText(formData, "ownerName"),
    businessType: readText(formData, "businessType"),
    registrationNumber: readText(formData, "registrationNumber"),
    tin: readText(formData, "tin"),
    businessAddress: readText(formData, "businessAddress"),
    natureOfBusiness: readText(formData, "lineOfBusiness", readText(formData, "businessActivity")),
    topNumber: app.feeAssessment?.assessmentNumber ?? "-",
    orNumber: app.paymentReferences[0]?.transactionNumber ?? "-",
    datePaid: toIsoOrNull(app.paymentReferences[0]?.paymentDate),
    annualAmountPaid: toMoneyNumber(app.feeAssessment?.annualAssessedAmount),
    signatories: {
      bploOfficer: "BPLO Officer",
      municipalTreasurer: "Municipal Treasurer",
      mayor: "Mayor",
    },
    verificationPlaceholder: "Verification QR placeholder",
    legalNote: "This permit must be displayed conspicuously at the place of business.",
  };
}

function toClosureReason(formData: unknown): string {
  const reasonKeys = ["closureReason", "reasonForClosure", "closureRemarks", "remarks"];
  for (const key of reasonKeys) {
    const value = readText(formData, key, "");
    if (value) return value;
  }
  return "-";
}

function toClosureCertificatePrintData(app: {
  applicationNumber: string;
  formData: unknown;
  permitIssuance: {
    documentNumber: string;
    issuedAt: Date;
  } | null;
  businessRecord: {
    closedAt: Date | null;
  } | null;
  feeAssessment: {
    assessmentNumber: string;
    releasePaymentAmount: any;
    remainingBalance: any;
    amountPaid: any;
  } | null;
  paymentReferences: Array<{
    transactionNumber: string;
    paymentDate: Date;
  }>;
}): ClosureCertificatePrintData {
  const formData = app.formData;

  return {
    heading: {
      republic: "Republic of the Philippines",
      province: readText(formData, "province", "Province"),
      municipality: readText(formData, "cityMunicipality", "Municipality"),
      office: "Business Permits and Licensing Office",
      title: "BUSINESS CLOSURE CERTIFICATE",
    },
    certificateNumber: app.permitIssuance?.documentNumber ?? "-",
    applicationNumber: app.applicationNumber,
    dateIssued: toIsoOrNull(app.permitIssuance?.issuedAt),
    effectiveClosureDate: toIsoOrNull(app.businessRecord?.closedAt),
    businessName: readText(formData, "businessName"),
    tradeName: readText(formData, "tradeName"),
    ownerOrPresident: readText(formData, "ownerName"),
    businessType: readText(formData, "businessType"),
    registrationNumber: readText(formData, "registrationNumber"),
    tin: readText(formData, "tin"),
    businessAddress: readText(formData, "businessAddress"),
    reasonForClosure: toClosureReason(formData),
    topNumber: app.feeAssessment?.assessmentNumber ?? "-",
    orNumber: app.paymentReferences[0]?.transactionNumber ?? "-",
    datePaid: toIsoOrNull(app.paymentReferences[0]?.paymentDate),
    closureCertificateFee: toMoneyNumber(app.feeAssessment?.releasePaymentAmount),
    paymentDuesPendingFee: toMoneyNumber(app.feeAssessment?.remainingBalance),
    totalPaid: toMoneyNumber(app.feeAssessment?.amountPaid),
    certificationStatement:
      "This certifies that the business has completed the required closure processing and has been officially recorded as closed/ceased operation.",
    signatories: {
      bploOfficer: "BPLO Officer",
      municipalTreasurerOrAuthorizedOfficer: "Municipal Treasurer / Authorized Officer",
    },
    verificationPlaceholder: "Verification QR placeholder",
  };
}

async function findApplicationForPrint(
  applicationId: string,
  applicantId?: string
): Promise<{
  id: string;
  applicantId: string;
  applicationNumber: string;
  applicationType: ApplicationTypeForPrint;
  status: ApplicationStatusForPrint;
  formData: unknown;
  feeAssessment: {
    assessmentNumber: string;
    annualAssessedAmount: any;
    releasePaymentAmount: any;
    remainingBalance: any;
    amountPaid: any;
  } | null;
  businessRecord: { closedAt: Date | null } | null;
  permitIssuance: {
    id: string;
    documentNumber: string;
    documentPath: string | null;
    status: PermitIssuanceStatusForPrint;
    issuedAt: Date;
  } | null;
  paymentReferences: Array<{
    id: string;
    transactionNumber: string;
    paymentDate: Date;
  }>;
} | null> {
  return prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
      ...(applicantId ? { applicantId } : {}),
    },
    select: {
      id: true,
      applicantId: true,
      applicationNumber: true,
      applicationType: true,
      status: true,
      formData: true,
      feeAssessment: {
        select: {
          assessmentNumber: true,
          annualAssessedAmount: true,
          releasePaymentAmount: true,
          remainingBalance: true,
          amountPaid: true,
        },
      },
      businessRecord: {
        select: {
          closedAt: true,
        },
      },
      permitIssuance: {
        select: {
          id: true,
          documentNumber: true,
          documentPath: true,
          status: true,
          issuedAt: true,
        },
      },
      paymentReferences: {
        where: { status: "VERIFIED" },
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: {
          id: true,
          transactionNumber: true,
          paymentDate: true,
        },
      },
    },
  }) as Promise<{
    id: string;
    applicantId: string;
    applicationNumber: string;
    applicationType: ApplicationTypeForPrint;
    status: ApplicationStatusForPrint;
    formData: unknown;
    feeAssessment: {
      assessmentNumber: string;
      annualAssessedAmount: any;
      releasePaymentAmount: unknown;
      remainingBalance: unknown;
      amountPaid: unknown;
    } | null;
    businessRecord: { closedAt: Date | null } | null;
    permitIssuance: {
      id: string;
      documentNumber: string;
      documentPath: string | null;
      status: PermitIssuanceStatusForPrint;
      issuedAt: Date;
    } | null;
    paymentReferences: Array<{
      id: string;
      transactionNumber: string;
      paymentDate: Date;
    }>;
  } | null>;
}

export function getPrintableDocumentType(
  applicationType: ApplicationTypeForPrint
): PrintableDocumentType {
  if (applicationType === "CLOSURE") {
    return "BUSINESS_CLOSURE_CERTIFICATE";
  }

  return "BUSINESS_PERMIT";
}

export function canBploPrintDocument(
  application: PrintableDocumentApplication
): BploPrintableEligibility {
  const reasons: string[] = [];
  const documentType = getPrintableDocumentType(application.applicationType);

  if (application.status !== "FOR_RELEASE" && application.status !== "RELEASED") {
    reasons.push("Application must be FOR_RELEASE or RELEASED.");
  }

  if (!application.payment?.hasVerifiedPaymentReference) {
    reasons.push("Verified payment is required before document printing.");
  }

  if (!hasIssuanceRecord(application) && !isDocumentReleaseReady(application)) {
    reasons.push("Permit issuance record must exist or be release-ready.");
  }

  return {
    canPrint: reasons.length === 0,
    reasons,
    documentType,
  };
}

export function canApplicantPrintDocument(
  application: PrintableDocumentApplication,
  currentApplicantId: string
): ApplicantPrintableEligibility {
  const reasons: string[] = [];
  const documentType = getPrintableDocumentType(application.applicationType);

  if (application.applicantId !== currentApplicantId) {
    reasons.push("Document does not belong to the current applicant.");
  }

  if (application.status !== "RELEASED") {
    reasons.push("Application must be RELEASED for applicant printing.");
  }

  if (!hasIssuanceRecord(application)) {
    reasons.push("Permit issuance record is required for applicant printing.");
  }

  if (!application.payment?.hasVerifiedPaymentReference) {
    reasons.push("Verified payment is required before applicant printing.");
  }

  return {
    canPrint: reasons.length === 0,
    reasons,
    documentType,
  };
}

export async function getBploBusinessPermitPrintAccess(
  applicationId: string
): Promise<BusinessPermitPrintAccessResult> {
  const app = await findApplicationForPrint(applicationId);
  if (!app) {
    return { ok: false, status: 404, error: "Application not found" };
  }

  const snapshot = toPrintableSnapshot(app);
  const eligibility = canBploPrintDocument(snapshot);

  if (eligibility.documentType !== "BUSINESS_PERMIT") {
    return {
      ok: false,
      status: 403,
      error: "Closure applications cannot print a Business Permit.",
    };
  }

  if (!eligibility.canPrint) {
    return {
      ok: false,
      status: 403,
      error: eligibility.reasons.join(" "),
    };
  }

  return {
    ok: true,
    permit: toBusinessPermitPrintData(app),
  };
}

export async function getApplicantBusinessPermitPrintAccess(
  applicationId: string,
  applicantId: string
): Promise<BusinessPermitPrintAccessResult> {
  const app = await findApplicationForPrint(applicationId, applicantId);
  if (!app) {
    return { ok: false, status: 404, error: "Permit not found" };
  }

  const snapshot = toPrintableSnapshot(app);
  const eligibility = canApplicantPrintDocument(snapshot, applicantId);

  if (eligibility.documentType !== "BUSINESS_PERMIT") {
    return {
      ok: false,
      status: 403,
      error: "Closure applications cannot print a Business Permit.",
    };
  }

  if (!eligibility.canPrint) {
    return {
      ok: false,
      status: 403,
      error: eligibility.reasons.join(" "),
    };
  }

  return {
    ok: true,
    permit: toBusinessPermitPrintData(app),
  };
}

export async function getBploClosureCertificatePrintAccess(
  applicationId: string
): Promise<ClosureCertificatePrintAccessResult> {
  const app = await findApplicationForPrint(applicationId);
  if (!app) {
    return { ok: false, status: 404, error: "Application not found" };
  }

  const snapshot = toPrintableSnapshot(app);
  const eligibility = canBploPrintDocument(snapshot);

  if (eligibility.documentType !== "BUSINESS_CLOSURE_CERTIFICATE") {
    return {
      ok: false,
      status: 403,
      error: "New and renewal applications cannot print a Business Closure Certificate.",
    };
  }

  if (!eligibility.canPrint) {
    return {
      ok: false,
      status: 403,
      error: eligibility.reasons.join(" "),
    };
  }

  return {
    ok: true,
    certificate: toClosureCertificatePrintData(app),
  };
}

export async function getApplicantClosureCertificatePrintAccess(
  applicationId: string,
  applicantId: string
): Promise<ClosureCertificatePrintAccessResult> {
  const app = await findApplicationForPrint(applicationId, applicantId);
  if (!app) {
    return { ok: false, status: 404, error: "Closure certificate not found" };
  }

  const snapshot = toPrintableSnapshot(app);
  const eligibility = canApplicantPrintDocument(snapshot, applicantId);

  if (eligibility.documentType !== "BUSINESS_CLOSURE_CERTIFICATE") {
    return {
      ok: false,
      status: 403,
      error: "New and renewal applications cannot print a Business Closure Certificate.",
    };
  }

  if (!eligibility.canPrint) {
    return {
      ok: false,
      status: 403,
      error: eligibility.reasons.join(" "),
    };
  }

  return {
    ok: true,
    certificate: toClosureCertificatePrintData(app),
  };
}
