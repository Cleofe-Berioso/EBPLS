import type { ApplicationStatus as DbApplicationStatus } from "@prisma/client";
import type { ApplicationStatus } from "@/lib/applicant-types";

export const EDITABLE_APPLICATION_STATUSES: DbApplicationStatus[] = ["DRAFT", "RETURNED_FOR_CORRECTION"];

const dbToUiStatus: Record<DbApplicationStatus, ApplicationStatus> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSESSED: "Assessed",
  APPROVED_FOR_PAYMENT: "Approved for Payment",
  PAID: "Paid",
  FOR_RELEASE: "For Release",
  RELEASED: "Released",
  RETURNED_FOR_CORRECTION: "Returned for Correction",
  REJECTED: "Rejected",
};

export function mapDbStatusToUi(status: DbApplicationStatus): ApplicationStatus {
  return dbToUiStatus[status];
}

export function isEditableStatus(status: DbApplicationStatus): boolean {
  return EDITABLE_APPLICATION_STATUSES.includes(status);
}
