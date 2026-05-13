import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { listActivePermittedBusinessLocations } from "@/lib/business-location";

type JitInspectionStatus = "COMPLIANT" | "NON_COMPLIANT" | "REVOCATION_REVIEW" | "REVOCATION_DENIED" | "REVOKED";

const FLAGGED_STATUSES: JitInspectionStatus[] = ["NON_COMPLIANT", "REVOCATION_REVIEW", "REVOKED"];
const HIGH_RISK_STATUSES: JitInspectionStatus[] = ["NON_COMPLIANT", "REVOCATION_REVIEW"];
const NON_COMPLIANT_RECORD_STATUSES: JitInspectionStatus[] = ["NON_COMPLIANT", "REVOCATION_REVIEW"];

export interface JitDashboardSummary {
  visibleBusinessCount: number;
  inspectionSummary: number;
  highRiskCount: number;
  flaggedBusinessesCount: number;
  compliantCount: number;
  nonCompliantCount: number;
  highRiskBusinessCount: number;
  mediumRiskBusinessCount: number;
  lowRiskBusinessCount: number;
}

function getEmptySummary(visibleBusinessCount = 0): JitDashboardSummary {
  return {
    visibleBusinessCount,
    inspectionSummary: 0,
    highRiskCount: 0,
    flaggedBusinessesCount: 0,
    compliantCount: 0,
    nonCompliantCount: 0,
    highRiskBusinessCount: 0,
    mediumRiskBusinessCount: 0,
    lowRiskBusinessCount: 0,
  };
}

const getCachedJitDashboardSummary = cache(async (): Promise<JitDashboardSummary> => {
  const businesses = await listActivePermittedBusinessLocations();
  const businessRecordIds = businesses.map((row) => row.businessRecordId);

  if (businessRecordIds.length === 0) {
    return getEmptySummary();
  }

  const inspections = await prisma.inspection.findMany({
    where: {
      businessRecordId: {
        in: businessRecordIds,
      },
      inspector: {
        role: "JIT",
      },
    },
    select: {
      businessRecordId: true,
      status: true,
      createdAt: true,
    },
    orderBy: [{ businessRecordId: "asc" }, { createdAt: "desc" }],
  });

  const latestByBusiness = new Map<string, JitInspectionStatus>();
  const inspectionCountByBusiness = new Map<string, number>();
  const flaggedHistoryByBusiness = new Set<string>();

  for (const inspection of inspections) {
    const status = inspection.status as JitInspectionStatus;

    inspectionCountByBusiness.set(inspection.businessRecordId, (inspectionCountByBusiness.get(inspection.businessRecordId) ?? 0) + 1);

    if (!latestByBusiness.has(inspection.businessRecordId)) {
      latestByBusiness.set(inspection.businessRecordId, status);
    }

    if (NON_COMPLIANT_RECORD_STATUSES.includes(status)) {
      flaggedHistoryByBusiness.add(inspection.businessRecordId);
    }
  }

  let highRiskBusinessCount = 0;
  let mediumRiskBusinessCount = 0;
  let lowRiskBusinessCount = 0;

  for (const businessRecordId of businessRecordIds) {
    const latestStatus = latestByBusiness.get(businessRecordId);
    const inspectionCount = inspectionCountByBusiness.get(businessRecordId) ?? 0;
    const hasFlaggedHistory = flaggedHistoryByBusiness.has(businessRecordId);

    if (!latestStatus) {
      lowRiskBusinessCount += 1;
      continue;
    }

    if (HIGH_RISK_STATUSES.includes(latestStatus)) {
      highRiskBusinessCount += 1;
      continue;
    }

    if (inspectionCount > 1 || hasFlaggedHistory) {
      mediumRiskBusinessCount += 1;
    } else {
      lowRiskBusinessCount += 1;
    }
  }

  const inspectionSummary = inspections.length;
  const highRiskCount = businesses.filter((row) => HIGH_RISK_STATUSES.includes(latestByBusiness.get(row.businessRecordId) ?? "COMPLIANT")).length;
  const flaggedBusinessesCount = businesses.filter((row) => FLAGGED_STATUSES.includes(latestByBusiness.get(row.businessRecordId) ?? "COMPLIANT")).length;
  const compliantCount = businesses.filter((row) => latestByBusiness.get(row.businessRecordId) === "COMPLIANT").length;
  const nonCompliantCount = inspections.filter((inspection) => NON_COMPLIANT_RECORD_STATUSES.includes(inspection.status as JitInspectionStatus)).length;

  return {
    visibleBusinessCount: businesses.length,
    inspectionSummary,
    highRiskCount,
    flaggedBusinessesCount,
    compliantCount,
    nonCompliantCount,
    highRiskBusinessCount,
    mediumRiskBusinessCount,
    lowRiskBusinessCount,
  };
});

export async function getJitDashboardSummary() {
  return getCachedJitDashboardSummary();
}