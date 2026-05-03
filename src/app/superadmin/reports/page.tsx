import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { SuperAdminLocationReport } from "@/components/superadmin/superadmin-location-report";
import { listSuperAdminBusinessLocations } from "@/lib/business-location";
import { getSuperAdminReportsSummary } from "@/lib/superadmin-data";

export default async function SuperAdminReportsPage() {
  const [reports, locationRows] = await Promise.all([
    getSuperAdminReportsSummary(),
    listSuperAdminBusinessLocations(),
  ]);
  const totalNew = reports.applicationsByType.find((row) => row.type === "NEW")?.count ?? 0;
  const totalRenewal = reports.applicationsByType.find((row) => row.type === "RENEWAL")?.count ?? 0;
  const totalClosure = reports.applicationsByType.find((row) => row.type === "CLOSURE")?.count ?? 0;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="Reports"
        description="View-only reporting cards, grouped summaries, and Business Location monitoring sourced from existing live records."
        badge={<RoleBadge role="VIEW_ONLY" label="Read-Only Reports" />}
      />

      <InfoBanner
        title="View-only monitoring"
        description="Reports reflect current stored records only. The map report remains read-only, with no operational actions available."
        variant="readOnly"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total New"
          value={totalNew.toLocaleString("en-PH")}
          subtitle="All new application records"
          tone="blue"
        />
        <StatCard
          title="Total Renewal"
          value={totalRenewal.toLocaleString("en-PH")}
          subtitle="All renewal application records"
          tone="amber"
        />
        <StatCard
          title="Total Closure"
          value={totalClosure.toLocaleString("en-PH")}
          subtitle="All closure application records"
          tone="slate"
        />
        <StatCard
          title="Released Permits"
          value={reports.releasedPermits.toLocaleString("en-PH")}
          subtitle="Released business permits"
          tone="green"
        />
        <StatCard
          title="BPLO Activity Count"
          value={reports.bploActivityCount.toLocaleString("en-PH")}
          subtitle="Recorded BPLO history actions"
          tone="slate"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Applications by Status"
          description="Distribution across the current workflow stages."
        >
          {reports.applicationsByStatus.length === 0 ? (
            <EmptyState
              title="No records available yet"
              description="This section will populate as applications are processed."
            />
          ) : (
            <div className="space-y-2">
              {reports.applicationsByStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{row.status}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {row.count.toLocaleString("en-PH")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Applications by Type"
          description="Grouped totals for new, renewal, and closure records."
        >
          {reports.applicationsByType.length === 0 ? (
            <EmptyState
              title="No records available yet"
              description="This section will populate as application records are created."
            />
          ) : (
            <div className="space-y-2">
              {reports.applicationsByType.map((row) => (
                <div
                  key={row.type}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{row.type}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {row.count.toLocaleString("en-PH")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SuperAdminLocationReport rows={locationRows} />
    </section>
  );
}
