import { notFound } from "next/navigation";
import { DepartmentHeadInspectionVerificationClient } from "@/components/department-head/inspection-verification-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";

export default async function DepartmentHeadInspectionVerificationPage() {
  const session = await requireDepartmentHeadSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Inspection Verification"
        description="Verify JIT inspection results before compliant cases or flagged cases move forward."
        badge={<RoleBadge role="VIEW_ONLY" label="Department Head" />}
      />

      <InfoBanner
        title="Verification Scope"
        description="Only inspections waiting for Department Head verification are listed here. JIT submissions stay pending until you verify them."
        variant="readOnly"
      />

      <DepartmentHeadInspectionVerificationClient />
    </section>
  );
}