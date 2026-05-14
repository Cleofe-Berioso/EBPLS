/**
 * Shared summary card for Super Admin printable reports.
 * Renders a labeled grid of key statistics.
 * Server component — no client interactivity needed.
 */

export type ReportSummaryTone = "blue" | "green" | "amber" | "slate" | "red" | "indigo";

export interface ReportSummaryItem {
  label: string;
  value: string | number;
  tone?: ReportSummaryTone;
}

interface ReportSummaryCardProps {
  /** Optional section heading above the grid. */
  title?: string;
  items: ReportSummaryItem[];
}

const containerTone: Record<ReportSummaryTone, string> = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  amber: "bg-amber-50 border-amber-200",
  slate: "bg-slate-50 border-slate-200",
  red: "bg-red-50 border-red-200",
  indigo: "bg-indigo-50 border-indigo-200",
};

const labelTone: Record<ReportSummaryTone, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  amber: "text-amber-600",
  slate: "text-slate-500",
  red: "text-red-600",
  indigo: "text-indigo-600",
};

const valueTone: Record<ReportSummaryTone, string> = {
  blue: "text-blue-800",
  green: "text-green-800",
  amber: "text-amber-800",
  slate: "text-slate-800",
  red: "text-red-800",
  indigo: "text-indigo-800",
};

export function ReportSummaryCard({ title, items }: ReportSummaryCardProps) {
  return (
    <div className="space-y-3">
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      ) : null}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {items.map((item) => {
          const tone = item.tone ?? "slate";
          return (
            <div
              key={item.label}
              className={`rounded-xl border p-3 ${containerTone[tone]}`}
            >
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${labelTone[tone]}`}>
                {item.label}
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${valueTone[tone]}`}>
                {typeof item.value === "number"
                  ? item.value.toLocaleString("en-PH")
                  : item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
