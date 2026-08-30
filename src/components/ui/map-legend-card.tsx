import type { ReactNode } from "react";

export interface MapLegendItem {
  id: string;
  label: string;
  color?: string;
  marker?: ReactNode;
  note?: string;
}

export interface MapLegendGroup {
  id: string;
  title: string;
  items: MapLegendItem[];
}

export function MapLegendCard({
  title = "Map Legend",
  subtitle,
  groups,
  footer,
}: {
  title?: string;
  subtitle?: string;
  groups: MapLegendGroup[];
  footer?: ReactNode;
}) {
  return (
    <aside className="app-surface p-5">
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      {subtitle ? <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">{subtitle}</p> : null}
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">{group.title}</p>
            {group.items.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                {item.marker ? (
                  <span className="mt-[3px] inline-flex h-3 w-3 items-center justify-center">{item.marker}</span>
                ) : (
                  <span
                    style={{ backgroundColor: item.color ?? "var(--ink-muted)" }}
                    className="mt-[3px] inline-block h-3 w-3 rounded-full border border-[var(--border-color)]"
                  />
                )}
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">{item.label}</p>
                  {item.note ? <p className="text-[11px] leading-5 text-[var(--ink-muted)]">{item.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {footer ? <div className="mt-3 text-[11px] leading-5 text-[var(--ink-muted)]">{footer}</div> : null}
    </aside>
  );
}
