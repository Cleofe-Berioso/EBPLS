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
    <SectionCard title={title} description={description} contentClassName="pt-4 min-w-0">
      {loading ? (
        <div className="h-[280px] min-h-[280px] w-full min-w-0 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      ) : error ? (
        <EmptyState title="Unable to load chart" description={error} />
      ) : isEmpty ? (
        <EmptyState
          title={emptyTitle ?? "No application data available yet."}
          description={emptyDescription ?? "Once operational records are available, the chart will render here."}
        />
      ) : (
        <div className="h-[280px] min-h-[280px] w-full min-w-0">{children}</div>
      )}
    </SectionCard>
  );
}

export const DASHBOARD_CHART_COLORS = [
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#ea580c",
  "#dc2626",
  "#7c3aed",
  "#475569",
];
