import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBploSession } from "@/lib/bplo-api";
import {
  getPermitIssuanceDetail,
  preparePermitIssuance,
  releasePermitIssuance,
} from "@/lib/bplo-permit-issuance";
import { DetailHeader } from "@/components/ui/detail-header";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";

interface PageProps {
  params: Promise<{ applicationId: string }>;
  searchParams?: Promise<{ action?: string }>;
}

function dateOnly(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-PH");
}

function money(value: number): string {
  return `₱ ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function SummaryTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default async function PermitIssuanceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireBploSession();
  if (!session) notFound();

  const { applicationId } = await params;
  const qp = searchParams ? await searchParams : {};

  if (qp.action === "prepare") {
    try {
      await preparePermitIssuance(applicationId, session.user.id, "Prepared via detail action");
    } catch {
      // no-op; page will show latest state
    }
  }

  if (qp.action === "release") {
    try {
      await releasePermitIssuance(applicationId, session.user.id, "Released via detail action");
    } catch {
      // no-op; page will show latest state
    }
  }

  const detail = await getPermitIssuanceDetail(applicationId);
  if (!detail) notFound();

  return (
    <section className="space-y-6">
      <DetailHeader
        title="Permit Issuance Detail"
        subtitle={detail.application.applicationNumber}
        badge={<RoleBadge role="BPLO" />}
        actions={
          <Link href="/bplo/permit-issuance" className={actionButtonStyles("secondary", "sm")}>
            Back to Permit Issuance
          </Link>
        }
      />

      <InfoBanner
        title={`Current workflow status: ${detail.application.status}`}
        description="This view remains aligned to the existing permit preparation and release logic."
        variant={detail.application.rawStatus === "RELEASED" ? "success" : detail.application.rawStatus === "FOR_RELEASE" ? "warning" : "info"}
      />

      <SectionCard title="Application Summary" description={`${detail.application.businessName} • ${detail.application.applicationType}`}>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>Application Number: <strong>{detail.application.applicationNumber}</strong></p>
          <p>Application Type: <strong>{detail.application.applicationType}</strong></p>
          <p>Current Status: <strong>{detail.application.status}</strong></p>
          <p>Applicant: <strong>{detail.application.applicantName}</strong> ({detail.application.applicantEmail})</p>
          <p>Business Name: <strong>{detail.application.businessName}</strong></p>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Business Information">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>Business Type: <strong>{detail.businessInfo.businessType}</strong></p>
            <p>Registration Number: <strong>{detail.businessInfo.registrationNumber}</strong></p>
            <p>TIN: <strong>{detail.businessInfo.tin}</strong></p>
            <p>Business Name: <strong>{detail.businessInfo.businessName}</strong></p>
            <p>Trade Name: <strong>{detail.businessInfo.tradeName}</strong></p>
            <p>Owner / President: <strong>{detail.businessInfo.ownerName}</strong></p>
            <p className="md:col-span-2">Business Address: <strong>{detail.businessInfo.businessAddress}</strong></p>
          </div>
        </SectionCard>

        <SectionCard title="Payment Summary">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>TOP Number: <strong>{detail.paymentSummary.topNumber ?? "-"}</strong></p>
            <p>Total Amount Paid: <strong>{money(detail.paymentSummary.totalAmountPaid)}</strong></p>
            <p>Payment Ref / OR: <strong>{detail.paymentSummary.paymentReferenceNumber ?? "-"}</strong></p>
            <p>Payment Verification: <strong>{detail.paymentSummary.paymentVerificationStatus ?? "-"}</strong></p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Generated Document Preview" description={detail.preview.subtitle}>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-base font-semibold text-blue-900">{detail.preview.title}</p>
          <p className="mt-1 text-sm text-blue-800">
            This preview reflects the current document output view and does not alter permit issuance logic.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Permit / Certificate Metadata">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Document Type" value={detail.issuance.documentType ?? "-"} />
          <SummaryTile label="Permit / Certificate Number" value={detail.issuance.documentNumber ?? "-"} />
          <SummaryTile label="Issue Date" value={dateOnly(detail.issuance.issueDate)} />
          <SummaryTile label="Validity Period" value={detail.issuance.validityPeriod ?? "-"} />
          <SummaryTile label="Prepared By" value={detail.issuance.preparedBy ?? "-"} />
          <SummaryTile label="Released Date" value={dateOnly(detail.issuance.releasedDate)} />
          <SummaryTile label="Released By" value={detail.issuance.releasedBy ?? "-"} />
          <SummaryTile label="Issuance Status" value={detail.issuance.status ?? "-"} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remarks</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{detail.issuance.remarks ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Issuance Actions" description="Use the next available issuance step shown below. Existing permit issuance route behavior remains unchanged.">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3">
            <SummaryTile
              label="Current Workflow State"
              value={detail.application.status}
              helper="Determines which permit issuance action is currently available."
            />
            <SummaryTile
              label="Document Type"
              value={detail.issuance.documentType ?? "-"}
              helper="Set automatically by the existing issuance logic."
            />
            <SummaryTile
              label="Payment Verification"
              value={detail.paymentSummary.paymentVerificationStatus ?? "-"}
              helper="Reference point before prepare or release."
            />
          </div>

          <div className="space-y-4">
            <InfoBanner
              title="Action panel"
              description="Only the next valid action is shown according to the current application status."
              variant="readOnly"
            />

            {detail.application.rawStatus === "PAID" ? (
              <>
                <InfoBanner
                  title="Ready for preparation"
                  description="Preparing will create or update the permit or certificate record and move the application to For Release under the existing workflow."
                  variant="info"
                />
                <form method="get" className="flex flex-wrap gap-2">
                  <input type="hidden" name="action" value="prepare" />
                  <button type="submit" className={actionButtonStyles("primary", "md")}>
                    {detail.application.applicationType === "CLOSURE"
                      ? "Prepare Certificate"
                      : "Prepare Permit"}
                  </button>
                </form>
              </>
            ) : null}

            {detail.application.rawStatus === "FOR_RELEASE" ? (
              <>
                <InfoBanner
                  title="Ready for release"
                  description="Mark Released will keep the existing route behavior and complete the issuance stage for this application."
                  variant="warning"
                />
                <form method="get" className="flex flex-wrap gap-2">
                  <input type="hidden" name="action" value="release" />
                  <button type="submit" className={actionButtonStyles("warning", "md")}>
                    Mark Released
                  </button>
                </form>
              </>
            ) : null}

            {detail.application.rawStatus !== "PAID" &&
            detail.application.rawStatus !== "FOR_RELEASE" ? (
              <InfoBanner
                title="No action is required right now"
                description="This application will show the next issuance button only when it reaches the proper workflow stage."
                variant="readOnly"
              />
            ) : null}
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
