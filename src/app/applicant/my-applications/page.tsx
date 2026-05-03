import Link from "next/link";
import { auth } from "@/lib/auth";
import { listApplicantApplications } from "@/lib/applications";
import { StatusBadge } from "@/components/applicant/status-badge";
import { StatusTracker } from "@/components/applicant/status-tracker";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";

export default async function MyApplicationsPage() {
  const session = await auth();
  const applications = session?.user?.id ? await listApplicantApplications(session.user.id) : [];
  const latest = applications[0];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="My Applications"
        description="Track all applications from submission through release. Returned and rejected records remain visible for reference."
        badge={<RoleBadge role="APPLICANT" />}
        actions={
          <Link href="/applicant/application" className={actionButtonStyles("secondary", "sm")}>
            New filing
          </Link>
        }
      />

      <InfoBanner
        title="Status-first tracking"
        description="Each record shows workflow status, current stage, and available route actions using the existing application links."
        variant="info"
      />

      {latest ? (
        <SectionCard
          title="Current Workflow Status"
          description={`${latest.applicationNumber} • ${latest.businessName}`}
          action={<StatusBadge status={latest.status} />}
        >
          <StatusTracker status={latest.status} />
        </SectionCard>
      ) : (
        <EmptyState
          title="No records available yet"
          description="This section will populate as applications are processed. Start a new, renewal, or closure filing to begin."
          action={
            <Link href="/applicant/application" className={actionButtonStyles("primary", "sm")}>
              Start application
            </Link>
          }
        />
      )}

      <ResponsiveDataTable
        title="Application Records"
        description="Review status, submission date, and available actions for each application."
        table={
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Application Number</th>
                <th className="px-4 py-3 font-semibold">Business Name</th>
                <th className="px-4 py-3 font-semibold">Application Type</th>
                <th className="px-4 py-3 font-semibold">Date Submitted</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.applicationNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{row.businessName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.applicationType}</td>
                  <td className="px-4 py-3 text-slate-600">{row.dateSubmitted}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/applicant/my-applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>
                        View
                      </Link>
                      {row.status === "Returned for Correction" ? (
                        <Link
                          href={`/applicant/application/${row.applicationType.toLowerCase()}?applicationId=${row.id}`}
                          className={actionButtonStyles("warning", "sm")}
                        >
                          Correct and Resubmit
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    No records available yet. This table will populate as applications are processed.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        }
        mobile={
          applications.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No records available yet"
                description="This section will populate as applications are processed."
              />
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {applications.map((row) => (
                <article key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{row.applicationType}</p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Submitted: {row.dateSubmitted}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/applicant/my-applications/${row.id}`} className={actionButtonStyles("secondary", "sm")}>View</Link>
                    {row.status === "Returned for Correction" ? (
                      <Link
                        href={`/applicant/application/${row.applicationType.toLowerCase()}?applicationId=${row.id}`}
                        className={actionButtonStyles("warning", "sm")}
                      >
                        Correct and Resubmit
                      </Link>
                    ) : null}
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
