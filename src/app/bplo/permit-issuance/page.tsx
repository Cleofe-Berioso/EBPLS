import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBploSession } from "@/lib/bplo-api";
import { listPermitIssuanceEntries } from "@/lib/bplo-permit-issuance";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { RoleBadge } from "@/components/ui/role-badge";
import { actionButtonStyles } from "@/components/ui/action-button";

const TYPE_LABEL: Record<string, string> = {
  NEW: "New",
  RENEWAL: "Renewal",
  CLOSURE: "Closure",
};

function dateOnly(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-PH");
}

export default async function BploPermitIssuancePage() {
  const session = await requireBploSession();
  if (!session) notFound();

  const data = await listPermitIssuanceEntries();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Permit Issuance"
        description="Prepare and release business permits or closure certificates for paid applications using the existing issuance flow."
        badge={<RoleBadge role="BPLO" />}
      />

      <InfoBanner
        title="Issuance stages"
        description="Paid -> For Release -> Released. Existing prepare and release behavior remains unchanged."
        variant="info"
      />

      <div className="space-y-4">
        <ResponsiveDataTable
          title={`Blocked / Awaiting Payment (${data.blocked.length})`}
          description="Applications that cannot be prepared yet because required payment is missing, pending verification, or not yet eligible."
          table={
            data.blocked.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No blocked applications at the moment.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-700">
                    <th className="px-4 py-3 font-semibold">Application Number</th>
                    <th className="px-4 py-3 font-semibold">Business Name</th>
                    <th className="px-4 py-3 font-semibold">Payment Status</th>
                    <th className="px-4 py-3 font-semibold">Release Payment</th>
                    <th className="px-4 py-3 font-semibold">Amount Paid</th>
                    <th className="px-4 py-3 font-semibold">Block Reason</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.blocked.map((row) => (
                    <tr key={row.applicationId} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.applicationNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.businessName}</td>
                      <td className="px-4 py-3 text-slate-600">{row.paymentStatus ?? "NO PAYMENT REFERENCE"}</td>
                      <td className="px-4 py-3 text-slate-600">₱ {row.requiredReleasePayment.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-slate-600">₱ {row.amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-slate-600">{row.blockingReason ?? "Awaiting payment action"}</td>
                      <td className="px-4 py-3">
                        <button type="button" disabled className={actionButtonStyles("secondary", "sm")}>
                          Awaiting Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          mobile={
            data.blocked.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No blocked applications at the moment.</div>
            ) : (
              <div className="space-y-3 p-4">
                {data.blocked.map((row) => (
                  <article key={row.applicationId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    <p className="mt-1 text-xs text-slate-500">Payment: {row.paymentStatus ?? "NO PAYMENT REFERENCE"}</p>
                    <p className="text-xs text-slate-500">Required Release Payment: ₱ {row.requiredReleasePayment.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-500">Amount Paid: ₱ {row.amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                    <p className="mt-2 text-xs text-slate-600">{row.blockingReason ?? "Awaiting payment action"}</p>
                    <div className="mt-3">
                      <button type="button" disabled className={actionButtonStyles("secondary", "sm")}>
                        Awaiting Payment
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        />

        <ResponsiveDataTable
          title={`Paid Applications (${data.paid.length})`}
          description="Verified payments waiting for permit or certificate preparation."
          table={
            data.paid.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No records available yet in this section. Paid applications will appear here once payment verification is completed.</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-700">
                  <th className="px-4 py-3 font-semibold">Application Number</th>
                  <th className="px-4 py-3 font-semibold">Business Name</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Application Type</th>
                  <th className="px-4 py-3 font-semibold">TOP Number</th>
                  <th className="px-4 py-3 font-semibold">Payment Status</th>
                  <th className="px-4 py-3 font-semibold">Date Paid</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.paid.map((row) => (
                  <tr key={row.applicationId} className="hover:bg-slate-50/60">
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
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.topNumber ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                        {row.paymentStatus ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dateOnly(row.datePaid)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bplo/permit-issuance/${row.applicationId}`} className={actionButtonStyles("primary", "sm")}>
                        {row.applicationType === "CLOSURE" ? "Prepare Certificate" : "Prepare Permit"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          }
          mobile={
            data.paid.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No records available yet in this section.</div>
            ) : (
              <div className="space-y-3 p-4">
                {data.paid.map((row) => (
                  <article key={row.applicationId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    <p className="text-xs text-slate-500">{TYPE_LABEL[row.applicationType] ?? row.applicationType} • Paid: {dateOnly(row.datePaid)}</p>
                    <div className="mt-3">
                      <Link href={`/bplo/permit-issuance/${row.applicationId}`} className={actionButtonStyles("primary", "sm")}>
                        {row.applicationType === "CLOSURE" ? "Prepare Certificate" : "Prepare Permit"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        />

        <ResponsiveDataTable
          title={`For Release (${data.forRelease.length})`}
          description="Prepared documents waiting to be marked as released."
          table={
            data.forRelease.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No records available yet in this section. Prepared permits and certificates will appear here when ready for release.</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-700">
                  <th className="px-4 py-3 font-semibold">Application Number</th>
                  <th className="px-4 py-3 font-semibold">Business Name</th>
                  <th className="px-4 py-3 font-semibold">Application Type</th>
                  <th className="px-4 py-3 font-semibold">Permit / Certificate Number</th>
                  <th className="px-4 py-3 font-semibold">Prepared Date</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.forRelease.map((row) => (
                  <tr key={row.applicationId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.applicationNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.businessName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {TYPE_LABEL[row.applicationType] ?? row.applicationType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.documentNumber ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{dateOnly(row.preparedDate)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bplo/permit-issuance/${row.applicationId}`} className={actionButtonStyles("warning", "sm")}>
                        Mark Released
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          }
          mobile={
            data.forRelease.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No records available yet in this section.</div>
            ) : (
              <div className="space-y-3 p-4">
                {data.forRelease.map((row) => (
                  <article key={row.applicationId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    <p className="text-xs text-slate-500">{TYPE_LABEL[row.applicationType] ?? row.applicationType} • Prepared: {dateOnly(row.preparedDate)}</p>
                    <div className="mt-3">
                      <Link href={`/bplo/permit-issuance/${row.applicationId}`} className={actionButtonStyles("warning", "sm")}>
                        Mark Released
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        />

        <ResponsiveDataTable
          title={`Released (${data.released.length})`}
          description="Completed permit and certificate release records."
          table={
            data.released.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No records available yet in this section. Released permits and certificates will appear here for reference.</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-700">
                  <th className="px-4 py-3 font-semibold">Application Number</th>
                  <th className="px-4 py-3 font-semibold">Business Name</th>
                  <th className="px-4 py-3 font-semibold">Application Type</th>
                  <th className="px-4 py-3 font-semibold">Permit / Certificate Number</th>
                  <th className="px-4 py-3 font-semibold">Released Date</th>
                  <th className="px-4 py-3 font-semibold">Released By</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.released.map((row) => (
                  <tr key={row.applicationId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.applicationNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.businessName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {TYPE_LABEL[row.applicationType] ?? row.applicationType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.documentNumber ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{dateOnly(row.releasedDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{row.releasedBy ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bplo/permit-issuance/${row.applicationId}`} className={actionButtonStyles("secondary", "sm")}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          }
          mobile={
            data.released.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No records available yet in this section.</div>
            ) : (
              <div className="space-y-3 p-4">
                {data.released.map((row) => (
                  <article key={row.applicationId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    <p className="text-xs text-slate-500">{TYPE_LABEL[row.applicationType] ?? row.applicationType} • Released: {dateOnly(row.releasedDate)}</p>
                    <p className="text-xs text-slate-500">By: {row.releasedBy ?? "-"}</p>
                    <div className="mt-3">
                      <Link href={`/bplo/permit-issuance/${row.applicationId}`} className={actionButtonStyles("secondary", "sm")}>View</Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        />
      </div>
    </section>
  );
}
