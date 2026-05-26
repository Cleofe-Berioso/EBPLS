type ActionButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning" | "readOnly";
type ActionButtonSize = "sm" | "md";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function actionButtonStyles(
  variant: ActionButtonVariant = "primary",
  size: ActionButtonSize = "md",
  className?: string
) {
  const base =
    "inline-flex max-w-full items-center justify-center gap-1.5 rounded-xl border text-center font-semibold whitespace-normal transition-colors transition-shadow transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none";

  const variants: Record<ActionButtonVariant, string> = {
    primary:
      "border-emerald-700 bg-emerald-700 text-white hover:border-emerald-800 hover:bg-emerald-800 focus-visible:ring-emerald-700 shadow-sm",
    secondary:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-emerald-600 shadow-sm",
    ghost:
      "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500",
    danger:
      "border-rose-700 bg-rose-700 text-white hover:border-rose-800 hover:bg-rose-800 focus-visible:ring-rose-700 shadow-sm",
    warning:
      "border-amber-600 bg-amber-600 text-white hover:border-amber-700 hover:bg-amber-700 focus-visible:ring-amber-600 shadow-sm",
    readOnly:
      "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-500 shadow-sm",
  };

  const sizes: Record<ActionButtonSize, string> = {
    sm: "min-h-11 px-3.5 py-2 text-sm leading-5",
    md: "min-h-11 px-4.5 py-2.5 text-sm leading-5",
  };

  return joinClasses(base, variants[variant], sizes[size], className);
}
