import Link from "next/link";
import { notFound } from "next/navigation";
import { getBploApplicationDetail } from "@/lib/bplo-applications";
import { StatusBadge } from "@/components/applicant/status-badge";
import { StatusTracker } from "@/components/applicant/status-tracker";
import { BploReviewActions } from "@/components/bplo/bplo-review-actions";
import type { ApplicationStatus } from "@/lib/applicant-types";
import { DetailHeader } from "@/components/ui/detail-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { Timeline } from "@/components/ui/timeline";
import { actionButtonStyles } from "@/components/ui/action-button";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

function getStatusGuidance(status: string): { meaning: string; nextStep: string } {
  if (status === "Draft") {
    return {
      meaning: "This application is still in draft and not yet in the BPLO review flow.",
      nextStep: "No BPLO review action is expected yet.",
    };
  }

  if (status === "Submitted") {
    return {
      meaning: "The application has been filed and is waiting for BPLO review start.",
      nextStep: "Move to Under Review or issue a return/reject decision when applicable.",
    };
  }

  if (status === "Under Review") {
    return {
      meaning: "The application is currently in BPLO review stage.",
      nextStep: "Send to Department Head Review, or return/reject with remarks if needed.",
    };
  }

  if (status === "Assessed") {
    return {
      meaning: "Review stage is complete and the application was assessed.",
      nextStep: "Proceed through assessment and payment preparation modules.",
    };
  }

  if (status === "Approved for Payment") {
    return {
      meaning: "The application is approved for payment processing.",
      nextStep: "Monitor payment verification module for submitted payment references.",
    };
  }

  if (status === "Paid") {
    return {
      meaning: "Payment was recorded and the application is beyond review decision stage.",
      nextStep: "Continue permit issuance workflow in its assigned module.",
    };
  }

  if (status === "For Release") {
    return {
      meaning: "Permit or certificate preparation is completed and queued for release.",
      nextStep: "Finalize release processing in permit issuance module.",
    };
  }

  if (status === "Released") {
    return {
      meaning: "Application reached release completion.",
      nextStep: "No additional BPLO review decision is required on this page.",
    };
  }

  if (status === "Returned for Correction") {
    return {
      meaning: "The application was returned for applicant corrections.",
      nextStep: "Wait for applicant resubmission and monitor queue updates.",
    };
  }

  if (status === "Rejected") {
    return {
      meaning: "The application was rejected during BPLO review.",
      nextStep: "No further review-stage transition is expected.",
    };
  }

  return {
    meaning: "This record has an active workflow status.",
    nextStep: "Follow the current workflow stage guidance.",
  };
}

export default async function BploApplicationDetailPage({ params }: PageProps) {
  const { applicationId } = await params;
  const application = await getBploApplicationDetail(applicationId);

  if (!application) {
    notFound();
  }

  const formData = application.formData as Record<string, string | boolean | undefined>;
  const statusGuidance = getStatusGuidance(application.status);
  const latestRemarks = application.history.find(
    (item: any) => typeof item.remarks === "string" && item.remarks.trim().length > 0
  );

  return (
    <section className="space-y-6">
      <DetailHeader
        title="Application Review"
        subtitle={application.applicationNumber}
        badge={<StatusBadge status={application.status as ApplicationStatus} />}
        actions={
          <Link href="/bplo/applications" className={actionButtonStyles("secondary", "sm")}>
            Back to Queue
          </Link>
        }
      />

      <SectionCard title="Application Summary" description={`${application.businessName} - ${application.applicationType}`}>
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Application Number</p>
            <p className="mt-1 font-medium text-slate-900">{application.applicationNumber}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Business Name</p>
            <p className="mt-1 font-medium text-slate-900">{application.businessName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Applicant</p>
            <p className="mt-1 font-medium text-slate-900">{application.applicant.name}</p>
            <p className="text-xs text-slate-500">{application.applicant.email}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Application Type</p>
            <p className="mt-1 font-medium text-slate-900">{application.applicationType}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Date Submitted</p>
            <p className="mt-1 font-medium text-slate-900">
              {application.submittedAt ? formatDateTime(application.submittedAt) : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
            <div className="mt-1">
              <StatusBadge status={application.status as ApplicationStatus} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Current Status" description="Current workflow meaning and expected next step.">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Status meaning:</span> {statusGuidance.meaning}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-slate-900">Expected next step:</span> {statusGuidance.nextStep}
            </p>
          </div>
          <StatusTracker status={application.status as ApplicationStatus} />
        </div>
      </SectionCard>

      <BploReviewActions applicationId={application.id} currentStatus={application.status} />

      <SectionCard title="Documents" description="Requirements attached by the applicant for BPLO review.">
        <ul className="space-y-2 text-sm text-slate-700">
          {application.documents.map((doc: any) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div>
                <p><strong>{doc.documentName}</strong>: {doc.fileName}</p>
                <p className="text-xs text-slate-500">Uploaded: {formatDateTime(doc.uploadedAt)}</p>
              </div>
              <a
                href={`/api/bplo/applications/${application.id}/documents/${doc.id}/download`}
                className={actionButtonStyles("secondary", "sm")}
              >
                View / Download
              </a>
            </li>
          ))}
          {application.documents.length === 0 ? (
            <li>
              <EmptyState title="No uploaded documents" description="No records available yet for this application." />
            </li>
          ) : null}
        </ul>
      </SectionCard>

      <SectionCard title="Remarks" description="Latest BPLO remarks and comment trail context.">
        {latestRemarks ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">{latestRemarks.remarks}</p>
            <p className="mt-2 text-xs text-amber-800">
              {latestRemarks.actorName}
              {latestRemarks.actorRole ? ` / ${latestRemarks.actorRole}` : ""} - {new Date(latestRemarks.createdAt).toLocaleString("en-PH")}
            </p>
          </div>
        ) : (
          <EmptyState title="No remarks yet" description="Remarks will appear here when BPLO records comments in review history." />
        )}
      </SectionCard>

      <SectionCard title="Application Details" description="Filed business information and operation details.">
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Business Information" description="Filed business identity and contact details.">
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Business Name:</strong> {application.businessName}</p>
              <p><strong>Business Type:</strong> {String(formData.businessType ?? "-")}</p>
              <p><strong>Registration Number:</strong> {String(formData.registrationNumber ?? "-")}</p>
              <p><strong>TIN:</strong> {String(formData.tin ?? "-")}</p>
              <p><strong>Owner/President:</strong> {String(formData.ownerName ?? "-")}</p>
              <p><strong>Trade Name:</strong> {String(formData.tradeName ?? "-")}</p>
              <p><strong>Email:</strong> {String(formData.email ?? "-")}</p>
              <p><strong>Phone:</strong> {String(formData.phone ?? "-")}</p>
              <p><strong>Nationality:</strong> {String(formData.nationality ?? "-")}</p>
              <p><strong>Main Office Address:</strong> {String(formData.mainOfficeAddress ?? "-")}</p>
              <p><strong>Business Address:</strong> {String(formData.businessAddress ?? "-")}</p>
            </div>
          </SectionCard>

          <SectionCard title="Business Operation Details" description="Operational information used for review and later assessment.">
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Business Area:</strong> {String(formData.businessArea ?? "-")}</p>
              <p><strong>Total Floor Area:</strong> {String(formData.totalFloorArea ?? "-")}</p>
              <p><strong>Total Employees:</strong> {String(formData.totalEmployees ?? "-")}</p>
              <p><strong>Male Employees:</strong> {String(formData.maleEmployees ?? "-")}</p>
              <p><strong>Female Employees:</strong> {String(formData.femaleEmployees ?? "-")}</p>
              <p><strong>Employees within Municipality:</strong> {String(formData.employeesWithinMunicipality ?? "-")}</p>
              <p><strong>Delivery Vehicles:</strong> {String(formData.deliveryVehicles ?? "-")}</p>
              <p><strong>Property Ownership:</strong> {String(formData.propertyOwnership ?? "-")}</p>
              <p><strong>Tax Incentives:</strong> {String(formData.taxIncentives ?? "-")}</p>
              <p><strong>Business Activity:</strong> {String(formData.businessActivity ?? "-")}</p>
              <p><strong>Line of Business:</strong> {String(formData.lineOfBusiness ?? "-")}</p>
              <p><strong>Asset Size:</strong> {String(formData.assetSize ?? "-")}</p>
            </div>
          </SectionCard>
        </div>
      </SectionCard>

      <SectionCard title="History / Timeline" description="Recorded workflow activity and remarks.">
        <Timeline
          items={application.history.map((item: any) => ({
            id: item.id,
            title: `${item.fromStatus ? `${item.fromStatus} to ` : ""}${item.toStatus}`,
            description: `${item.actorName}${item.actorRole ? ` / ${item.actorRole}` : ""}${item.remarks ? ` - ${item.remarks}` : ""}`,
            timestamp: new Date(item.createdAt).toLocaleString("en-PH"),
            status: <StatusBadge status={item.toStatus as ApplicationStatus} />,
          }))}
          empty={<EmptyState title="No history yet" description="Status history will appear as this application is processed." />}
        />
      </SectionCard>
    </section>
  );
}
