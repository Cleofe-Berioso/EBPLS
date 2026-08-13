import Link from "next/link";
import {
  superadminFormControlClass,
  superadminMobileRecordCardClass,
  superadminSummaryLabelClass,
  superadminTableClass,
} from "@/components/superadmin/superadmin-ui-styles";
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
import { PaginationControls } from "@/components/ui/pagination-controls";

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; pageSize?: string }>;
}

export default async function SuperAdminApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await listSuperAdminApplications(params.search, {
    page: params.page,
    pageSize: params.pageSize,
  });
  const rows = result.records;
  const queryParams = {
    search: params.search,
    page: params.page,
    pageSize: params.pageSize,
  };

  return (
    <section className="ui-page-stack">
      <PageHeader
        title="All Applications"
        description="Read-only directory of application records across the full applicant-to-BPLO workflow."
        badge={<RoleBadge roleType="VIEW_ONLY" label="View-Only Oversight" />}
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
            placeholder="Search by application number or applicant email"
            aria-label="Search applications by number or email"
            className={`max-w-md ${superadminFormControlClass}`}
          />
          <button type="submit" className={actionButtonStyles("readOnly", "sm")}>
            Search
          </button>
          <Link href="/superadmin/applications" className={actionButtonStyles("secondary", "sm")}>
            Reset Filters
          </Link>
        </form>
      </FilterBar>

      <ResponsiveDataTable
        title="Application Records"
        description={`${result.totalCount} application${result.totalCount === 1 ? "" : "s"} matched the current search.`}
        switchAt="xl"
        table={rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No applications found"
              description="Try a different application number or applicant email."
            />
          </div>
        ) : (
          <table className={superadminTableClass}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Application Number</th>
                <th>Business Name</th>
                <th>Applicant Email</th>
                <th>Application Type</th>
                <th>TOP Number</th>
                <th>Permit / Certificate No.</th>
                <th>Date Submitted</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td>
                    <StatusBadge status={row.status as ApplicationStatus} />
                  </td>
                  <td className="max-w-[11rem] break-all font-medium text-[var(--foreground)]">{row.applicationNumber}</td>
                  <td className="text-[var(--ink-muted)]">{row.businessName}</td>
                  <td className="max-w-[13rem] break-all text-[var(--ink-muted)]">{row.applicantEmail}</td>
                  <td className="text-[var(--ink-muted)]">{row.applicationType}</td>
                  <td className="font-mono ui-caption">{row.topNumber ?? "-"}</td>
                  <td className="font-mono ui-caption">{row.permitOrCertificateNumber ?? "-"}</td>
                  <td className="text-[var(--ink-muted)]">{row.dateSubmitted}</td>
                  <td className="text-[var(--ink-muted)]">{row.lastUpdated}</td>
                  <td>
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
              title="No applications found"
              description="Try a different application number or applicant email."
            />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {rows.map((row) => (
              <article key={row.id} className={superadminMobileRecordCardClass}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-all font-mono ui-caption">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{row.businessName}</p>
                    <p className="break-all ui-caption">{row.applicantEmail}</p>
                  </div>
                  <StatusBadge status={row.status as ApplicationStatus} />
                </div>
                <p className={`mt-2 ${superadminSummaryLabelClass}`}>
                  {row.applicationType} • Submitted: {row.dateSubmitted}
                </p>
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

      <PaginationControls
        basePath="/superadmin/applications"
        queryParams={queryParams}
        page={result.page}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
        recordLabel="applications"
        sortHint="Recently updated applications appear first."
      />
    </section>
  );
}
