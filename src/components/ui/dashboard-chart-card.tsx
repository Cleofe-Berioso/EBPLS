import type { ReactNode } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

export function DashboardChartCard({
  title,
  description,
  loading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} description={description} contentClassName="pt-3 min-w-0">
      {loading ? (
        <div className="h-[clamp(200px,30vh,260px)] min-h-[200px] w-full min-w-0 animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--muted-surface)]" />
      ) : error ? (
        <EmptyState compact title="Unable to load chart" description={error} />
      ) : isEmpty ? (
        <EmptyState
          compact
          title={emptyTitle ?? "No application data available yet."}
          description={emptyDescription ?? "Charts appear once operational records are available."}
        />
      ) : (
        <div className="h-[clamp(200px,30vh,260px)] min-h-[200px] w-full min-w-0">{children}</div>
      )}
    </SectionCard>
  );
}

export const DASHBOARD_CHART_COLORS = [
  "#0c5c38",
  "#c4852a",
  "#1a5ca8",
  "#ad5e0e",
  "#ae3a3a",
  "#576858",
  "#8a9d8e",
];
