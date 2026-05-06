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
    <div className="ui-page-header app-surface flex flex-col gap-4 px-5 py-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-6">
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
          <h2 className="ui-page-title min-w-0 text-2xl font-semibold tracking-tight text-slate-900 md:text-[2rem]">
            {title}
          </h2>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {description ? (
          <p className="ui-muted-text max-w-3xl text-sm leading-6 text-slate-600 md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
