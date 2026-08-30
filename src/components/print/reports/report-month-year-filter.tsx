import { REPORT_MONTH_OPTIONS } from "@/lib/printable-reports";

interface ReportMonthYearFilterProps {
  action: string;
  month: number;
  year: number;
  resetHref: string;
}

/** Month/year picker for monthly summary and period-based reports. Screen only. */
export function ReportMonthYearFilter({ action, month, year, resetHref }: ReportMonthYearFilterProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);

  return (
    <div className="no-print rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Reporting Period</p>
      <p className="mb-3 text-sm text-slate-600">
        Choose the calendar month and year. The report summarizes all activity recorded within that period.
      </p>
      <form method="GET" action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="report-month" className="text-xs font-medium text-slate-600">
            Month
          </label>
          <select
            id="report-month"
            name="month"
            defaultValue={String(month)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {REPORT_MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="report-year" className="text-xs font-medium text-slate-600">
            Year
          </label>
          <select
            id="report-year"
            name="year"
            defaultValue={String(year)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Generate Report
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
  );
}
