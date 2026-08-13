import type { ReactNode } from "react";

type BannerVariant = "info" | "success" | "warning" | "danger" | "readOnly";

const BANNER_STYLES: Record<BannerVariant, string> = {
  info: "border-[var(--border-color)] bg-[var(--info-soft)] text-[var(--info)]",
  success: "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
  warning: "border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "border-[var(--border-color)] bg-[var(--danger-soft)] text-[var(--danger)]",
  readOnly: "border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]",
};

export function InfoBanner({
  title,
  description,
  variant = "info",
  action,
}: {
  title: string;
  description?: string;
  variant?: BannerVariant;
  action?: ReactNode;
}) {
  return (
    <div className={`rounded-[var(--radius-card)] border px-3.5 py-3 sm:px-4 sm:py-3.5 ${BANNER_STYLES[variant]}`}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 opacity-90">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
