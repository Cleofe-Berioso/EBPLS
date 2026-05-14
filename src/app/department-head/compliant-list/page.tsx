import { notFound } from "next/navigation";
import { CompliantListClient } from "@/components/department-head/compliant-list-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";

export default async function DepartmentHeadCompliantListPage() {
  const session = await requireDepartmentHeadSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Compliant List"
        description="Read-only list of JIT inspections verified as compliant by Department Head."
        badge={<RoleBadge role="VIEW_ONLY" label="Department Head" />}
      />

      <InfoBanner
        title="Read-only view"
        description="Verified compliant inspections are listed here. No status changes, revocations, or deletions can be done from this page."
        variant="readOnly"
      />

      <CompliantListClient />
    </section>
  );
}