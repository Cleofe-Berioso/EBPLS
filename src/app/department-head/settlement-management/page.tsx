import { notFound } from "next/navigation";
import { SettlementManagementClient } from "@/components/department-head/settlement-management-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";

export default async function DepartmentHeadSettlementManagementPage() {
  const session = await requireDepartmentHeadSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Settlement Management"
        description="View and settle eligible government-agency-related compliance cases."
        badge={<RoleBadge roleType="VIEW_ONLY" label="Department Head" />}
      />

      <InfoBanner
        title="Settlement Scope"
        description="Only government-agency-related MINOR or MAJOR flagged cases are eligible for settlement here. SEVERE and renewal-related cases are handled separately."
        variant="readOnly"
      />

      <SettlementManagementClient />
    </section>
  );
}
