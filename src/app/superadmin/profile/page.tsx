import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireSuperAdminSession } from "@/lib/superadmin-api";

function labelValue(label: string, value: string) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}

export default async function SuperAdminProfilePage() {
  const session = await requireSuperAdminSession();

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="Profile"
        description="Account overview for the read-only oversight role."
        badge={<RoleBadge role="SUPER_ADMIN" />}
      />

      <InfoBanner
        title="View-only monitoring"
        description="Account settings, password updates, and profile editing are outside the current UI scope. No action is required right now."
        variant="readOnly"
      />

      <SectionCard
        title="Account Summary"
        description="Current signed-in Super Admin identity and access level."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {labelValue("Name", session?.user.name ?? "Super Admin")}
          {labelValue("Email", session?.user.email ?? "-")}
          {labelValue("Role", "SUPER_ADMIN")}
          {labelValue("Access Level", "View-only oversight")}
        </div>
      </SectionCard>
    </section>
  );
}
