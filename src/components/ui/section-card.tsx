import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
  contentClassName = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={`ui-section-card app-surface relative overflow-hidden ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-6 lg:px-8 lg:py-6 lg:gap-4">
          <div className="min-w-0">
            {title ? <h3 className="ui-section-heading text-xl font-semibold tracking-tight text-slate-900">{title}</h3> : null}
            {description ? <p className="ui-muted-text mt-1 text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
          </div>
          {action ? <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 sm:w-auto">{action}</div> : null}
        </div>
      ) : null}
      <div className={`px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${contentClassName}`}>{children}</div>
    </section>
  );
}
