import Link from "next/link";
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

      {/* ── Printable System Reports ───────────────────────────────── */}
      <SectionCard
        title="Printable System Reports"
        description="Generate, filter, and print official reports. Super Admin access only."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PrintableReportCard
            title="Application Summary"
            description="All application records: type, status, owner, submitted and updated dates."
            href="/superadmin/reports/print/applications"
            tone="blue"
          />
          <PrintableReportCard
            title="Revenue Collection"
            description="Fee assessments, Official Receipt Numbers, amounts assessed and paid."
            href="/superadmin/reports/print/revenue"
            tone="green"
          />
          <PrintableReportCard
            title="Business Registry"
            description="Business records with permit number, validity, type, and current status."
            href="/superadmin/reports/print/business-registry"
            tone="indigo"
          />
          <PrintableReportCard
            title="Business Closure"
            description="Closure applications with certificate status and released dates."
            href="/superadmin/reports/print/closures"
            tone="amber"
          />
          <PrintableReportCard
            title="Inspection Compliance"
            description="JIT inspection records: compliance status, inspector, and Department Head decisions."
            href="/superadmin/reports/print/inspections"
            tone="slate"
          />
          <PrintableReportCard
            title="Audit Trail"
            description="System-wide actor actions across modules — role, action, entity, and status changes."
            href="/superadmin/reports/print/audit-trail"
            tone="purple"
          />
          <PrintableReportCard
            title="SMS Delivery Log"
            description="SMS delivery records with masked phone numbers, provider, and delivery status."
            href="/superadmin/reports/print/sms"
            tone="red"
          />
        </div>
      </SectionCard>
    </section>
  );
}

type CardTone = "blue" | "green" | "indigo" | "amber" | "slate" | "purple" | "red";

const cardToneStyles: Record<CardTone, { border: string; icon: string; title: string; btn: string }> = {
  blue:   { border: "border-blue-200",   icon: "bg-blue-100 text-blue-600",   title: "text-blue-900",   btn: "border-blue-400 bg-blue-600 hover:bg-blue-700 text-white" },
  green:  { border: "border-green-200",  icon: "bg-green-100 text-green-600",  title: "text-green-900",  btn: "border-green-400 bg-green-600 hover:bg-green-700 text-white" },
  indigo: { border: "border-indigo-200", icon: "bg-indigo-100 text-indigo-600", title: "text-indigo-900", btn: "border-indigo-400 bg-indigo-600 hover:bg-indigo-700 text-white" },
  amber:  { border: "border-amber-200",  icon: "bg-amber-100 text-amber-600",  title: "text-amber-900",  btn: "border-amber-400 bg-amber-600 hover:bg-amber-700 text-white" },
  slate:  { border: "border-slate-200",  icon: "bg-slate-100 text-slate-600",  title: "text-slate-900",  btn: "border-slate-400 bg-slate-600 hover:bg-slate-700 text-white" },
  purple: { border: "border-purple-200", icon: "bg-purple-100 text-purple-600", title: "text-purple-900", btn: "border-purple-400 bg-purple-600 hover:bg-purple-700 text-white" },
  red:    { border: "border-red-200",    icon: "bg-red-100 text-red-600",    title: "text-red-900",    btn: "border-red-400 bg-red-600 hover:bg-red-700 text-white" },
};

function PrintableReportCard({
  title,
  description,
  href,
  tone,
}: {
  title: string;
  description: string;
  href: string;
  tone: CardTone;
}) {
  const styles = cardToneStyles[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 ${styles.border} bg-white`}>
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${styles.icon}`}>
        ⬜
      </div>
      <div className="flex-1 space-y-1">
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        <p className="text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <Link
        href={href}
        className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${styles.btn}`}
      >
        Open Report →
      </Link>
    </div>
  );
}
