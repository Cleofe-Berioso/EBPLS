import type { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "RETURNED_FOR_CORRECTION", "REJECTED"],
  UNDER_REVIEW: ["DEPARTMENT_HEAD_REVIEW", "ASSESSED", "RETURNED_FOR_CORRECTION", "REJECTED"],
  DEPARTMENT_HEAD_REVIEW: ["DEPARTMENT_HEAD_APPROVED", "RETURNED_FOR_CORRECTION", "REJECTED"],
  DEPARTMENT_HEAD_APPROVED: ["ASSESSED"],
  ASSESSED: ["APPROVED_FOR_PAYMENT"],
  APPROVED_FOR_PAYMENT: ["PAID", "ASSESSED"],
  PAID: ["FOR_RELEASE"],
  FOR_RELEASE: ["RELEASED"],
  RELEASED: ["REVOCATION_REVIEW"],
  REVOCATION_REVIEW: ["RELEASED", "REVOKED"],
  REVOKED: [],
  RETURNED_FOR_CORRECTION: ["SUBMITTED"],
  REJECTED: [],
};

export function canTransitionStatus(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_STATUS_TRANSITIONS[from].includes(to);
}

export function assertStatusTransition(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!canTransitionStatus(from, to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}