import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailHeader } from "@/components/ui/detail-header";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline } from "@/components/ui/timeline";
import { actionButtonStyles } from "@/components/ui/action-button";
import type { ApplicationStatus } from "@/lib/applicant-types";
import { getSuperAdminApplicationDetail } from "@/lib/superadmin-data";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

function currency(value: number) {
  return `P ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function smallPill(label: string, tone: "slate" | "green" | "amber" | "red" = "slate") {
  const tones = {
    slate: "border border-slate-200 bg-slate-100 text-slate-700",
    green: "border border-green-200 bg-green-50 text-green-700",
    amber: "border border-amber-200 bg-amber-50 text-amber-800",
    red: "border border-red-200 bg-red-50 text-red-700",
  } as const;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

function labelValue(label: string, value: string) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}

export default async function SuperAdminApplicationDetailPage({ params }: PageProps) {
  const { applicationId } = await params;
  const app = await getSuperAdminApplicationDetail(applicationId);
  if (!app) notFound();

  return (
    <section className="space-y-6">
      <DetailHeader
        title="Application Detail"
        subtitle="Read-only audit view of the selected application, supporting records, payment, and permit status."
        badge={<RoleBadge role="VIEW_ONLY" label="Read-Only Record" />}
        actions={
          <Link href="/superadmin/applications" className={actionButtonStyles("secondary", "sm")}>
            Back to All Applications
          </Link>
        }
      />

      <InfoBanner
        title="Operational controls are intentionally hidden"
        description="This detail view supports read-only review of workflow, payment, and permit records. Workflow decisions remain available to BPLO pages only."
        variant="readOnly"
      />

      <SectionCard
        title="Application Summary"
        description={app.application.applicationNumber}
        action={<StatusBadge status={app.application.status as ApplicationStatus} />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {labelValue("Application Type", app.application.applicationType)}
          {labelValue(
            "Submitted At",
            app.application.submittedAt
              ? new Date(app.application.submittedAt).toLocaleString("en-PH")
              : "-"
          )}
          {labelValue("Created At", new Date(app.application.createdAt).toLocaleString("en-PH"))}
          {labelValue("Last Updated", new Date(app.application.updatedAt).toLocaleString("en-PH"))}
          {labelValue("Current Status", app.application.status)}
          {labelValue("Raw Workflow State", app.application.rawStatus)}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Applicant Information" description="Read-only account data linked to this application.">
          <div className="grid gap-4 md:grid-cols-2">
            {labelValue("Applicant Name", app.applicant.name)}
            {labelValue("Applicant Email", app.applicant.email)}
          </div>
        </SectionCard>

        <SectionCard title="Business Information" description="Submitted business details captured in the application form.">
          <div className="grid gap-4 md:grid-cols-2">
            {labelValue("Business Name", app.businessInfo.businessName)}
            {labelValue("Business Type", app.businessInfo.businessType)}
            {labelValue("Registration Number", app.businessInfo.registrationNumber)}
            {labelValue("TIN", app.businessInfo.tin)}
            {labelValue("Trade Name", app.businessInfo.tradeName)}
            {labelValue("Owner Name", app.businessInfo.ownerName)}
            {labelValue("Business Email", app.businessInfo.email)}
            {labelValue("Phone", app.businessInfo.phone)}
            {labelValue("Main Office Address", app.businessInfo.mainOfficeAddress)}
            {labelValue("Business Address", app.businessInfo.businessAddress)}
            {labelValue("Line of Business", app.businessInfo.lineOfBusiness)}
            {labelValue("Business Activity", app.businessInfo.businessActivity)}
            {labelValue("Asset Size", app.businessInfo.assetSize)}
            {labelValue("Total Employees", app.businessInfo.totalEmployees)}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Uploaded Documents" description="File metadata only. Download remains disabled in this oversight view.">
        {app.documents.length === 0 ? (
          <EmptyState
            title="No records available yet"
            description="This section will populate as application documents are uploaded and processed."
          />
        ) : (
          <div className="grid gap-3">
            {app.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.documentName}</p>
                    <p className="mt-1 text-sm text-slate-600">{doc.fileName}</p>
                  </div>
                  {smallPill("Metadata Only")}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {doc.mimeType} • {doc.sizeBytes.toLocaleString("en-PH")} bytes •{" "}
                  {new Date(doc.uploadedAt).toLocaleString("en-PH")}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Fee Assessment / TOP"
          description="Assessment output and tax order of payment details generated in the BPLO flow."
          action={
            app.feeAssessment.status
              ? smallPill(
                  app.feeAssessment.status,
                  app.feeAssessment.status === "GENERATED" ? "green" : "amber"
                )
              : undefined
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {labelValue("TOP Number", app.feeAssessment.assessmentNumber ?? "-")}
            {labelValue("Payment Frequency", app.feeAssessment.paymentFrequency ?? "-")}
            {labelValue("Total Amount", currency(app.feeAssessment.totalAmount))}
            {labelValue("Generated At", app.feeAssessment.generatedAt ? new Date(app.feeAssessment.generatedAt).toLocaleString("en-PH") : "-")}
            {labelValue("Mayor's Permit Fee", currency(app.feeAssessment.mayorsPermitFee))}
            {labelValue("Regulatory Fees", currency(app.feeAssessment.regulatoryFees))}
            {labelValue("Additional Charges", currency(app.feeAssessment.additionalCharges))}
            {labelValue("Penalties", currency(app.feeAssessment.penalties))}
            {labelValue("Surcharge", currency(app.feeAssessment.surcharge))}
            {labelValue("Interest", currency(app.feeAssessment.interest))}
            {labelValue("Closure Certificate Fee", currency(app.feeAssessment.closureCertificateFee))}
            {labelValue("Arrears", currency(app.feeAssessment.arrears))}
            {labelValue("Other Charges", currency(app.feeAssessment.otherCharges))}
            {labelValue("Remarks", app.feeAssessment.remarks ?? "-")}
          </div>
        </SectionCard>

        <SectionCard
          title="Payment Reference"
          description="Latest payment submission and verification outcome linked to this application."
        >
          {app.paymentReference ? (
            <div className="grid gap-4 md:grid-cols-2">
              {labelValue("Reference Number", app.paymentReference.transactionNumber)}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</p>
                <div className="mt-1">
                  {smallPill(
                    app.paymentReference.status,
                    app.paymentReference.status === "VERIFIED"
                      ? "green"
                      : app.paymentReference.status === "REJECTED"
                        ? "red"
                        : "amber"
                  )}
                </div>
              </div>
              {labelValue("Amount Paid", currency(app.paymentReference.amountPaid))}
              {labelValue("Submitted At", new Date(app.paymentReference.submittedAt).toLocaleString("en-PH"))}
              {labelValue(
                "Reviewed At",
                app.paymentReference.reviewedAt
                  ? new Date(app.paymentReference.reviewedAt).toLocaleString("en-PH")
                  : "-"
              )}
              {labelValue("Reviewer Remarks", app.paymentReference.reviewerRemarks ?? "-")}
            </div>
          ) : (
            <EmptyState
              title="No payment reference recorded"
              description="No action is required right now. This section will populate after the applicant submits a payment reference."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Permit Issuance Status"
        description="Read-only permit or closure certificate metadata from the issuance stage."
      >
        {app.permitIssuance ? (
          <div className="grid gap-4 md:grid-cols-2">
            {labelValue("Document Type", app.permitIssuance.documentType)}
            {labelValue("Document Number", app.permitIssuance.documentNumber)}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issuance Status</p>
              <div className="mt-1">
                {smallPill(
                  app.permitIssuance.status,
                  app.permitIssuance.status === "RELEASED"
                    ? "green"
                    : app.permitIssuance.status === "FOR_RELEASE"
                      ? "amber"
                      : "slate"
                )}
              </div>
            </div>
            {labelValue("Issued At", new Date(app.permitIssuance.issuedAt).toLocaleString("en-PH"))}
            {labelValue(
              "Released At",
              app.permitIssuance.releasedAt
                ? new Date(app.permitIssuance.releasedAt).toLocaleString("en-PH")
                : "-"
            )}
            {labelValue("Prepared By", app.permitIssuance.preparedBy ?? "-")}
            {labelValue("Released By", app.permitIssuance.releasedBy ?? "-")}
            {labelValue("Remarks", app.permitIssuance.remarks ?? "-")}
          </div>
        ) : (
          <EmptyState
            title="No permit issuance record"
            description="This section will populate after the application reaches permit preparation and release."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Application History Timeline"
        description="Chronological status activity for read-only monitoring and audit review."
      >
        <Timeline
          items={app.history.map((item) => ({
            id: item.id,
            title: `${item.fromStatus ? `${item.fromStatus} to ` : ""}${item.toStatus}`,
            description: `${item.actorEmail ? item.actorEmail : "System"}${item.remarks ? ` - ${item.remarks}` : ""}`,
            timestamp: new Date(item.createdAt).toLocaleString("en-PH"),
            status:
              item.actorRole === "APPLICANT" ||
              item.actorRole === "BPLO" ||
              item.actorRole === "SUPER_ADMIN" ? (
                <RoleBadge role={item.actorRole} />
              ) : (
                smallPill(item.actorRole ?? "SYSTEM")
              ),
          }))}
          empty={
            <EmptyState
              title="No history records"
              description="This section will populate as workflow events are recorded."
            />
          }
        />
      </SectionCard>
    </section>
  );
}
