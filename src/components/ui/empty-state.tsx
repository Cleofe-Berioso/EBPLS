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
          ? "border-[var(--border-color)] bg-[var(--muted-surface)] px-4 py-3.5"
          : "border-[var(--border-color)] bg-[var(--muted-surface)] px-4 py-4 sm:px-5 sm:py-5"
      }`}
    >
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="ui-caption mx-auto mt-1.5 max-w-md leading-6">{description}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
