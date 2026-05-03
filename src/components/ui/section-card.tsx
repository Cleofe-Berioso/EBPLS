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
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            {title ? <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          {action ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{action}</div> : null}
        </div>
      ) : null}
      <div className={`px-5 py-5 sm:px-6 sm:py-6 ${contentClassName}`}>{children}</div>
    </section>
  );
}
