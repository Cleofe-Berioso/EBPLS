/**
 * Shared summary card for IT Administrator printable reports.
 * Renders a labeled grid of key statistics.
 * Server component — no client interactivity needed.
 */

export interface ReportSummaryItem {
  label: string;
  value: string | number;
  /** Short interpretation shown under the value. */
  hint?: string;
  /** legacy display tone (ignored in plain print) */
  tone?: string;
}

interface ReportSummaryCardProps {
  title?: string;
  description?: string;
  items: ReportSummaryItem[];
}

export function ReportSummaryCard({ title, description, items }: ReportSummaryCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-black/10 px-3 py-3">
      {title ? <h3 className="text-sm font-bold uppercase tracking-wide text-black">{title}</h3> : null}
      {description ? <p className="text-sm leading-6 text-black/75">{description}</p> : null}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-md border border-black/5 bg-black/[0.02] p-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-black/65">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-black tabular-nums">
              {typeof item.value === "number" ? item.value.toLocaleString("en-PH") : item.value}
            </p>
            {item.hint ? <p className="mt-1 text-xs leading-5 text-black/60">{item.hint}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
