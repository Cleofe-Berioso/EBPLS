"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  trends: {
    monthlyApplications: { month: string; count: number }[];
  };
  summaries: {
    statusDistribution: { label: string; count: number }[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  Approved: "#16a34a",
  Pending: "#f59e0b",
  Returned: "#ef4444",
};

export default function AdminDashboardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/analytics", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then(setData)
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("Analytics are temporarily unavailable.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Analytics are temporarily unavailable."}
      </div>
    );
  }

  const monthlyApplications = data.trends.monthlyApplications;
  const statusDistribution = data.summaries.statusDistribution;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Application Analytics</h2>
        <p className="mt-1 text-sm text-gray-600">
          Monthly application activity and the current application mix from existing system records.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Applications Over Time</h3>
            <p className="mt-1 text-sm text-gray-500">Monthly totals for the last 12 months.</p>
          </div>

          {monthlyApplications.length === 0 ? (
            <EmptyState message="No application history is available yet." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyApplications} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [value, "Applications"]} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#2563eb" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Status Distribution</h3>
            <p className="mt-1 text-sm text-gray-500">Approved, pending, and returned application totals.</p>
          </div>

          {statusDistribution.every((entry) => entry.count === 0) ? (
            <EmptyState message="No application status data is available yet." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusDistribution}
                  layout="vertical"
                  margin={{ top: 6, right: 16, left: 8, bottom: 6 }}
                >
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={80}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => [value, "Applications"]} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.label} fill={STATUS_COLORS[entry.label] ?? "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 space-y-2">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="flex h-72 items-center justify-center text-sm text-gray-500">{message}</p>;
}
