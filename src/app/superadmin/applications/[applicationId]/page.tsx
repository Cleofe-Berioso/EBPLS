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

  const latestRemark = app.history.find(
    (item) => typeof item.remarks === "string" && item.remarks.trim().length > 0
  );

  return (
    <section className="space-y-6">
      <DetailHeader
        title="Application Audit Detail"
        subtitle="Read-only audit view of the selected application for monitoring and compliance."
        badge={<RoleBadge role="VIEW_ONLY" label="Audit View Only" />}
        actions={
          <Link href="/superadmin/applications" className={actionButtonStyles("secondary", "sm")}>
            Back to Applications
          </Link>
        }
      />

      <InfoBanner
        title="Audit View Only"
        description="SuperAdmin can view this application but cannot approve, reject, assess fees, verify payments, or release permits."
        variant="readOnly"
      />

      <SectionCard
        title="Application Summary"
        description={app.application.applicationNumber}
        action={<StatusBadge status={app.application.status as ApplicationStatus} />}
      >
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Application Number</p>
            <p className="mt-1 font-medium text-slate-900">{app.application.applicationNumber}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Business Name</p>
            <p className="mt-1 font-medium text-slate-900">{app.businessInfo.businessName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Applicant</p>
            <p className="mt-1 font-medium text-slate-900">{app.applicant.name}</p>
            <p className="text-xs text-slate-500">{app.applicant.email}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Application Type</p>
            <p className="mt-1 font-medium text-slate-900">{app.application.applicationType}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Date Submitted</p>
            <p className="mt-1 font-medium text-slate-900">
              {app.application.submittedAt
                ? new Date(app.application.submittedAt).toLocaleString("en-PH")
                : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
            <div className="mt-1">
              <StatusBadge status={app.application.status as ApplicationStatus} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Status Timeline / History"
        description="Recorded workflow activity for read-only monitoring and audit review."
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

      <SectionCard title="Remarks" description="Latest BPLO remarks and activity context.">
        {latestRemark ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">{latestRemark.remarks}</p>
            <p className="mt-2 text-xs text-amber-800">
              {latestRemark.actorEmail ? latestRemark.actorEmail : "System"}
              {latestRemark.actorRole ? ` / ${latestRemark.actorRole}` : ""} - {new Date(latestRemark.createdAt).toLocaleString("en-PH")}
            </p>
          </div>
        ) : (
          <EmptyState
            title="No remarks recorded"
            description="Remarks will appear here when activity notes are added during workflow processing."
          />
        )}
      </SectionCard>

      <SectionCard title="Documents" description="Uploaded files and document metadata for audit review.">
        {app.documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
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

      <SectionCard title="Full Application Details" description="Complete filed business information captured during application.">
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Applicant Information" description="Account and contact details linked to this application.">
            <div className="grid gap-4">
              {labelValue("Applicant Name", app.applicant.name)}
              {labelValue("Applicant Email", app.applicant.email)}
            </div>
          </SectionCard>

          <SectionCard title="Business Information" description="Submitted business identity and registration details.">
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
      </SectionCard>

      <SectionCard title="Audit Log" description="Assessment, payment, and permit issuance records for compliance review.">
        <div className="grid gap-4">
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

          <SectionCard title="Payment Reference" description="Latest payment submission and verification outcome linked to this application.">
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
                description="This section will populate after the applicant submits a payment reference."
              />
            )}
          </SectionCard>

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
        </div>
      </SectionCard>
    </section>
  );
}
