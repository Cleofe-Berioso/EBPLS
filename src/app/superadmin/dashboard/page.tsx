import { PageHeader } from "@/components/ui/page-header";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardQueueCard } from "@/components/ui/dashboard-queue-card";
import { DashboardLineChart } from "@/components/ui/dashboard-line-chart";
import { DashboardStackedBarChart } from "@/components/ui/dashboard-stacked-bar-chart";
import { DashboardHorizontalBarChart } from "@/components/ui/dashboard-horizontal-bar-chart";
import { DashboardPieChart } from "@/components/ui/dashboard-pie-chart";
import { DashboardGaugeCard } from "@/components/ui/dashboard-gauge-card";
import { DASHBOARD_CHART_COLORS } from "@/components/ui/dashboard-chart-card";
import { Activity, ClipboardList, MessageSquareWarning, Users } from "lucide-react";
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
      tone: "blue" as const,
    },
    {
      title: "Total Users",
      value: summary.totalUsers.toLocaleString("en-PH"),
      subtitle: "Applicant and system role accounts",
      tone: "blue" as const,
    },
    {
      title: "Total Applications",
      value: summary.totalApplications.toLocaleString("en-PH"),
      subtitle: "System-wide application records",
      tone: "blue" as const,
    },
    {
      title: "Released Permits/Certificates",
      value: reports.releasedPermits.toLocaleString("en-PH"),
      subtitle: "Released business permits",
      tone: "green" as const,
    },
  ];

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Super Admin"
        title="IT ADMINISTRATOR Dashboard"
        description="Operational analytics for system activity, workflow volume, compliance, and messaging logs."
        badge={<RoleBadge roleType="VIEW_ONLY" label="Read-Only Monitoring" />}
        showHeroWatermark
      />

      <InfoBanner
        title="Audit View Only"
        description="This dashboard is view-only. It cannot approve, reject, assess, verify payments, release permits, verify inspections, revoke permits, or mutate records."
        variant="readOnly"
      />

      <SectionCard title="Oversight Priorities" description="High-level queues and signals for system monitoring.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardQueueCard
            title="Applications Registry"
            description="System-wide application records available for audit."
            count={summary.totalApplications}
            href="/superadmin/applications"
            tone="info"
            icon={<ClipboardList className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="User Accounts"
            description="Applicant and staff accounts managed in the system."
            count={summary.totalUsers}
            href="/superadmin/users"
            tone="success"
            icon={<Users className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Recent Activity"
            description="Application history entries recorded in the last 7 days."
            count={metrics.systemHealth.recentActivityVolume}
            href="/superadmin/activities"
            tone="warning"
            icon={<Activity className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Failed SMS"
            description="SMS delivery failures recorded in the last 7 days."
            count={metrics.systemHealth.recentFailedSmsCount}
            href="/superadmin/reports"
            tone="danger"
            icon={<MessageSquareWarning className="h-4 w-4" />}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="System Totals"
        description="Core system totals preserved for high-level oversight."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            { key: "applicant", label: "Applicant", color: DASHBOARD_CHART_COLORS[2] },
            { key: "bplo", label: "BPLO", color: DASHBOARD_CHART_COLORS[0] },
            { key: "departmentHead", label: "Department Head", color: DASHBOARD_CHART_COLORS[3] },
            { key: "jit", label: "JIT", color: DASHBOARD_CHART_COLORS[6] },
            { key: "superAdmin", label: "Super Admin", color: DASHBOARD_CHART_COLORS[5] },
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
            { key: "bploReview", label: "BPLO Review", color: DASHBOARD_CHART_COLORS[2] },
            { key: "bploAssessment", label: "BPLO Assessment", color: DASHBOARD_CHART_COLORS[6] },
            { key: "bploPayment", label: "BPLO Payment", color: DASHBOARD_CHART_COLORS[3] },
            { key: "bploRelease", label: "BPLO Release", color: DASHBOARD_CHART_COLORS[0] },
            { key: "departmentHeadApproval", label: "Department Head Approval", color: DASHBOARD_CHART_COLORS[5] },
            { key: "jitInspection", label: "JIT Inspection", color: DASHBOARD_CHART_COLORS[4] },
          ]}
          emptyTitle="No application volume data available yet."
          emptyDescription="Stage volume will appear once applications and inspections are available."
        />

        <DashboardLineChart
          title="Transaction / Activity Logs Volume"
          description="Daily trend for submissions, approvals, returns/rejections, inspections, payment verification, permit releases, and SMS outcomes."
          data={metrics.transactionVolume}
          series={[
            { key: "logins", label: "Logins (if tracked)", color: DASHBOARD_CHART_COLORS[5] },
            { key: "submitted", label: "Applications Submitted", color: DASHBOARD_CHART_COLORS[2] },
            { key: "approvals", label: "Approvals", color: DASHBOARD_CHART_COLORS[0] },
            { key: "returnsRejections", label: "Returns/Rejections", color: DASHBOARD_CHART_COLORS[4] },
            { key: "inspections", label: "Inspections", color: DASHBOARD_CHART_COLORS[6] },
            { key: "paymentVerification", label: "Payment Verification", color: DASHBOARD_CHART_COLORS[3] },
            { key: "permitReleases", label: "Permit Releases", color: DASHBOARD_CHART_COLORS[1] },
            { key: "smsSent", label: "SMS Sent", color: DASHBOARD_CHART_COLORS[0] },
            { key: "smsFailed", label: "SMS Failed", color: DASHBOARD_CHART_COLORS[4] },
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
            { key: "releasedPermits", label: "Approved/Released Permits", color: DASHBOARD_CHART_COLORS[0] },
            { key: "verifiedNonCompliant", label: "Verified Non-Compliant", color: DASHBOARD_CHART_COLORS[3] },
            { key: "revokedBusinesses", label: "Revoked Businesses", color: DASHBOARD_CHART_COLORS[4] },
            { key: "restrictedRenewals", label: "Restricted/Disabled Renewals", color: DASHBOARD_CHART_COLORS[5] },
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            tone="blue"
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
