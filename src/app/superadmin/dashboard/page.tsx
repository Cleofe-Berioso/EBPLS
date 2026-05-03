import { PageHeader } from "@/components/ui/page-header";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ApplicationStatus } from "@/lib/applicant-types";
import {
  getSuperAdminDashboardSummary,
  getSuperAdminReportsSummary,
} from "@/lib/superadmin-data";

export default async function SuperAdminDashboard() {
  const summary = await getSuperAdminDashboardSummary();
  const reports = await getSuperAdminReportsSummary();
  const totalNew = reports.applicationsByType.find((row) => row.type === "NEW")?.count ?? 0;
  const totalRenewal = reports.applicationsByType.find((row) => row.type === "RENEWAL")?.count ?? 0;
  const totalClosure = reports.applicationsByType.find((row) => row.type === "CLOSURE")?.count ?? 0;

  const primaryCards = [
    {
      title: "Total New",
      value: totalNew.toLocaleString("en-PH"),
      subtitle: "New application records",
      tone: "blue" as const,
    },
    {
      title: "Total Renewal",
      value: totalRenewal.toLocaleString("en-PH"),
      subtitle: "Renewal application records",
      tone: "amber" as const,
    },
    {
      title: "Total Closure",
      value: totalClosure.toLocaleString("en-PH"),
      subtitle: "Closure application records",
      tone: "slate" as const,
    },
    {
      title: "Total Applications",
      value: summary.totalApplications.toLocaleString("en-PH"),
      subtitle: "All workflow records currently stored",
      tone: "slate" as const,
    },
    {
      title: "Released Applications",
      value: summary.byStatus.RELEASED.toLocaleString("en-PH"),
      subtitle: "Applications already released",
      tone: "green" as const,
    },
    {
      title: "Total Users",
      value: summary.totalUsers.toLocaleString("en-PH"),
      subtitle: "Applicant, BPLO, and Super Admin accounts",
      tone: "slate" as const,
    },
    {
      title: "BPLO Activity Count",
      value: reports.bploActivityCount.toLocaleString("en-PH"),
      subtitle: "Recorded BPLO history actions",
      tone: "blue" as const,
    },
  ];

  const workflowRows: Array<{ status: ApplicationStatus; value: number }> = [
    { status: "Submitted", value: summary.byStatus.SUBMITTED },
    { status: "Under Review", value: summary.byStatus.UNDER_REVIEW },
    { status: "Assessed", value: summary.byStatus.ASSESSED },
    {
      status: "Approved for Payment",
      value: summary.byStatus.APPROVED_FOR_PAYMENT,
    },
    { status: "Paid", value: summary.byStatus.PAID },
    { status: "For Release", value: summary.byStatus.FOR_RELEASE },
    { status: "Released", value: summary.byStatus.RELEASED },
    {
      status: "Returned for Correction",
      value: summary.byStatus.RETURNED_FOR_CORRECTION,
    },
    { status: "Rejected", value: summary.byStatus.REJECTED },
    { status: "Draft", value: summary.byStatus.DRAFT },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="Oversight Dashboard"
        description="View-only monitoring across applicant submissions, BPLO processing, payment verification, and permit issuance."
        badge={<RoleBadge role="VIEW_ONLY" label="View-Only Monitoring" />}
      />

      <InfoBanner
        title="View-only oversight dashboard"
        description="Super Admin can monitor workflow, permit issuance, users, and BPLO activity without approve, reject, assess, verify, prepare, or release controls."
        variant="readOnly"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Workflow Snapshot"
          description="Current application counts grouped by status for read-only oversight."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {workflowRows.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.status} />
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {row.value.toLocaleString("en-PH")}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Oversight Notes"
          description="Key monitoring notes for read-only oversight and reporting."
        >
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Applicant and BPLO operational workflows remain unchanged. This dashboard surfaces read-only oversight metrics.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Monitoring emphasis: application types, overall volume, releases, user counts, and BPLO activity logs.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Super Admin remains view-only for operations. No approve, reject, assess, verify, prepare, or release controls are exposed here.
            </div>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
