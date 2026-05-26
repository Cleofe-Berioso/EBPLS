/**
 * Shared summary card for Super Admin printable reports.
 * Renders a labeled grid of key statistics.
 * Server component — no client interactivity needed.
 */

export interface ReportSummaryItem {
  label: string;
  value: string | number;
  /** legacy display tone (ignored in plain print) */
  tone?: string;
}

interface ReportSummaryCardProps {
  title?: string;
  items: ReportSummaryItem[];
}

export function ReportSummaryCard({ title, items }: ReportSummaryCardProps) {
  return (
    <div className="space-y-2">
      {title ? (
        <h3 className="text-sm font-semibold uppercase">{title}</h3>
      ) : null}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="p-1">
            <p className="text-xs font-medium text-black/80">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-black tabular-nums">
              {typeof item.value === "number" ? item.value.toLocaleString("en-PH") : item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
