import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { cacheOrCompute, CacheKeys, CacheTTL } from "@/lib/cache";
import {
  getRenewalEligibility,
  checkClosureEligibility,
} from "@/lib/application-helpers";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

type Icon = React.ElementType<{ className?: string }>;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, firstName } = session.user;
  const whereClause =
    role === "APPLICANT" ? { applicantId: session.user.id } : {};

  const cacheKey = CacheKeys.dashboardStats(
    role === "APPLICANT" ? session.user.id : role
  );

  const stats = await cacheOrCompute(
    cacheKey,
    async () => {
      const [total, under, app, rej] = await Promise.all([
        prisma.application.count({ where: whereClause }),
        prisma.application.count({ where: { ...whereClause, status: "UNDER_REVIEW" } }),
        prisma.application.count({
          where: {
            ...whereClause,
            status: { in: ["PAYMENT_PENDING", "PAID", "PERMIT_PREPARED", "READY_FOR_RELEASE", "RELEASED", "COMPLETED"] },
          },
        }),
        prisma.application.count({ where: { ...whereClause, status: "REJECTED" } }),
      ]);
      return { total, under, app, rej };
    },
    CacheTTL.SHORT
  );

  const { total: totalApplications, under: underReview, app: approved, rej: rejected } = stats;

  let applicantContextData: {
    canStartNew: boolean;
    renewalEligibleCount: number;
    closureEligibleCount: number;
  } | null = null;

  if (role === "APPLICANT") {
    const [userPermits, pendingNewApps] = await Promise.all([
      prisma.permit.findMany({
        where: { application: { applicantId: session.user.id } },
        select: {
          id: true,
          application: { select: { dtiSecRegistration: true } },
        },
      }),
      prisma.application.findMany({
        where: {
          applicantId: session.user.id,
          type: "NEW",
          status: { in: ["DRAFT", "SUBMITTED"] },
        },
        select: { dtiSecRegistration: true },
      }),
    ]);

    const canStartNew = pendingNewApps.length === 0;

    const renewalChecks = await Promise.all(
      userPermits.map((p) => getRenewalEligibility(session.user.id, p.id))
    );
    const renewalEligibleCount = renewalChecks.filter((r) => r.isEligible).length;

    const closureChecks = await Promise.all(
      userPermits.map((p) => checkClosureEligibility(session.user.id, p.id))
    );
    const closureEligibleCount = closureChecks.filter((c) => c.isEligible).length;

    applicantContextData = { canStartNew, renewalEligibleCount, closureEligibleCount };
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          {role === "APPLICANT"
            ? "Dashboard"
            : role === "BPLO_OFFICE"
            ? "BPLO Dashboard"
            : "Admin Dashboard"}
        </h1>
        <p className="mt-1 text-gray-600">
          Welcome back, {firstName}!{" "}
          {role === "APPLICANT"
            ? "Manage your business permit applications."
            : role === "BPLO_OFFICE"
            ? "Review applications and manage permit issuances."
            : "Manage users, reports, settings, and system visibility."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          Icon={FileText}
          label="Total Applications"
          value={totalApplications.toString()}
          borderColor="border-blue-500"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          Icon={Clock}
          label="Under Review"
          value={underReview.toString()}
          borderColor="border-yellow-500"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          Icon={CheckCircle}
          label="Approved"
          value={approved.toString()}
          borderColor="border-green-500"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          Icon={XCircle}
          label="Rejected"
          value={rejected.toString()}
          borderColor="border-red-500"
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role === "APPLICANT" && (
            <>
              {applicantContextData?.canStartNew && (
                <QuickAction
                  Icon={FileText}
                  title="New Application"
                  description="Submit a new business permit application"
                  href="/dashboard/applications/new"
                  color="green"
                />
              )}
              {applicantContextData && applicantContextData.renewalEligibleCount > 0 && (
                <QuickAction
                  Icon={FileText}
                  title="Renew Permit"
                  description={`${applicantContextData.renewalEligibleCount} permit${applicantContextData.renewalEligibleCount !== 1 ? "s" : ""} eligible for renewal`}
                  href="/dashboard/renew"
                  color="blue"
                />
              )}
              {applicantContextData && applicantContextData.closureEligibleCount > 0 && (
                <QuickAction
                  Icon={XCircle}
                  title="Close Business"
                  description={`${applicantContextData.closureEligibleCount} permit${applicantContextData.closureEligibleCount !== 1 ? "s" : ""} eligible for closure`}
                  href="/dashboard/applications/closure"
                  color="red"
                />
              )}
              <QuickAction
                Icon={Clock}
                title="Track Application"
                description="Check the status of your applications"
                href="/dashboard/tracking"
                color="yellow"
              />
            </>
          )}
          {role === "BPLO_OFFICE" && (
            <>
              <QuickAction
                Icon={AlertCircle}
                title="Verify Documents"
                description="Review submitted documents"
                href="/dashboard/verify-documents"
                color="blue"
              />
              <QuickAction
                Icon={CheckCircle}
                title="Review Queue"
                description="Review applications awaiting approval"
                href="/dashboard/review"
                color="green"
              />
              <QuickAction
                Icon={Printer}
                title="Issue Permits"
                description="Issue permits to approved applications"
                href="/dashboard/issuance"
                color="purple"
              />
              <QuickAction
                Icon={FileText}
                title="Payment Queue"
                description="Validate and confirm submitted payments"
                href="/dashboard/payment-queue"
                color="yellow"
              />
            </>
          )}
          {role === "ADMIN" && (
            <>
              <QuickAction
                Icon={Users}
                title="Manage Users"
                description="Create, update, and monitor user accounts"
                href="/dashboard/admin/users"
                color="blue"
              />
              <QuickAction
                Icon={BarChart3}
                title="View Reports"
                description="Review system analytics and export reports"
                href="/dashboard/admin/reports"
                color="green"
              />
              <QuickAction
                Icon={Settings}
                title="System Settings"
                description="Configure system-wide settings and controls"
                href="/dashboard/admin/settings"
                color="purple"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  borderColor,
  iconBg,
  iconColor,
}: {
  Icon: Icon;
  label: string;
  value: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${iconBg} p-3 rounded-full`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

const quickActionColors = {
  green: { bg: "bg-green-100", text: "text-green-600", hover: "hover:border-green-300" },
  blue: { bg: "bg-blue-100", text: "text-blue-600", hover: "hover:border-blue-300" },
  red: { bg: "bg-red-100", text: "text-red-600", hover: "hover:border-red-300" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600", hover: "hover:border-yellow-300" },
  purple: { bg: "bg-purple-100", text: "text-purple-600", hover: "hover:border-purple-300" },
} as const;

function QuickAction({
  Icon,
  title,
  description,
  href,
  color,
}: {
  Icon: Icon;
  title: string;
  description: string;
  href: string;
  color: keyof typeof quickActionColors;
}) {
  const c = quickActionColors[color];
  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${c.hover}`}
    >
      <div className={`rounded-lg ${c.bg} p-2.5`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div>
        <h3 className={`font-semibold text-gray-900 group-hover:${c.text}`}>{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
