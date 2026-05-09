import type { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "RETURNED_FOR_CORRECTION", "REJECTED"],
  UNDER_REVIEW: ["ASSESSED", "RETURNED_FOR_CORRECTION", "REJECTED"],
  ASSESSED: ["APPROVED_FOR_PAYMENT"],
  APPROVED_FOR_PAYMENT: ["PAID"],
  PAID: ["FOR_RELEASE"],
  FOR_RELEASE: ["RELEASED"],
  RELEASED: [],
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