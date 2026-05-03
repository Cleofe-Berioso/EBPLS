import Link from "next/link";
import { listBploApplications } from "@/lib/bplo-applications";
import { StatusBadge } from "@/components/applicant/status-badge";
import type { ApplicationStatus } from "@/lib/applicant-types";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { RoleBadge } from "@/components/ui/role-badge";
import { actionButtonStyles } from "@/components/ui/action-button";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: "ALL" | "NEW" | "RENEWAL" | "CLOSURE";
    status?:
      | "ALL"
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "ASSESSED"
      | "APPROVED_FOR_PAYMENT"
      | "PAID"
      | "FOR_RELEASE"
      | "RELEASED"
      | "RETURNED_FOR_CORRECTION"
      | "REJECTED";
  }>;
}

export default async function BploApplicationsQueuePage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const rows = await listBploApplications({
    search: filters.search,
    type: filters.type ?? "ALL",
    status: filters.status ?? "ALL",
  });

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="BPLO"
        title="Applications Queue"
        description="Review incoming applications and route them through approved BPLO workflow stages."
        badge={<RoleBadge role="BPLO" />}
      />

      <FilterBar
        title="Queue Filters"
        description="Search by application number, applicant, business name, type, or workflow status."
        actions={<Link href="/bplo/applications" className={actionButtonStyles("secondary", "sm")}>Reset</Link>}
      >
        <form className="grid gap-3 md:grid-cols-4">
          <input
            type="search"
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Search business, applicant, or application no."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select name="type" defaultValue={filters.type ?? "ALL"} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All Types</option>
            <option value="NEW">New</option>
            <option value="RENEWAL">Renewal</option>
            <option value="CLOSURE">Closure</option>
          </select>
          <select name="status" defaultValue={filters.status ?? "ALL"} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSESSED">Assessed</option>
            <option value="APPROVED_FOR_PAYMENT">Approved for Payment</option>
            <option value="PAID">Paid</option>
            <option value="FOR_RELEASE">For Release</option>
            <option value="RELEASED">Released</option>
            <option value="RETURNED_FOR_CORRECTION">Returned for Correction</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="flex flex-wrap gap-2 md:col-span-4">
            <button type="submit" className={actionButtonStyles("primary", "sm")}>
              Apply Filters
            </button>
          </div>
        </form>
      </FilterBar>

      <ResponsiveDataTable
        title="Review Queue"
        description={`${rows.length} application${rows.length === 1 ? "" : "s"} matched the current filters.`}
        table={
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Application Number</th>
                <th className="px-4 py-3 font-semibold">Business Name</th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Application Type</th>
                <th className="px-4 py-3 font-semibold">Date Submitted</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  <td className="px-4 py-3"><StatusBadge status={row.status as ApplicationStatus} /></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.applicationNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{row.businessName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.applicantName || row.applicantEmail}</td>
                  <td className="px-4 py-3 text-slate-700">{row.applicationType}</td>
                  <td className="px-4 py-3 text-slate-600">{row.dateSubmitted}</td>
                  <td className="px-4 py-3">
                    <Link href={`/bplo/applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                      View / Review
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={7}>
                    No records available yet. This queue will populate as applications are processed.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        }
        mobile={
          rows.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No records available yet. This queue will populate as applications are processed.</div>
          ) : (
            <div className="space-y-3 p-4">
              {rows.map((row) => (
                <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    </div>
                    <StatusBadge status={row.status as ApplicationStatus} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{row.applicantName || row.applicantEmail}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{row.applicationType} • {row.dateSubmitted}</p>
                  <div className="mt-3">
                    <Link href={`/bplo/applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                      View / Review
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )
        }
      >
      </ResponsiveDataTable>
    </section>
  );
}
