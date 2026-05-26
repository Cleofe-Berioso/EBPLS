import Link from "next/link";
import { listAssessmentFeeApplications } from "@/lib/bplo-assessment";
import { PageHeader } from "@/components/ui/page-header";
import { TableContainer } from "@/components/ui/table-container";
import { actionButtonStyles } from "@/components/ui/action-button";

const TYPE_LABEL: Record<string, string> = {
  NEW: "New",
  RENEWAL: "Renewal",
  CLOSURE: "Closure",
};

const ASSESSMENT_STATUS_BADGE: Record<string, string> = {
  DRAFT: "border border-amber-200 bg-amber-50 text-amber-800",
  GENERATED: "border border-green-200 bg-green-50 text-green-800",
};

export default async function BploAssessmentFeesPage() {
  const rows = await listAssessmentFeeApplications();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Assessment & Fees"
        description="Department Head approved applications are ready for fee computation and Tax Order of Payment generation."
      />

      <TableContainer
        title="Assessment Queue"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"} ready for assessment or currently under assessment.`}
      >
        {rows.length === 0 ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            No records available yet. This section will populate as applications are approved by the Department Head.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-700">
                <th className="px-4 py-3 font-semibold">Application No.</th>
                <th className="px-4 py-3 font-semibold">Business Name</th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Line of Business</th>
                <th className="px-4 py-3 font-semibold">Assessment</th>
                <th className="px-4 py-3 font-semibold">Last Updated</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.applicationNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.businessName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{row.applicantName}</p>
                    <p className="text-xs text-slate-600">{row.applicantEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {TYPE_LABEL[row.applicationType] ?? row.applicationType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.lineOfBusiness !== "-" ? row.lineOfBusiness : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.assessmentStatus ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSESSMENT_STATUS_BADGE[row.assessmentStatus] ?? ""}`}
                        >
                          {row.assessmentStatus === "GENERATED" ? "TOP Generated" : "Draft Saved"}
                        </span>
                        {row.reassessmentRequested ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">Re-assessment Requested</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">Not started</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <Link href={`/bplo/assessment-fees/${row.id}`} className={actionButtonStyles("primary", "sm")}>
                      {row.assessmentStatus ? "View Assessment" : "Assess"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableContainer>
    </section>
  );
}
