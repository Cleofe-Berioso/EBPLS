import Link from "next/link";
import { ClipboardCheck, ShieldAlert, ShieldX, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { RoleBadge } from "@/components/ui/role-badge";
import { actionButtonStyles } from "@/components/ui/action-button";
import { DashboardPieChart } from "@/components/ui/dashboard-pie-chart";
import { DashboardBarChart } from "@/components/ui/dashboard-bar-chart";
import { DashboardLineChart } from "@/components/ui/dashboard-line-chart";
import { DashboardHorizontalBarChart } from "@/components/ui/dashboard-horizontal-bar-chart";
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
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Department Head Dashboard"
        description="Operational view of evaluations, compliance decisions, and flagged businesses."
        badge={<RoleBadge role="VIEW_ONLY" label="Read-only Dashboard" />}
        eyebrowClassName="text-amber-700"
      />

      <SectionCard title="Operational Summary" description="Current Department Head decision and review workload.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            tone="slate"
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
            { key: "verifiedCompliant", label: "Verified Compliant", color: "#0f766e" },
            { key: "verifiedNonCompliant", label: "Verified Non-Compliant", color: "#dc2626" },
            { key: "revocationApproved", label: "Revocation Approved", color: "#ea580c" },
            { key: "revocationDenied", label: "Revocation Denied", color: "#2563eb" },
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
        <p className="text-sm text-slate-600">
          This dashboard reads existing records only. Actions like approve, return, reject, verify, and revocation decisions
          remain in their dedicated Department Head workflow pages.
        </p>
      </SectionCard>
    </section>
  );
}
