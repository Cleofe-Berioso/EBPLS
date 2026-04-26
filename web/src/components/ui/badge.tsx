import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // shadcn/ui standard variants
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-foreground border border-border",
        // Existing project status variants (preserved for backward compatibility)
        primary: "bg-[var(--accent-light)] text-[var(--accent-blue)]",
        success: "bg-[var(--success-light)] text-[var(--success)]",
        warning: "bg-[var(--warning-light)] text-[var(--warning)]",
        danger: "bg-[var(--danger-light)] text-[var(--danger)]",
        info: "bg-[var(--accent-light)] text-[var(--accent-blue)]",
        purple: "bg-purple-100 text-purple-800",
        orange: "bg-orange-100 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * Map application/document/permit status string to a badge variant
 */
export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps["variant"]> = {
    DRAFT: "default",
    SUBMITTED: "primary",
    UNDER_REVIEW: "warning",
    RETURNED_FOR_CORRECTION: "orange",
    RESUBMITTED: "primary",
    ASSESSED: "info",
    PAYMENT_PENDING: "warning",
    PAID: "success",
    PERMIT_PREPARED: "info",
    READY_FOR_RELEASE: "purple",
    REJECTED: "danger",
    CANCELLED: "default",
    ACTIVE: "success",
    EXPIRED: "orange",
    REVOKED: "danger",
    RENEWED: "info",
    UPLOADED: "primary",
    PENDING_VERIFICATION: "warning",
    VERIFIED: "success",
    PREPARED: "info",
    ISSUED: "primary",
    RELEASED: "purple",
    COMPLETED: "success",
    TEMPORARY: "warning",
    CONFIRMED: "success",
    RESCHEDULED: "info",
    GENERATED: "primary",
    CLAIMED: "success",
  };

  const displayLabel = status.replace(/_/g, " ");

  return <Badge variant={variantMap[status] || "default"}>{displayLabel}</Badge>;
}

export { Badge, badgeVariants };
