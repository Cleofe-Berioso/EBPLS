import type { ApplicationStatus, ApplicationType } from "@/lib/applicant-types";
import { DISPLAY_STATUS_FLOW, getStatusBanner, getTrackerIndex } from "@/components/ui/status-badge";
import { InfoBanner } from "@/components/ui/info-banner";

const APPLICANT_PROGRESS_FLOWS: Record<
  ApplicationType,
  Array<{ label: string; statuses: ApplicationStatus[] }>
> = {
  NEW: [
    { label: "Submitted", statuses: ["Submitted"] },
    { label: "BPLO Review", statuses: ["Under Review"] },
    { label: "Department Head Approval", statuses: ["Department Head Review", "Department Head Approved"] },
    { label: "Assessment", statuses: ["Assessed"] },
    { label: "Payment", statuses: ["Approved for Payment", "Paid"] },
    { label: "For Release", statuses: ["For Release"] },
    { label: "Released", statuses: ["Released"] },
  ],
  RENEWAL: [
    { label: "Submitted", statuses: ["Submitted"] },
    { label: "BPLO Review", statuses: ["Under Review"] },
    { label: "Department Head Approval", statuses: ["Department Head Review", "Department Head Approved"] },
    { label: "Assessment", statuses: ["Assessed"] },
    { label: "Payment", statuses: ["Approved for Payment", "Paid"] },
    { label: "For Release", statuses: ["For Release"] },
    { label: "Released", statuses: ["Released"] },
  ],
  CLOSURE: [
    { label: "Submitted", statuses: ["Submitted"] },
    { label: "BPLO Review", statuses: ["Under Review"] },
    { label: "Department Head Approval", statuses: ["Department Head Review", "Department Head Approved"] },
    { label: "Closure Processing", statuses: ["Assessed", "Approved for Payment", "Paid", "For Release"] },
    { label: "Closure Certificate", statuses: ["Released"] },
  ],
};

function getFlow(applicationType?: ApplicationType) {
  if (!applicationType) {
    return DISPLAY_STATUS_FLOW.map((label) => ({ label, statuses: [label] as ApplicationStatus[] }));
  }

  return APPLICANT_PROGRESS_FLOWS[applicationType];
}

function getFlowIndex(status: ApplicationStatus, applicationType?: ApplicationType) {
  const flow = getFlow(applicationType);
  const directIndex = flow.findIndex((step) => step.statuses.includes(status));
  if (directIndex >= 0) return directIndex;

  if (status === "Draft") return -1;
  if (status === "Returned for Correction" || status === "Rejected") {
    return flow.findIndex((step) => step.label === "BPLO Review");
  }

  return flow.length - 1;
}

export function StatusTracker({
  status,
  applicationType,
}: {
  status: ApplicationStatus;
  applicationType?: ApplicationType;
}) {
  const flow = getFlow(applicationType);
  const currentIndex = applicationType ? getFlowIndex(status, applicationType) : getTrackerIndex(status);
  const banner = getStatusBanner(status);

  return (
    <div className="space-y-3">
      {banner ? (
        <InfoBanner
          title={banner.title}
          description={banner.description}
          variant={banner.variant}
        />
      ) : null}
      <ol className={`grid gap-3 ${applicationType === "CLOSURE" ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-7"}`}>
        {flow.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
                  key={`${step.label}-${index}`}
              className={`rounded-2xl border px-4 py-4 text-sm ${
                active
                  ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
                  : done
                    ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
                    : "border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]"
              }`}
            >
              <span
                className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-[var(--success)] text-white"
                    : done
                      ? "bg-[var(--success-soft)] text-[var(--success)]"
                      : "bg-[var(--surface)] text-[var(--ink-muted)]"
                }`}
              >
                {index + 1}
              </span>
              <p className="font-medium">{step.label}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
