import Link from "next/link";
import type { ReactNode } from "react";

type QueueTone = "danger" | "info" | "warning" | "success";

const TONE_STYLES: Record<
  QueueTone,
  { container: string; iconBadge: string; value: string; rail: string }
> = {
  danger: {
    container: "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--danger)]",
    iconBadge: "bg-[var(--danger-soft)] text-[var(--danger)] ring-[var(--border-color)]",
    value: "text-[var(--danger)]",
    rail: "bg-[var(--danger)]",
  },
  info: {
    container: "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--info)]",
    iconBadge: "bg-[var(--info-soft)] text-[var(--info)] ring-[var(--border-color)]",
    value: "text-[var(--info)]",
    rail: "bg-[var(--info)]",
  },
  warning: {
    container: "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--warning)]",
    iconBadge: "bg-[var(--warning-soft)] text-[var(--warning)] ring-[var(--border-color)]",
    value: "text-[var(--warning)]",
    rail: "bg-[var(--warning)]",
  },
  success: {
    container: "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--success)]",
    iconBadge: "bg-[var(--success-soft)] text-[var(--success)] ring-[var(--border-color)]",
    value: "text-[var(--success)]",
    rail: "bg-[var(--success)]",
  },
};

export function DashboardQueueCard({
  title,
  description,
  count,
  href,
  tone,
  icon,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
  tone: QueueTone;
  icon: ReactNode;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <Link
      href={href}
      className={`group relative flex min-h-[8.25rem] items-start justify-between gap-3 overflow-hidden rounded-[var(--radius-card)] border p-3.5 shadow-[var(--card-shadow)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] ${styles.container}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${styles.rail}`} aria-hidden="true" />
      <div className="min-w-0 pr-2">
        <div className="flex items-start gap-2.5">
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] ring-1 ${styles.iconBadge}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold leading-5 text-[var(--foreground)]">{title}</h4>
            <p className="ui-caption mt-1 line-clamp-2">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between self-stretch text-right">
        <p className={`text-2xl font-bold leading-none tabular-nums ${styles.value}`}>
          {count.toLocaleString("en-PH")}
        </p>
        <p className="ui-caption mt-4 font-semibold text-[var(--primary)] group-hover:underline">
          View queue
        </p>
      </div>
    </Link>
  );
}
