/**
 * Empty state for IT Administrator printable reports when no data matches the filters.
 * Server component.
 */

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
}

export function ReportEmptyState({
  title = "No data available",
  description = "There are no records to display for the selected date range or filters.",
}: ReportEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-600">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
