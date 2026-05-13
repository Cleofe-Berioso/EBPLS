import Link from "next/link";
import { auth } from "@/lib/auth";
import { listApplicantApplications, listApplicantNotifications } from "@/lib/applications";
import { listApplicantReleasedBusinessLocations } from "@/lib/business-location";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/role-badge";

type NextActionTone = "info" | "warning";

interface DashboardNotification {
  id: string;
  applicationNumber: string;
  toStatus: string;
  remarks: string | null;
  createdAt: string;
}

function getPriorityRank(status: string, releasedWithLocation: boolean): number {
  if (status === "Returned for Correction") return 1;
  if (status === "Approved for Payment") return 2;
  if (status === "For Release") return 3;
  if (status === "Released" && !releasedWithLocation) return 4;
  if (status === "Draft") return 5;
  if (status === "Submitted" || status === "Under Review") return 6;
  if (status === "Assessed") return 7;
  if (status === "Paid") return 8;
  if (status === "Released" && releasedWithLocation) return 9;
  if (status === "Rejected") return 10;
  return 99;
}

function getNextActionForStatus(input: {
  status: string;
  id: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  releasedWithLocation: boolean;
}): {
  label: string;
  detail: string;
  href: string;
  cta: string;
  variant: NextActionTone;
} {
  if (input.status === "Draft") {
    return {
      label: "Continue draft application",
      detail: "Continue your draft application and submit when ready.",
      href: `/applicant/application/${input.applicationType.toLowerCase()}?applicationId=${input.id}`,
      cta: "Continue draft",
      variant: "info",
    };
  }

  if (input.status === "Submitted") {
    return {
      label: "No immediate action required",
      detail: "Your application was submitted and is queued for BPLO review.",
      href: "/applicant/my-applications",
      cta: "View All Applications",
      variant: "info",
    };
  }

  if (input.status === "Under Review") {
    return {
      label: "No immediate action required",
      detail: "BPLO is currently reviewing your application.",
      href: "/applicant/my-applications",
      cta: "Track progress",
      variant: "info",
    };
  }

  if (input.status === "Returned for Correction") {
    return {
      label: "Correct returned application",
      detail: "Review BPLO remarks, complete required corrections, and resubmit.",
      href: `/applicant/application/${input.applicationType.toLowerCase()}?applicationId=${input.id}`,
      cta: "Correct and resubmit",
      variant: "warning",
    };
  }

  if (input.status === "Assessed") {
    return {
      label: "No immediate action required",
      detail: "BPLO assessment is complete. Wait for Tax Order of Payment to be generated.",
      href: "/applicant/my-applications",
      cta: "View status",
      variant: "info",
    };
  }

  if (input.status === "Approved for Payment") {
    return {
      label: "View Tax Order of Payment and submit OR number",
      detail: "Your Tax Order of Payment is available. Submit your OR Number after payment.",
      href: "/applicant/top",
      cta: "Open Tax Order of Payment",
      variant: "warning",
    };
  }

  if (input.status === "Paid") {
    return {
      label: "No immediate action required",
      detail: "Payment has been verified. BPLO will proceed with permit or certificate preparation.",
      href: "/applicant/my-applications",
      cta: "View status",
      variant: "info",
    };
  }

  if (input.status === "For Release") {
    return {
      label: "No immediate action required",
      detail: "Your permit or certificate is in the release stage and awaiting final release processing.",
      href: "/applicant/my-applications",
      cta: "View release status",
      variant: "info",
    };
  }

  if (input.status === "Released") {
    return {
      label: "Application Released",
      detail: input.releasedWithLocation
        ? "Your permit or certificate is released. Business Location coordinates have been submitted with your application."
        : "Your permit or certificate is released. Business Location coordinates are recorded in your application.",
      href: "/applicant/my-applications",
      cta: "View all applications",
      variant: "info",
    };
  }

  if (input.status === "Rejected") {
    return {
      label: "Application rejected; view remarks",
      detail: "Review the rejection remarks in your application details.",
      href: `/applicant/my-applications/${input.id}`,
      cta: "View remarks",
      variant: "warning",
    };
  }

  return {
    label: "Review application status",
    detail: "Open your application tracker to review the latest status updates.",
    href: "/applicant/my-applications",
    cta: "Open tracker",
    variant: "info",
  };
}

export default async function ApplicantDashboard() {
  const session = await auth();
  const applications = session?.user?.id ? await listApplicantApplications(session.user.id) : [];
  const locationRows = session?.user?.id
    ? await listApplicantReleasedBusinessLocations(session.user.id)
    : [];
  const notifications = session?.user?.id ? await listApplicantNotifications(session.user.id) : [];

  const locationSubmittedByApplicationNumber = new Set(
    locationRows.filter((row) => row.location !== null).map((row) => row.applicationNumber)
  );

  const pendingCount = applications.filter((item) => item.status !== "Released" && item.status !== "Rejected").length;
  const needsActionCount = applications.filter((item) => item.status === "Returned for Correction").length;
  const releasedCount = applications.filter((item) => item.status === "Released").length;

  const prioritized = applications
    .map((item, index) => {
      const releasedWithLocation =
        item.status === "Released" && locationSubmittedByApplicationNumber.has(item.applicationNumber);

      return {
        item,
        index,
        rank: getPriorityRank(item.status, releasedWithLocation),
        releasedWithLocation,
      };
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index)[0];

  const nextAction = prioritized
    ? getNextActionForStatus({
        status: prioritized.item.status,
        id: prioritized.item.id,
        applicationType: prioritized.item.applicationType,
        releasedWithLocation: prioritized.releasedWithLocation,
      })
    : {
        label: "Start your first application",
        detail: "Choose New Application, Renewal Application, or Closure Application to begin.",
        href: "/applicant/application",
        cta: "Start application",
        variant: "info" as const,
      };

  const recentNotifications = (notifications as DashboardNotification[]).slice(0, 5);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="My Dashboard"
        description="See your application status, updates, and next steps."
        badge={<RoleBadge role="APPLICANT" />}
      />

      <SectionCard title="Your Next Action" description="Based on your highest-priority application status.">
        <InfoBanner
          title={nextAction.label}
          description={nextAction.detail}
          variant={nextAction.variant}
          action={
            <Link
              href={nextAction.href}
              className={actionButtonStyles(nextAction.variant === "warning" ? "warning" : "secondary", "sm")}
            >
              {nextAction.cta}
            </Link>
          }
        />
      </SectionCard>

      <SectionCard title="Application Summary" description="Quick overview of your current applications.">
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardSummaryCard title="Active Applications" value={String(pendingCount)} subtitle="Applications still in progress" tone="blue" />
          <DashboardSummaryCard title="Needs Action" value={String(needsActionCount)} subtitle="Returned for correction" tone="amber" />
          <DashboardSummaryCard title="Completed / Released" value={String(releasedCount)} subtitle="Released application records" tone="green" />
        </div>
      </SectionCard>

      <SectionCard title="Recent Updates" description="Latest updates from your application history.">
        {recentNotifications.length === 0 ? (
          <EmptyState
            title="No updates yet"
            description="Updates will appear here as BPLO processes your applications."
          />
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-mono text-xs text-slate-600">{item.applicationNumber}</p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("en-PH")}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">Status: {item.toStatus}</p>
                <p className="mt-1 text-sm text-slate-600">{item.remarks ?? "No remarks provided."}</p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Primary Actions" description="Choose your next primary action.">
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/applicant/application" className={actionButtonStyles("primary", "md", "w-full")}>
            File New Application
          </Link>
          <Link href="/applicant/my-applications" className={actionButtonStyles("secondary", "md", "w-full")}>
            View All Applications
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Renewal and Closure require an eligible released business record.
        </p>
      </SectionCard>
    </section>
  );
}
