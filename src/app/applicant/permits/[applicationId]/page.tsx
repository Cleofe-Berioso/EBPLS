import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessPermitTemplate } from "@/components/print/business-permit-template";
import { actionButtonStyles } from "@/components/ui/action-button";
import { requireApplicantSession } from "@/lib/applicant-api";
import { getApplicantBusinessPermitPrintAccess } from "@/lib/printable-documents";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function ApplicantPermitPrintPage({ params }: PageProps) {
  const session = await requireApplicantSession();
  if (!session) notFound();

  const { applicationId } = await params;
  const access = await getApplicantBusinessPermitPrintAccess(applicationId, session.user.id);

  if (!access.ok) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="no-print flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Applicant permit view. You can print your released Business Permit from this page.</p>
        <Link href={`/applicant/my-applications/${applicationId}`} className={actionButtonStyles("secondary", "sm")}>
          Back to Application Detail
        </Link>
      </div>
      <BusinessPermitTemplate permit={access.permit} />
    </section>
  );
}
