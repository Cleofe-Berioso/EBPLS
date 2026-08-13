import type { ReactNode } from "react";

type StatTone = "green" | "blue" | "amber" | "red" | "slate";

const TONE_STYLES: Record<StatTone, { container: string; icon: string }> = {
  green: {
    container: "border-[var(--border-color)]",
    icon: "bg-[var(--success-soft)] text-[var(--success)] ring-1 ring-[var(--border-color)]",
  },
  blue: {
    container: "border-[var(--border-color)]",
    icon: "bg-[var(--info-soft)] text-[var(--info)] ring-1 ring-[var(--border-color)]",
  },
  amber: {
    container: "border-[var(--border-color)]",
    icon: "bg-[var(--warning-soft)] text-[var(--warning)] ring-1 ring-[var(--border-color)]",
  },
  red: {
    container: "border-[var(--border-color)]",
    icon: "bg-[var(--danger-soft)] text-[var(--danger)] ring-1 ring-[var(--border-color)]",
  },
  slate: {
    container: "border-[var(--border-color)]",
    icon: "bg-[var(--muted-surface)] text-[var(--ink-muted)] ring-1 ring-[var(--border-color)]",
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
    <div className={`ui-stat-card app-surface relative h-full p-3.5 transition-shadow hover:shadow-[var(--card-shadow-hover)] sm:p-4 ${palette.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ui-caption font-semibold uppercase tracking-wide">{title}</p>
          <p className="ui-stat-value mt-1.5 tabular-nums">{value}</p>
          {subtitle ? <p className="ui-caption mt-1.5 line-clamp-2">{subtitle}</p> : null}
        </div>
        {icon ? (
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-control)] ${palette.icon}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
