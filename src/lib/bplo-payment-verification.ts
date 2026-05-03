import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import {
  getPaymentReferencesFromFormData,
  upsertPaymentReferencesInFormData,
  type PaymentReferenceEntry,
} from "@/lib/payment-reference";

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
  totalAmountDue: number;
  amountPaid: number;
  transactionNumber: string;
  submittedAt: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  applicationStatus: string;
  reviewerRemarks: string | null;
  reviewedAt: string | null;
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
    feeAssessment: { assessmentNumber: string; totalAmount: number } | null;
  };
  ref: PaymentReferenceEntry;
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
    totalAmountDue: app.feeAssessment?.totalAmount ?? 0,
    amountPaid: ref.amountPaid,
    transactionNumber: ref.transactionNumber,
    submittedAt: ref.submittedAt,
    paymentStatus: ref.status,
    applicationStatus: mapDbStatusToUi(app.status),
    reviewerRemarks: ref.reviewerRemarks,
    reviewedAt: ref.reviewedAt,
  };
}

async function fetchCandidateApplications() {
  return prisma.businessApplication.findMany({
    where: {
      status: {
        in: ["APPROVED_FOR_PAYMENT", "PAID", "FOR_RELEASE", "RELEASED"],
      },
      feeAssessment: {
        isNot: null,
      },
    },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      businessRecord: { select: { businessName: true } },
      feeAssessment: {
        select: {
          assessmentNumber: true,
          totalAmount: true,
          paymentFrequency: true,
          mayorsPermitFee: true,
          regulatoryFees: true,
          additionalCharges: true,
          penalties: true,
          surcharge: true,
          interest: true,
          closureCertificateFee: true,
          arrears: true,
          otherCharges: true,
          remarks: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function listPaymentVerificationEntries(): Promise<PaymentVerificationLists> {
  const apps = await fetchCandidateApplications();

  const allRows: PaymentVerificationRow[] = [];

  for (const app of apps as any[]) {
    const refs = getPaymentReferencesFromFormData(app.formData, app.id, app.status);
    for (const ref of refs) {
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
  const apps = await fetchCandidateApplications();

  for (const app of apps as any[]) {
    const refs = getPaymentReferencesFromFormData(app.formData, app.id, app.status);
    const idx = refs.findIndex((r) => r.id === paymentReferenceId);
    if (idx >= 0) {
      return {
        app,
        refs,
        idx,
      };
    }
  }

  return null;
}

export async function getPaymentVerificationDetail(
  paymentReferenceId: string
): Promise<PaymentVerificationDetail | null> {
  const found = await findReference(paymentReferenceId);
  if (!found) return null;

  const ref = found.refs[found.idx];
  const app = found.app;

  return {
    row: toRow({
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
      mayorsPermitFee: app.feeAssessment?.mayorsPermitFee ?? 0,
      regulatoryFees: app.feeAssessment?.regulatoryFees ?? 0,
      additionalCharges: app.feeAssessment?.additionalCharges ?? 0,
      penalties: app.feeAssessment?.penalties ?? 0,
      surcharge: app.feeAssessment?.surcharge ?? 0,
      interest: app.feeAssessment?.interest ?? 0,
      closureCertificateFee: app.feeAssessment?.closureCertificateFee ?? 0,
      arrears: app.feeAssessment?.arrears ?? 0,
      otherCharges: app.feeAssessment?.otherCharges ?? 0,
      totalAmount: app.feeAssessment?.totalAmount ?? 0,
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

  const { app, refs, idx } = found;
  const target = refs[idx];

  if (target.status !== "PENDING") {
    throw new Error("Only pending payment references can be verified");
  }

  if (app.status !== "APPROVED_FOR_PAYMENT") {
    throw new Error("Application is not eligible for payment verification");
  }

  const totalDue = app.feeAssessment?.totalAmount ?? 0;
  const isUnderpaid = totalDue > 0 && target.amountPaid < totalDue;

  const nowIso = new Date().toISOString();
  refs[idx] = {
    ...target,
    status: "VERIFIED",
    reviewerRemarks: remarks?.trim() ? remarks.trim() : null,
    reviewedAt: nowIso,
    reviewedById: bploUserId,
  };

  const nextFormData = upsertPaymentReferencesInFormData(app.formData, refs);

  await prisma.$transaction(async (tx: any) => {
    await tx.businessApplication.update({
      where: { id: app.id },
      data: {
        status: "PAID",
        formData: nextFormData,
      },
    });

    const approvalRemarkBase =
      `BPLO verified payment reference ${target.id} (${target.transactionNumber}) for ₱${target.amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`;
    const underpaidNote = isUnderpaid
      ? ` Underpaid warning: Amount paid ₱${target.amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}, total due ₱${totalDue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`
      : "";
    const extraRemark = remarks?.trim() ? ` Remarks: ${remarks.trim()}` : "";

    await tx.applicationHistory.create({
      data: {
        applicationId: app.id,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "APPROVED_FOR_PAYMENT",
        toStatus: "PAID",
        remarks: `${approvalRemarkBase}${underpaidNote}${extraRemark}`,
      },
    });
  });

  return {
    paymentReferenceId: target.id,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    previousStatus: "APPROVED_FOR_PAYMENT" as const,
    newStatus: "PAID" as const,
    isUnderpaid,
    totalAmountDue: totalDue,
    amountPaid: target.amountPaid,
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

  const { app, refs, idx } = found;
  const target = refs[idx];

  if (target.status !== "PENDING") {
    throw new Error("Only pending payment references can be rejected");
  }

  if (app.status !== "APPROVED_FOR_PAYMENT") {
    throw new Error("Application is not eligible for payment rejection");
  }

  const nowIso = new Date().toISOString();
  refs[idx] = {
    ...target,
    status: "REJECTED",
    reviewerRemarks: reason,
    reviewedAt: nowIso,
    reviewedById: bploUserId,
  };

  const nextFormData = upsertPaymentReferencesInFormData(app.formData, refs);

  await prisma.$transaction(async (tx: any) => {
    await tx.businessApplication.update({
      where: { id: app.id },
      data: {
        formData: nextFormData,
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: app.id,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "APPROVED_FOR_PAYMENT",
        toStatus: "APPROVED_FOR_PAYMENT",
        remarks:
          `BPLO rejected payment reference ${target.id} (${target.transactionNumber}). ` +
          `Reason: ${reason}`,
      },
    });
  });

  return {
    paymentReferenceId: target.id,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    status: "APPROVED_FOR_PAYMENT" as const,
    rejectionRemarks: reason,
  };
}
