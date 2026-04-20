import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { cacheOrCompute, CacheKeys, CacheTTL } from "@/lib/cache";
import {
  canStartNewApplication,
  getRenewalEligibility,
  checkClosureEligibility,
} from "@/lib/application-helpers";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  CalendarCheck,
  AlertCircle,
  Printer,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, firstName } = session.user;
  // Build filter: APPLICANT sees only their own; staff/admin see all
  const whereClause =
    role === "APPLICANT" ? { applicantId: session.user.id } : {};

  // Cache dashboard stats per role (2 min TTL)
  const cacheKey = CacheKeys.dashboardStats(
    role === "APPLICANT" ? session.user.id : role
  );

  const stats = await cacheOrCompute(
    cacheKey,
    async () => {
      const [total, under, app, rej] = await Promise.all([
        prisma.application.count({ where: whereClause }),
        prisma.application.count({ where: { ...whereClause, status: "UNDER_REVIEW" } }),
        prisma.application.count({ where: { ...whereClause, status: "APPROVED" } }),
        prisma.application.count({ where: { ...whereClause, status: "REJECTED" } }),
      ]);
      return { total, under, app, rej };
    },
    CacheTTL.SHORT
  );

  const { total: totalApplications, under: underReview, app: approved, rej: rejected } = stats;

  // APPLICANT-specific: Load business contexts and compute eligibility per context
  let applicantContextData: {
    canStartNew: boolean;
    renewalEligibleCount: number;
    closureEligibleCount: number;
  } | null = null;

  if (role === "APPLICANT") {
    const [userPermits, pendingNewApps] = await Promise.all([
      prisma.permit.findMany({
        where: {
          application: { applicantId: session.user.id },
        },
        select: {
          id: true,
          application: {
            select: {
              dtiSecRegistration: true,
            },
          },
        },
      }),
      prisma.application.findMany({
        where: {
          applicantId: session.user.id,
          type: "NEW",
          status: { in: ["DRAFT", "SUBMITTED"] },
        },
        select: {
          dtiSecRegistration: true,
        },
      }),
    ]);

    // Can start NEW if no pending NEW applications exist
    const canStartNew = pendingNewApps.length === 0;

    // Count renewal and closure eligible permits
    const renewalChecks = await Promise.all(
      userPermits.map((p) => getRenewalEligibility(session.user.id, p.id))
    );
    const renewalEligibleCount = renewalChecks.filter((r) => r.isEligible).length;

    const closureChecks = await Promise.all(
      userPermits.map((p) => checkClosureEligibility(session.user.id, p.id))
    );
    const closureEligibleCount = closureChecks.filter((c) => c.isEligible).length;

    applicantContextData = {
      canStartNew,
      renewalEligibleCount,
      closureEligibleCount,
    };
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {role === "APPLICANT"
            ? "Manage your business permit applications and track their status."
            : role === "BPLO_OFFICE"
            ? "Review applications and manage permit issuances."
            : "Validate payments and manage payment records."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-6 w-6 text-[var(--accent)]" />}
          label="Total Applications"
          value={totalApplications.toString()}
          bgColor="bg-[var(--accent-light)]"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-[var(--warning)]" />}
          label="Under Review"
          value={underReview.toString()}
          bgColor="bg-[var(--warning-light)]"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6 text-[var(--success)]" />}
          label="Approved"
          value={approved.toString()}
          bgColor="bg-[var(--success-light)]"
        />
        <StatCard
          icon={<XCircle className="h-6 w-6 text-[var(--danger)]" />}
          label="Rejected"
          value={rejected.toString()}
          bgColor="bg-[var(--danger-light)]"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role === "APPLICANT" && (
            <>
              {applicantContextData?.canStartNew && (
                <QuickAction
                  icon={<FileText className="h-5 w-5" />}
                  title="New Application"
                  description="Submit a new business permit application"
                  href="/dashboard/applications/new"
                />
              )}
              {applicantContextData && applicantContextData.renewalEligibleCount > 0 && (
                <QuickAction
                  icon={<FileText className="h-5 w-5" />}
                  title="Renew Permit"
                  description={`${applicantContextData.renewalEligibleCount} permit${applicantContextData.renewalEligibleCount !== 1 ? 's' : ''} eligible for renewal`}
                  href="/dashboard/renew"
                />
              )}
              {applicantContextData && applicantContextData.closureEligibleCount > 0 && (
                <QuickAction
                  icon={<FileText className="h-5 w-5" />}
                  title="Close Business"
                  description={`${applicantContextData.closureEligibleCount} permit${applicantContextData.closureEligibleCount !== 1 ? 's' : ''} eligible for closure`}
                  href="/dashboard/applications/closure"
                />
              )}
              <QuickAction
                icon={<Clock className="h-5 w-5" />}
                title="Track Application"
                description="Check the status of your applications"
                href="/dashboard/tracking"
              />
            </>
          )}
          {role === "BPLO_OFFICE" && (
            <>
              <QuickAction
                icon={<AlertCircle className="h-5 w-5" />}
                title="Verify Documents"
                description="Review submitted documents"
                href="/dashboard/verify-documents"
              />
              <QuickAction
                icon={<CheckCircle className="h-5 w-5" />}
                title="Review Queue"
                description="Review applications awaiting approval"
                href="/dashboard/review"
              />
              <QuickAction
                icon={<Printer className="h-5 w-5" />}
                title="Issue Permits"
                description="Issue permits to approved applications"
                href="/dashboard/issuance"
              />
              <QuickAction
                icon={<FileText className="h-5 w-5" />}
                title="Reports"
                description="View application and status reports"
                href="/dashboard/admin/reports"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`rounded-lg ${bgColor} p-2.5 sm:p-3`}>{icon}</div>
        <div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="rounded-lg bg-[var(--accent-light)] p-2 text-[var(--accent)] group-hover:bg-blue-100">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
    </a>
  );
}
