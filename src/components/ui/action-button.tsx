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
    "inline-flex max-w-full items-center justify-center gap-1.5 rounded-lg border text-center font-medium whitespace-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none";

  const variants: Record<ActionButtonVariant, string> = {
    primary:
      "border-green-700 bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-700 shadow-sm",
    secondary:
      "border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-600 shadow-sm",
    ghost:
      "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500",
    danger:
      "border-red-700 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700 shadow-sm",
    warning:
      "border-amber-600 bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-600 shadow-sm",
    readOnly:
      "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-500 shadow-sm",
  };

  const sizes: Record<ActionButtonSize, string> = {
    sm: "min-h-10 px-3 py-2 text-sm leading-5",
    md: "min-h-11 px-4 py-2.5 text-sm leading-5",
  };

  return joinClasses(base, variants[variant], sizes[size], className);
}
