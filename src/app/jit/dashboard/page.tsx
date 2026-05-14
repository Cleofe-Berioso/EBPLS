import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  FlagTriangleRight,
  ShieldCheck,
  TriangleAlert,
  Activity,
  ArrowRight,
  MapPinned,
} from "lucide-react";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { actionButtonStyles } from "@/components/ui/action-button";
import { DashboardPieChart } from "@/components/ui/dashboard-pie-chart";
import { DashboardLineChart } from "@/components/ui/dashboard-line-chart";
import { DashboardStackedBarChart } from "@/components/ui/dashboard-stacked-bar-chart";
import { requireJitSession } from "@/lib/jit-api";
import { getJitDashboardMetrics, getJitDashboardSummary } from "@/lib/jit-dashboard";

export default async function JitDashboardPage() {
  const session = await requireJitSession();
  if (!session) notFound();

  const [summary, metrics] = await Promise.all([getJitDashboardSummary(), getJitDashboardMetrics()]);

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

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardPieChart
          title="Inspection Results Distribution"
          description="Current JIT inspection outcomes on released businesses only."
          data={metrics.inspectionResultsDistribution}
          emptyTitle="No inspection results available yet."
        />
        <DashboardLineChart
          title="Inspections Conducted Per Week"
          description="Weekly JIT inspection activity based on inspection record creation time."
          data={metrics.inspectionsConductedPerWeek}
          lineLabel="Inspections"
          emptyTitle="No inspections conducted yet."
        />
        <DashboardStackedBarChart
          title="Violations by Business Type"
          description="Non-compliant and verified non-compliant inspection counts by business type."
          data={metrics.violationsByBusinessType}
          categoryKey="label"
          series={[
            { key: "nonCompliant", label: "Non-compliant", color: "#dc2626" },
            { key: "verifiedNonCompliant", label: "Verified non-compliant", color: "#ea580c" },
          ]}
          emptyTitle="No violation records available yet."
        />
        <SectionCard
          title="Inspection Locations Map Summary"
          description="Released-business inspection locations grouped from active permitted business records."
          action={
            <Link href="/jit/business-map" className={actionButtonStyles("secondary", "sm")}>
              Open Business Map
            </Link>
          }
        >
          {metrics.locationSummary.totalInspectionLocations === 0 ? (
            <EmptyState
              title="No inspection locations available yet."
              description="Inspection locations appear here only after business permits are released and location records exist."
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                  title="Total Inspection Locations"
                  value={metrics.locationSummary.totalInspectionLocations.toLocaleString("en-PH")}
                  subtitle="Released businesses available for inspection"
                  icon={<MapPinned className="h-4 w-4" />}
                  tone="blue"
                />
                <StatCard
                  title="Barangays With Locations"
                  value={metrics.locationSummary.barangayCounts.length.toLocaleString("en-PH")}
                  subtitle="Grouped from active released-business locations"
                  icon={<MapPinned className="h-4 w-4" />}
                  tone="green"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Top Barangay Groups</p>
                <div className="mt-3 space-y-2">
                  {metrics.locationSummary.barangayCounts.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span className="text-sm text-slate-700">{row.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{row.value.toLocaleString("en-PH")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </section>
  );
}