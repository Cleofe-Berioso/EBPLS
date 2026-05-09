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

  const systemTotalsCards = [
    {
      title: "New Applications",
      value: totalNew.toLocaleString("en-PH"),
      subtitle: "New application records",
      tone: "blue" as const,
    },
    {
      title: "Renewal Applications",
      value: totalRenewal.toLocaleString("en-PH"),
      subtitle: "Renewal application records",
      tone: "amber" as const,
    },
    {
      title: "Closure Applications",
      value: totalClosure.toLocaleString("en-PH"),
      subtitle: "Closure application records",
      tone: "slate" as const,
    },
    {
      title: "Total Users",
      value: summary.totalUsers.toLocaleString("en-PH"),
      subtitle: "Applicant, BPLO, and Super Admin accounts",
      tone: "slate" as const,
    },
  ];

  const mainWorkflowRows: Array<{ status: ApplicationStatus; value: number }> = [
    { status: "Draft", value: summary.byStatus.DRAFT },
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
  ];

  const exceptionStatuses: Array<{ status: ApplicationStatus; value: number }> = [
    {
      status: "Returned for Correction",
      value: summary.byStatus.RETURNED_FOR_CORRECTION,
    },
    { status: "Rejected", value: summary.byStatus.REJECTED },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="SuperAdmin Dashboard"
        description="System statistics, workflow overview, and audit visibility."
        badge={<RoleBadge role="VIEW_ONLY" label="Read-Only Monitoring" />}
      />

      <InfoBanner
        title="Audit View Only"
        description="SuperAdmin can view this application but cannot approve, reject, assess fees, verify payments, or release permits."
        variant="readOnly"
      />

      <SectionCard
        title="System Totals"
        description="Core application and user statistics for system-wide oversight."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systemTotalsCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              tone={card.tone}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Workflow Status"
        description="Exact application workflow statuses with current counts for read-only oversight."
      >
        <div>
          <p className="mb-4 text-sm text-slate-600">
            Draft → Submitted → Under Review → Assessed → Approved for Payment → Paid → For Release → Released
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {mainWorkflowRows.map((row) => (
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
        </div>
      </SectionCard>

      <SectionCard
        title="Exception / Action-Required States"
        description="Applications requiring action or indicating final negative outcome."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {exceptionStatuses.map((row) => (
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
        title="Audit Summary"
        description="System activity overview for monitoring and audit purposes."
      >
        <div className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Applications</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {summary.totalApplications.toLocaleString("en-PH")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Released Applications</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {summary.byStatus.RELEASED.toLocaleString("en-PH")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">BPLO Activity Count</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {reports.bploActivityCount.toLocaleString("en-PH")}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
