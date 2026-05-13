import type { ReactNode } from "react";

type BannerVariant = "info" | "success" | "warning" | "danger" | "readOnly";

const BANNER_STYLES: Record<BannerVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
  readOnly: "border-slate-200 bg-slate-100 text-slate-800",
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
    <div className={`rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 ${BANNER_STYLES[variant]}`}>
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold tracking-tight">{title}</p>
          {description ? <p className="mt-1 text-sm sm:text-base leading-6 opacity-90">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2 flex-shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
