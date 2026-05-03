import type { ReactNode } from "react";

type StatTone = "green" | "blue" | "amber" | "red" | "slate";

const TONE_STYLES: Record<StatTone, { accent: string; icon: string; value: string }> = {
  green: {
    accent: "border-slate-200 before:bg-green-600",
    icon: "bg-green-50 text-green-700 ring-1 ring-green-100",
    value: "text-green-800",
  },
  blue: {
    accent: "border-slate-200 before:bg-blue-600",
    icon: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    value: "text-blue-800",
  },
  amber: {
    accent: "border-slate-200 before:bg-amber-500",
    icon: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    value: "text-amber-800",
  },
  red: {
    accent: "border-slate-200 before:bg-red-600",
    icon: "bg-red-50 text-red-700 ring-1 ring-red-100",
    value: "text-red-800",
  },
  slate: {
    accent: "border-slate-200 before:bg-slate-500",
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
      className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 ${palette.accent} sm:p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${palette.value}`}>{value}</p>
          {subtitle ? <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {icon ? (
          <div className={`rounded-2xl p-3 ${palette.icon}`}>{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
