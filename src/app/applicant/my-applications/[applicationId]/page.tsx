import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getApplicantApplicationDetail } from "@/lib/applications";
import { StatusBadge } from "@/components/applicant/status-badge";
import { StatusTracker } from "@/components/applicant/status-tracker";
import { DetailHeader } from "@/components/ui/detail-header";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";
import { Timeline } from "@/components/ui/timeline";
import { actionButtonStyles } from "@/components/ui/action-button";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { applicationId } = await params;
  const application = await getApplicantApplicationDetail(session.user.id, applicationId);
  if (!application) notFound();

  const formData = application.formData as Record<string, string | boolean | undefined>;
  const paymentReferencesRaw = Array.isArray((application.formData as Record<string, unknown>).paymentReferences)
    ? ((application.formData as Record<string, unknown>).paymentReferences as Array<Record<string, unknown>>)
    : [];
  const latestPayment = paymentReferencesRaw.length > 0 ? paymentReferencesRaw[paymentReferencesRaw.length - 1] : null;

  return (
    <section className="space-y-6">
      <DetailHeader
        title="Application Detail"
        subtitle={application.applicationNumber}
        badge={<StatusBadge status={application.status} />}
        actions={
          <Link href="/applicant/my-applications" className={actionButtonStyles("secondary", "sm")}>
            Back to My Applications
          </Link>
        }
      />

      {application.permitIssuance ? (
        <InfoBanner
          title={
            application.permitIssuance.documentType === "CLOSURE_CERTIFICATE"
              ? "Closure certificate record available"
              : "Permit record available"
          }
          description={`Document No. ${application.permitIssuance.documentNumber} • Issuance status: ${application.permitIssuance.status}${application.permitIssuance.releasedAt ? ` • Released on ${new Date(application.permitIssuance.releasedAt).toLocaleDateString()}` : ""}`}
          variant="success"
        />
      ) : null}

      {application.status === "Returned for Correction" ? (
        <InfoBanner
          title="Returned for correction"
          description="Update your form and uploaded documents, then resubmit the application for BPLO review."
          variant="warning"
          action={
            <Link
              href={`/applicant/application/${application.applicationType.toLowerCase()}?applicationId=${application.id}`}
              className={actionButtonStyles("warning", "sm")}
            >
              Open editable form
            </Link>
          }
        />
      ) : null}

      <SectionCard title="Application Summary" description={`Business: ${String(formData.businessName ?? "-")}`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Application Type</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{application.applicationType}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{application.status}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Submitted At</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {application.submittedAt ? new Date(application.submittedAt).toLocaleString("en-PH") : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Last Updated</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {new Date(application.updatedAt).toLocaleString("en-PH")}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Status Timeline" description="Track current workflow progression for this application.">
        <StatusTracker status={application.status} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="TOP / Payment" description="Current payment reference details in this application record.">
          {latestPayment ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Reference Number</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{String(latestPayment.transactionNumber ?? "-")}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Payment Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{String(latestPayment.status ?? "-")}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Amount Paid</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {typeof latestPayment.amountPaid === "number"
                    ? `P ${latestPayment.amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                    : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Reviewed At</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {latestPayment.reviewedAt ? new Date(String(latestPayment.reviewedAt)).toLocaleString("en-PH") : "-"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No payment reference yet"
              description="No action is required right now. TOP and payment reference details appear after BPLO assessment."
            />
          )}
        </SectionCard>

        <SectionCard title="Permit / Release" description="Permit and release information, if issuance has been completed.">
          {application.permitIssuance ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Document Type</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{application.permitIssuance.documentType}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Document Number</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{application.permitIssuance.documentNumber}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Issued At</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(application.permitIssuance.issuedAt).toLocaleString("en-PH")}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Released At</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{application.permitIssuance.releasedAt ? new Date(application.permitIssuance.releasedAt).toLocaleString("en-PH") : "-"}</p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No permit record yet"
              description="Permit or closure certificate metadata appears after BPLO preparation and release stages."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Business Location" description="Location mapping becomes available after permit release.">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-slate-600">
            {application.permitIssuance?.releasedAt
              ? "Your application is released. Continue to Business Location for mapping submission or updates."
              : "Business Location mapping is shown after release stage completion."}
          </p>
          <Link href="/applicant/business-location" className={actionButtonStyles("secondary", "sm")}>
            Open Business Location
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Uploaded Documents" description="Submitted requirements attached to this application.">
        <ul className="space-y-2 text-sm text-gray-700">
          {application.documents.map((doc: any) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <span>{doc.documentName}: {doc.fileName}</span>
              <a
                href={`/api/applicant/applications/${application.id}/documents/${doc.id}/download`}
                className={actionButtonStyles("secondary", "sm")}
              >
                Download
              </a>
            </li>
          ))}
          {application.documents.length === 0 ? (
            <li>
              <EmptyState
                title="No uploaded documents"
                description="No records available yet for this application."
              />
            </li>
          ) : null}
        </ul>
      </SectionCard>

      <SectionCard title="Application History" description="Status and remarks recorded as the application moves through workflow.">
        <Timeline
          items={application.history.map((item: any) => ({
            id: item.id,
            title: `${item.fromStatus ? `${item.fromStatus} to ` : ""}${item.toStatus}`,
            description: item.remarks ?? "No remarks provided.",
            timestamp: new Date(item.createdAt).toLocaleString("en-PH"),
            status: <StatusBadge status={item.toStatus} />,
          }))}
          empty={<EmptyState title="No history yet" description="Status history will appear as this application is processed." />}
        />
      </SectionCard>
    </section>
  );
}
