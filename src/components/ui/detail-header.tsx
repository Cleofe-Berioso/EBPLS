import type { ReactNode } from "react";

export function DetailHeader({
  title,
  subtitle,
  badge,
  meta,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="app-surface flex flex-col gap-2.5 px-4 py-3.5 sm:px-5 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-3 lg:px-6">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2.5">
            <div className="h-px w-6 flex-shrink-0 bg-[var(--accent)]" />
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--accent)" }}
            >
              {eyebrow}
            </p>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2
            className="ui-detail-title min-w-0 font-semibold tracking-tight"
            style={{
              fontSize: "var(--text-detail-title)",
              lineHeight: 1.25,
              color: "var(--foreground)",
            }}
          >
            {title}
          </h2>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {subtitle ? (
          <p className="ui-muted-text max-w-3xl text-sm leading-6 sm:text-[0.95rem]" style={{ color: "var(--ink-muted)" }}>
            {subtitle}
          </p>
        ) : null}
        {meta ? (
          <div className="ui-caption max-w-3xl">{meta}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
