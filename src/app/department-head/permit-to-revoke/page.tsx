import { notFound } from "next/navigation";
import { PermitToRevokeClient } from "@/components/department-head/permit-to-revoke-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";

export default async function DepartmentHeadPermitToRevokePage() {
  const session = await requireDepartmentHeadSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Flagged Cases"
        description="Review Department Head verified NON_COMPLIANT inspections and decide if revocation should proceed."
        badge={<RoleBadge role="VIEW_ONLY" label="Department Head" />}
      />

      <InfoBanner
        title="Decision Scope"
        description="Department Head may approve or deny revocation for flagged cases only. Renewal blocking and restriction list publication are handled automatically after decision."
        variant="readOnly"
      />

      <PermitToRevokeClient />
    </section>
  );
}
