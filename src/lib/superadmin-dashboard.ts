import { cache } from "react";
import { prisma } from "@/lib/prisma";

type DbRole = "APPLICANT" | "BPLO" | "DEPARTMENT_HEAD" | "JIT" | "SUPER_ADMIN";
type SmsStatus = "SENT" | "FAILED" | "SKIPPED";

type UserActivityBucket = {
  applicant: number;
  bplo: number;
  departmentHead: number;
  jit: number;
  superAdmin: number;
};

type TransactionBucket = {
  submitted: number;
  approvals: number;
  returnsRejections: number;
  inspections: number;
  paymentVerification: number;
  permitReleases: number;
  smsSent: number;
  smsFailed: number;
  logins: number;
};

export interface SuperAdminDashboardMetrics {
  userActivityByRole: Array<{
    label: string;
    applicant: number;
    bplo: number;
    departmentHead: number;
    jit: number;
    superAdmin: number;
  }>;
  applicationVolumeAcrossSystem: Array<{
    stage: string;
    bploReview: number;
    bploAssessment: number;
    bploPayment: number;
    bploRelease: number;
    departmentHeadApproval: number;
    jitInspection: number;
  }>;
  transactionVolume: Array<{
    label: string;
    submitted: number;
    approvals: number;
    returnsRejections: number;
    inspections: number;
    paymentVerification: number;
    permitReleases: number;
    smsSent: number;
    smsFailed: number;
    logins: number;
  }>;
  complianceRevocationTrends: Array<{
    metric: string;
    releasedPermits: number;
    verifiedNonCompliant: number;
    revokedBusinesses: number;
    restrictedRenewals: number;
  }>;
  closurePrevalenceTrend: Array<{ label: string; value: number }>;
  prevalentBusinessCategoriesByArea: Array<{ label: string; value: number }>;
  smsDeliveryDistribution: Array<{ name: string; value: number }>;
  errorLogConfigured: boolean;
  systemHealth: {
    databaseReachable: boolean;
    lastSuccessfulDashboardCheck: string;
    recentFailedSmsCount: number;
    recentActivityVolume: number;
  };
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatShortDate(dayKey: string): string {
  const [year, month, day] = dayKey.split("-");
  return `${month}/${day}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${month}/${year}`;
}

function initUserActivityBucket(): UserActivityBucket {
  return {
    applicant: 0,
    bplo: 0,
    departmentHead: 0,
    jit: 0,
    superAdmin: 0,
  };
}

function initTransactionBucket(): TransactionBucket {
  return {
    submitted: 0,
    approvals: 0,
    returnsRejections: 0,
    inspections: 0,
    paymentVerification: 0,
    permitReleases: 0,
    smsSent: 0,
    smsFailed: 0,
    logins: 0,
  };
}

function roleKey(role: DbRole | null): keyof UserActivityBucket | null {
  if (role === "APPLICANT") return "applicant";
  if (role === "BPLO") return "bplo";
  if (role === "DEPARTMENT_HEAD") return "departmentHead";
  if (role === "JIT") return "jit";
  if (role === "SUPER_ADMIN") return "superAdmin";
  return null;
}

function buildDayBuckets(days: number): Map<string, UserActivityBucket> {
  const buckets = new Map<string, UserActivityBucket>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    buckets.set(toDayKey(date), initUserActivityBucket());
  }
  return buckets;
}

function buildTransactionDayBuckets(days: number): Map<string, TransactionBucket> {
  const buckets = new Map<string, TransactionBucket>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    buckets.set(toDayKey(date), initTransactionBucket());
  }
  return buckets;
}

const getCachedSuperAdminDashboardMetrics = cache(async (): Promise<SuperAdminDashboardMetrics> => {
  const now = new Date();
  const dayWindow = 14;
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (dayWindow - 1)));
  const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

  const [
    activityHistory,
    bploReview,
    bploAssessment,
    bploPayment,
    bploRelease,
    departmentHeadApproval,
    jitInspection,
    transactionHistory,
    inspectionsTrendRows,
    paymentVerificationRows,
    permitReleaseRows,
    smsTrendRows,
    releasedPermits,
    verifiedNonCompliant,
    revokedBusinessRows,
    restrictedRenewals,
    closureRows,
    businessCategoryRows,
    smsSummaryRows,
    recentFailedSmsCount,
    recentActivityVolume,
  ] = await Promise.all([
    prisma.applicationHistory.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, actorRole: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.businessApplication.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "RETURNED_FOR_CORRECTION"] } },
    }),
    prisma.businessApplication.count({
      where: { status: { in: ["DEPARTMENT_HEAD_APPROVED", "ASSESSED"] } },
    }),
    prisma.businessApplication.count({ where: { status: "APPROVED_FOR_PAYMENT" } }),
    prisma.businessApplication.count({ where: { status: "FOR_RELEASE" } }),
    prisma.businessApplication.count({ where: { status: "DEPARTMENT_HEAD_REVIEW" } }),
    prisma.inspection.count({
      where: { status: { in: ["COMPLIANT", "NON_COMPLIANT", "DH_VERIFICATION_PENDING"] } },
    }),
    prisma.applicationHistory.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, toStatus: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.inspection.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.paymentReference.findMany({
      where: { reviewedAt: { gte: startDate }, status: { in: ["VERIFIED", "REJECTED"] } },
      select: { reviewedAt: true },
    }),
    prisma.permitIssuance.findMany({
      where: { releasedAt: { gte: startDate }, status: "RELEASED" },
      select: { releasedAt: true },
    }),
    prisma.smsDeliveryLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.permitIssuance.count({ where: { status: "RELEASED" } }),
    prisma.inspection.count({ where: { status: "VERIFIED_NON_COMPLIANT" } }),
    prisma.inspection.findMany({
      where: { OR: [{ status: "REVOKED" }, { revocationDecision: "APPROVED" }] },
      select: { businessRecordId: true },
      distinct: ["businessRecordId"],
    }),
    prisma.businessApplication.count({
      where: {
        applicationType: "RENEWAL",
        status: { in: ["REVOCATION_REVIEW", "REVOKED"] },
      },
    }),
    prisma.businessApplication.findMany({
      where: { applicationType: "CLOSURE" },
      select: { createdAt: true, submittedAt: true, updatedAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.businessRecord.findMany({
      select: {
        lineOfBusiness: true,
        businessType: true,
        location: { select: { barangay: true } },
      },
    }),
    prisma.smsDeliveryLog.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.smsDeliveryLog.count({ where: { createdAt: { gte: sevenDaysAgo }, status: "FAILED" } }),
    prisma.applicationHistory.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const activityBuckets = buildDayBuckets(dayWindow);
  for (const row of activityHistory) {
    const key = toDayKey(row.createdAt);
    const bucket = activityBuckets.get(key);
    if (!bucket) continue;
    const keyByRole = roleKey(row.actorRole as DbRole | null);
    if (!keyByRole) continue;
    bucket[keyByRole] += 1;
  }

  const userActivityByRole = Array.from(activityBuckets.entries()).map(([dayKey, bucket]) => ({
    label: formatShortDate(dayKey),
    applicant: bucket.applicant,
    bplo: bucket.bplo,
    departmentHead: bucket.departmentHead,
    jit: bucket.jit,
    superAdmin: bucket.superAdmin,
  }));

  const applicationVolumeAcrossSystem =
    bploReview + bploAssessment + bploPayment + bploRelease + departmentHeadApproval + jitInspection > 0
      ? [
          {
            stage: "Open Workload",
            bploReview,
            bploAssessment,
            bploPayment,
            bploRelease,
            departmentHeadApproval,
            jitInspection,
          },
        ]
      : [];

  const transactionBuckets = buildTransactionDayBuckets(dayWindow);

  // NOTE: Explicit login events are not persisted yet, so login trend stays zero.
  for (const row of transactionHistory) {
    const key = toDayKey(row.createdAt);
    const bucket = transactionBuckets.get(key);
    if (!bucket) continue;

    if (row.toStatus === "SUBMITTED") {
      bucket.submitted += 1;
    }

    if (
      row.toStatus === "DEPARTMENT_HEAD_APPROVED" ||
      row.toStatus === "APPROVED_FOR_PAYMENT" ||
      row.toStatus === "PAID" ||
      row.toStatus === "FOR_RELEASE" ||
      row.toStatus === "RELEASED"
    ) {
      bucket.approvals += 1;
    }

    if (row.toStatus === "RETURNED_FOR_CORRECTION" || row.toStatus === "REJECTED") {
      bucket.returnsRejections += 1;
    }
  }

  for (const row of inspectionsTrendRows) {
    const key = toDayKey(row.createdAt);
    const bucket = transactionBuckets.get(key);
    if (!bucket) continue;
    bucket.inspections += 1;
  }

  for (const row of paymentVerificationRows) {
    if (!row.reviewedAt) continue;
    const key = toDayKey(row.reviewedAt);
    const bucket = transactionBuckets.get(key);
    if (!bucket) continue;
    bucket.paymentVerification += 1;
  }

  for (const row of permitReleaseRows) {
    if (!row.releasedAt) continue;
    const key = toDayKey(row.releasedAt);
    const bucket = transactionBuckets.get(key);
    if (!bucket) continue;
    bucket.permitReleases += 1;
  }

  for (const row of smsTrendRows) {
    const key = toDayKey(row.createdAt);
    const bucket = transactionBuckets.get(key);
    if (!bucket) continue;

    const smsStatus = row.status as SmsStatus;
    if (smsStatus === "SENT") bucket.smsSent += 1;
    if (smsStatus === "FAILED") bucket.smsFailed += 1;
  }

  const transactionVolume = Array.from(transactionBuckets.entries()).map(([dayKey, bucket]) => ({
    label: formatShortDate(dayKey),
    submitted: bucket.submitted,
    approvals: bucket.approvals,
    returnsRejections: bucket.returnsRejections,
    inspections: bucket.inspections,
    paymentVerification: bucket.paymentVerification,
    permitReleases: bucket.permitReleases,
    smsSent: bucket.smsSent,
    smsFailed: bucket.smsFailed,
    logins: bucket.logins,
  }));

  const complianceRevocationTrends =
    releasedPermits + verifiedNonCompliant + revokedBusinessRows.length + restrictedRenewals > 0
      ? [
          {
            metric: "System Compliance",
            releasedPermits,
            verifiedNonCompliant,
            revokedBusinesses: revokedBusinessRows.length,
            restrictedRenewals,
          },
        ]
      : [];

  const monthBuckets = new Map<string, number>();
  const monthWindow = 12;
  for (let i = monthWindow - 1; i >= 0; i -= 1) {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthBuckets.set(toMonthKey(month), 0);
  }

  // NOTE: Closure trend uses submittedAt when available; otherwise createdAt as safe fallback.
  for (const row of closureRows) {
    const sourceDate = row.submittedAt ?? row.createdAt ?? row.updatedAt;
    const key = toMonthKey(sourceDate);
    if (!monthBuckets.has(key)) continue;
    monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
  }

  const closurePrevalenceTrend = Array.from(monthBuckets.entries()).map(([monthKey, value]) => ({
    label: formatMonthLabel(monthKey),
    value,
  }));

  const categoryByAreaMap = new Map<string, number>();
  for (const row of businessCategoryRows) {
    const area = row.location?.barangay?.trim() || "Unspecified Barangay";
    const category = row.lineOfBusiness?.trim() || row.businessType?.trim() || "Unspecified Category";
    const key = `${area}: ${category}`;
    categoryByAreaMap.set(key, (categoryByAreaMap.get(key) ?? 0) + 1);
  }

  const prevalentBusinessCategoriesByArea = Array.from(categoryByAreaMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const smsCountMap = new Map<SmsStatus, number>([
    ["SENT", 0],
    ["FAILED", 0],
    ["SKIPPED", 0],
  ]);
  for (const row of smsSummaryRows) {
    const key = row.status as SmsStatus;
    smsCountMap.set(key, row._count._all);
  }

  const smsDeliveryDistribution = [
    { name: "Sent SMS", value: smsCountMap.get("SENT") ?? 0 },
    { name: "Failed SMS", value: smsCountMap.get("FAILED") ?? 0 },
    { name: "Skipped SMS", value: smsCountMap.get("SKIPPED") ?? 0 },
  ];

  let databaseReachable = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseReachable = false;
  }

  return {
    userActivityByRole,
    applicationVolumeAcrossSystem,
    transactionVolume,
    complianceRevocationTrends,
    closurePrevalenceTrend,
    prevalentBusinessCategoriesByArea,
    smsDeliveryDistribution,
    errorLogConfigured: false,
    systemHealth: {
      databaseReachable,
      lastSuccessfulDashboardCheck: new Date().toISOString(),
      recentFailedSmsCount,
      recentActivityVolume,
    },
  };
});

export async function getSuperAdminDashboardMetrics(): Promise<SuperAdminDashboardMetrics> {
  return getCachedSuperAdminDashboardMetrics();
}
