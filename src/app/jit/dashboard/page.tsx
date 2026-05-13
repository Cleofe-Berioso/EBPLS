import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, FlagTriangleRight, ShieldCheck, TriangleAlert, Activity, ArrowRight } from "lucide-react";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";
import { requireJitSession } from "@/lib/jit-api";
import { getJitDashboardSummary } from "@/lib/jit-dashboard";

export default async function JitDashboardPage() {
  const session = await requireJitSession();
  if (!session) notFound();

  const summary = await getJitDashboardSummary();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="JIT"
        title="JIT Dashboard"
        description="Inspection summary and compliance indicators for active released businesses."
        badge={<RoleBadge role="VIEW_ONLY" label="JIT" />}
        actions={
          <>
            <Link href="/jit/inspect-a-business" className={actionButtonStyles("primary", "sm")}>
              Go to Inspection Queue
            </Link>
            <Link href="/jit/business-map" className={actionButtonStyles("secondary", "sm")}>
              View Business Map
            </Link>
          </>
        }
      />

      <InfoBanner
        title="Read-only dashboard"
        description="Metrics below are derived from active released businesses and JIT inspection records only. No dashboard actions mutate data."
        variant="readOnly"
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            <Activity className="h-3.5 w-3.5" />
            {summary.visibleBusinessCount} visible businesses
          </span>
        }
      />

      <SectionCard title="Summary Cards" description="Live counts from released-business and inspection data.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardSummaryCard
            title="Inspection Summary"
            value={summary.inspectionSummary.toLocaleString("en-PH")}
            subtitle="Total inspections submitted by JIT"
            icon={<BarChart3 className="h-4 w-4" />}
            tone="slate"
          />
          <DashboardSummaryCard
            title="High-Risk Count"
            value={summary.highRiskCount.toLocaleString("en-PH")}
            subtitle="Latest inspection is NON_COMPLIANT or REVOCATION_REVIEW"
            icon={<TriangleAlert className="h-4 w-4" />}
            tone="red"
          />
          <DashboardSummaryCard
            title="Flagged Businesses Count"
            value={summary.flaggedBusinessesCount.toLocaleString("en-PH")}
            subtitle="Latest inspection is flagged or revoked"
            icon={<FlagTriangleRight className="h-4 w-4" />}
            tone="amber"
          />
          <DashboardSummaryCard
            title="Compliant Count"
            value={summary.compliantCount.toLocaleString("en-PH")}
            subtitle="Businesses with latest COMPLIANT inspection"
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="green"
          />
          <DashboardSummaryCard
            title="Non-Compliant Count"
            value={summary.nonCompliantCount.toLocaleString("en-PH")}
            subtitle="NON_COMPLIANT and REVOCATION_REVIEW records"
            icon={<ArrowRight className="h-4 w-4" />}
            tone="blue"
          />
        </div>
      </SectionCard>

      <SectionCard title="Risk Note" description="UI-only risk grouping based on the latest inspection state.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">High Risk</p>
            <p className="mt-1 text-sm leading-6 text-rose-800">Latest inspection is NON_COMPLIANT or REVOCATION_REVIEW.</p>
            <p className="mt-3 text-2xl font-semibold text-rose-900">{summary.highRiskBusinessCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Medium Risk</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">Has previous inspection history but is not currently flagged.</p>
            <p className="mt-3 text-2xl font-semibold text-amber-900">{summary.mediumRiskBusinessCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Low Risk</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">No non-compliant inspection history visible to JIT.</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-900">{summary.lowRiskBusinessCount}</p>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}