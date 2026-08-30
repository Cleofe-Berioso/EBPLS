import Link from "next/link";
import { ClipboardCheck, ShieldAlert, ShieldX, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { RoleBadge } from "@/components/ui/role-badge";
import { actionButtonStyles } from "@/components/ui/action-button";
import { DashboardQueueCard } from "@/components/ui/dashboard-queue-card";
import { DashboardPieChart } from "@/components/ui/dashboard-pie-chart";
import { DashboardBarChart } from "@/components/ui/dashboard-bar-chart";
import { DashboardLineChart } from "@/components/ui/dashboard-line-chart";
import { DashboardHorizontalBarChart } from "@/components/ui/dashboard-horizontal-bar-chart";
import { DASHBOARD_CHART_COLORS } from "@/components/ui/dashboard-chart-card";
import {
  getDepartmentHeadDashboardMetrics,
  getDepartmentHeadDashboardSummary,
} from "@/lib/department-head-dashboard";

export default async function DepartmentHeadDashboardPage() {
  const [summary, metrics] = await Promise.all([
    getDepartmentHeadDashboardSummary(),
    getDepartmentHeadDashboardMetrics(),
  ]);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Department Head"
        title="Department Head Dashboard"
        description="Operational view of evaluations, compliance decisions, and flagged businesses."
        badge={<RoleBadge roleType="VIEW_ONLY" label="Read-only Dashboard" />}
        showHeroWatermark
      />

      <SectionCard title="Action Required Now" description="Priority queues needing Department Head attention.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardQueueCard
            title="Application Approvals"
            description="BPLO-approved applications awaiting decision."
            count={summary.pendingApplicationApprovals}
            href="/department-head/application-approval"
            tone="info"
            icon={<ClipboardCheck className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Revocation Recommendations"
            description="Cases ready for Department Head revocation decision."
            count={summary.revocationRecommendations}
            href="/department-head/permit-to-revoke"
            tone="warning"
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Flagged Cases"
            description="Non-compliant cases awaiting revocation decision."
            count={summary.pendingFlaggedCases}
            href="/department-head/permit-to-revoke"
            tone="danger"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Restrictions List"
            description="Businesses under active restriction."
            count={summary.businessesUnderRestriction}
            href="/department-head/revoke-permit-list"
            tone="success"
            icon={<ShieldX className="h-4 w-4" />}
          />
        </div>
      </SectionCard>

      <SectionCard title="Key Metrics" description="Current Department Head decision and review workload.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/department-head/application-approval" className="block">
            <StatCard
              title="Pending Application Approvals"
              value={summary.pendingApplicationApprovals.toLocaleString("en-PH")}
              subtitle="Applications awaiting evaluation"
              icon={<ClipboardCheck className="h-5 w-5" />}
              tone="green"
            />
          </Link>
          <Link href="/department-head/permit-to-revoke" className="block">
            <StatCard
              title="Pending Flagged Cases"
              value={summary.pendingFlaggedCases.toLocaleString("en-PH")}
              subtitle="Verified non-compliant cases in review"
              icon={<ShieldAlert className="h-5 w-5" />}
              tone="amber"
            />
          </Link>
          <Link href="/department-head/revoke-permit-list" className="block">
            <StatCard
              title="Businesses Under Restriction"
              value={summary.businessesUnderRestriction.toLocaleString("en-PH")}
              subtitle="Revocation approved"
              icon={<ShieldX className="h-5 w-5" />}
              tone="red"
            />
          </Link>
          <StatCard
            title="Revocation Recommendations"
            value={summary.revocationRecommendations.toLocaleString("en-PH")}
            subtitle="Ready for Department Head decision"
            icon={<AlertCircle className="h-5 w-5" />}
            tone="blue"
          />
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardPieChart
          title="Evaluation Decisions Overview"
          description="Department Head decisions from application approval flow."
          data={metrics.evaluationDecisionsOverview}
          error={null}
          emptyTitle="No evaluation decisions available yet."
        />
        <DashboardBarChart
          title="Applications Awaiting Evaluation"
          description="Pending Department Head evaluations grouped by application type."
          data={metrics.applicationsAwaitingEvaluation}
          barLabel="Pending Evaluations"
          error={null}
          emptyTitle="No applications awaiting evaluation."
        />
        <DashboardLineChart
          title="Compliance Actions Trend"
          description="Daily Department Head compliance actions (verified compliant/non-compliant and revocation decisions)."
          data={metrics.complianceActionsTrend}
          series={[
            { key: "verifiedCompliant", label: "Verified Compliant", color: DASHBOARD_CHART_COLORS[0] },
            { key: "verifiedNonCompliant", label: "Verified Non-Compliant", color: DASHBOARD_CHART_COLORS[4] },
            { key: "revocationApproved", label: "Revocation Approved", color: DASHBOARD_CHART_COLORS[3] },
            { key: "revocationDenied", label: "Revocation Denied", color: DASHBOARD_CHART_COLORS[2] },
          ]}
          error={null}
          emptyTitle="No compliance action records yet."
        />
        <DashboardHorizontalBarChart
          title="Flagged Businesses by Barangay"
          description="Businesses from Department Head-verified non-compliant inspections, grouped by barangay."
          data={metrics.flaggedBusinessesByBarangay}
          barLabel="Flagged Businesses"
          error={null}
          emptyTitle="No flagged businesses by barangay yet."
        />
      </div>

      <SectionCard
        title="Workflow Guardrails"
        description="Dashboard is view-only and does not perform approval, verification, or revocation actions."
        action={
          <Link href="/department-head/application-approval" className={actionButtonStyles("secondary", "sm")}>
            Open Evaluation Queue
          </Link>
        }
      >
        <p className="text-sm text-[var(--ink-muted)]">
          This dashboard reads existing records only. Actions like approve, return, reject, verify, and revocation decisions
          remain in their dedicated Department Head workflow pages.
        </p>
      </SectionCard>
    </section>
  );
}
