import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig = {
  info: {
    container: "bg-[var(--accent-light)] border-l-4 border-[var(--accent-blue)]",
    icon: <Info className="h-5 w-5 text-[var(--accent-blue)]" />,
    title: "text-[var(--accent-blue)]",
    text: "text-foreground",
  },
  success: {
    container: "bg-[var(--success-light)] border-l-4 border-[var(--success)]",
    icon: <CheckCircle className="h-5 w-5 text-[var(--success)]" />,
    title: "text-[var(--success)]",
    text: "text-foreground",
  },
  warning: {
    container: "bg-[var(--warning-light)] border-l-4 border-[var(--warning)]",
    icon: <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />,
    title: "text-[var(--warning)]",
    text: "text-foreground",
  },
  error: {
    container: "bg-[var(--danger-light)] border-l-4 border-[var(--danger)]",
    icon: <AlertCircle className="h-5 w-5 text-[var(--danger)]" />,
    title: "text-[var(--danger)]",
    text: "text-foreground",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        config.container,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn("mb-1 font-semibold text-sm", config.title)}>{title}</h4>
        )}
        <div className={cn("text-sm", config.text)}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
