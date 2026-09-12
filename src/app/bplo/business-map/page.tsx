import { notFound } from "next/navigation";
import { requireBploSession } from "@/lib/bplo-api";
import { BploBusinessMapClient } from "@/components/bplo/bplo-business-map-client";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";

export default async function BploBusinessMapPage() {
  const session = await requireBploSession();
  if (!session) notFound();

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="BPLO"
        title="Business Map"
        description="Review submitted Business Location records from released applications, confirm map pins, and monitor mapping status."
        badge={<RoleBadge roleType="BPLO" />}
      />

      <BploBusinessMapClient />
    </section>
  );
}
