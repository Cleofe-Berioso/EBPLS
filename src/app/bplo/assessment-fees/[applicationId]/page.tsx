import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getApplicationForAssessment } from "@/lib/bplo-assessment";
import { AssessmentFeeForm } from "@/components/bplo/assessment-fee-form";
import { PageHeader } from "@/components/ui/page-header";
import { actionButtonStyles } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/role-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";

export default async function BploAssessmentDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const detail = await getApplicationForAssessment(applicationId);

  if (!detail) {
    // Check if application exists but is no longer in an assessment-accessible status
    // (e.g., TOP has already been generated)
    const application = await prisma.businessApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        feeAssessment: { select: { status: true } },
      },
    });

    if (application?.feeAssessment?.status === "GENERATED") {
      return (
        <section className="space-y-6">
          <PageHeader
            eyebrow="BPLO"
            title="Assessment & Fees"
            description="Already Processed"
            badge={<RoleBadge role="BPLO" />}
            actions={
              <Link href="/bplo/assessment-fees" className={actionButtonStyles("secondary", "sm")}>
                Back to List
              </Link>
            }
          />

          <SectionCard title="Assessment Status" description="This application has already been processed.">
            <div className="space-y-4">
              <EmptyState
                title="Tax Order of Payment already generated"
                description={`Application ${application.applicationNumber} has already been approved and moved to payment verification. The assessment for this application cannot be edited further.`}
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Current Status:</span> {application.status}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Next: Payment Verification
                </p>
              </div>
              <Link
                href="/bplo/assessment-fees"
                className={actionButtonStyles("primary", "md")}
              >
                Back to Assessment Fees
              </Link>
            </div>
          </SectionCard>
        </section>
      );
    }

    notFound();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Assessment & Fees"
        description={`${detail.applicationNumber} — ${detail.businessName}`}
        badge={<RoleBadge role="BPLO" />}
        actions={
          <Link href="/bplo/assessment-fees" className={actionButtonStyles("secondary", "sm")}>
            Back to List
          </Link>
        }
      />

      <AssessmentFeeForm detail={detail} />
    </section>
  );
}
