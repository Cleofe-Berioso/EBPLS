import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FileWarning, PackageCheck, Wallet } from "lucide-react";
import {
  getBploApplicationTypeSummary,
  getBploDashboardSummary,
  listRecentBploSubmissions,
} from "@/lib/bplo-applications";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { StatusBadge } from "@/components/applicant/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/role-badge";

export default async function BploDashboard() {
  const summary = await getBploDashboardSummary();
  const typeSummary = await getBploApplicationTypeSummary();
  const recentSubmissions = await listRecentBploSubmissions();

  const actionRequiredQueues = [
    {
      title: "Returned for Correction",
      description: "Review applicant resubmissions and remarks.",
      count: summary.returnedForCorrection,
      href: "/bplo/applications",
      tone: "red" as const,
      icon: <FileWarning className="h-4 w-4" />,
    },
    {
      title: "Submitted Queue",
      description: "New applications waiting for BPLO review.",
      count: summary.submittedApplications,
      href: "/bplo/applications",
      tone: "blue" as const,
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      title: "Payment Verification",
      description: "Payments waiting for verification or confirmation.",
      count: summary.approvedForPayment,
      href: "/bplo/payment-verification",
      tone: "amber" as const,
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      title: "For Release",
      description: "Approved documents ready for release preparation.",
      count: summary.forRelease,
      href: "/bplo/permit-issuance",
      tone: "green" as const,
      icon: <PackageCheck className="h-4 w-4" />,
    },
  ];

  const pipelineRows = [
    { status: "Draft" as const, value: "N/A" },
    { status: "Submitted" as const, value: summary.submittedApplications },
    { status: "Under Review" as const, value: summary.underReview },
    { status: "Assessed" as const, value: summary.assessedApplications },
    { status: "Approved for Payment" as const, value: summary.approvedForPayment },
    { status: "Paid" as const, value: summary.paidApplications },
    { status: "For Release" as const, value: summary.forRelease },
    { status: "Released" as const, value: summary.releasedPermits },
  ];

  const toneColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    red: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-900",
      icon: "text-rose-600",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      icon: "text-blue-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      icon: "text-amber-600",
    },
    green: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
      icon: "text-emerald-600",
    },
  };

  return (
    <section className="bplo-dashboard mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="BPLO Dashboard"
        description="Quick overview of applications that need BPLO attention."
        badge={<RoleBadge role="BPLO" />}
        eyebrowClassName="text-[#1f3a5f]"
      />

      {/* Action Required Section */}
      <SectionCard
        title="Action Required Now"
        description="Priority queues requiring immediate BPLO attention"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actionRequiredQueues.map((queue) => {
            const colors = toneColors[queue.tone];
            return (
              <div
                key={queue.title}
                className={`flex flex-col rounded-xl border ${colors.border} ${colors.bg} p-4 transition-shadow hover:shadow-sm`}
              >
                <div className="mb-2 flex items-start gap-2">
                  <div className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>{queue.icon}</div>
                  <h4 className={`text-sm font-semibold ${colors.text}`}>{queue.title}</h4>
                </div>
                <p className={`mb-3 text-2xl font-bold ${colors.text}`}>{queue.count}</p>
                <p className={`mb-4 flex-grow text-xs ${colors.text} opacity-75`}>{queue.description}</p>
                <Link href={queue.href} className={actionButtonStyles("primary", "sm", "w-full")}>
                  View Queue
                </Link>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Key Metrics Section */}
      <SectionCard title="Key Metrics" description="Application totals and workload indicators.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardSummaryCard
            title="New Applications"
            value={String(typeSummary.totalNew)}
            subtitle="Total new business permit applications"
            tone="blue"
          />
          <DashboardSummaryCard
            title="Renewal Applications"
            value={String(typeSummary.totalRenewal)}
            subtitle="Total renewal applications"
            tone="amber"
          />
          <DashboardSummaryCard
            title="Closure Applications"
            value={String(typeSummary.totalClosure)}
            subtitle="Total closure requests"
            tone="slate"
          />
          <DashboardSummaryCard
            title="Action Required"
            value={String(summary.returnedForCorrection + summary.submittedApplications + summary.approvedForPayment + summary.forRelease)}
            subtitle="Returned, submitted, payment, and release queues"
            tone="red"
          />
        </div>
      </SectionCard>

      {/* Workflow Pipeline Section */}
      <SectionCard
        title="Workflow Overview"
        description="Draft -> Submitted -> Under Review -> Assessed -> Approved for Payment -> Paid -> For Release -> Released"
      >
        <p className="mb-3 text-xs text-slate-600">
          Returned for Correction is tracked separately in the Action Required Now section.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pipelineRows.map((row) => (
            <div
              key={row.status}
              className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <div className="mb-2">
                <StatusBadge status={row.status as any} />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {typeof row.value === "number" ? row.value.toLocaleString("en-PH") : row.value}
              </p>
              <p className="text-xs text-slate-500">applications</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Recent Submissions Section */}
      <SectionCard title="Recent Activity" description="Most recently filed applications from existing queue data.">
        <div className="space-y-3">
          {recentSubmissions.length > 0 ? (
            recentSubmissions.map((row) => (
              <article key={row.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-shadow hover:shadow-sm">
                <div className="min-w-0 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{row.applicationNumber}</p>
                    <StatusBadge status={row.status as any} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{row.businessName}</p>
                  <p className="text-xs text-slate-500">{row.applicantName} · {row.dateSubmitted}</p>
                </div>
                <Link href={`/bplo/applications`} className={actionButtonStyles("secondary", "sm")}>
                  View
                </Link>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">No recent submissions</p>
              <p className="text-xs text-slate-500">Newly filed applications will appear here</p>
            </div>
          )}
        </div>
      </SectionCard>
    </section>
  );
}
