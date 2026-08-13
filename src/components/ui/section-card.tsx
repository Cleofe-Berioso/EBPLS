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
    <section className={`ui-section-card app-surface relative overflow-hidden ${className}`}>
      {title || description || action ? (
        <div className="flex flex-col gap-2 border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-5 lg:gap-3 lg:px-6">
          <div className="min-w-0">
            {title ? (
              <h3
                className="ui-section-heading font-semibold tracking-tight"
                style={{
                  fontSize: "var(--text-section-title)",
                  color: "var(--foreground)",
                }}
              >
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="ui-caption mt-1">{description}</p>
            ) : null}
          </div>
          {action ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 sm:w-auto">
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={`px-4 py-3.5 sm:px-5 sm:py-4 lg:px-6 ${contentClassName}`}>{children}</div>
    </section>
  );
}
