import { notFound } from "next/navigation";
import Link from "next/link";
import { getApplicationForAssessment } from "@/lib/bplo-assessment";
import { AssessmentFeeForm } from "@/components/bplo/assessment-fee-form";
import { PageHeader } from "@/components/ui/page-header";
import { actionButtonStyles } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/role-badge";

export default async function BploAssessmentDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const detail = await getApplicationForAssessment(applicationId);

  if (!detail) {
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
