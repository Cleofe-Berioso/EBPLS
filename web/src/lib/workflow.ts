import type { ApplicationStatus, Payment, Prisma, User } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { generatePermitNumber } from "@/lib/utils";

export const ROLE = {
  APPLICANT: "APPLICANT",
  BPLO_OFFICE: "BPLO_OFFICE",
  ADMIN: "ADMIN",
} as const;

export type ActiveRole = (typeof ROLE)[keyof typeof ROLE];

export function isBplo(user?: Pick<User, "role"> | { role?: string } | null): boolean {
  return user?.role === ROLE.BPLO_OFFICE;
}

export function isApplicant(user?: Pick<User, "role"> | { role?: string } | null): boolean {
  return user?.role === ROLE.APPLICANT;
}

export function isAdmin(user?: Pick<User, "role"> | { role?: string } | null): boolean {
  return user?.role === ROLE.ADMIN;
}

export const EDITABLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "DRAFT",
  "RETURNED_FOR_CORRECTION",
];

export const REVIEWABLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "RESUBMITTED",
  "UNDER_REVIEW",
];

export const PAYMENT_READY_STATUSES: ApplicationStatus[] = [
  "ASSESSED",
  "PAYMENT_PENDING",
];

export const PERMIT_GENERATION_STATUSES: ApplicationStatus[] = ["PAID"];

export const APPLICANT_PERMIT_DOWNLOAD_STATUSES: ApplicationStatus[] = [
  "READY_FOR_RELEASE",
  "RELEASED",
  "COMPLETED",
];

export function canApplicantMutateApplication(status: ApplicationStatus): boolean {
  return EDITABLE_APPLICATION_STATUSES.includes(status);
}

export function canStartReview(status: ApplicationStatus): boolean {
  return REVIEWABLE_APPLICATION_STATUSES.includes(status);
}

export function canCreatePayment(status: ApplicationStatus): boolean {
  return PAYMENT_READY_STATUSES.includes(status);
}

export function canVerifyPayment(status: ApplicationStatus): boolean {
  return status === "PAYMENT_PENDING";
}

export function canGeneratePermit(status: ApplicationStatus): boolean {
  return PERMIT_GENERATION_STATUSES.includes(status);
}

export function canApplicantDownloadPermit(status: ApplicationStatus): boolean {
  return APPLICANT_PERMIT_DOWNLOAD_STATUSES.includes(status);
}

export async function transitionApplicationStatus(params: {
  applicationId: string;
  newStatus: ApplicationStatus;
  changedBy: string;
  comment?: string | null;
  data?: Prisma.ApplicationUpdateInput;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const application = await client.application.findUnique({
    where: { id: params.applicationId },
    select: { status: true },
  });
  if (!application) throw new Error("Application not found");

  const updated = await client.application.update({
    where: { id: params.applicationId },
    data: {
      ...(params.data ?? {}),
      status: params.newStatus,
      ...(params.newStatus === "UNDER_REVIEW" && { reviewedAt: new Date() }),
      ...(params.newStatus === "REJECTED" && { rejectedAt: new Date() }),
      ...(params.newStatus === "ASSESSED" && { approvedAt: new Date() }),
      ...(params.newStatus === "PAID" && { paymentConfirmed: true }),
    },
  });

  await client.applicationHistory.create({
    data: {
      applicationId: params.applicationId,
      previousStatus: application.status,
      newStatus: params.newStatus,
      comment: params.comment ?? null,
      changedBy: params.changedBy,
    },
  });

  return updated;
}

export async function preparePermitForPaidApplication(params: {
  applicationId: string;
  issuedById: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  const application = await client.application.findUnique({
    where: { id: params.applicationId },
    include: { applicant: true, permit: true },
  });

  if (!application) throw new Error("Application not found");
  if (!canGeneratePermit(application.status)) {
    throw new Error("Application must be PAID before permit preparation");
  }
  if (application.permit) {
    throw new Error("Permit already exists for this application");
  }

  const permitCount = await client.permit.count();
  const permit = await client.permit.create({
    data: {
      permitNumber: generatePermitNumber(permitCount + 1),
      applicationId: application.id,
      businessName: application.businessName,
      businessAddress: application.businessAddress,
      ownerName: `${application.applicant.firstName} ${application.applicant.lastName}`,
      issueDate: new Date(),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: "ACTIVE",
    },
  });

  const issuance = await client.permitIssuance.create({
    data: {
      permitId: permit.id,
      issuedById: params.issuedById,
      status: "PREPARED",
      mayorSigningStatus: application.type === "CLOSURE" ? "NOT_REQUIRED" : "PENDING",
    },
  });

  await transitionApplicationStatus({
    applicationId: application.id,
    newStatus: "PERMIT_PREPARED",
    changedBy: params.issuedById,
    comment: "Permit prepared after payment verification",
    tx: client,
  });

  return { permit, issuance };
}

export function paymentAmountToDecimal(amount: number | string | Decimal): Decimal {
  return amount instanceof Decimal ? amount : new Decimal(amount);
}

export function isPaymentPaid(payment: Pick<Payment, "status">): boolean {
  return payment.status === "PAID";
}
