import type { ReactNode } from "react";

type StatTone = "green" | "blue" | "amber" | "red" | "slate";

const TONE_STYLES: Record<StatTone, { container: string; icon: string; value: string }> = {
  green: {
    container: "border-emerald-100",
    icon: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    value: "text-slate-900",
  },
  blue: {
    container: "border-sky-100",
    icon: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    value: "text-slate-900",
  },
  amber: {
    container: "border-amber-100",
    icon: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    value: "text-slate-900",
  },
  red: {
    container: "border-rose-100",
    icon: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    value: "text-slate-900",
  },
  slate: {
    container: "border-slate-200",
    icon: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    value: "text-slate-800",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "green",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: StatTone;
}) {
  const palette = TONE_STYLES[tone];

  return (
    <div
      className={`ui-stat-card app-surface relative p-4 sm:p-5 lg:p-6 ${palette.container} h-full`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ui-muted-text text-sm font-medium text-slate-600">{title}</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight lg:text-4xl ${palette.value}`}>{value}</p>
          {subtitle ? <p className="ui-muted-text mt-2 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {icon ? (
          <div className={`rounded-xl p-2.5 sm:p-3 flex-shrink-0 ${palette.icon}`}>{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
