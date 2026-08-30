import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-dashed text-center ${
        compact
          ? "border-[var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-3"
          : "border-[var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-3.5 sm:px-4 sm:py-4"
      }`}
    >
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="ui-caption mx-auto mt-1 max-w-md leading-5">{description}</p>
      {action ? <div className="mt-2.5 flex justify-center">{action}</div> : null}
    </div>
  );
}
