"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardChartCard, DASHBOARD_CHART_COLORS } from "@/components/ui/dashboard-chart-card";

export interface DashboardHorizontalBarDatum {
  label: string;
  value: number;
}

function truncateLabel(value: string, maxChars: number): string {
  const text = value.trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

function HorizontalYTick({
  x = 0,
  y = 0,
  payload,
  maxChars,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
  maxChars: number;
}) {
  const full = String(payload?.value ?? "");
  const display = truncateLabel(full, maxChars);

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="var(--ink-muted)"
        fontSize={11}
        style={{ pointerEvents: "none" }}
      >
        {display}
      </text>
    </g>
  );
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
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const rowCount = Math.max(data.length, 1);
  const rowHeight = isNarrow ? 44 : 40;
  const chartHeight = Math.max(220, rowCount * rowHeight + 48);
  const yAxisWidth = isNarrow ? 96 : 148;
  const maxChars = isNarrow ? 16 : 28;

  return (
    <DashboardChartCard
      title={title}
      description={description}
      loading={loading}
      error={error}
      isEmpty={!hasData}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      fillHeight={false}
    >
      <div className="w-full min-w-0 overflow-x-auto">
        <div className="min-w-0 sm:min-w-[320px]">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 8,
                right: 16,
                left: 4,
                bottom: 8,
              }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} />
              <YAxis
                type="category"
                dataKey="label"
                width={yAxisWidth}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={<HorizontalYTick maxChars={maxChars} />}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString("en-PH")}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="value" name={barLabel} fill={DASHBOARD_CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardChartCard>
  );
}
