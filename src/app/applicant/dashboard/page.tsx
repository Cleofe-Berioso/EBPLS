import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { StatusBadge } from "@/components/applicant/status-badge";
import { StatusTracker } from "@/components/applicant/status-tracker";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardGaugeCard } from "@/components/ui/dashboard-gauge-card";
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
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="My Dashboard"
        description="Track permit validity, application progress, and your current workflow status."
        badge={<RoleBadge role="APPLICANT" />}
      />

      <InfoBanner
        title="Read-only dashboard"
        description="This page shows your own application records only. Viewing it does not change any application, permit, payment, or business data."
        variant="readOnly"
      />

      <SectionCard title="Application Summary" description="Quick overview of your current applications.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardSummaryCard
            title="Total Applications"
            value={String(metrics.summary.totalApplications)}
            subtitle="All filings owned by you"
            tone="slate"
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
            <div className="space-y-4">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-500">{latestApplication.applicationNumber}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{latestApplication.businessName}</p>
                  <p className="mt-1 text-sm text-slate-600">{latestApplication.applicationType}</p>
                  <p className="mt-2 text-sm text-slate-600">Submitted: {latestApplication.dateSubmitted}</p>
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
        {latestApplication ? (
          <StatusTracker status={latestApplication.status} applicationType={latestApplication.applicationType} />
        ) : (
          <EmptyState
            title="No application progress available yet."
            description="Submit your first application to see the progress tracker here."
          />
        )}
      </SectionCard>

      <SectionCard title="Recent Applications" description="Your most recent filings at a glance.">
        <ResponsiveDataTable
          title="Recent Application Records"
          description="Review the latest owned applications without leaving the dashboard."
          table={
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-4 font-semibold sm:px-6">Status</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Application Number</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Business Name</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Application Type</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Date Submitted</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentApplications.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                    <td className="px-4 py-4 sm:px-6">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900 sm:px-6">{row.applicationNumber}</td>
                    <td className="px-4 py-4 text-slate-700 sm:px-6">{row.businessName}</td>
                    <td className="px-4 py-4 text-slate-700 sm:px-6">{row.applicationType}</td>
                    <td className="px-4 py-4 text-slate-600 sm:px-6">{row.dateSubmitted}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <Link href={`/applicant/my-applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {metrics.recentApplications.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-slate-500 sm:px-6" colSpan={6}>
                      No applications submitted yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          }
          mobile={
            metrics.recentApplications.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No applications submitted yet."
                  description="This list will appear after you file your first application."
                />
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {metrics.recentApplications.map((row) => (
                  <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{row.applicationType}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Submitted: {row.dateSubmitted}</p>
                    <div className="mt-3">
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
        <p className="mt-3 text-sm text-slate-600">Renewal and Closure require an eligible released business record.</p>
      </SectionCard>
    </section>
  );
}
