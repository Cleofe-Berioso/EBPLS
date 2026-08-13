import { notFound } from "next/navigation";
import { JitNoPermitRecordClient } from "@/components/jit/jit-no-permit-record-client";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireJitSession } from "@/lib/jit-api";

export default async function JitNoPermitRecordPage() {
  const session = await requireJitSession();
  if (!session) notFound();

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="JIT"
        title="No Permit Record"
        description="Record businesses found during inspections that do not have an existing business permit record."
        badge={<RoleBadge roleType="VIEW_ONLY" label="JIT" />}
      />

      <JitNoPermitRecordClient />
    </section>
  );
}
