"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsData {
  period: string;
  overview: {
    totalApplications: number;
    recentApplications: number;
    totalUsers: number;
    newUsersThisPeriod: number;
    totalPermits: number;
    activePermits: number;
    expiringPermits: number;
    approvalRate: string;
  };
  applications: {
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  performance: {
    averageProcessingTimeHours: number | null;
  };
  trends: {
    dailyApplications: { date: string; count: number }[];
    peakHours: { hour: number; count: number }[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9ca3af",
  SUBMITTED: "#60a5fa",
  UNDER_REVIEW: "#fbbf24",
  RETURNED_FOR_CORRECTION: "#f97316",
  RESUBMITTED: "#818cf8",
  ASSESSED: "#6366f1",
  PAYMENT_PENDING: "#f59e0b",
  PAID: "#34d399",
  PERMIT_PREPARED: "#3b82f6",
  READY_FOR_RELEASE: "#8b5cf6",
  RELEASED: "#22c55e",
  COMPLETED: "#16a34a",
  REJECTED: "#ef4444",
  CANCELLED: "#d1d5db",
};

const TYPE_COLORS = ["#16a34a", "#2563eb", "#dc2626"];

function formatHour(h: number) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export default function SystemStats({ period = "30" }: { period?: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/analytics?period=${period}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError("Failed to load analytics");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [period]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Analytics unavailable"}
      </div>
    );
  }

  const { overview, applications, performance, trends } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={overview.totalApplications} sub={`+${overview.recentApplications} this period`} color="blue" />
        <StatCard label="Active Permits" value={overview.activePermits} sub={`${overview.expiringPermits} expiring soon`} color="green" />
        <StatCard label="Total Users" value={overview.totalUsers} sub={`+${overview.newUsersThisPeriod} new`} color="purple" />
        <StatCard label="Approval Rate" value={overview.approvalRate} sub="of decided applications" color="yellow" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Applications by Status (Pie) */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Applications by Status</h3>
          {applications.byStatus.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={applications.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                >
                  {applications.byStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, String(name).replace(/_/g, " ")]} />
                <Legend formatter={(val) => String(val).replace(/_/g, " ")} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Applications by Type (Bar) */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Applications by Type</h3>
          {applications.byType.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={applications.byType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {applications.byType.map((entry, index) => (
                    <Cell key={entry.type} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Trend + Peak Hours */}
      {trends.dailyApplications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Daily Applications — Last {data.period}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trends.dailyApplications} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d) => {
                  const dt = new Date(d);
                  return `${dt.getMonth() + 1}/${dt.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString()}
                formatter={(v) => [v, "Applications"]}
              />
              <Bar dataKey="count" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance + Peak Hours */}
      <div className="grid gap-6 lg:grid-cols-2">
        {performance.averageProcessingTimeHours !== null && (
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Avg Processing Time</h3>
            <p className="text-3xl font-bold text-green-600">
              {performance.averageProcessingTimeHours}h
            </p>
            <p className="text-xs text-gray-500 mt-1">from submission to approval</p>
          </div>
        )}
        {trends.peakHours.length > 0 && (
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Activity by Hour</h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={trends.peakHours} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={formatHour} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip labelFormatter={(label) => formatHour(Number(label))} formatter={(v) => [v, "Activities"]} />
                <Bar dataKey="count" fill="#2563eb" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: "blue" | "green" | "purple" | "yellow";
}) {
  const colors = {
    blue: "border-blue-500 text-blue-600 bg-blue-50",
    green: "border-green-500 text-green-600 bg-green-50",
    purple: "border-purple-500 text-purple-600 bg-purple-50",
    yellow: "border-yellow-500 text-yellow-600 bg-yellow-50",
  };
  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${colors[color].split(" ")[0]}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color].split(" ")[1]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
