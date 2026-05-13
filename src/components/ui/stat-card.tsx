import type { ReactNode } from "react";

type StatTone = "green" | "blue" | "amber" | "red" | "slate";

const TONE_STYLES: Record<StatTone, { accent: string; icon: string; value: string }> = {
  green: {
    accent: "before:bg-emerald-600",
    icon: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    value: "text-emerald-800",
  },
  blue: {
    accent: "before:bg-blue-600",
    icon: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    value: "text-blue-800",
  },
  amber: {
    accent: "before:bg-amber-500",
    icon: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    value: "text-amber-800",
  },
  red: {
    accent: "before:bg-rose-600",
    icon: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    value: "text-rose-800",
  },
  slate: {
    accent: "before:bg-slate-500",
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
      className={`ui-stat-card app-surface relative overflow-hidden p-4 before:absolute before:inset-x-0 before:top-0 before:h-1 ${palette.accent} sm:p-5 lg:p-6`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ui-muted-text text-xs sm:text-sm font-medium text-slate-600">{title}</p>
          <p className={`mt-2 text-2xl sm:text-3xl font-semibold tracking-tight lg:text-4xl ${palette.value}`}>{value}</p>
          {subtitle ? <p className="ui-muted-text mt-1.5 text-xs leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
        {icon ? (
          <div className={`rounded-xl p-2.5 sm:p-3 flex-shrink-0 ${palette.icon}`}>{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
