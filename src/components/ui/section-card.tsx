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
        <div className="flex flex-col gap-1.5 border-b border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-4 lg:gap-2.5 lg:px-5">
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
              <p className="ui-caption mt-0.5">{description}</p>
            ) : null}
          </div>
          {action ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={`px-3.5 py-3 sm:px-4 sm:py-3.5 lg:px-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}
