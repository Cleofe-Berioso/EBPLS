import type { ApplicationStatus } from "@/lib/applicant-types";

export const DISPLAY_STATUS_FLOW: ApplicationStatus[] = [
  "Submitted",
  "Under Review",
  "Department Head Review",
  "Department Head Approved",
  "Assessed",
  "Approved for Payment",
  "Paid",
  "For Release",
  "Released",
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Draft: "border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]",
  Submitted: "border-[var(--border-color)] bg-[var(--info-soft)] text-[var(--info)]",
  "Under Review": "border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]",
  "Department Head Review": "border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--foreground)]",
  "Department Head Approved": "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
  Assessed: "border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]",
  "Approved for Payment": "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
  Paid: "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
  "For Release": "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
  Released: "border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]",
  "Revocation Review": "border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]",
  Revoked: "border-[var(--border-color)] bg-[var(--danger-soft)] text-[var(--danger)]",
  "Returned for Correction": "border-[var(--border-color)] bg-[var(--danger-soft)] text-[var(--danger)]",
  Rejected: "border-[var(--border-color)] bg-[var(--danger-soft)] text-[var(--danger)]",
};

export function getStatusBadgeClass(status: ApplicationStatus): string {
  return STATUS_STYLES[status];
}

export function getTrackerIndex(status: ApplicationStatus) {
  if (status === "Draft") return -1;
  if (status === "Returned for Correction" || status === "Rejected") {
    return DISPLAY_STATUS_FLOW.indexOf("Under Review");
  }
  return DISPLAY_STATUS_FLOW.indexOf(status);
}

export function getStatusBanner(status: ApplicationStatus) {
  if (status === "Draft") {
    return {
      title: "Draft saved",
      description: "This application is not yet submitted. No action is required from BPLO right now.",
      variant: "info" as const,
    };
  }

  if (status === "Returned for Correction") {
    return {
      title: "Returned for correction",
      description: "Please review BPLO remarks, update the application, and resubmit when ready.",
      variant: "warning" as const,
    };
  }

  if (status === "Rejected") {
    return {
      title: "Application rejected",
      description: "This application is closed in the workflow. Review the recorded remarks for the reason.",
      variant: "danger" as const,
    };
  }

  return null;
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`ui-badge max-w-full ${getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
