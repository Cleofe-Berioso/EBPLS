import { notFound } from "next/navigation";
import { Mail, UserCircle2 } from "lucide-react";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { ProfilePictureCard } from "@/components/applicant/profile-picture-card";
import { requireApplicantSession } from "@/lib/applicant-api";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

function formatValue(value?: string | null) {
  return value && value.trim().length > 0 ? value : "Not provided";
}

export default async function ApplicantProfilePage() {
  const session = await requireApplicantSession();

  if (!session) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Applicant"
        title="Profile"
        description={`Signed in as ${formatValue(session.user.name)}. This page summarizes your account information.`}
      />

      <SectionCard title="Profile Picture">
        <ProfilePictureCard userName={formatValue(session.user.name)} />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardSummaryCard title="Account Name" value={formatValue(session.user.name)} subtitle="Authenticated applicant account" icon={<UserCircle2 className="h-5 w-5" />} tone="green" />
        <DashboardSummaryCard title="Email Address" value={formatValue(session.user.email)} subtitle="Login and notification address" icon={<Mail className="h-5 w-5" />} tone="blue" />
      </div>

      <SectionCard title="Account Details" description="System-managed applicant identity from the active session.">
        <div className="space-y-3 text-sm text-[var(--ink-muted)] [&_strong]:text-[var(--foreground)]">
          <p><strong>Name:</strong> {formatValue(session.user.name)}</p>
          <p><strong>Email:</strong> {formatValue(session.user.email)}</p>
          <p><strong>Role:</strong> APPLICANT</p>
          <p><strong>User ID:</strong> {formatValue(session.user.id)}</p>
        </div>
      </SectionCard>

      <SectionCard title="Notes">
        <p className="text-sm text-[var(--ink-muted)]">
          This page reflects live applicant identity from your active session. Fields not yet stored in the database display as &quot;Not provided&quot;.
        </p>
      </SectionCard>
    </section>
  );
}
