import Link from "next/link";
import { listAssessmentFeeApplications } from "@/lib/bplo-assessment";
import {
  bploEmptyStateClass,
  bploMobileRecordCardClass,
  bploTableClass,
} from "@/components/bplo/bplo-ui-styles";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { actionButtonStyles } from "@/components/ui/action-button";

const TYPE_LABEL: Record<string, string> = {
  NEW: "New",
  RENEWAL: "Renewal",
  CLOSURE: "Closure",
};

const ASSESSMENT_STATUS_BADGE: Record<string, string> = {
  DRAFT: "border border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]",
  GENERATED: "border border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
};

export default async function BploAssessmentFeesPage() {
  const rows = await listAssessmentFeeApplications();

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="BPLO"
        title="Assessment & Fees"
        description="Department Head approved applications are ready for fee computation and Tax Order of Payment generation."
      />

      <ResponsiveDataTable
        title="Assessment Queue"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"} ready for assessment or currently under assessment.`}
        switchAt="xl"
        table={rows.length === 0 ? (
          <div className={bploEmptyStateClass}>
            No records available yet. This section will populate as applications are approved by the Department Head.
          </div>
        ) : (
          <table className={bploTableClass}>
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--muted-surface)] text-left text-[var(--foreground)]">
                <th className="px-4 py-3 font-semibold">Application No.</th>
                <th className="px-4 py-3 font-semibold">Business Name</th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Line of Business</th>
                <th className="px-4 py-3 font-semibold">Assessment</th>
                <th className="px-4 py-3 font-semibold">Last Updated</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--muted-surface)]/60">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--ink-muted)]">{row.applicationNumber}</td>
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{row.businessName}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    <p>{row.applicantName}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{row.applicantEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[var(--border-color)] bg-[var(--info-soft)] px-2 py-0.5 text-xs text-[var(--info)]">
                      {TYPE_LABEL[row.applicationType] ?? row.applicationType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {row.lineOfBusiness !== "-" ? row.lineOfBusiness : <span className="text-[var(--ink-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.assessmentStatus ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSESSMENT_STATUS_BADGE[row.assessmentStatus] ?? ""}`}
                        >
                          {row.assessmentStatus === "GENERATED" ? "TOP Generated" : "Draft Saved"}
                        </span>
                        {row.reassessmentRequested ? (
                          <span className="rounded-full border border-[var(--border-color)] bg-[var(--warning-soft)] px-2 py-0.5 text-xs text-[var(--warning)]">Re-assessment Requested</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--ink-muted)]">Not started</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">{row.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <Link href={`/bplo/assessment-fees/${row.id}`} className={actionButtonStyles("primary", "sm")}>
                      {row.assessmentStatus ? "View Assessment" : "Assess"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        mobile={rows.length === 0 ? (
          <div className="p-4 text-sm text-[var(--ink-muted)]">
            No records available yet. This section will populate as applications are approved by the Department Head.
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {rows.map((row) => (
              <article key={row.id} className={bploMobileRecordCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs text-[var(--ink-muted)]">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{row.businessName}</p>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">{row.applicantName}</p>
                    <p className="break-all text-xs text-[var(--ink-muted)]">{row.applicantEmail}</p>
                  </div>
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--info-soft)] px-2 py-0.5 text-xs text-[var(--info)]">
                    {TYPE_LABEL[row.applicationType] ?? row.applicationType}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--ink-muted)]">
                  <p>
                    <span className="font-semibold text-[var(--foreground)]">Line of Business:</span>{" "}
                    {row.lineOfBusiness !== "-" ? row.lineOfBusiness : "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {row.assessmentStatus ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSESSMENT_STATUS_BADGE[row.assessmentStatus] ?? ""}`}
                      >
                        {row.assessmentStatus === "GENERATED" ? "TOP Generated" : "Draft Saved"}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--ink-muted)]">Not started</span>
                    )}
                    {row.reassessmentRequested ? (
                      <span className="rounded-full border border-[var(--border-color)] bg-[var(--warning-soft)] px-2 py-0.5 text-xs text-[var(--warning)]">Re-assessment Requested</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">Last Updated: {row.lastUpdated}</p>
                </div>
                <div className="mt-3">
                  <Link href={`/bplo/assessment-fees/${row.id}`} className={actionButtonStyles("primary", "sm")}>
                    {row.assessmentStatus ? "View Assessment" : "Assess"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      />
    </section>
  );
}
