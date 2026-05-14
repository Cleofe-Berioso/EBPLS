import type { ReactNode } from "react";

/**
 * Column definition for ReportTable.
 */
export interface ReportTableColumn {
  /** Matches the key in each row object. */
  key: string;
  /** Column header label. */
  label: string;
  /** Extra Tailwind classes for <td> cells in this column. */
  className?: string;
  /** Extra Tailwind classes for the <th> header cell. */
  headerClassName?: string;
}

interface ReportTableProps {
  columns: ReportTableColumn[];
  /**
   * Each row is a plain object. Missing keys render as "-".
   * Accepts any object whose values are renderable by React.
   */
  rows: Array<Record<string, unknown>>;
  /** Accessible table caption / sub-title shown above the header row. */
  caption?: string;
  /** Text displayed when rows is empty. */
  emptyMessage?: string;
}

/**
 * Generic printable data table for Super Admin system reports.
 *
 * - Alternating row background (zebra striping)
 * - `report-table-row` class on each <tr> → prevents row page-break (set by ReportPageHeader CSS)
 * - `print:overflow-visible` ensures table is not clipped during print
 * - Server component — no client interactivity
 */
export function ReportTable({
  columns,
  rows,
  caption,
  emptyMessage = "No records found.",
}: ReportTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible">
      <table className="w-full border-collapse text-sm text-slate-900">
        {caption ? (
          <caption className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 caption-top">
            {caption}
          </caption>
        ) : null}

        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${col.headerClassName ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr
                key={rowIdx}
                className="report-table-row border-b border-slate-100 last:border-0 odd:bg-white even:bg-slate-50/50"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {(row[col.key] as ReactNode) ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
