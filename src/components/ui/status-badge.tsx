import type { ApplicationStatus } from "@/lib/applicant-types";

export const DISPLAY_STATUS_FLOW: ApplicationStatus[] = [
  "Submitted",
  "Under Review",
  "Assessed",
  "Approved for Payment",
  "Paid",
  "For Release",
  "Released",
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  Submitted: "border-blue-200 bg-blue-50 text-blue-700",
  "Under Review": "border-amber-200 bg-amber-50 text-amber-700",
  "Department Head Review": "border-purple-200 bg-purple-50 text-purple-700",
  "Department Head Approved": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Assessed: "border-amber-200 bg-amber-50 text-amber-700",
  "Approved for Payment": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "For Release": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Released: "border-slate-300 bg-slate-100 text-slate-700",
  "Revocation Review": "border-orange-200 bg-orange-50 text-orange-700",
  Revoked: "border-rose-200 bg-rose-50 text-rose-700",
  "Returned for Correction": "border-rose-200 bg-rose-50 text-rose-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
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
    <span
      className={`ui-status-badge inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.04em] leading-4 ${getStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}
