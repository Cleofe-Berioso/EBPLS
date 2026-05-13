"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, ShieldAlert, ShieldX, AlertCircle } from "lucide-react";

interface DashboardSummary {
  pendingApplicationApprovals: number;
  pendingFlaggedCases: number;
  businessesUnderRestriction: number;
  revocationRecommendations: number;
}

export function DepartmentHeadDashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/department-head/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-slate-900">Department Head Dashboard</h1>
            <p className="mt-2 text-lg text-slate-600">Loading summary data...</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-slate-900">Department Head Dashboard</h1>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <p className="text-red-700">{error || "Failed to load dashboard data"}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900">Department Head Dashboard</h1>
          <p className="mt-2 text-lg text-slate-600">Manage applications, flagged cases, and permits.</p>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Pending Application Approvals */}
          <Link href="/department-head/application-approval">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md hover:bg-emerald-50/30 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700 transition-all group-hover:bg-emerald-200">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900">Application Approvals</h2>
                    <p className="mt-1 text-sm text-slate-600">Pending approvals awaiting decision</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-emerald-700">{summary.pendingApplicationApprovals}</div>
                  <p className="mt-1 text-xs text-slate-500">pending</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Pending Flagged Cases */}
          <Link href="/department-head/permit-to-revoke">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md hover:bg-orange-50/30 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-orange-100 p-3 text-orange-700 transition-all group-hover:bg-orange-200">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900">Flagged Cases</h2>
                    <p className="mt-1 text-sm text-slate-600">Non-compliant businesses under review</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-orange-600">{summary.pendingFlaggedCases}</div>
                  <p className="mt-1 text-xs text-slate-500">pending</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Businesses Under Restriction */}
          <Link href="/department-head/revoke-permit-list">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-red-200 hover:shadow-md hover:bg-red-50/30 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-red-100 p-3 text-red-700 transition-all group-hover:bg-red-200">
                    <ShieldX className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900">Restrictions List</h2>
                    <p className="mt-1 text-sm text-slate-600">Revoked permits and active restrictions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-red-600">{summary.businessesUnderRestriction}</div>
                  <p className="mt-1 text-xs text-slate-500">active</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Revocation Recommendations */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900">Revocation Recommendations</h2>
                  <p className="mt-1 text-sm text-slate-600">JIT non-compliant recommendations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-slate-700">{summary.revocationRecommendations}</div>
                <p className="mt-1 text-xs text-slate-500">recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
