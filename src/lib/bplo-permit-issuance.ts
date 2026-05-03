import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import { getPaymentReferencesFromFormData } from "@/lib/payment-reference";

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

type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";

export type IssuanceDocumentType = "BUSINESS_PERMIT" | "CLOSURE_CERTIFICATE";

export interface PermitIssuanceRow {
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicationType: ApplicationType;
  topNumber: string | null;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED" | null;
  datePaid: string | null;
  documentNumber: string | null;
  preparedDate: string | null;
  releasedDate: string | null;
  releasedBy: string | null;
  currentStatus: string;
}

export interface PermitIssuanceLists {
  paid: PermitIssuanceRow[];
  forRelease: PermitIssuanceRow[];
  released: PermitIssuanceRow[];
}

export interface PermitIssuanceDetail {
  application: {
    id: string;
    applicationNumber: string;
    applicationType: ApplicationType;
    status: string;
    rawStatus: DbApplicationStatus;
    applicantName: string;
    applicantEmail: string;
    businessName: string;
  };
  businessInfo: {
    businessType: string;
    registrationNumber: string;
    tin: string;
    businessName: string;
    tradeName: string;
    ownerName: string;
    businessAddress: string;
  };
  paymentSummary: {
    topNumber: string | null;
    totalAmountPaid: number;
    paymentReferenceNumber: string | null;
    paymentVerificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | null;
  };
  preview: {
    title: string;
    subtitle: string;
  };
  issuance: {
    id: string | null;
    documentType: IssuanceDocumentType | null;
    documentNumber: string | null;
    issueDate: string | null;
    validityPeriod: string | null;
    preparedBy: string | null;
    releasedDate: string | null;
    releasedBy: string | null;
    status: "PREPARED" | "FOR_RELEASE" | "RELEASED" | null;
    remarks: string | null;
  };
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const maybe = (formData ?? {}) as Record<string, unknown>;
  const fromForm =
    typeof maybe.businessName === "string" && maybe.businessName.trim()
      ? maybe.businessName.trim()
      : null;
  return fromForm ?? fallback ?? "-";
}

function resolveFormValue(formData: unknown, key: string): string {
  const maybe = (formData ?? {}) as Record<string, unknown>;
  const value = maybe[key];
  return typeof value === "string" && value.trim() ? value.trim() : "-";
}

function dateIsoOrNull(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function resolveDocumentType(applicationType: ApplicationType): IssuanceDocumentType {
  return applicationType === "CLOSURE" ? "CLOSURE_CERTIFICATE" : "BUSINESS_PERMIT";
}

async function generateDocumentNumber(
  dbClient: any,
  documentType: IssuanceDocumentType
): Promise<string> {
  const prefix = documentType === "CLOSURE_CERTIFICATE" ? "CC" : "BP";
  const year = new Date().getFullYear();
  const count = await dbClient.permitIssuance.count({
    where: {
      documentType,
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });
  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}-${year}-${seq}`;
}

function findPaidDate(history: Array<{ toStatus: DbApplicationStatus; createdAt: Date }>): string | null {
  const paid = history
    .slice()
    .reverse()
    .find((item) => item.toStatus === "PAID");
  return paid ? paid.createdAt.toISOString() : null;
}

function toListRow(app: any): PermitIssuanceRow {
  const refs = getPaymentReferencesFromFormData(app.formData, app.id, app.status);
  const latestRef = refs.length > 0 ? refs[refs.length - 1] : null;

  return {
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    businessName: resolveBusinessName(app.formData, app.businessRecord?.businessName ?? null),
    applicantName: app.applicant.name,
    applicantEmail: app.applicant.email,
    applicationType: app.applicationType,
    topNumber: app.feeAssessment?.assessmentNumber ?? null,
    paymentStatus: latestRef?.status ?? null,
    datePaid: findPaidDate(app.history),
    documentNumber: app.permitIssuance?.documentNumber ?? null,
    preparedDate: dateIsoOrNull(app.permitIssuance?.issuedAt),
    releasedDate: dateIsoOrNull(app.permitIssuance?.releasedAt),
    releasedBy: app.permitIssuance?.releasedBy?.name ?? null,
    currentStatus: mapDbStatusToUi(app.status),
  };
}

export async function listPermitIssuanceEntries(): Promise<PermitIssuanceLists> {
  const rows = await prisma.businessApplication.findMany({
    where: {
      status: {
        in: ["PAID", "FOR_RELEASE", "RELEASED"],
      },
    },
    include: {
      applicant: { select: { name: true, email: true } },
      businessRecord: { select: { businessName: true } },
      feeAssessment: { select: { assessmentNumber: true } },
      history: { select: { toStatus: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      permitIssuance: {
        include: {
          releasedBy: { select: { name: true } },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return {
    paid: rows
      .filter((row: { status: DbApplicationStatus }) => row.status === "PAID")
      .map(toListRow),
    forRelease: rows
      .filter((row: { status: DbApplicationStatus }) => row.status === "FOR_RELEASE")
      .map(toListRow),
    released: rows
      .filter((row: { status: DbApplicationStatus }) => row.status === "RELEASED")
      .map(toListRow),
  };
}

export async function getPermitIssuanceDetail(applicationId: string): Promise<PermitIssuanceDetail | null> {
  const app = await prisma.businessApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: { select: { name: true, email: true } },
      businessRecord: { select: { businessName: true } },
      feeAssessment: { select: { assessmentNumber: true, totalAmount: true } },
      permitIssuance: {
        include: {
          preparedBy: { select: { name: true } },
          releasedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!app) return null;

  const refs = getPaymentReferencesFromFormData(app.formData, app.id, app.status);
  const latestRef = refs.length > 0 ? refs[refs.length - 1] : null;
  const docType = resolveDocumentType(app.applicationType as ApplicationType);

  return {
    application: {
      id: app.id,
      applicationNumber: app.applicationNumber,
      applicationType: app.applicationType as ApplicationType,
      status: mapDbStatusToUi(app.status),
      rawStatus: app.status as DbApplicationStatus,
      applicantName: app.applicant.name,
      applicantEmail: app.applicant.email,
      businessName: resolveBusinessName(app.formData, app.businessRecord?.businessName ?? null),
    },
    businessInfo: {
      businessType: resolveFormValue(app.formData, "businessType"),
      registrationNumber: resolveFormValue(app.formData, "registrationNumber"),
      tin: resolveFormValue(app.formData, "tin"),
      businessName: resolveFormValue(app.formData, "businessName"),
      tradeName: resolveFormValue(app.formData, "tradeName"),
      ownerName: resolveFormValue(app.formData, "ownerName"),
      businessAddress: resolveFormValue(app.formData, "businessAddress"),
    },
    paymentSummary: {
      topNumber: app.feeAssessment?.assessmentNumber ?? null,
      totalAmountPaid: latestRef?.amountPaid ?? app.feeAssessment?.totalAmount ?? 0,
      paymentReferenceNumber: latestRef?.transactionNumber ?? null,
      paymentVerificationStatus: latestRef?.status ?? null,
    },
    preview: {
      title: docType === "CLOSURE_CERTIFICATE" ? "Closure Certificate Preview" : "Business Permit Preview",
      subtitle:
        docType === "CLOSURE_CERTIFICATE"
          ? "Current closure certificate output view"
          : "Current business permit output view",
    },
    issuance: {
      id: app.permitIssuance?.id ?? null,
      documentType: (app.permitIssuance?.documentType as IssuanceDocumentType | undefined) ?? null,
      documentNumber: app.permitIssuance?.documentNumber ?? null,
      issueDate: dateIsoOrNull(app.permitIssuance?.issuedAt),
      validityPeriod:
        app.applicationType === "CLOSURE"
          ? null
          : app.permitIssuance?.issuedAt
            ? `Valid until December 31, ${new Date(app.permitIssuance.issuedAt).getFullYear()}`
            : null,
      preparedBy: app.permitIssuance?.preparedBy?.name ?? null,
      releasedDate: dateIsoOrNull(app.permitIssuance?.releasedAt),
      releasedBy: app.permitIssuance?.releasedBy?.name ?? null,
      status: app.permitIssuance?.status ?? null,
      remarks: app.permitIssuance?.remarks ?? null,
    },
  };
}

async function upsertBusinessRecordOnRelease(tx: any, app: any) {
  if (app.applicationType === "CLOSURE") {
    // TODO: No "closed" status field exists in BusinessRecord schema yet.
    return;
  }

  const form = (app.formData ?? {}) as Record<string, unknown>;
  const registrationNumber =
    typeof form.registrationNumber === "string" ? form.registrationNumber.trim() : "";

  const payload = {
    applicantId: app.applicantId,
    businessType: typeof form.businessType === "string" ? form.businessType : "Sole Proprietorship",
    registrationNumber: registrationNumber || `REG-${app.applicationNumber}`,
    tin: typeof form.tin === "string" ? form.tin : "-",
    businessName: typeof form.businessName === "string" ? form.businessName : "-",
    tradeName: typeof form.tradeName === "string" ? form.tradeName : "-",
    ownerName: typeof form.ownerName === "string" ? form.ownerName : "-",
    nationality: typeof form.nationality === "string" ? form.nationality : "Filipino",
    email: typeof form.email === "string" ? form.email : app.applicant.email,
    phone: typeof form.phone === "string" ? form.phone : "-",
    mainOfficeAddress:
      typeof form.mainOfficeAddress === "string" ? form.mainOfficeAddress : "-",
    businessAddress: typeof form.businessAddress === "string" ? form.businessAddress : "-",
    sameAsMainOffice:
      typeof form.sameAsMainOffice === "boolean" ? form.sameAsMainOffice : true,
    businessArea: typeof form.businessArea === "string" ? form.businessArea : null,
    totalFloorArea:
      typeof form.totalFloorArea === "string" ? form.totalFloorArea : null,
    totalEmployees:
      typeof form.totalEmployees === "string" ? form.totalEmployees : null,
    maleEmployees:
      typeof form.maleEmployees === "string" ? form.maleEmployees : null,
    femaleEmployees:
      typeof form.femaleEmployees === "string" ? form.femaleEmployees : null,
    employeesWithinMunicipality:
      typeof form.employeesWithinMunicipality === "string"
        ? form.employeesWithinMunicipality
        : null,
    deliveryVehicles:
      typeof form.deliveryVehicles === "string" ? form.deliveryVehicles : null,
    propertyOwnership:
      typeof form.propertyOwnership === "string" ? form.propertyOwnership : null,
    taxDeclarationNumber:
      typeof form.taxDeclarationNumber === "string" ? form.taxDeclarationNumber : null,
    propertyIdentificationNumber:
      typeof form.propertyIdentificationNumber === "string"
        ? form.propertyIdentificationNumber
        : null,
    taxIncentives:
      typeof form.taxIncentives === "string" ? form.taxIncentives : null,
    businessActivity:
      typeof form.businessActivity === "string" ? form.businessActivity : null,
    lineOfBusiness:
      typeof form.lineOfBusiness === "string" ? form.lineOfBusiness : null,
    assetSize: typeof form.assetSize === "string" ? form.assetSize : null,
  };

  if (app.businessRecordId) {
    await tx.businessRecord.update({
      where: { id: app.businessRecordId },
      data: payload,
    });
    return;
  }

  const record = await tx.businessRecord.upsert({
    where: { registrationNumber: payload.registrationNumber },
    create: payload,
    update: payload,
    select: { id: true },
  });

  await tx.businessApplication.update({
    where: { id: app.id },
    data: { businessRecordId: record.id },
  });
}

export async function preparePermitIssuance(
  applicationId: string,
  bploUserId: string,
  remarks?: string
) {
  return prisma.$transaction(async (tx: any) => {
    const app = await tx.businessApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { email: true } },
        permitIssuance: true,
      },
    });

    if (!app) throw new Error("Application not found");
    if (app.status !== "PAID") {
      throw new Error("Only PAID applications can be prepared for release");
    }

    const refs = getPaymentReferencesFromFormData(app.formData, app.id, app.status);
    const latestRef = refs.length > 0 ? refs[refs.length - 1] : null;
    if (!latestRef || latestRef.status !== "VERIFIED") {
      throw new Error("Application payment reference must be VERIFIED before permit preparation");
    }

    const documentType = resolveDocumentType(app.applicationType as ApplicationType);
    const documentNumber = app.permitIssuance?.documentNumber
      ? app.permitIssuance.documentNumber
      : await generateDocumentNumber(tx, documentType);

    const issuance = await tx.permitIssuance.upsert({
      where: { applicationId },
      create: {
        applicationId,
        documentNumber,
        documentType,
        status: "FOR_RELEASE",
        issuedAt: new Date(),
        preparedById: bploUserId,
        remarks: remarks?.trim() || null,
      },
      update: {
        documentType,
        documentNumber,
        status: "FOR_RELEASE",
        issuedAt: app.permitIssuance?.issuedAt ?? new Date(),
        preparedById: app.permitIssuance?.preparedById ?? bploUserId,
        remarks: remarks?.trim() || app.permitIssuance?.remarks || null,
      },
    });

    await tx.businessApplication.update({
      where: { id: applicationId },
      data: { status: "FOR_RELEASE" },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "PAID",
        toStatus: "FOR_RELEASE",
        remarks:
          `Prepared ${documentType === "CLOSURE_CERTIFICATE" ? "Closure Certificate" : "Business Permit"}` +
          ` (${documentNumber}) for release.${remarks?.trim() ? ` Remarks: ${remarks.trim()}` : ""}`,
      },
    });

    return {
      applicationId,
      documentNumber: issuance.documentNumber,
      documentType: issuance.documentType as IssuanceDocumentType,
      status: issuance.status,
      newApplicationStatus: "FOR_RELEASE" as const,
    };
  });
}

export async function releasePermitIssuance(
  applicationId: string,
  bploUserId: string,
  remarks?: string
) {
  return prisma.$transaction(async (tx: any) => {
    const app = await tx.businessApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { select: { email: true } },
        permitIssuance: true,
      },
    });

    if (!app) throw new Error("Application not found");
    if (app.status !== "FOR_RELEASE") {
      throw new Error("Only FOR_RELEASE applications can be marked as released");
    }
    if (!app.permitIssuance) {
      throw new Error("Permit issuance record not found");
    }

    await tx.permitIssuance.update({
      where: { applicationId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        releasedById: bploUserId,
        remarks: remarks?.trim() || app.permitIssuance.remarks || null,
      },
    });

    await tx.businessApplication.update({
      where: { id: applicationId },
      data: { status: "RELEASED" },
    });

    await upsertBusinessRecordOnRelease(tx, app);

    await tx.applicationHistory.create({
      data: {
        applicationId,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "FOR_RELEASE",
        toStatus: "RELEASED",
        remarks:
          `Application marked released.${remarks?.trim() ? ` Remarks: ${remarks.trim()}` : ""}`,
      },
    });

    return {
      applicationId,
      documentNumber: app.permitIssuance.documentNumber,
      status: "RELEASED" as const,
      newApplicationStatus: "RELEASED" as const,
    };
  });
}
