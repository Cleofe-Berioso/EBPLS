import { PageHeader } from "@/components/ui/page-header";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardLineChart } from "@/components/ui/dashboard-line-chart";
import { DashboardStackedBarChart } from "@/components/ui/dashboard-stacked-bar-chart";
import { DashboardHorizontalBarChart } from "@/components/ui/dashboard-horizontal-bar-chart";
import { DashboardPieChart } from "@/components/ui/dashboard-pie-chart";
import { DashboardGaugeCard } from "@/components/ui/dashboard-gauge-card";
import {
  getSuperAdminDashboardSummary,
  getSuperAdminReportsSummary,
} from "@/lib/superadmin-data";
import { getSuperAdminDashboardMetrics } from "@/lib/superadmin-dashboard";

export default async function SuperAdminDashboard() {
  const [summary, reports, metrics] = await Promise.all([
    getSuperAdminDashboardSummary(),
    getSuperAdminReportsSummary(),
    getSuperAdminDashboardMetrics(),
  ]);

  const totalNew = reports.applicationsByType.find((row) => row.type === "NEW")?.count ?? 0;
  const totalRenewal = reports.applicationsByType.find((row) => row.type === "RENEWAL")?.count ?? 0;
  const totalClosure = reports.applicationsByType.find((row) => row.type === "CLOSURE")?.count ?? 0;
  const dbHealthMax = 1;
  const dbHealthValue = metrics.systemHealth.databaseReachable ? 1 : 0;
  const lastCheckLabel = new Date(metrics.systemHealth.lastSuccessfulDashboardCheck).toLocaleString("en-PH");

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
      subtitle: "Applicant and system role accounts",
      tone: "slate" as const,
    },
    {
      title: "Total Applications",
      value: summary.totalApplications.toLocaleString("en-PH"),
      subtitle: "System-wide application records",
      tone: "slate" as const,
    },
    {
      title: "Released Permits/Certificates",
      value: reports.releasedPermits.toLocaleString("en-PH"),
      subtitle: "Released business permits",
      tone: "green" as const,
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrowClassName="text-slate-600"
        title="IT ADMINISTRATOR Dashboard"
        description="Operational analytics for system activity, workflow volume, compliance, and messaging logs."
        badge={<RoleBadge role="VIEW_ONLY" label="Read-Only Monitoring" />}
      />

      <InfoBanner
        title="Audit View Only"
        description="This dashboard is view-only. It cannot approve, reject, assess, verify payments, release permits, verify inspections, revoke permits, or mutate records."
        variant="readOnly"
      />

      <SectionCard
        title="System Totals"
        description="Core system totals preserved for high-level oversight."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardLineChart
          title="System-Wide User Activity"
          description="Daily activity log volume by actor role. Uses application history logs as a proxy for daily active users."
          data={metrics.userActivityByRole}
          series={[
            { key: "applicant", label: "Applicant", color: "#2563eb" },
            { key: "bplo", label: "BPLO", color: "#0f766e" },
            { key: "departmentHead", label: "Department Head", color: "#ea580c" },
            { key: "jit", label: "JIT", color: "#7c3aed" },
            { key: "superAdmin", label: "Super Admin", color: "#334155" },
          ]}
          emptyTitle="No user activity logs available yet."
          emptyDescription="System user activity will appear once workflow history entries are recorded."
        />

        <DashboardStackedBarChart
          title="Application Volume Across System"
          description="Current processing workload by role and stage using existing statuses and inspection records."
          data={metrics.applicationVolumeAcrossSystem}
          categoryKey="stage"
          series={[
            { key: "bploReview", label: "BPLO Review", color: "#2563eb" },
            { key: "bploAssessment", label: "BPLO Assessment", color: "#0891b2" },
            { key: "bploPayment", label: "BPLO Payment", color: "#ea580c" },
            { key: "bploRelease", label: "BPLO Release", color: "#16a34a" },
            { key: "departmentHeadApproval", label: "Department Head Approval", color: "#7c3aed" },
            { key: "jitInspection", label: "JIT Inspection", color: "#dc2626" },
          ]}
          emptyTitle="No application volume data available yet."
          emptyDescription="Stage volume will appear once applications and inspections are available."
        />

        <DashboardLineChart
          title="Transaction / Activity Logs Volume"
          description="Daily trend for submissions, approvals, returns/rejections, inspections, payment verification, permit releases, and SMS outcomes."
          data={metrics.transactionVolume}
          series={[
            { key: "logins", label: "Logins (if tracked)", color: "#64748b" },
            { key: "submitted", label: "Applications Submitted", color: "#2563eb" },
            { key: "approvals", label: "Approvals", color: "#16a34a" },
            { key: "returnsRejections", label: "Returns/Rejections", color: "#dc2626" },
            { key: "inspections", label: "Inspections", color: "#7c3aed" },
            { key: "paymentVerification", label: "Payment Verification", color: "#ea580c" },
            { key: "permitReleases", label: "Permit Releases", color: "#0891b2" },
            { key: "smsSent", label: "SMS Sent", color: "#22c55e" },
            { key: "smsFailed", label: "SMS Failed", color: "#ef4444" },
          ]}
          emptyTitle="No transaction activity available yet."
          emptyDescription="Activity trends will render when history and related logs contain records."
        />

        <DashboardStackedBarChart
          title="Compliance & Revocation Trends"
          description="Released permits, verified non-compliant inspections, revoked businesses, and renewals under revocation-related restriction."
          data={metrics.complianceRevocationTrends}
          categoryKey="metric"
          series={[
            { key: "releasedPermits", label: "Approved/Released Permits", color: "#16a34a" },
            { key: "verifiedNonCompliant", label: "Verified Non-Compliant", color: "#f97316" },
            { key: "revokedBusinesses", label: "Revoked Businesses", color: "#dc2626" },
            { key: "restrictedRenewals", label: "Restricted/Disabled Renewals", color: "#7c3aed" },
          ]}
          emptyTitle="No compliance or revocation records yet."
          emptyDescription="Compliance and revocation trends will appear once inspection and revocation data exists."
        />

        <DashboardLineChart
          title="Business Closure Prevalence"
          description="Monthly closure trend based on closure application timestamps."
          data={metrics.closurePrevalenceTrend}
          lineLabel="Closure Applications"
          emptyTitle="No closure application trends yet."
          emptyDescription="Closure trend will appear once closure applications are filed."
        />

        <DashboardHorizontalBarChart
          title="Most Prevalent Business Categories by Area"
          description="Top area/category combinations, grouped by barangay with fallback to Unspecified Category."
          data={metrics.prevalentBusinessCategoriesByArea}
          barLabel="Business Records"
          emptyTitle="No business category data available yet."
          emptyDescription="Category prevalence appears after business profile and location records are available."
        />

        <DashboardPieChart
          title="SMS Sent and Failed"
          description="Distribution of SMS delivery statuses from SmsDeliveryLog."
          data={metrics.smsDeliveryDistribution}
          emptyTitle="No SMS delivery logs available yet."
          emptyDescription="SMS status analytics will render once delivery logs are recorded."
        />

        <SectionCard
          title="Error & Exception Logs"
          description="System error tracking from persisted error logs."
        >
          {metrics.errorLogConfigured ? null : (
            <EmptyState
              title="Error log tracking is not configured yet."
              description="No error/exception log table is currently available in this deployment."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="System Health Indicators"
        description="Internal indicators only; this is not full server uptime or infrastructure monitoring."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardGaugeCard
            title="Database Reachability"
            description={metrics.systemHealth.databaseReachable ? "Database ping succeeded." : "Database ping failed."}
            value={dbHealthValue}
            max={dbHealthMax}
            unit="Reachable"
          />
          <StatCard
            title="Last Successful Dashboard Check"
            value={lastCheckLabel}
            subtitle="Last aggregation run"
            tone="slate"
          />
          <StatCard
            title="Recent Failed SMS (7 days)"
            value={metrics.systemHealth.recentFailedSmsCount.toLocaleString("en-PH")}
            subtitle="SmsDeliveryLog status = FAILED"
            tone={metrics.systemHealth.recentFailedSmsCount > 0 ? "red" : "green"}
          />
          <StatCard
            title="Recent Activity Volume (7 days)"
            value={metrics.systemHealth.recentActivityVolume.toLocaleString("en-PH")}
            subtitle="Application history entries"
            tone="blue"
          />
        </div>
      </SectionCard>
    </section>
  );
}
