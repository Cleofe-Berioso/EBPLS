import { notFound } from "next/navigation";
import { InfoBanner } from "@/components/ui/info-banner";
import { JitInspectBusinessClient } from "@/components/jit/jit-inspect-business-client";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireJitSession } from "@/lib/jit-api";

export default async function JitInspectBusinessPage() {
  const session = await requireJitSession();
  if (!session) notFound();

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="JIT"
        title="Inspection Queue"
        description="Review active released businesses and log compliance findings."
        badge={<RoleBadge roleType="VIEW_ONLY" label="JIT" />}
      />

      <InfoBanner
        title="JIT Inspection Rules"
        description="JIT can log COMPLIANT or NON_COMPLIANT findings. NON_COMPLIANT records are routed to Department Head review; JIT cannot directly revoke permits."
        variant="info"
      />

      <JitInspectBusinessClient />
    </section>
  );
}