import type { ReactNode } from "react";

type InlineAlertVariant = "error" | "warning" | "info" | "success";

const VARIANT_STYLES: Record<InlineAlertVariant, string> = {
  error: "border-[var(--border-color)] bg-[var(--danger-soft)] text-[var(--danger)]",
  warning: "border-[var(--border-color)] bg-[var(--warning-soft)] text-[var(--warning)]",
  info: "border-[var(--border-color)] bg-[var(--info-soft)] text-[var(--info)]",
  success: "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]",
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function InlineAlert({
  variant = "error",
  title,
  message,
  children,
  className,
}: {
  variant?: InlineAlertVariant;
  title?: string;
  message?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const body = children ?? message;

  if (!title && !body) {
    return null;
  }

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={joinClasses(
        "rounded-[var(--radius-control)] border px-3.5 py-3 text-sm leading-6",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {title ? <p className="font-semibold tracking-tight">{title}</p> : null}
      {body ? (
        <div className={joinClasses(title && "mt-1 opacity-95")}>{body}</div>
      ) : null}
    </div>
  );
}
