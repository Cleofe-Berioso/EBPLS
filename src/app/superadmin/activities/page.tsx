import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { actionButtonStyles } from "@/components/ui/action-button";
import {
  getSuperAdminActivityFilterOptions,
  listSuperAdminActivities,
  type SuperAdminActivityRow,
} from "@/lib/superadmin-data";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    actorRole?: "ALL" | "APPLICANT" | "BPLO" | "DEPARTMENT_HEAD" | "JIT" | "SUPER_ADMIN" | "SYSTEM";
    module?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    applicationNumber?: string;
    page?: string;
  }>;
}

function actorRoleLabel(role: string): string {
  if (role === "DEPARTMENT_HEAD") return "Department Head";
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "JIT") return "Joint Inspection Team";
  if (role === "BPLO") return "BPLO";
  if (role === "APPLICANT") return "Applicant";
  if (role === "SYSTEM") return "System";
  return role;
}

function prettyLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function systemRolePill(value: string) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
      {value}
    </span>
  );
}

function auditValuePill(value: string | null) {
  if (!value) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
      {value}
    </span>
  );
}

function buildActivitiesHref(
  params: Awaited<PageProps["searchParams"]>,
  overrides: Record<string, string | null | undefined>
): string {
  const nextParams = new URLSearchParams();

  const entries = {
    search: params.search,
    actorRole: params.actorRole,
    module: params.module,
    action: params.action,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    applicationNumber: params.applicationNumber,
    page: params.page,
    ...overrides,
  };

  for (const [key, value] of Object.entries(entries)) {
    if (!value || value === "" || (key === "page" && value === "1")) {
      continue;
    }
    nextParams.set(key, value);
  }

  const query = nextParams.toString();
  return query ? `/superadmin/activities?${query}` : "/superadmin/activities";
}

function renderActorRole(role: string) {
  if (role === "APPLICANT" || role === "BPLO" || role === "SUPER_ADMIN") {
    return <RoleBadge role={role} label={actorRoleLabel(role)} />;
  }

  return systemRolePill(actorRoleLabel(role));
}

function renderRecordReference(row: SuperAdminActivityRow) {
  if (!row.recordReference && !row.applicationNumber) {
    return <span className="text-slate-400">-</span>;
  }

  const showApplicationNumber = row.applicationNumber && row.applicationNumber !== row.recordReference ? row.applicationNumber : null;

  return (
    <div className="space-y-1">
      <p className="font-medium text-slate-900">{row.recordReference ?? row.applicationNumber}</p>
      {showApplicationNumber ? <p className="text-xs text-slate-500">App No.: {showApplicationNumber}</p> : null}
    </div>
  );
}

function PaginationControls({
  params,
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  params: Awaited<PageProps["searchParams"]>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}) {
  if (totalCount === 0) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <section className="app-surface flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-sm font-medium text-slate-900">
          Showing {start}-{end} of {totalCount} audit trail records
        </p>
        <p className="text-xs text-slate-500">Newest records appear first.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <Link href={buildActivitiesHref(params, { page: String(page - 1) })} className={actionButtonStyles("secondary", "sm")}>
            Previous
          </Link>
        ) : (
          <span className={`${actionButtonStyles("secondary", "sm")} pointer-events-none opacity-50`}>Previous</span>
        )}
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={buildActivitiesHref(params, { page: String(page + 1) })} className={actionButtonStyles("secondary", "sm")}>
            Next
          </Link>
        ) : (
          <span className={`${actionButtonStyles("secondary", "sm")} pointer-events-none opacity-50`}>Next</span>
        )}
      </div>
    </section>
  );
}

export default async function SuperAdminActivitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageSize = 25;

  const [activityResult, filterOptions] = await Promise.all([
    listSuperAdminActivities({
      searchKeyword: params.search,
      actorRole: params.actorRole ?? "ALL",
      module: params.module,
      action: params.action,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      applicationNumber: params.applicationNumber,
      page,
      pageSize,
    }),
    getSuperAdminActivityFilterOptions(),
  ]);

  const rows = activityResult.records;
  const description =
    activityResult.totalCount === 0
      ? "No audit trail records matched the current filters."
      : `Showing ${rows.length} record${rows.length === 1 ? "" : "s"} from ${activityResult.totalCount} total match${activityResult.totalCount === 1 ? "" : "es"}.`;

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="Audit Trail"
        description="Read-only system-wide audit log for monitoring actions across application, payment, permit, inspection, settings, user management, document, revocation, and SMS modules."
        badge={<RoleBadge role="VIEW_ONLY" label="Audit Viewer" />}
      />

      <InfoBanner
        title="Super Admin access only"
        description="This page is read-only. Sensitive metadata, private document URLs, passwords, tokens, secrets, IP addresses, and user-agent strings are not shown in the audit viewer output."
        variant="readOnly"
      />

      <FilterBar
        title="Audit Trail Filters"
        description="Filter by keyword, actor role, module, action type, date range, and application number."
        contentClassName="block"
      >
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search actor, module, action, entity, or description"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <select
            name="actorRole"
            defaultValue={params.actorRole ?? "ALL"}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="ALL">All Actor Roles</option>
            <option value="APPLICANT">Applicant</option>
            <option value="BPLO">BPLO</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
            <option value="JIT">Joint Inspection Team</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SYSTEM">System</option>
          </select>
          <select
            name="module"
            defaultValue={params.module ?? ""}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="">All Modules</option>
            {filterOptions.modules.map((module) => (
              <option key={module} value={module}>
                {prettyLabel(module)}
              </option>
            ))}
          </select>
          <select
            name="action"
            defaultValue={params.action ?? ""}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="">All Actions</option>
            {filterOptions.actions.map((action) => (
              <option key={action} value={action}>
                {prettyLabel(action)}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="dateFrom"
            defaultValue={params.dateFrom ?? ""}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <input
            type="date"
            name="dateTo"
            defaultValue={params.dateTo ?? ""}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <input
            name="applicationNumber"
            defaultValue={params.applicationNumber ?? ""}
            placeholder="Filter by application number"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2 xl:items-center">
            <button type="submit" className={actionButtonStyles("readOnly", "sm")}>
              Search
            </button>
            <Link href="/superadmin/activities" className={actionButtonStyles("secondary", "sm")}>
              Reset Filters
            </Link>
          </div>
        </form>
      </FilterBar>

      <ResponsiveDataTable
        title="Audit Trail Records"
        description={description}
        table={rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No audit trail records found." description="Try adjusting the current filters." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Date / Time</th>
                <th className="px-4 py-3 font-semibold">Actor Name</th>
                <th className="px-4 py-3 font-semibold">Actor Role</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Entity Type</th>
                <th className="px-4 py-3 font-semibold">Affected Record / App No.</th>
                <th className="px-4 py-3 font-semibold">Before Status</th>
                <th className="px-4 py-3 font-semibold">After Status</th>
                <th className="px-4 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Date(row.dateTime).toLocaleString("en-PH")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.actorName}</td>
                  <td className="px-4 py-3">{renderActorRole(row.actorRole)}</td>
                  <td className="px-4 py-3 text-slate-700">{row.action}</td>
                  <td className="px-4 py-3 text-slate-700">{row.module}</td>
                  <td className="px-4 py-3 text-slate-700">{row.entityType}</td>
                  <td className="px-4 py-3 text-slate-700">{renderRecordReference(row)}</td>
                  <td className="px-4 py-3">{auditValuePill(row.beforeStatus)}</td>
                  <td className="px-4 py-3">{auditValuePill(row.afterStatus)}</td>
                  <td className="max-w-sm px-4 py-3 text-slate-600">{row.description ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        mobile={rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No audit trail records found." description="Try adjusting the current filters." />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {rows.map((row) => (
              <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{new Date(row.dateTime).toLocaleString("en-PH")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {renderActorRole(row.actorRole)}
                  <span className="text-sm font-semibold text-slate-900">{row.actorName}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Action:</span> {row.action}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Module:</span> {row.module}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Entity Type:</span> {row.entityType}
                  </p>
                  <div>
                    <p className="font-semibold text-slate-900">Affected Record / App No.</p>
                    <div className="mt-1">{renderRecordReference(row)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div>
                      <p className="mb-1 font-semibold text-slate-900">Before</p>
                      {auditValuePill(row.beforeStatus)}
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-slate-900">After</p>
                      {auditValuePill(row.afterStatus)}
                    </div>
                  </div>
                  <p>
                    <span className="font-semibold text-slate-900">Description:</span> {row.description ?? "-"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      />

      <PaginationControls
        params={params}
        page={activityResult.page}
        pageSize={activityResult.pageSize}
        totalCount={activityResult.totalCount}
        totalPages={activityResult.totalPages}
      />
    </section>
  );
}
