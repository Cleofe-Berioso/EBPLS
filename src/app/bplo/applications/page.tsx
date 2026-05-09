import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { listBploApplications } from "@/lib/bplo-applications";
import { StatusBadge } from "@/components/applicant/status-badge";
import type { ApplicationStatus } from "@/lib/applicant-types";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { actionButtonStyles } from "@/components/ui/action-button";
import { SectionCard } from "@/components/ui/section-card";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: "ALL" | "NEW" | "RENEWAL" | "CLOSURE";
    status?: "ALL" | "SUBMITTED" | "UNDER_REVIEW" | "RETURNED_FOR_CORRECTION";
  }>;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

export default async function BploApplicationsQueuePage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const rows = await listBploApplications({
    search: filters.search,
    type: filters.type ?? "ALL",
    status: filters.status ?? "ALL",
  });

  const hasActiveFilters = filters.search || filters.type !== "ALL" || filters.status !== "ALL";

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Applications Queue"
        description="Search, review, and route only review-stage applications. Assessment, payment verification, and release are handled in their own modules."
        badge={<RoleBadge role="BPLO" />}
      />

      {/* Queue Filters Card */}
      <SectionCard
        title="Queue Filters"
        description="Search by application number, applicant, business name, type, or review-stage workflow status."
      >
        <form method="GET" className="space-y-4">
          {/* Search Input */}
          <div>
            <input
              type="search"
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Search business, applicant, or application no."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Dropdowns and Buttons Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex-1 min-w-0 sm:flex-none sm:w-auto">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Application Type</label>
              <select
                name="type"
                defaultValue={filters.type ?? "ALL"}
                className="w-full sm:w-48 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ALL">All Types</option>
                <option value="NEW">New</option>
                <option value="RENEWAL">Renewal</option>
                <option value="CLOSURE">Closure</option>
              </select>
            </div>

            <div className="flex-1 min-w-0 sm:flex-none sm:w-auto">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Workflow Status</label>
              <select
                name="status"
                defaultValue={filters.status ?? "ALL"}
                className="w-full sm:w-48 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RETURNED_FOR_CORRECTION">Returned for Correction</option>
              </select>
            </div>

            <div className="flex gap-2 sm:gap-2">
              <button type="submit" className={actionButtonStyles("primary", "md", "flex-1 sm:flex-none")}>
                Search
              </button>
              {hasActiveFilters && (
                <Link href="/bplo/applications" className={actionButtonStyles("secondary", "md", "flex-1 sm:flex-none")}>
                  Reset Filters
                </Link>
              )}
            </div>
          </div>
        </form>
      </SectionCard>

      {/* Review Queue Card */}
      <SectionCard
        title="Review Queue"
        description={`${rows.length} application${rows.length === 1 ? "" : "s"} match${rows.length === 1 ? "es" : ""} your filters.`}
      >
        {rows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-900">No applications found.</h3>
            <p className="mt-1 text-sm text-slate-600">Try adjusting the search keyword, application type, or workflow status.</p>
            {hasActiveFilters && (
              <div className="mt-4">
                <Link href="/bplo/applications" className={actionButtonStyles("secondary", "sm")}>
                  Reset Filters
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Status</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Application Number</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Business Name</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Applicant</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Type</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Date Submitted</th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 align-middle">
                        <StatusBadge status={row.status as ApplicationStatus} />
                      </td>
                      <td className="px-5 py-4 text-slate-900 font-mono text-xs">{row.applicationNumber}</td>
                      <td className="px-5 py-4 text-slate-900 font-medium">{row.businessName}</td>
                      <td className="px-5 py-4 text-slate-700">{row.applicantName || row.applicantEmail}</td>
                      <td className="px-5 py-4 text-slate-700">{row.applicationType}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(row.dateSubmitted)}</td>
                      <td className="px-5 py-4">
                        <Link href={`/bplo/applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 lg:hidden">
              {rows.map((row) => (
                <article key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-grow">
                      <p className="font-mono text-xs text-slate-600 truncate">{row.applicationNumber}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={row.status as ApplicationStatus} />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p><span className="font-medium">Applicant:</span> {row.applicantName || row.applicantEmail}</p>
                    <p><span className="font-medium">Type:</span> {row.applicationType}</p>
                    <p><span className="font-medium">Submitted:</span> {formatDate(row.dateSubmitted)}</p>
                  </div>
                  <div className="pt-2">
                    <Link href={`/bplo/applications/${row.id}`} className={actionButtonStyles("secondary", "sm", "w-full")}>
                      Review
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </section>
  );
}
