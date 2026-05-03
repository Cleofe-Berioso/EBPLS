import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { actionButtonStyles } from "@/components/ui/action-button";
import type { ApplicationStatus } from "@/lib/applicant-types";
import { listSuperAdminApplications } from "@/lib/superadmin-data";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function SuperAdminApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rows = await listSuperAdminApplications(params.search);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="All Applications"
        description="Read-only directory of application records across the full applicant-to-BPLO workflow."
        badge={<RoleBadge role="VIEW_ONLY" label="View-Only Oversight" />}
      />

      <InfoBanner
        title="Operational actions are not available"
        description="This screen is limited to search and detail viewing for monitoring, auditing, and read-only oversight."
        variant="readOnly"
      />

      <FilterBar title="Search Filters" description="Search application records by number or applicant email.">
        <form className="flex flex-wrap gap-2">
          <input
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search application number or applicant email"
            className="w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className={actionButtonStyles("readOnly", "sm")}>
            Search
          </button>
          <Link href="/superadmin/applications" className={actionButtonStyles("secondary", "sm")}>
            Reset
          </Link>
        </form>
      </FilterBar>

      <ResponsiveDataTable
        title="Application Records"
        description={`${rows.length} application${rows.length === 1 ? "" : "s"} matched the current search.`}
        table={rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No records available yet"
              description="This section will populate as applications are processed and matched to the current search."
            />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Application Number</th>
                <th className="px-4 py-3 font-semibold">Business Name</th>
                <th className="px-4 py-3 font-semibold">Applicant Email</th>
                <th className="px-4 py-3 font-semibold">Application Type</th>
                <th className="px-4 py-3 font-semibold">TOP Number</th>
                <th className="px-4 py-3 font-semibold">Permit / Certificate No.</th>
                <th className="px-4 py-3 font-semibold">Date Submitted</th>
                <th className="px-4 py-3 font-semibold">Last Updated</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status as ApplicationStatus} />
                  </td>
                  <td className="max-w-[11rem] break-all px-4 py-3 font-medium text-slate-900">{row.applicationNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{row.businessName}</td>
                  <td className="max-w-[13rem] break-all px-4 py-3 text-slate-600">{row.applicantEmail}</td>
                  <td className="px-4 py-3 text-slate-700">{row.applicationType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {row.topNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {row.permitOrCertificateNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.dateSubmitted}</td>
                  <td className="px-4 py-3 text-slate-600">{row.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/superadmin/applications/${row.id}`}
                      className={actionButtonStyles("secondary", "sm")}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        mobile={rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No records available yet"
              description="This section will populate as applications are processed and matched to the current search."
            />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {rows.map((row) => (
              <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    <p className="break-all text-xs text-slate-500">{row.applicantEmail}</p>
                  </div>
                  <StatusBadge status={row.status as ApplicationStatus} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{row.applicationType} • Submitted: {row.dateSubmitted}</p>
                <div className="mt-3">
                  <Link
                    href={`/superadmin/applications/${row.id}`}
                    className={actionButtonStyles("secondary", "sm")}
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      />
    </section>
  );
}
