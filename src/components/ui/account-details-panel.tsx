import type { ReactNode } from "react";

export type AccountDetailItem = {
  label: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
  emphasize?: boolean;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AccountDetailsPanel({
  items,
  columns = 2,
}: {
  items: AccountDetailItem[];
  columns?: 1 | 2 | 3 | 4;
}) {
  const columnClass =
    columns === 1
      ? "md:grid-cols-1"
      : columns === 3
        ? "md:grid-cols-2 xl:grid-cols-3"
        : columns === 4
          ? "md:grid-cols-2 xl:grid-cols-4"
          : "md:grid-cols-2";

  return (
    <div className={joinClasses("grid gap-3", columnClass)}>
      {items.map((item, index) => (
        <article
          key={`${item.label}-${index}`}
          className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[linear-gradient(145deg,var(--surface)_0%,var(--muted-surface)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[border-color,box-shadow,transform] duration-200 animate-[fadeSlideUp_0.45s_ease-out_both] hover:border-[var(--primary)]/35 hover:shadow-sm motion-reduce:animate-none"
          style={{ animationDelay: `${index * 45}ms` }}
        >
          <span
            aria-hidden
            className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-[var(--primary)]/70 opacity-80 transition-opacity group-hover:opacity-100"
          />
          <div className="flex items-start gap-3 pl-2">
            {item.icon ? (
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-color)] bg-[var(--surface)] text-[var(--primary-strong)] shadow-sm">
                {item.icon}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="ui-caption font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                {item.label}
              </p>
              <p
                className={joinClasses(
                  "mt-1 break-words text-sm leading-5 text-[var(--foreground)]",
                  item.emphasize && "font-semibold tracking-tight"
                )}
              >
                {item.value}
              </p>
              {item.hint ? (
                <p className="mt-1 text-xs leading-4 text-[var(--ink-muted)]">{item.hint}</p>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
