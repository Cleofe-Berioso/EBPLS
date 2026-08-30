import Link from "next/link";
import { Clock, FileText, FileWarning, Wallet } from "lucide-react";
import { notFound } from "next/navigation";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { StatusBadge } from "@/components/applicant/status-badge";
import {
  applicantListCardClass,
  applicantMobileRecordCardClass,
  applicantTableClass,
} from "@/components/applicant/applicant-ui-styles";
import { ApplicationProgressOverview } from "@/components/applicant/application-progress-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardGaugeCard } from "@/components/ui/dashboard-gauge-card";
import { DashboardQueueCard } from "@/components/ui/dashboard-queue-card";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { actionButtonStyles } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireApplicantSession } from "@/lib/applicant-api";
import { getApplicantDashboardMetrics } from "@/lib/applicant-dashboard";

export default async function ApplicantDashboard() {
  const session = await requireApplicantSession();
  if (!session) {
    notFound();
  }

  const metrics = await getApplicantDashboardMetrics(session.user.id);
  const latestApplication = metrics.latestApplication;

  return (
    <section className="ui-page-stack pb-2">
      <PageHeader
        eyebrow="Applicant"
        title="My Dashboard"
        description="Track permit validity, application progress, and your current workflow status."
        badge={<RoleBadge roleType="APPLICANT" />}
        showHeroWatermark
      />

      <InfoBanner
        title="Read-only dashboard"
        description="This page shows your own application records only. Viewing it does not change any application, permit, payment, or business data."
        variant="readOnly"
      />

      <SectionCard title="Action Required Now" description="Items that may need your attention.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardQueueCard
            title="Returned for Correction"
            description="Applications that need updates before resubmission."
            count={metrics.summary.returnedApplications}
            href="/applicant/my-applications"
            tone="danger"
            icon={<FileWarning className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Pending Applications"
            description="Applications still moving through review."
            count={metrics.summary.pendingApplications}
            href="/applicant/my-applications"
            tone="info"
            icon={<Clock className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Processing"
            description="Approved, paid, or for release."
            count={metrics.summary.processingApplications}
            href="/applicant/my-applications"
            tone="warning"
            icon={<Wallet className="h-4 w-4" />}
          />
          <DashboardQueueCard
            title="Draft / New Filing"
            description="Start or continue an application."
            count={metrics.summary.totalApplications}
            href="/applicant/application"
            tone="success"
            icon={<FileText className="h-4 w-4" />}
          />
        </div>
      </SectionCard>

      <SectionCard title="Application Summary" description="Quick overview of your current applications.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardSummaryCard
            title="Total Applications"
            value={String(metrics.summary.totalApplications)}
            subtitle="All filings owned by you"
            tone="blue"
          />
          <DashboardSummaryCard
            title="Pending Applications"
            value={String(metrics.summary.pendingApplications)}
            subtitle="Still in workflow"
            tone="blue"
          />
          <DashboardSummaryCard
            title="Returned Applications"
            value={String(metrics.summary.returnedApplications)}
            subtitle="Need correction or resubmission"
            tone="amber"
          />
          <DashboardSummaryCard
            title="Processing Applications"
            value={String(metrics.summary.processingApplications)}
            subtitle="Approved, paid, or for release"
            tone="green"
          />
          <DashboardSummaryCard
            title="Released Permits"
            value={String(metrics.summary.releasedPermits)}
            subtitle="Active released permit records"
            tone="green"
          />
          <DashboardSummaryCard
            title="Closure Applications"
            value={String(metrics.summary.closureApplications)}
            subtitle="Closure filings on record"
            tone="red"
          />
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard title="Permit Validity Tracking" description="Only released permits count as active permits.">
          {metrics.permitValidity.hasActivePermit && metrics.permitValidity.expirationDate ? (
            <div className="space-y-3">
              <DashboardGaugeCard
                title="Active Permit Validity Remaining"
                description={
                  metrics.permitValidity.isExpired
                    ? `Expired on ${new Date(metrics.permitValidity.expirationDate).toLocaleDateString("en-PH")}`
                    : `Expires on ${new Date(metrics.permitValidity.expirationDate).toLocaleDateString("en-PH")}`
                }
                value={metrics.permitValidity.daysRemaining ?? 0}
                max={metrics.permitValidity.totalValidityDays ?? 365}
                unit="Days remaining"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard
                  title="Permit Number"
                  value={metrics.permitValidity.permitNumber ?? "-"}
                  subtitle="Latest released permit"
                  tone="blue"
                />
                <StatCard
                  title="Validity State"
                  value={metrics.permitValidity.isExpired ? "Expired" : `${metrics.permitValidity.daysRemaining ?? 0} Days`}
                  subtitle={metrics.permitValidity.applicationNumber ? `Application ${metrics.permitValidity.applicationNumber}` : ""}
                  tone={metrics.permitValidity.isExpired ? "red" : "green"}
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title="No active permit available yet."
              description="A released permit will appear here once your application is released and active."
            />
          )}
        </SectionCard>

        <SectionCard title="Latest Application Status" description="Current application, payment, and release state.">
          {latestApplication ? (
            <div className="space-y-3">
              <div className={`${applicantListCardClass} flex flex-wrap items-start justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-[var(--ink-muted)]">{latestApplication.applicationNumber}</p>
                  <p className="mt-1 text-base font-semibold text-[var(--foreground)]">{latestApplication.businessName}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{latestApplication.applicationType}</p>
                  <p className="mt-1.5 text-sm text-[var(--ink-muted)]">Submitted: {latestApplication.dateSubmitted}</p>
                </div>
                <StatusBadge status={latestApplication.status} />
              </div>
              <InfoBanner
                title={latestApplication.nextAction.label}
                description={latestApplication.nextAction.detail}
                variant={latestApplication.nextAction.variant}
                action={
                  <Link
                    href={latestApplication.nextAction.href}
                    className={actionButtonStyles(latestApplication.nextAction.variant === "warning" ? "warning" : "secondary", "sm")}
                  >
                    {latestApplication.nextAction.cta}
                  </Link>
                }
              />
            </div>
          ) : (
            <EmptyState
              title="No applications submitted yet."
              description="Start a New, Renewal, or Closure filing to track progress here."
              action={
                <Link href="/applicant/application" className={actionButtonStyles("primary", "sm")}>
                  Start application
                </Link>
              }
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Application Progress Overview" description="Track the workflow stage of your most recent application.">
        <ApplicationProgressOverview application={latestApplication} />
      </SectionCard>

      <SectionCard title="Recent Applications" description="Your most recent filings at a glance.">
        <ResponsiveDataTable
          title="Recent Application Records"
          description="Review the latest owned applications without leaving the dashboard."
          table={
            <table className={applicantTableClass}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Application Number</th>
                  <th>Business Name</th>
                  <th>Application Type</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentApplications.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="font-medium">{row.applicationNumber}</td>
                    <td>{row.businessName}</td>
                    <td>{row.applicationType}</td>
                    <td className="text-[var(--ink-muted)]">{row.dateSubmitted}</td>
                    <td>
                      <Link href={`/applicant/my-applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {metrics.recentApplications.length === 0 ? (
                  <tr>
                    <td className="py-6 text-[var(--ink-muted)]" colSpan={6}>
                      No applications submitted yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          }
          mobile={
            metrics.recentApplications.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No applications submitted yet."
                  description="This list will appear after you file your first application."
                />
              </div>
            ) : (
              <div className="space-y-2.5 p-3.5">
                {metrics.recentApplications.map((row) => (
                  <article key={row.id} className={applicantMobileRecordCardClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-[var(--ink-muted)]">{row.applicationNumber}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{row.businessName}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-[var(--ink-muted)]">{row.applicationType}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--ink-muted)]">Submitted: {row.dateSubmitted}</p>
                    <div className="mt-2.5">
                      <Link href={`/applicant/my-applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                        View Details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        />
      </SectionCard>

      <SectionCard title="Primary Actions" description="Choose your next primary action.">
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/applicant/application" className={actionButtonStyles("primary", "md", "w-full")}>
            File New Application
          </Link>
          <Link href="/applicant/my-applications" className={actionButtonStyles("secondary", "md", "w-full")}>
            View All Applications
          </Link>
        </div>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">Renewal and Closure require an eligible released business record.</p>
      </SectionCard>
    </section>
  );
}
