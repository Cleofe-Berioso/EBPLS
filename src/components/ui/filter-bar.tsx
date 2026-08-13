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
    <section className={`app-surface px-4 py-4 sm:px-5 lg:px-6 ${className}`}>
      {(title || description || actions) ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between lg:gap-3">
          <div className="min-w-0">
            {title ? (
              <h3
                className="ui-section-heading font-semibold tracking-tight"
                style={{ color: "var(--foreground)", fontSize: "var(--text-section-title)" }}
              >
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="ui-caption mt-1">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
