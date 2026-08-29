import { Eye, Mail, Shield, UserCircle2 } from "lucide-react";
import { AccountDetailsPanel } from "@/components/ui/account-details-panel";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireSuperAdminSession } from "@/lib/superadmin-api";

export default async function SuperAdminProfilePage() {
  const session = await requireSuperAdminSession();

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="IT Administrator"
        title="Profile"
        description="Account overview for the read-only oversight role."
        badge={<RoleBadge roleType="SUPER_ADMIN" label="IT Administrator" />}
      />

      <InfoBanner
        title="View-only monitoring"
        description="Account settings, password updates, and profile editing are outside the current UI scope. No action is required right now."
        variant="readOnly"
      />

      <SectionCard
        title="Account Details"
        description="Current signed-in IT Administrator identity and access level."
      >
        <AccountDetailsPanel
          items={[
            {
              label: "Name",
              value: session?.user.name ?? "IT Administrator",
              icon: <UserCircle2 className="h-4 w-4" />,
              emphasize: true,
            },
            {
              label: "Email",
              value: session?.user.email ?? "-",
              icon: <Mail className="h-4 w-4" />,
              hint: "Signed-in account address",
            },
            {
              label: "Role",
              value: "IT Administrator",
              icon: <Shield className="h-4 w-4" />,
            },
            {
              label: "Access Level",
              value: "View-only oversight",
              icon: <Eye className="h-4 w-4" />,
              hint: "Monitoring and configuration access only",
            },
          ]}
        />
      </SectionCard>
    </section>
  );
}
