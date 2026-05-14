import { notFound } from "next/navigation";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { buildReportMetadata, SMS_STATUS_OPTIONS } from "@/lib/printable-reports";
import {
  getSmsDeliveryReport,
  type SmsDeliveryReportFilters,
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
  { key: "date", label: "Date", className: "whitespace-nowrap" },
  { key: "applicationNumber", label: "Application No.", className: "font-mono text-xs whitespace-nowrap" },
  { key: "maskedPhone", label: "Phone (Masked)", className: "font-mono text-xs whitespace-nowrap" },
  { key: "provider", label: "Provider", className: "whitespace-nowrap" },
  { key: "status", label: "Status", className: "whitespace-nowrap" },
  { key: "messageBody", label: "Message" },
];

export default async function SmsDeliveryReportPage({ searchParams }: PageProps) {
  const session = await requireSuperAdminSession();
  if (!session) notFound();

  const params = await searchParams;
  const filters: SmsDeliveryReportFilters = {
    from: params.from,
    to: params.to,
    status: params.status,
  };

  const rows = await getSmsDeliveryReport(filters);

  const meta = buildReportMetadata({
    title: "SMS Delivery Report",
    generatedBy: session.user.name ?? "Super Admin",
    dateFrom: params.from,
    dateTo: params.to,
  });

  const totalSent = rows.filter((r) => r.status === "SENT").length;
  const totalFailed = rows.filter((r) => r.status === "FAILED").length;
  const totalSkipped = rows.filter((r) => r.status === "SKIPPED").length;

  const resetHref = "/superadmin/reports/print/sms";

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
              From Date
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
              To Date
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
              Delivery Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={params.status ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {SMS_STATUS_OPTIONS.map((opt) => (
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

      {/* ── Summary cards ─────────────────────────────────────────── */}
      <ReportSummaryCard
        items={[
          { label: "Total Records", value: rows.length },
          { label: "Sent", value: totalSent },
          { label: "Failed", value: totalFailed },
          { label: "Skipped", value: totalSkipped },
        ]}
      />

      {/* ── Table ─────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <ReportEmptyState
          description="No SMS delivery records found for the selected filters."
        />
      ) : (
        <ReportTable
          columns={COLUMNS}
          rows={(rows as unknown) as Record<string, unknown>[]}
        />
      )}
    </div>
  );
}
