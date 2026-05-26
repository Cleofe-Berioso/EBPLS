import { notFound } from "next/navigation";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { buildReportMetadata } from "@/lib/printable-reports";
import {
  getRevenueCollectionReport,
  type RevenueCollectionReportFilters,
} from "@/lib/superadmin-data";
import { ReportPageHeader } from "@/components/print/reports/report-page-header";
import { ReportSummaryCard } from "@/components/print/reports/report-summary-card";
import { ReportTable } from "@/components/print/reports/report-table";
import { ReportEmptyState } from "@/components/print/reports/report-empty-state";
import { toMoneyNumber } from "@/lib/money";

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

const COLUMNS = [
  { key: "applicationNumber", label: "Application No.", className: "font-mono text-xs whitespace-nowrap" },
  { key: "businessName", label: "Business Name" },
  { key: "officialReceiptNumber", label: "Official Receipt No.", className: "font-mono text-xs whitespace-nowrap" },
  { key: "amountAssessed", label: "Amount Assessed", className: "text-right tabular-nums whitespace-nowrap" },
  { key: "amountPaid", label: "Amount Paid", className: "text-right tabular-nums whitespace-nowrap" },
  { key: "paymentStatus", label: "Payment Status", className: "whitespace-nowrap" },
  { key: "verifiedDate", label: "Verified Date", className: "whitespace-nowrap" },
];

function parsePesoRow(v: string): number {
  // strips ₱ and commas then parses
  return Number(v.replace(/[₱,]/g, "").trim()) || 0;
}

export default async function RevenueCollectionReportPage({ searchParams }: PageProps) {
  const session = await requireSuperAdminSession();
  if (!session) notFound();

  const params = await searchParams;
  const filters: RevenueCollectionReportFilters = {
    from: params.from,
    to: params.to,
  };

  const rows = await getRevenueCollectionReport(filters);

  const meta = buildReportMetadata({
    title: "Revenue Collection Report",
    generatedBy: session.user.name ?? "Super Admin",
    dateFrom: params.from,
    dateTo: params.to,
  });

  const totalAssessed = rows.reduce((sum, r) => sum + parsePesoRow(r.amountAssessed), 0);
  const totalPaid = rows.reduce((sum, r) => sum + parsePesoRow(r.amountPaid), 0);
  const paidCount = rows.filter((r) => r.paymentStatus === "Paid").length;
  const withOR = rows.filter((r) => r.officialReceiptNumber !== "-").length;

  function fmt(n: number): string {
    return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const resetHref = "/superadmin/reports/print/revenue";

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
          { label: "Total Records", value: rows.length, tone: "slate" },
          { label: "Total Assessed", value: fmt(totalAssessed), tone: "blue" },
          { label: "Total Paid", value: fmt(totalPaid), tone: "green" },
          { label: "Fully Paid Records", value: paidCount, tone: "green" },
          { label: "With Official Receipt", value: withOR, tone: "indigo" },
        ]}
      />

      {/* ── Detail table ─────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <ReportEmptyState description="No fee assessment records found. Adjust the date range and try again." />
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
