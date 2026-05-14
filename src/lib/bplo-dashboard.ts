import { cache } from "react";
import { prisma } from "@/lib/prisma";

type DbApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "DEPARTMENT_HEAD_REVIEW"
  | "DEPARTMENT_HEAD_APPROVED"
  | "ASSESSED"
  | "APPROVED_FOR_PAYMENT"
  | "PAID"
  | "FOR_RELEASE"
  | "RELEASED"
  | "REVOCATION_REVIEW"
  | "REVOKED"
  | "RETURNED_FOR_CORRECTION"
  | "REJECTED";

type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";

export interface BploDashboardMetrics {
  applicationStatusDistribution: Array<{ name: string; value: number }>;
  applicationsProcessedPerDay: Array<{ label: string; value: number }>;
  processingTimeByApplicationType: Array<{ label: string; value: number }>;
  pendingQueueByStatus: Array<{
    queue: string;
    bploReview: number;
    assessment: number;
    paymentVerification: number;
    permitRelease: number;
  }>;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}`;
}

function emptyMetrics(): BploDashboardMetrics {
  return {
    applicationStatusDistribution: [],
    applicationsProcessedPerDay: [],
    processingTimeByApplicationType: [],
    pendingQueueByStatus: [],
  };
}

const getCachedBploDashboardMetrics = cache(async (): Promise<BploDashboardMetrics> => {
  const rows = await prisma.businessApplication.findMany({
    select: {
      status: true,
      applicationType: true,
      submittedAt: true,
      updatedAt: true,
    },
  });

  if (rows.length === 0) return emptyMetrics();

  const statusCount = {
    pendingUnderReview: 0,
    returned: 0,
    approvedForPayment: 0,
    rejected: 0,
    paidRelease: 0,
  };

  const now = new Date();
  const dayRange = 14;
  const dayBuckets = new Map<string, number>();
  for (let i = dayRange - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    dayBuckets.set(dateKey(date), 0);
  }

  const typeAccumulator: Record<ApplicationType, { totalHours: number; count: number }> = {
    NEW: { totalHours: 0, count: 0 },
    RENEWAL: { totalHours: 0, count: 0 },
    CLOSURE: { totalHours: 0, count: 0 },
  };

  for (const row of rows) {
    const status = row.status as DbApplicationStatus;

    if (status === "SUBMITTED" || status === "UNDER_REVIEW" || status === "DEPARTMENT_HEAD_REVIEW") {
      statusCount.pendingUnderReview += 1;
    }
    if (status === "RETURNED_FOR_CORRECTION") {
      statusCount.returned += 1;
    }
    if (status === "DEPARTMENT_HEAD_APPROVED" || status === "ASSESSED" || status === "APPROVED_FOR_PAYMENT") {
      statusCount.approvedForPayment += 1;
    }
    if (status === "REJECTED") {
      statusCount.rejected += 1;
    }
    if (status === "PAID" || status === "FOR_RELEASE" || status === "RELEASED") {
      statusCount.paidRelease += 1;
    }

    // Exact processed timestamp is not modeled. We safely approximate processed date by updatedAt.
    const updatedKey = dateKey(row.updatedAt);
    if (dayBuckets.has(updatedKey)) {
      dayBuckets.set(updatedKey, (dayBuckets.get(updatedKey) ?? 0) + 1);
    }

    if (row.submittedAt) {
      const hours = (row.updatedAt.getTime() - row.submittedAt.getTime()) / (1000 * 60 * 60);
      if (hours >= 0) {
        const type = row.applicationType as ApplicationType;
        typeAccumulator[type].totalHours += hours;
        typeAccumulator[type].count += 1;
      }
    }
  }

  const applicationStatusDistribution = [
    { name: "Pending / Under Review", value: statusCount.pendingUnderReview },
    { name: "Returned", value: statusCount.returned },
    { name: "Approved / For Payment", value: statusCount.approvedForPayment },
    { name: "Rejected", value: statusCount.rejected },
    { name: "Paid / Release / Released", value: statusCount.paidRelease },
  ];

  const applicationsProcessedPerDay = Array.from(dayBuckets.entries()).map(([iso, value]) => ({
    label: formatShortDate(iso),
    value,
  }));

  const processingTimeByApplicationType = [
    { label: "New", type: "NEW" as const },
    { label: "Renewal", type: "RENEWAL" as const },
    { label: "Closure", type: "CLOSURE" as const },
  ]
    .map((entry) => {
      const stats = typeAccumulator[entry.type];
      return {
        label: entry.label,
        value: stats.count > 0 ? Math.round((stats.totalHours / stats.count) * 10) / 10 : 0,
      };
    })
    .filter((row) => row.value > 0);

  const pendingQueueData = {
    queue: "Pending Queue",
    bploReview: rows.filter(
      (row) => row.status === "SUBMITTED" || row.status === "UNDER_REVIEW" || row.status === "RETURNED_FOR_CORRECTION"
    ).length,
    assessment: rows.filter((row) => row.status === "DEPARTMENT_HEAD_APPROVED" || row.status === "ASSESSED").length,
    paymentVerification: rows.filter((row) => row.status === "APPROVED_FOR_PAYMENT").length,
    permitRelease: rows.filter((row) => row.status === "FOR_RELEASE").length,
  };

  const pendingQueueByStatus =
    pendingQueueData.bploReview +
      pendingQueueData.assessment +
      pendingQueueData.paymentVerification +
      pendingQueueData.permitRelease >
    0
      ? [pendingQueueData]
      : [];

  return {
    applicationStatusDistribution,
    applicationsProcessedPerDay,
    processingTimeByApplicationType,
    pendingQueueByStatus,
  };
});

export async function getBploDashboardMetrics(): Promise<BploDashboardMetrics> {
  return getCachedBploDashboardMetrics();
}
