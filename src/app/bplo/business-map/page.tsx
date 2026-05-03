import { notFound } from "next/navigation";
import { requireBploSession } from "@/lib/bplo-api";
import { BploBusinessMapClient } from "@/components/bplo/bplo-business-map-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";

export default async function BploBusinessMapPage() {
  const session = await requireBploSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Business Map"
        description="Review submitted Business Location records from released applications, confirm map pins, and monitor mapping status."
        badge={<RoleBadge role="BPLO" />}
      />

      <InfoBanner
        title="Map workflow preserved"
        description="This page updates map presentation only. Existing BPLO verify and return-for-correction behavior, APIs, released-business rules, and coordinate handling remain unchanged."
        variant="info"
      />

      <BploBusinessMapClient />
    </section>
  );
}
