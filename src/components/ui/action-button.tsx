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
    "inline-flex max-w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border text-center font-semibold whitespace-normal shadow-sm transition-colors transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-[var(--border-color)] disabled:bg-[var(--muted-surface)] disabled:text-[var(--ink-muted)] disabled:shadow-none";

  const variants: Record<ActionButtonVariant, string> = {
    primary:
      "border-[var(--primary)] bg-[var(--primary)] text-white hover:border-[var(--primary-strong)] hover:bg-[var(--primary-strong)]",
    secondary:
      "border-[var(--border-color)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]",
    ghost:
      "border-transparent bg-transparent text-[var(--foreground)] shadow-none hover:bg-[var(--muted-surface)]",
    danger:
      "border-[var(--danger)] bg-[var(--danger)] text-white hover:brightness-95 focus-visible:ring-[var(--danger)]",
    warning:
      "border-[var(--warning)] bg-[var(--warning)] text-white hover:brightness-95 focus-visible:ring-[var(--warning)]",
    readOnly:
      "border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)] hover:bg-[var(--accent-soft)]",
  };

  const sizes: Record<ActionButtonSize, string> = {
    sm: "min-h-10 px-3.5 py-2 text-sm leading-5",
    md: "min-h-11 px-4 py-2.5 text-sm leading-5",
  };

  return joinClasses(base, variants[variant], sizes[size], className);
}
