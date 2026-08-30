"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, ShieldAlert, ShieldX, AlertCircle } from "lucide-react";
import { dhSurfacePanelClass } from "@/components/department-head/department-head-ui-styles";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";

interface DashboardSummary {
  pendingApplicationApprovals: number;
  pendingFlaggedCases: number;
  businessesUnderRestriction: number;
  revocationRecommendations: number;
}

const dashboardCardClass =
  "group relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-sm transition-colors hover:shadow-md";

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
      <section className="ui-page-stack">
        <PageHeader
          eyebrow="Department Head"
          title="Dashboard"
          description="Summary of pending approvals, flagged cases, and permit restrictions."
        />
        <LoadingState message="Loading summary data…" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--muted-surface)]" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section className="ui-page-stack">
        <PageHeader eyebrow="Department Head" title="Dashboard" />
        <InlineAlert variant="error" title="Unable to load dashboard" message={error || "Failed to load dashboard data"} />
      </section>
    );
  }

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="Department Head"
        title="Dashboard"
        description="Manage applications, flagged cases, and permits."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/department-head/application-approval">
          <div className={`${dashboardCardClass} hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[var(--foreground)]">Application Approvals</h2>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">Pending approvals awaiting decision</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[var(--primary)]">{summary.pendingApplicationApprovals}</div>
                <p className="mt-1 ui-caption">pending</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/department-head/permit-to-revoke">
          <div className={`${dashboardCardClass} hover:border-[var(--warning)] hover:bg-[var(--warning-soft)]`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--warning-soft)] p-2.5 text-[var(--warning)]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[var(--foreground)]">Flagged Cases</h2>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">Non-compliant businesses under review</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[var(--warning)]">{summary.pendingFlaggedCases}</div>
                <p className="mt-1 ui-caption">pending</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/department-head/revoke-permit-list">
          <div className={`${dashboardCardClass} hover:border-[var(--danger)] hover:bg-[var(--danger-soft)]`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--danger-soft)] p-2.5 text-[var(--danger)]">
                  <ShieldX className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-[var(--foreground)]">Restrictions List</h2>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">Revoked permits and active restrictions</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[var(--danger)]">{summary.businessesUnderRestriction}</div>
                <p className="mt-1 ui-caption">active</p>
              </div>
            </div>
          </div>
        </Link>

        <div className={dhSurfacePanelClass}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[var(--muted-surface)] p-2.5 text-[var(--ink-muted)]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-[var(--foreground)]">Revocation Recommendations</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">JIT non-compliant recommendations</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--foreground)]">{summary.revocationRecommendations}</div>
              <p className="mt-1 ui-caption">recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
