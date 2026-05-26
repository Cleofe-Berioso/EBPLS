import { notFound } from "next/navigation";
import { JitBusinessMapClient } from "@/components/jit/jit-business-map-client";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireJitSession } from "@/lib/jit-api";

export default async function JitBusinessMapPage() {
  const session = await requireJitSession();
  if (!session) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="JIT"
        title="Business Map"
        description="Read-only released business map for Joint Inspection Team planning and monitoring."
        badge={<RoleBadge role="VIEW_ONLY" label="JIT" />}
      />

      <InfoBanner
        title="Released Businesses Only"
        description="This map uses active permitted locations from released permits only. No inspection submission or revocation actions are enabled in this phase."
        variant="info"
      />

      <JitBusinessMapClient />
    </section>
  );
}