import { notFound } from "next/navigation";
import { Building2, Mail, UserCircle2 } from "lucide-react";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { auth } from "@/lib/auth";
import { listApplicantBusinessRecords } from "@/lib/applications";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

function formatValue(value?: string | null) {
  return value && value.trim().length > 0 ? value : "Not provided";
}

export default async function ApplicantProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const businessRecords = await listApplicantBusinessRecords(session.user.id);
  const latestBusinessRecord = businessRecords[0]?.businessInfo ?? null;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="Profile"
        description={`Signed in as ${formatValue(session.user.name)}. This page summarizes your account and latest business record information.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardSummaryCard title="Account Name" value={formatValue(session.user.name)} subtitle="Authenticated applicant account" icon={<UserCircle2 className="h-5 w-5" />} tone="green" />
        <DashboardSummaryCard title="Email Address" value={formatValue(session.user.email)} subtitle="Login and notification address" icon={<Mail className="h-5 w-5" />} tone="blue" />
        <DashboardSummaryCard title="Business Records" value={String(businessRecords.length)} subtitle="Latest filing data available" icon={<Building2 className="h-5 w-5" />} tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Account Details" description="System-managed applicant identity from the active session.">
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Name:</strong> {formatValue(session.user.name)}</p>
            <p><strong>Email:</strong> {formatValue(session.user.email)}</p>
            <p><strong>Role:</strong> APPLICANT</p>
            <p><strong>User ID:</strong> {formatValue(session.user.id)}</p>
          </div>
        </SectionCard>

        <SectionCard title="Latest Business Record" description="Pulled from the most recent submitted or saved business record.">
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Business Name:</strong> {formatValue(latestBusinessRecord?.businessName)}</p>
            <p><strong>Trade Name:</strong> {formatValue(latestBusinessRecord?.tradeName)}</p>
            <p><strong>Registration Number:</strong> {formatValue(latestBusinessRecord?.registrationNumber)}</p>
            <p><strong>Business Type:</strong> {formatValue(latestBusinessRecord?.businessType)}</p>
            <p><strong>Contact Number:</strong> {formatValue(latestBusinessRecord?.phone)}</p>
            <p><strong>Main Office Address:</strong> {formatValue(latestBusinessRecord?.mainOfficeAddress)}</p>
            <p><strong>Business Address:</strong> {formatValue(latestBusinessRecord?.businessAddress)}</p>
            <p><strong>Same as Main Office:</strong> {latestBusinessRecord?.sameAsMainOffice ? "Yes" : "No"}</p>
            <p><strong>Business Activity:</strong> {formatValue(latestBusinessRecord?.businessActivity)}</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Notes">
        {latestBusinessRecord ? (
          <p className="text-sm text-gray-700">
            This page reflects live applicant identity and the latest business record. Fields not yet stored in the database display as “Not provided”.
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            No business record has been saved yet, so only the authenticated account details are available.
          </p>
        )}
      </SectionCard>
    </section>
  );
}
