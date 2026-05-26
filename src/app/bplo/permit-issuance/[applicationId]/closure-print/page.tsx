import Link from "next/link";
import { notFound } from "next/navigation";
import { ClosureCertificateTemplate } from "@/components/print/closure-certificate-template";
import { actionButtonStyles } from "@/components/ui/action-button";
import { requireBploSession } from "@/lib/bplo-api";
import { getBploClosureCertificatePrintAccess } from "@/lib/printable-documents";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function BploClosureCertificatePrintPage({ params }: PageProps) {
  const session = await requireBploSession();
  if (!session) notFound();

  const { applicationId } = await params;
  const access = await getBploClosureCertificatePrintAccess(applicationId);

  if (!access.ok) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="no-print flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          BPLO preview mode. Use the print button below to print or reprint this Business Closure Certificate.
        </p>
        <Link href={`/bplo/permit-issuance/${applicationId}`} className={actionButtonStyles("secondary", "sm")}>
          Back to Issuance Detail
        </Link>
      </div>
      <ClosureCertificateTemplate certificate={access.certificate} />
    </section>
  );
}
