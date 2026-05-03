import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status?: ReactNode;
}

export function Timeline({
  items,
  empty,
}: {
  items: TimelineItem[];
  empty?: ReactNode;
}) {
  if (items.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.id} className="relative rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.description ? <p className="text-sm leading-6 text-slate-600">{item.description}</p> : null}
              {item.timestamp ? <p className="text-xs text-slate-500">{item.timestamp}</p> : null}
            </div>
            {item.status ? <div className="shrink-0">{item.status}</div> : null}
          </div>
          {index < items.length - 1 ? (
            <span className="absolute -bottom-3 left-6 h-3 border-l border-dashed border-slate-300" aria-hidden="true" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
