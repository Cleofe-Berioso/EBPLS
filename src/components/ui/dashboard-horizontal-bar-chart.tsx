"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardChartCard } from "@/components/ui/dashboard-chart-card";

export interface DashboardHorizontalBarDatum {
  label: string;
  value: number;
}

export function DashboardHorizontalBarChart({
  title,
  description,
  data,
  loading,
  error,
  barLabel = "Count",
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description?: string;
  data: DashboardHorizontalBarDatum[];
  loading?: boolean;
  error?: string | null;
  barLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const hasData = data.some((item) => item.value > 0);

  return (
    <DashboardChartCard
      title={title}
      description={description}
      loading={loading}
      error={error}
      isEmpty={!hasData}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    >
      <div className="w-full min-w-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, left: 30, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={110} />
            <Tooltip formatter={(value: number) => value.toLocaleString("en-PH")} />
            <Bar dataKey="value" name={barLabel} fill="#1d4ed8" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}
