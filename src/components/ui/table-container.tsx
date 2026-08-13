import type { ReactNode } from "react";

export function TableContainer({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ui-table-container app-surface relative overflow-hidden">
      {title || description || action ? (
        <div className="ui-surface-header flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-5 lg:gap-3 lg:px-6">
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
          {action ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">{action}</div> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto overscroll-x-contain bg-[var(--surface)]">{children}</div>
    </section>
  );
}
