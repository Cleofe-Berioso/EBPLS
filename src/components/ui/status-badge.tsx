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
  Draft: "border border-slate-200 bg-slate-100 text-slate-700",
  Submitted: "border border-blue-200 bg-blue-50 text-blue-800",
  "Under Review": "border border-amber-200 bg-amber-50 text-amber-800",
  Assessed: "border border-indigo-200 bg-indigo-50 text-indigo-800",
  "Approved for Payment": "border border-sky-200 bg-sky-50 text-sky-800",
  Paid: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  "For Release": "border border-lime-200 bg-lime-50 text-lime-800",
  Released: "border border-green-200 bg-green-50 text-green-800",
  "Returned for Correction": "border border-orange-200 bg-orange-50 text-orange-800",
  Rejected: "border border-red-200 bg-red-50 text-red-800",
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
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-center text-[11px] font-semibold leading-4 ${getStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}
