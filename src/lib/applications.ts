import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi, isEditableStatus } from "@/lib/application-mappers";
import { getMissingRequiredDocuments, resolveRequiredDocuments } from "@/lib/required-documents";
import { toMoneyNumber } from "@/lib/money";
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

const TIN_REGEX = /^\d{9,12}$/;
const PH_MOBILE_REGEX = /^(\+63|0)9\d{9}$/;

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

const ELIGIBLE_EXISTING_BUSINESS_STATUSES: DbApplicationStatus[] = [
  "PAID",
  "FOR_RELEASE",
  "RELEASED",
];

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
    } as any,
  })) as unknown as {
    id: string;
    businessStatus?: "ACTIVE" | "CLOSED" | null;
    location?: { status: string } | null;
    applications: Array<{ id: string }>;
  } | null;

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

function validateSubmitPayload(input: SaveApplicationInput, mergedDocuments: ApplicationDocumentInput[]) {
  const missingFields = REQUIRED_FIELD_KEYS.filter((key) => {
    const value = input.formData[key];
    return typeof value !== "string" || value.trim().length === 0;
  }).map((key) => String(key));

  const tin = input.formData.tin.replace(/[^\d]/g, "");
  if (!TIN_REGEX.test(tin)) {
    missingFields.push("tin (must be 9 to 12 digits)");
  }

  const normalizedPhone = input.formData.phone.replace(/[\s-]/g, "");
  if (!PH_MOBILE_REGEX.test(normalizedPhone)) {
    missingFields.push("phone (must be a valid Philippine mobile number)");
  }

  const email = input.formData.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    missingFields.push("email (invalid format)");
  }

  const assetValue = Number(input.formData.assetSize.replace(/[₱,\s]/g, ""));
  if (!Number.isFinite(assetValue) || assetValue < 0) {
    missingFields.push("assetSize (must be a non-negative number)");
  }

  const employees = Number(input.formData.totalEmployees.replace(/[,\s]/g, ""));
  if (!Number.isFinite(employees) || employees < 0 || !Number.isInteger(employees)) {
    missingFields.push("totalEmployees (must be a non-negative integer)");
  }

  if ((input.applicationType === "RENEWAL" || input.applicationType === "CLOSURE") && !input.businessRecordId) {
    missingFields.push("businessRecordId");
  }

  const requiredDocs = resolveRequiredDocuments({
    applicationType: input.applicationType,
    formData: input.formData,
  });

  const missingDocuments = getMissingRequiredDocuments(
    requiredDocs,
    mergedDocuments.map((doc) => doc.documentName)
  );

  if (missingFields.length || missingDocuments.length) {
    throw new SubmitValidationError({
      missingFields,
      missingDocuments,
    });
  }
}

export async function listApplicantApplications(applicantId: string): Promise<ApplicantApplicationRow[]> {
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

export async function saveApplicantApplication(applicantId: string, input: SaveApplicationInput) {
  const nextStatus = input.mode === "SUBMIT" ? "SUBMITTED" : "DRAFT";
  const documents = sanitizeDocuments(input.documents);

  if (input.mode === "SUBMIT") {
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

  const mergedDocuments: ApplicationDocumentInput[] = [
    ...existingDocuments.map((doc: any) => ({
      id: doc.id,
      documentName: doc.documentName,
      fileName: doc.fileName,
      storagePath: doc.storagePath,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
    })),
    ...documents.filter(
      (doc) => Boolean(doc.id) || (Boolean(doc.storagePath) && Boolean(doc.mimeType) && typeof doc.sizeBytes === "number")
    ),
  ];

  if (input.mode === "SUBMIT") {
    validateSubmitPayload(input, mergedDocuments);
  }

  if (existing) {
    const updated = await prisma.$transaction(async (tx: any) => {
      const row = await tx.businessApplication.update({
        where: { id: existing.id },
        data: {
          applicationType: input.applicationType,
          businessRecordId: input.businessRecordId ?? null,
          status: nextStatus,
          formData: input.formData,
          submittedAt: input.mode === "SUBMIT" ? new Date() : null,
        },
      });

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
        formData: input.formData,
        submittedAt: input.mode === "SUBMIT" ? new Date() : null,
      },
    });

    if (documents.length) {
      const validDocuments = documents.filter(
        (doc) => doc.storagePath && doc.mimeType && typeof doc.sizeBytes === "number"
      );

      if (validDocuments.length) {
        await tx.applicationDocument.createMany({
          data: validDocuments.map((doc) => ({
            applicationId: row.id,
            documentName: doc.documentName,
            fileName: doc.fileName,
            storagePath: doc.storagePath as string,
            mimeType: doc.mimeType as string,
            sizeBytes: doc.sizeBytes as number,
          })),
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
  if (!isEditableStatus(application.status)) throw new Error("Only draft or returned applications can be edited");

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

export async function listApplicantNotifications(applicantId: string) {
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
}

export async function getApplicantTopSummary(applicantId: string) {
  const applications = await prisma.businessApplication.findMany({
    where: {
      applicantId,
      status: {
        in: ["APPROVED_FOR_PAYMENT", "PAID", "FOR_RELEASE", "RELEASED"],
      },
    },
    include: {
      feeAssessment: true,
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
      totalAmount: any;
      remarks: string | null;
      generatedAt: Date | null;
    } | null;

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
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
      closureCertificateFee: toMoneyNumber(fa?.closureCertificateFee),
      arrears: toMoneyNumber(fa?.arrears),
      otherCharges: toMoneyNumber(fa?.otherCharges),
      totalAmount: toMoneyNumber(fa?.totalAmount),
      remarks: fa?.remarks ?? null,
      generatedAt: fa?.generatedAt ? fa.generatedAt.toISOString() : null,
      paymentReference: payment
        ? {
            id: payment.id,
            transactionNumber: payment.transactionNumber,
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
    activeSummary:
      summaries.find((summary: { rawStatus: string }) => summary.rawStatus === "APPROVED_FOR_PAYMENT") ??
      summaries[0],
    records: summaries,
  };
}

export async function submitApplicantPaymentReference(
  applicantId: string,
  applicationId: string,
  transactionNumber: string,
  amountPaid: number,
  paymentDate: string,
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
  });

  if (!application) throw new Error("Application not found");

  if (application.status !== "APPROVED_FOR_PAYMENT") {
    throw new Error("Payment reference can only be submitted once the Tax Order of Payment has been generated");
  }

  const duplicate = await prisma.paymentReference.findUnique({
    where: { transactionNumber: transactionNumber.trim() },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("This OR number/payment reference has already been submitted. Please check your payment details.");
  }

  const latest = await prisma.paymentReference.findFirst({
    where: { applicationId: application.id },
    orderBy: { submittedAt: "desc" },
    select: { status: true },
  });

  if (latest?.status === "PENDING") {
    throw new Error("A payment reference is already pending verification");
  }

  if (latest?.status === "VERIFIED") {
    throw new Error("Payment has already been verified and is read-only");
  }

  const parsedPaymentDate = new Date(paymentDate);
  if (Number.isNaN(parsedPaymentDate.getTime())) {
    throw new Error("paymentDate is required");
  }

  const normalizedAmountPaid = Math.round(Math.max(0, amountPaid) * 100) / 100;

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
        remarks: `Applicant submitted payment reference: ${transactionNumber.trim()}, Amount: ₱${toMoneyNumber(normalizedAmountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return rows.map((row: any) => ({
    id: row.id,
    registrationNumber: row.registrationNumber,
    businessName: row.businessName,
    businessStatus: row.businessStatus as "ACTIVE" | "CLOSED",
    closedAt: row.closedAt ? (row.closedAt as Date).toISOString() : null,
    businessInfo: {
      businessType: row.businessType as BusinessInfo["businessType"],
      registrationNumber: row.registrationNumber,
      tin: row.tin,
      businessName: row.businessName,
      tradeName: row.tradeName,
      ownerName: row.ownerName,
      nationality: row.nationality,
      email: row.email,
      phone: row.phone,
      mainOfficeAddress: row.mainOfficeAddress,
      businessAddress: row.businessAddress,
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
    } satisfies BusinessInfo,
  }));
}
