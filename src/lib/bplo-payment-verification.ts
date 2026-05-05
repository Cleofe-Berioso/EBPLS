import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import { toMoneyNumber } from "@/lib/money";

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

export interface PaymentVerificationRow {
  paymentReferenceId: string;
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  topNumber: string | null;
  annualAssessedAmount: number;
  releasePaymentAmount: number;
  totalAmountDue: number;
  amountPaid: number;
  paymentDate: string;
  transactionNumber: string;
  submittedAt: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  applicationStatus: string;
  reviewerRemarks: string | null;
  reviewedAt: string | null;
  proofFileName: string;
}

export interface PaymentVerificationLists {
  pending: PaymentVerificationRow[];
  verified: PaymentVerificationRow[];
  rejected: PaymentVerificationRow[];
}

export interface PaymentVerificationDetail {
  row: PaymentVerificationRow;
  applicant: { id: string; name: string; email: string };
  business: {
    businessName: string;
    businessType: string;
    lineOfBusiness: string;
    assetSize: string;
    totalEmployees: string;
  };
  top: {
    assessmentNumber: string | null;
    paymentFrequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY" | null;
    annualAssessedAmount: number;
    releasePaymentAmount: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
    mayorsPermitFee: number;
    regulatoryFees: number;
    additionalCharges: number;
    penalties: number;
    surcharge: number;
    interest: number;
    closureCertificateFee: number;
    arrears: number;
    otherCharges: number;
    totalAmount: number;
    remarks: string | null;
  };
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const data = (formData ?? {}) as Record<string, unknown>;
  const fromForm =
    typeof data.businessName === "string" && data.businessName.trim()
      ? data.businessName.trim()
      : null;
  return fromForm ?? fallback ?? "-";
}

function resolveString(formData: unknown, key: string): string {
  const data = (formData ?? {}) as Record<string, unknown>;
  const val = data[key];
  return typeof val === "string" && val.trim() ? val.trim() : "-";
}

function toRow(params: {
  app: {
    id: string;
    applicationNumber: string;
    applicationType: "NEW" | "RENEWAL" | "CLOSURE";
    status: DbApplicationStatus;
    formData: unknown;
    applicant: { name: string; email: string };
    businessRecord: { businessName: string } | null;
    feeAssessment: {
      assessmentNumber: string;
      annualAssessedAmount: any;
      releasePaymentAmount: any;
      totalAmount: any;
    } | null;
  };
  ref: {
    id: string;
    transactionNumber: string;
    amountPaid: any;
    paymentDate: Date;
    submittedAt: Date;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    reviewerRemarks: string | null;
    reviewedAt: Date | null;
    proofFileName: string;
  };
}): PaymentVerificationRow {
  const { app, ref } = params;
  return {
    paymentReferenceId: ref.id,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    businessName: resolveBusinessName(app.formData, app.businessRecord?.businessName ?? null),
    applicantName: app.applicant.name,
    applicantEmail: app.applicant.email,
    applicationType: app.applicationType,
    topNumber: app.feeAssessment?.assessmentNumber ?? null,
    annualAssessedAmount: toMoneyNumber(app.feeAssessment?.annualAssessedAmount),
    releasePaymentAmount: toMoneyNumber(app.feeAssessment?.releasePaymentAmount),
    totalAmountDue: toMoneyNumber(app.feeAssessment?.totalAmount),
    amountPaid: toMoneyNumber(ref.amountPaid),
    paymentDate: ref.paymentDate.toISOString(),
    transactionNumber: ref.transactionNumber,
    submittedAt: ref.submittedAt.toISOString(),
    paymentStatus: ref.status,
    applicationStatus: mapDbStatusToUi(app.status),
    reviewerRemarks: ref.reviewerRemarks,
    reviewedAt: ref.reviewedAt ? ref.reviewedAt.toISOString() : null,
    proofFileName: ref.proofFileName,
  };
}

async function fetchCandidateApplications() {
  return (prisma as any).businessApplication.findMany({
    where: {
      status: {
        in: ["APPROVED_FOR_PAYMENT", "PAID", "FOR_RELEASE", "RELEASED"],
      },
      feeAssessment: {
        isNot: null,
      },
      paymentReferences: {
        some: {},
      },
    },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      businessRecord: { select: { businessName: true } },
      feeAssessment: {
        select: {
          assessmentNumber: true,
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
          totalAmount: true,
          remarks: true,
        },
      },
      paymentReferences: {
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function listPaymentVerificationEntries(): Promise<PaymentVerificationLists> {
  const apps = await fetchCandidateApplications();

  const allRows: PaymentVerificationRow[] = [];

  for (const app of apps as any[]) {
    for (const ref of app.paymentReferences as any[]) {
      allRows.push(
        toRow({
          app: {
            id: app.id,
            applicationNumber: app.applicationNumber,
            applicationType: app.applicationType,
            status: app.status,
            formData: app.formData,
            applicant: app.applicant,
            businessRecord: app.businessRecord,
            feeAssessment: app.feeAssessment,
          },
          ref,
        })
      );
    }
  }

  allRows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return {
    pending: allRows.filter((r) => r.paymentStatus === "PENDING"),
    verified: allRows.filter((r) => r.paymentStatus === "VERIFIED"),
    rejected: allRows.filter((r) => r.paymentStatus === "REJECTED"),
  };
}

async function findReference(paymentReferenceId: string) {
  return (prisma as any).paymentReference.findUnique({
    where: { id: paymentReferenceId },
    include: {
      application: {
        include: {
          applicant: { select: { id: true, name: true, email: true } },
          businessRecord: { select: { businessName: true } },
          feeAssessment: true,
        },
      },
    },
  });
}

export async function getPaymentVerificationDetail(
  paymentReferenceId: string
): Promise<PaymentVerificationDetail | null> {
  const found = await findReference(paymentReferenceId);
  if (!found) return null;

  const app = found.application;

  return {
    row: toRow({
      app: {
        id: app.id,
        applicationNumber: app.applicationNumber,
        applicationType: app.applicationType,
        status: app.status as DbApplicationStatus,
        formData: app.formData,
        applicant: app.applicant,
        businessRecord: app.businessRecord,
        feeAssessment: app.feeAssessment,
      },
      ref: {
        id: found.id,
        transactionNumber: found.transactionNumber,
        amountPaid: found.amountPaid,
        paymentDate: found.paymentDate,
        submittedAt: found.submittedAt,
        status: found.status,
        reviewerRemarks: found.reviewerRemarks,
        reviewedAt: found.reviewedAt,
        proofFileName: found.proofFileName,
      },
    }),
    applicant: app.applicant,
    business: {
      businessName: resolveBusinessName(app.formData, app.businessRecord?.businessName ?? null),
      businessType: resolveString(app.formData, "businessType"),
      lineOfBusiness: resolveString(app.formData, "lineOfBusiness"),
      assetSize: resolveString(app.formData, "assetSize"),
      totalEmployees: resolveString(app.formData, "totalEmployees"),
    },
    top: {
      assessmentNumber: app.feeAssessment?.assessmentNumber ?? null,
      paymentFrequency: app.feeAssessment?.paymentFrequency ?? null,
      annualAssessedAmount: toMoneyNumber(app.feeAssessment?.annualAssessedAmount),
      releasePaymentAmount: toMoneyNumber(app.feeAssessment?.releasePaymentAmount),
      amountPaid: toMoneyNumber(app.feeAssessment?.amountPaid),
      remainingBalance: toMoneyNumber(app.feeAssessment?.remainingBalance),
      paymentStatus: app.feeAssessment?.paymentStatus ?? "UNPAID",
      mayorsPermitFee: toMoneyNumber(app.feeAssessment?.mayorsPermitFee),
      regulatoryFees: toMoneyNumber(app.feeAssessment?.regulatoryFees),
      additionalCharges: toMoneyNumber(app.feeAssessment?.additionalCharges),
      penalties: toMoneyNumber(app.feeAssessment?.penalties),
      surcharge: toMoneyNumber(app.feeAssessment?.surcharge),
      interest: toMoneyNumber(app.feeAssessment?.interest),
      closureCertificateFee: toMoneyNumber(app.feeAssessment?.closureCertificateFee),
      arrears: toMoneyNumber(app.feeAssessment?.arrears),
      otherCharges: toMoneyNumber(app.feeAssessment?.otherCharges),
      totalAmount: toMoneyNumber(app.feeAssessment?.totalAmount),
      remarks: app.feeAssessment?.remarks ?? null,
    },
  };
}

export async function approvePaymentReference(
  paymentReferenceId: string,
  bploUserId: string,
  remarks?: string
) {
  const found = await findReference(paymentReferenceId);
  if (!found) throw new Error("Payment reference not found");

  const app = found.application;
  const assessment = app.feeAssessment;

  if (!assessment) {
    throw new Error("Fee assessment not found for this application");
  }

  if (found.status !== "PENDING") {
    throw new Error("Only pending payment references can be verified");
  }

  if (app.status !== "APPROVED_FOR_PAYMENT") {
    throw new Error("Application is not eligible for payment verification");
  }

  const requiredForRelease = toMoneyNumber(assessment.releasePaymentAmount);
  const submittedAmount = toMoneyNumber(found.amountPaid);
  if (submittedAmount < requiredForRelease) {
    throw new Error(
      `Amount paid is below required release payment amount (₱${requiredForRelease.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
      })}).`
    );
  }

  const paidSoFar = Math.round((toMoneyNumber(assessment.amountPaid) + submittedAmount) * 100) / 100;
  const remainingBalance = Math.max(
    0,
    Math.round((toMoneyNumber(assessment.annualAssessedAmount) - paidSoFar) * 100) / 100
  );
  const paymentStatus =
    remainingBalance <= 0 ? "PAID" : paidSoFar > 0 ? "PARTIALLY_PAID" : "UNPAID";

  const now = new Date();

  await prisma.$transaction(async (tx: any) => {
    await tx.paymentReference.update({
      where: { id: found.id },
      data: {
        status: "VERIFIED",
        reviewerRemarks: remarks?.trim() ? remarks.trim() : null,
        reviewedAt: now,
        reviewedById: bploUserId,
      },
    });

    await tx.feeAssessment.update({
      where: { applicationId: app.id },
      data: {
        amountPaid: paidSoFar,
        remainingBalance,
        paymentStatus,
      },
    });

    await tx.businessApplication.update({
      where: { id: app.id },
      data: {
        status: "PAID",
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: app.id,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "APPROVED_FOR_PAYMENT",
        toStatus: "PAID",
        remarks:
          `BPLO verified payment reference (${found.transactionNumber}) for ₱${submittedAmount.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
          })}.` + (remarks?.trim() ? ` Remarks: ${remarks.trim()}` : ""),
      },
    });
  });

  return {
    paymentReferenceId: found.id,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    previousStatus: "APPROVED_FOR_PAYMENT" as const,
    newStatus: "PAID" as const,
    totalAmountDue: toMoneyNumber(assessment.totalAmount),
    releasePaymentAmount: requiredForRelease,
    amountPaid: submittedAmount,
    remainingBalance,
  };
}

export async function rejectPaymentReference(
  paymentReferenceId: string,
  bploUserId: string,
  remarks: string
) {
  const reason = remarks.trim();
  if (!reason) throw new Error("Remarks are required when rejecting a payment");

  const found = await findReference(paymentReferenceId);
  if (!found) throw new Error("Payment reference not found");

  const app = found.application;

  if (found.status !== "PENDING") {
    throw new Error("Only pending payment references can be rejected");
  }

  if (app.status !== "APPROVED_FOR_PAYMENT") {
    throw new Error("Application is not eligible for payment rejection");
  }

  const now = new Date();

  await prisma.$transaction(async (tx: any) => {
    await tx.paymentReference.update({
      where: { id: found.id },
      data: {
        status: "REJECTED",
        reviewerRemarks: reason,
        reviewedAt: now,
        reviewedById: bploUserId,
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: app.id,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "APPROVED_FOR_PAYMENT",
        toStatus: "APPROVED_FOR_PAYMENT",
        remarks: `BPLO rejected payment reference (${found.transactionNumber}). Reason: ${reason}`,
      },
    });
  });

  return {
    paymentReferenceId: found.id,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    status: "APPROVED_FOR_PAYMENT" as const,
    rejectionRemarks: reason,
  };
}
