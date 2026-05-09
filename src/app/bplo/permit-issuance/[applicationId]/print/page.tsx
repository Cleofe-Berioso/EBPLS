import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessPermitTemplate } from "@/components/print/business-permit-template";
import { actionButtonStyles } from "@/components/ui/action-button";
import { requireBploSession } from "@/lib/bplo-api";
import { getBploBusinessPermitPrintAccess } from "@/lib/printable-documents";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function BploBusinessPermitPrintPage({ params }: PageProps) {
  const session = await requireBploSession();
  if (!session) notFound();

  const { applicationId } = await params;
  const access = await getBploBusinessPermitPrintAccess(applicationId);

  if (!access.ok) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="no-print flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          BPLO preview mode. Use the print button below to print or reprint this Business Permit.
        </p>
        <Link href={`/bplo/permit-issuance/${applicationId}`} className={actionButtonStyles("secondary", "sm")}>
          Back to Issuance Detail
        </Link>
      </div>
      <BusinessPermitTemplate permit={access.permit} />
    </section>
  );
}
