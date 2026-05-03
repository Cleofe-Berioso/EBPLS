import Link from "next/link";
import { ClipboardCheck, FileClock, FileWarning, PackageCheck, Wallet } from "lucide-react";
import {
  getBploApplicationTypeSummary,
  getBploDashboardSummary,
  listRecentBploSubmissions,
} from "@/lib/bplo-applications";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { StatusBadge } from "@/components/applicant/status-badge";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { actionButtonStyles } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/role-badge";

export default async function BploDashboard() {
  const summary = await getBploDashboardSummary();
  const typeSummary = await getBploApplicationTypeSummary();
  const recentSubmissions = await listRecentBploSubmissions();

  const pipelineRows = [
    { status: "Submitted" as const, value: summary.submittedApplications },
    { status: "Under Review" as const, value: summary.underReview },
    { status: "Assessed" as const, value: summary.assessedApplications },
    { status: "Approved for Payment" as const, value: summary.approvedForPayment },
    { status: "Paid" as const, value: summary.paidApplications },
    { status: "For Release" as const, value: summary.forRelease },
    { status: "Released" as const, value: summary.releasedPermits },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Dashboard"
        description="Operational overview of the application pipeline from intake, assessment, and payment verification to release."
        badge={<RoleBadge role="BPLO" />}
      />

      <InfoBanner
        title="Queue-focused operational view"
        description="Use this dashboard to monitor intake, Tax Order of Payment readiness, payment verification workload, and release queue volume."
        variant="info"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardSummaryCard title="New Applications" value={String(typeSummary.totalNew)} subtitle="All new application records" tone="blue" />
        <DashboardSummaryCard title="Renewal Applications" value={String(typeSummary.totalRenewal)} subtitle="All renewal application records" tone="amber" />
        <DashboardSummaryCard title="Closure Applications" value={String(typeSummary.totalClosure)} subtitle="All closure application records" tone="slate" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardSummaryCard title="Submitted" value={String(summary.submittedApplications)} subtitle="New intake queue" icon={<ClipboardCheck className="h-5 w-5" />} tone="blue" />
        <DashboardSummaryCard title="Under Review" value={String(summary.underReview)} subtitle="Currently being evaluated" icon={<FileClock className="h-5 w-5" />} tone="amber" />
        <DashboardSummaryCard title="Returned" value={String(summary.returnedForCorrection)} subtitle="Needs applicant correction" icon={<FileWarning className="h-5 w-5" />} tone="red" />
        <DashboardSummaryCard title="Assessed" value={String(summary.assessedApplications)} subtitle="Ready for TOP generation" icon={<Wallet className="h-5 w-5" />} tone="green" />
        <DashboardSummaryCard title="For Release" value={String(summary.forRelease)} subtitle="Prepared documents awaiting release" icon={<PackageCheck className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Workflow Pipeline"
          description="Submitted -> Under Review -> Assessed -> Approved for Payment -> Paid -> For Release -> Released"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pipelineRows.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <StatusBadge status={row.status} />
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {row.value.toLocaleString("en-PH")}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Urgent Work" description="Fast access to operational queues with immediate workload.">
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Returned for correction: {summary.returnedForCorrection}</p>
              <p className="mt-1">Review remarks and monitor resubmissions from applicants.</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">Submitted queue: {summary.submittedApplications}</p>
              <p className="mt-1">Move applications into review to keep intake flowing.</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              <p className="font-semibold">Release queue: {summary.forRelease}</p>
              <p className="mt-1">Prepare or release documents for completed paid applications.</p>
            </div>
            <div className="grid gap-2">
              <Link href="/bplo/applications" className={actionButtonStyles("primary", "sm", "w-full")}>Review Applications Queue</Link>
              <Link href="/bplo/assessment-fees" className={actionButtonStyles("secondary", "sm", "w-full")}>Open Assessment & Fees</Link>
              <Link href="/bplo/payment-verification" className={actionButtonStyles("secondary", "sm", "w-full")}>Open Payment Verification</Link>
              <Link href="/bplo/permit-issuance" className={actionButtonStyles("secondary", "sm", "w-full")}>Open Permit Issuance</Link>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Submissions" description="Most recently filed applications awaiting BPLO attention.">
          <div className="space-y-3">
            {recentSubmissions.map((row) => (
              <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{row.applicationNumber}</p>
                  <StatusBadge status={row.status as any} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{row.businessName}</p>
                <p className="text-xs text-slate-500">{row.applicantName} · {row.dateSubmitted}</p>
              </article>
            ))}
            {recentSubmissions.length === 0 ? (
              <EmptyState
                title="No recent submissions"
                description="This section will populate as new applications are filed."
              />
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Operational Shortcuts" description="Direct links to active queue modules.">
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/bplo/applications" className={actionButtonStyles("primary", "md", "w-full")}>
              Review Applications
            </Link>
            <Link href="/bplo/assessment-fees" className={actionButtonStyles("primary", "md", "w-full")}>
              Assessment & Fees
            </Link>
            <Link href="/bplo/payment-verification" className={actionButtonStyles("primary", "md", "w-full")}>
              Payment Verification
            </Link>
            <Link href="/bplo/permit-issuance" className={actionButtonStyles("primary", "md", "w-full")}>
              Permit Issuance
            </Link>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
