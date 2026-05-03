import type { ReactNode } from "react";

type BannerVariant = "info" | "success" | "warning" | "danger" | "readOnly";

const BANNER_STYLES: Record<BannerVariant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  readOnly: "border-slate-200 bg-slate-50 text-slate-800",
};

export function InfoBanner({
  title,
  description,
  variant = "info",
  action,
}: {
  title: string;
  description?: string;
  variant?: BannerVariant;
  action?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm ${BANNER_STYLES[variant]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 opacity-90">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
