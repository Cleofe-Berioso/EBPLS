import type { ReactNode } from "react";
import Image from "next/image";

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  eyebrowClassName,
  showHeroWatermark = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  eyebrowClassName?: string;
  showHeroWatermark?: boolean;
}) {
  return (
    <div className="ui-page-header app-surface flex flex-col gap-1.5 px-3.5 py-2.5 sm:px-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-2.5 lg:px-5">
      {showHeroWatermark ? (
        <div className="ui-page-header-watermark" aria-hidden="true">
          <Image src="/images/logo.png" alt="" width={144} height={144} className="h-full w-full object-contain" />
        </div>
      ) : null}
      <div className="relative z-[1] min-w-0 space-y-1">
        {eyebrow ? (
          <div className="flex items-center gap-2">
            <div className="h-px w-5 flex-shrink-0 bg-[var(--accent)]" />
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${eyebrowClassName ?? ""}`}
              style={!eyebrowClassName ? { color: "var(--accent)" } : undefined}
            >
              {eyebrow}
            </p>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2
            className="ui-page-title min-w-0 font-semibold tracking-tight"
            style={{
              fontSize: "var(--text-page-title)",
              lineHeight: 1.15,
              color: "var(--foreground)",
            }}
          >
            {title}
          </h2>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {description ? (
          <p className="ui-muted-text max-w-3xl text-sm leading-5" style={{ color: "var(--ink-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="relative z-[1] flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
