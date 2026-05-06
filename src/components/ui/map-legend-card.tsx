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
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p> : null}
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{group.title}</p>
            {group.items.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                {item.marker ? (
                  <span className="mt-[3px] inline-flex h-3 w-3 items-center justify-center">{item.marker}</span>
                ) : (
                  <span
                    style={{ backgroundColor: item.color ?? "#94a3b8" }}
                    className="mt-[3px] inline-block h-3 w-3 rounded-full border border-slate-300"
                  />
                )}
                <div>
                  <p className="text-xs font-medium text-slate-800">{item.label}</p>
                  {item.note ? <p className="text-[11px] leading-5 text-slate-500">{item.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {footer ? <div className="mt-3 text-[11px] leading-5 text-slate-500">{footer}</div> : null}
    </aside>
  );
}
