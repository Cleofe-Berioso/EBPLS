import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { actionButtonStyles } from "@/components/ui/action-button";
import type { ApplicationStatus } from "@/lib/applicant-types";
import { listSuperAdminActivities } from "@/lib/superadmin-data";

interface PageProps {
  searchParams: Promise<{
    actorRole?: "ALL" | "APPLICANT" | "BPLO" | "SUPER_ADMIN";
    transition?: string;
    date?: string;
    applicationNumber?: string;
  }>;
}

function systemRolePill(value: string) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
      {value}
    </span>
  );
}

export default async function SuperAdminActivitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const activities = await listSuperAdminActivities({
    actorRole: params.actorRole ?? "ALL",
    transition: params.transition,
    date: params.date,
    applicationNumber: params.applicationNumber,
  });

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="BPLO Activities"
        description="Read-only timeline of application history for monitoring workflow transitions and remarks."
        badge={<RoleBadge role="VIEW_ONLY" label="Audit View" />}
      />

      <InfoBanner
        title="View-only monitoring"
        description="Use filters to review status transitions and remarks. This page is for monitoring only."
        variant="readOnly"
      />

      <FilterBar title="Activity Filters" description="Filter by actor role, transition, date, and application number.">
        <form className="grid gap-3 md:grid-cols-4">
          <select
            name="actorRole"
            defaultValue={params.actorRole ?? "ALL"}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="ALL">All Actor Roles</option>
            <option value="APPLICANT">APPLICANT</option>
            <option value="BPLO">BPLO</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <input
            name="transition"
            defaultValue={params.transition ?? ""}
            placeholder="Status transition (e.g. PAID->FOR_RELEASE)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <input
            type="date"
            name="date"
            defaultValue={params.date ?? ""}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <input
            name="applicationNumber"
            defaultValue={params.applicationNumber ?? ""}
            placeholder="Application number"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2 md:col-span-4">
            <button type="submit" className={actionButtonStyles("readOnly", "sm")}>
              Apply Filters
            </button>
          </div>
        </form>
      </FilterBar>

      <ResponsiveDataTable
        title="Activity Timeline"
        description={`${activities.length} activity record${activities.length === 1 ? "" : "s"} matched the current filters.`}
        table={activities.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No records available yet"
              description="This section will populate as applications are processed and history entries are recorded."
            />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Date / Time</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Application</th>
                <th className="px-4 py-3 font-semibold">Transition</th>
                <th className="px-4 py-3 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(row.dateTime).toLocaleString("en-PH")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-900">{row.actorEmail}</p>
                      {row.actorRole === "APPLICANT" ||
                      row.actorRole === "BPLO" ||
                      row.actorRole === "SUPER_ADMIN" ? (
                        <RoleBadge role={row.actorRole} />
                      ) : (
                        systemRolePill(row.actorRole)
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.applicationNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[220px] flex-wrap items-center gap-2">
                      {row.fromStatus !== "-" ? (
                        <StatusBadge status={row.fromStatus as ApplicationStatus} />
                      ) : (
                        systemRolePill("Initial")
                      )}
                      <span className="text-slate-600">to</span>
                      <StatusBadge status={row.toStatus as ApplicationStatus} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.remarks ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        mobile={activities.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No records available yet"
              description="This section will populate as applications are processed and history entries are recorded."
            />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {activities.map((row) => (
              <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{new Date(row.dateTime).toLocaleString("en-PH")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {row.actorRole === "APPLICANT" || row.actorRole === "BPLO" || row.actorRole === "SUPER_ADMIN" ? (
                    <RoleBadge role={row.actorRole} />
                  ) : (
                    systemRolePill(row.actorRole)
                  )}
                  <span className="text-xs text-slate-600">{row.actorEmail}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{row.applicationNumber}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {row.fromStatus !== "-" ? (
                    <StatusBadge status={row.fromStatus as ApplicationStatus} />
                  ) : (
                    systemRolePill("Initial")
                  )}
                  <span className="text-slate-600">to</span>
                  <StatusBadge status={row.toStatus as ApplicationStatus} />
                </div>
                <p className="mt-2 text-xs text-slate-600">{row.remarks ?? "-"}</p>
              </article>
            ))}
          </div>
        )}
      />
    </section>
  );
}
