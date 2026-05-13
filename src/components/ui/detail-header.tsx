import type { ReactNode } from "react";

export function DetailHeader({
  title,
  subtitle,
  badge,
  meta,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="app-surface px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? <p className="text-sm sm:text-base leading-6 text-slate-600">{subtitle}</p> : null}
          {meta ? <div className="text-xs sm:text-sm text-slate-500">{meta}</div> : null}
        </div>
        {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}
