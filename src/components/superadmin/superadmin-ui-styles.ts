/** Shared Superadmin portal presentational classes (Batch 8F). */

export const superadminFormControlClass = "w-full text-sm";

export const superadminSummaryTileClass =
  "rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] p-3.5 sm:p-4";

export const superadminSummaryLabelClass = "ui-caption font-semibold uppercase tracking-wide";

export const superadminSummaryValueClass = "mt-1 text-sm font-semibold text-[var(--foreground)]";

export const superadminPanelClass =
  "rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] p-3.5 sm:p-4 text-sm text-[var(--ink-muted)]";

export const superadminFormPanelClass =
  "rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] p-3.5 sm:p-4";

export const superadminListCardClass =
  "rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] p-3.5 sm:p-4";

export const superadminMobileRecordCardClass =
  "rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] p-3.5 sm:p-4";

export const superadminDocumentCardClass =
  "rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-3 sm:px-4";

export const superadminSummaryRowClass =
  "flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-3";

export const superadminTableClass = "ui-table min-w-full text-sm";

export const superadminSkeletonClass =
  "animate-pulse rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)]";

export const superadminAuditPillClass =
  "ui-badge border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]";

export const superadminReadOnlyFieldClass = "ui-caption font-semibold uppercase tracking-wide";

export function superadminStatusPillClass(
  tone: "muted" | "success" | "warning" | "danger" = "muted"
): string {
  switch (tone) {
    case "success":
      return "ui-badge bg-[var(--success-soft)] text-[var(--success)]";
    case "warning":
      return "ui-badge bg-[var(--warning-soft)] text-[var(--warning)]";
    case "danger":
      return "ui-badge bg-[var(--danger-soft)] text-[var(--danger)]";
    default:
      return "ui-badge bg-[var(--muted-surface)] text-[var(--ink-muted)]";
  }
}
