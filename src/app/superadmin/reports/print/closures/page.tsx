import { notFound } from "next/navigation";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { buildReportMetadata, APPLICATION_STATUS_OPTIONS } from "@/lib/printable-reports";
import {
  getBusinessClosureReport,
  type BusinessClosureReportFilters,
} from "@/lib/superadmin-data";
import { ReportPageHeader } from "@/components/print/reports/report-page-header";
import { ReportSummaryCard } from "@/components/print/reports/report-summary-card";
import { ReportTable } from "@/components/print/reports/report-table";
import { ReportEmptyState } from "@/components/print/reports/report-empty-state";

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    status?: string;
  }>;
}

const COLUMNS = [
  { key: "applicationNumber", label: "Application No.", className: "font-mono text-xs whitespace-nowrap" },
  { key: "businessName", label: "Business Name" },
  { key: "owner", label: "Owner" },
  { key: "closureStatus", label: "Closure Status", className: "whitespace-nowrap" },
  { key: "closureCertStatus", label: "Closure Certificate", className: "whitespace-nowrap" },
  { key: "submittedDate", label: "Submitted", className: "whitespace-nowrap" },
  { key: "releasedDate", label: "Released Date", className: "whitespace-nowrap" },
];

export default async function BusinessClosureReportPage({ searchParams }: PageProps) {
  const session = await requireSuperAdminSession();
  if (!session) notFound();

  const params = await searchParams;
  const filters: BusinessClosureReportFilters = {
    from: params.from,
    to: params.to,
    status: params.status,
  };

  const rows = await getBusinessClosureReport(filters);

  const meta = buildReportMetadata({
    title: "Business Closure Report",
    generatedBy: session.user.name ?? "Super Admin",
    dateFrom: params.from,
    dateTo: params.to,
  });

  const releasedCerts = rows.filter((r) => r.closureCertStatus === "Released").length;
  const pendingClosures = rows.filter((r) =>
    !["Released", "Rejected"].includes(r.closureStatus)
  ).length;
  const withCert = rows.filter((r) => r.closureCertStatus !== "Not Issued").length;

  const resetHref = "/superadmin/reports/print/closures";

  return (
    <div className="report-print-container mx-auto max-w-[1200px] space-y-6 p-4 sm:p-8">
      <ReportPageHeader meta={meta} backHref="/superadmin/reports" />

      {/* ── Filter form (screen only) ──────────────────────────────── */}
      <div className="no-print rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Filter Records
        </p>
        <form method="GET" className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-xs font-medium text-slate-600">
              Submitted From
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-xs font-medium text-slate-600">
              Submitted To
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-xs font-medium text-slate-600">
              Closure Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={params.status ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {APPLICATION_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Apply Filters
            </button>
            <a
              href={resetHref}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </a>
          </div>
        </form>
      </div>

      {/* ── Summary ──────────────────────────────────────────────────── */}
      <ReportSummaryCard
        title="Summary"
        items={[
          { label: "Total Closures", value: rows.length, tone: "slate" },
          { label: "Pending", value: pendingClosures, tone: "amber" },
          { label: "With Certificate", value: withCert, tone: "blue" },
          { label: "Certificate Released", value: releasedCerts, tone: "green" },
        ]}
      />

      {/* ── Detail table ─────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <ReportEmptyState description="No closure applications found for the selected filters." />
      ) : (
        <ReportTable
          caption={`${rows.length.toLocaleString("en-PH")} record${rows.length !== 1 ? "s" : ""}`}
          columns={COLUMNS}
          rows={(rows as unknown) as Record<string, unknown>[]}
        />
      )}
    </div>
  );
}
