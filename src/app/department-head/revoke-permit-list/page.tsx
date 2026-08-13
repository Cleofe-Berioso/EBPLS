import { notFound } from "next/navigation";
import { RevokePermitListClient } from "@/components/department-head/revoke-permit-list-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";

export default async function DepartmentHeadRevokePermitListPage() {
  const session = await requireDepartmentHeadSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Restrictions List"
        description="Businesses currently blocked from renewal because of approved revocation."
        badge={<RoleBadge roleType="VIEW_ONLY" label="Department Head" />}
      />

      <InfoBanner
        title="Read-only Restrictions"
        description="This page shows finalized restricted records only. No approve, deny, lift restriction, or delete actions are available."
        variant="readOnly"
      />

      <RevokePermitListClient />
    </section>
  );
}