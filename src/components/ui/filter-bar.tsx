import type { ReactNode } from "react";

export function FilterBar({
  title,
  description,
  actions,
  children,
  className = "",
  contentClassName = "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={`app-surface px-5 py-5 sm:px-6 ${className}`}>
      {(title || description || actions) ? (
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
