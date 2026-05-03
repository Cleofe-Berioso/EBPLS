import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { RoleBadge } from "@/components/ui/role-badge";

export default async function BploProfilePage() {
  const session = await auth();

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="BPLO"
        title="Profile"
        description="Review current BPLO account details and role identity."
        badge={<RoleBadge role="BPLO" />}
      />
      <SectionCard title="Account Details" description="System-managed BPLO identity from the active session.">
        <div className="space-y-3 text-sm text-slate-700">
          <p><strong>Name:</strong> {session?.user?.name ?? "BPLO Officer"}</p>
          <p><strong>Email:</strong> {session?.user?.email ?? "-"}</p>
          <p><strong>Role:</strong> BPLO</p>
        </div>
      </SectionCard>
    </section>
  );
}
