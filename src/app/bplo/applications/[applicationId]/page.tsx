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

export default async function BploApplicationDetailPage({ params }: PageProps) {
  const { applicationId } = await params;
  const application = await getBploApplicationDetail(applicationId);

  if (!application) {
    notFound();
  }

  const formData = application.formData as Record<string, string | boolean | undefined>;

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

      <SectionCard title="Application Summary" description={`${application.businessName} • ${application.applicationType}`}>
        <div className="space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Date Submitted</p>
              <p className="mt-1 font-medium text-slate-900">
                {application.submittedAt ? new Date(application.submittedAt).toLocaleString() : "-"}
              </p>
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
              <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
              <p className="mt-1 font-medium text-slate-900">{application.status}</p>
            </div>
          </div>
          <StatusTracker status={application.status as ApplicationStatus} />
        </div>
      </SectionCard>

      <SectionCard title="Review Decision Area" description="Use BPLO review actions below. Existing review logic and transitions are unchanged.">
        <BploReviewActions applicationId={application.id} currentStatus={application.status} />
      </SectionCard>

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

      <SectionCard title="Uploaded Documents" description="Requirements attached by the applicant for BPLO review.">
        <ul className="space-y-2 text-sm text-slate-700">
          {application.documents.map((doc: any) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div>
                <p><strong>{doc.documentName}</strong>: {doc.fileName}</p>
                <p className="text-xs text-slate-500">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
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

      <SectionCard title="Application History" description="Recorded workflow activity and remarks.">
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
