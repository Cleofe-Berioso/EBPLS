import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/85 px-4 py-8 sm:px-6 sm:py-10 text-center">
      <p className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
