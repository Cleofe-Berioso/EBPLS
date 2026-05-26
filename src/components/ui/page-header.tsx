import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  eyebrowClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  eyebrowClassName?: string;
}) {
  return (
    <div className="ui-page-header app-surface flex flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-6">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
              eyebrowClassName ?? "text-emerald-700"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2 className="ui-page-title min-w-0 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {description ? (
          <p className="ui-muted-text max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
