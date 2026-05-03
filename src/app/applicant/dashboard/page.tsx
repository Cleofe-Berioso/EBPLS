import Link from "next/link";
import { Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { listApplicantApplications, listApplicantNotifications } from "@/lib/applications";
import { listApplicantReleasedBusinessLocations } from "@/lib/business-location";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import { StatusBadge } from "@/components/applicant/status-badge";
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

const TOP_READY_STATUSES = ["Approved for Payment", "Paid", "For Release", "Released"];

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
      label: "Wait for BPLO review",
      detail: "Your application was submitted and is queued for BPLO review.",
      href: "/applicant/my-applications",
      cta: "Open My Applications",
      variant: "info",
    };
  }

  if (input.status === "Under Review") {
    return {
      label: "BPLO is reviewing your application",
      detail: "Your application is currently under BPLO review.",
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
      label: "Wait for Tax Order of Payment generation",
      detail: "BPLO assessment is complete. Wait for Tax Order of Payment to be generated.",
      href: "/applicant/my-applications",
      cta: "View status",
      variant: "info",
    };
  }

  if (input.status === "Approved for Payment") {
    return {
      label: "View Tax Order of Payment and submit OR/eGov transaction number",
      detail: "Your Tax Order of Payment is available. Submit your OR Number / eGov Transaction Number after payment.",
      href: "/applicant/top",
      cta: "Open Tax Order of Payment",
      variant: "warning",
    };
  }

  if (input.status === "Paid") {
    return {
      label: "Wait for permit/certificate preparation",
      detail: "Payment has been verified. BPLO will proceed with permit or certificate preparation.",
      href: "/applicant/my-applications",
      cta: "View status",
      variant: "info",
    };
  }

  if (input.status === "For Release") {
    return {
      label: "Permit/certificate is ready for release",
      detail: "Your permit or certificate is in the release stage.",
      href: "/applicant/my-applications",
      cta: "View release status",
      variant: "info",
    };
  }

  if (input.status === "Released") {
    return {
      label: "Submit or view Business Location",
      detail: input.releasedWithLocation
        ? "Your released record already has a submitted Business Location. You can view or update it as allowed."
        : "Your permit or certificate is released. Submit your Business Location details next.",
      href: "/applicant/business-location",
      cta: "Open Business Location",
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

function getLatestTopStatus(status: string | null): {
  value: string;
  subtitle: string;
  tone: "green" | "blue" | "amber" | "slate";
} {
  if (!status) {
    return {
      value: "No application selected",
      subtitle: "No latest application record is available yet.",
      tone: "slate",
    };
  }

  if (status === "Approved for Payment") {
    return {
      value: "TOP available",
      subtitle: "This application can now submit OR Number / eGov Transaction Number.",
      tone: "amber",
    };
  }

  if (status === "Paid" || status === "For Release" || status === "Released") {
    return {
      value: "Payment stage completed",
      subtitle: "This application already completed Tax Order of Payment processing.",
      tone: "green",
    };
  }

  return {
    value: "Pending assessment",
    subtitle: "This application is waiting for BPLO assessment or TOP generation.",
    tone: "blue",
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

  const latest = applications[0];
  const pendingCount = applications.filter((item) => item.status !== "Released" && item.status !== "Rejected").length;
  const needsActionCount = applications.filter((item) => item.status === "Returned for Correction").length;
  const activePermits = applications.filter((item) => item.status === "Released").length;
  const hasAccountTopAvailability = applications.some((item) => TOP_READY_STATUSES.includes(item.status));

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

  const latestTopStatus = getLatestTopStatus(latest?.status ?? null);

  const latestHasLocationSubmitted = latest
    ? locationSubmittedByApplicationNumber.has(latest.applicationNumber)
    : false;

  const releaseLocationStatus = !latest
    ? {
        value: "No release yet",
        subtitle: "Business Location follows permit or certificate release.",
        tone: "slate" as const,
      }
    : latest.status === "Released" && !latestHasLocationSubmitted
      ? {
          value: "Business Location not submitted",
          subtitle: "Submit Business Location for your released record.",
          tone: "amber" as const,
        }
      : latest.status === "Released" && latestHasLocationSubmitted
        ? {
            value: "Business Location submitted",
            subtitle: "You can review your submitted Business Location details.",
            tone: "green" as const,
          }
        : latest.status === "For Release"
          ? {
              value: "Ready for release",
              subtitle: "Permit or certificate is in the release stage.",
              tone: "amber" as const,
            }
          : {
              value: "Not yet released",
              subtitle: "Business Location becomes available after release.",
              tone: "blue" as const,
            };

  const recentNotifications = (notifications as DashboardNotification[]).slice(0, 3);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="Dashboard"
        description={`Welcome, ${session?.user?.name ?? "Applicant"}. Review your next required action, latest application status, and filing updates.`}
        badge={<RoleBadge role="APPLICANT" />}
      />

      <SectionCard title="Next Required Action" description="Based on your highest-priority application status.">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardSummaryCard title="Active Permits" value={String(activePermits)} subtitle="Released application records" tone="green" />
        <DashboardSummaryCard title="Pending Applications" value={String(pendingCount)} subtitle="Applications still in progress" tone="blue" />
        <DashboardSummaryCard title="Needs Action" value={String(needsActionCount)} subtitle="Returned for correction" tone="amber" />
        <DashboardSummaryCard
          title="TOP Availability"
          value={hasAccountTopAvailability ? "Available" : "Pending"}
          subtitle={
            hasAccountTopAvailability
              ? "At least one application has a Tax Order of Payment."
              : "No application has a Tax Order of Payment yet."
          }
          icon={<Receipt className="h-5 w-5" />}
          tone="slate"
        />
      </div>

      <SectionCard title="Latest Application" description="Your most recently updated application record.">
        {latest ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{latest.applicationNumber}</p>
                <p className="mt-1 truncate text-sm text-slate-600">{latest.businessName}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {latest.applicationType} application
                </p>
              </div>
              <StatusBadge status={latest.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/applicant/my-applications/${latest.id}`} className={actionButtonStyles("primary", "sm")}>
                View details
              </Link>
              <Link href="/applicant/my-applications" className={actionButtonStyles("secondary", "sm")}>
                Open tracker
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            description="Start a new, renewal, or closure application to begin your filing workflow."
            action={
              <Link href="/applicant/application" className={actionButtonStyles("primary", "sm")}>
                Start application
              </Link>
            }
          />
        )}
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardSummaryCard
          title="Latest Application TOP Status"
          value={latestTopStatus.value}
          subtitle={latestTopStatus.subtitle}
          tone={latestTopStatus.tone}
        />
        <DashboardSummaryCard
          title="Release / Business Location Status"
          value={releaseLocationStatus.value}
          subtitle={releaseLocationStatus.subtitle}
          tone={releaseLocationStatus.tone}
        />
      </div>

      <SectionCard title="Recent Notifications" description="Latest updates from your application history.">
        {recentNotifications.length === 0 ? (
          <EmptyState
            title="No recent notifications."
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

      <SectionCard title="Quick Actions" description="Start a new filing using the application type below.">
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/applicant/application/new" className={actionButtonStyles("primary", "md", "w-full")}>
            New Application
          </Link>
          <Link href="/applicant/application/renewal" className={actionButtonStyles("primary", "md", "w-full")}>
            Renewal Application
          </Link>
          <Link href="/applicant/application/closure" className={actionButtonStyles("primary", "md", "w-full")}>
            Closure Application
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Renewal and Closure require an eligible released business record.
        </p>
      </SectionCard>
    </section>
  );
}
