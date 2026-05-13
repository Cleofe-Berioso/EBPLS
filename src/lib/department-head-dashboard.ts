import { prisma } from "@/lib/prisma";

export interface DepartmentHeadDashboardSummary {
  pendingApplicationApprovals: number;
  pendingFlaggedCases: number;
  businessesUnderRestriction: number;
  revocationRecommendations: number;
}

/**
 * Get count of applications pending Department Head approval.
 * These are applications with status DEPARTMENT_HEAD_REVIEW.
 */
export async function getPendingApplicationApprovalsCount(): Promise<number> {
  const count = await prisma.businessApplication.count({
    where: {
      status: "DEPARTMENT_HEAD_REVIEW",
    },
  });
  return count;
}

/**
 * Get count of inspections in revocation review.
 * These are flagged cases waiting for Department Head decision.
 */
export async function getPendingFlaggedCasesCount(): Promise<number> {
  const count = await prisma.inspection.count({
    where: {
      status: "REVOCATION_REVIEW",
      revocationDecision: null,
    },
  });
  return count;
}

/**
 * Get count of businesses under restriction.
 * These are businesses with revoked permits (inspection status REVOKED with revocation decision APPROVED).
 */
export async function getBusinessesUnderRestrictionCount(): Promise<number> {
  const count = await prisma.inspection.count({
    where: {
      status: "REVOKED",
      revocationDecision: "APPROVED",
    },
  });
  return count;
}

/**
 * Get count of revocation recommendations.
 * These are non-compliant inspections awaiting revocation decision.
 */
export async function getRevocationRecommendationsCount(): Promise<number> {
  const count = await prisma.inspection.count({
    where: {
      status: "REVOCATION_REVIEW",
      revocationDecision: null,
    },
  });
  return count;
}

/**
 * Get all dashboard summary counts.
 */
export async function getDepartmentHeadDashboardSummary(): Promise<DepartmentHeadDashboardSummary> {
  const [
    pendingApplicationApprovals,
    pendingFlaggedCases,
    businessesUnderRestriction,
    revocationRecommendations,
  ] = await Promise.all([
    getPendingApplicationApprovalsCount(),
    getPendingFlaggedCasesCount(),
    getBusinessesUnderRestrictionCount(),
    getRevocationRecommendationsCount(),
  ]);

  return {
    pendingApplicationApprovals,
    pendingFlaggedCases,
    businessesUnderRestriction,
    revocationRecommendations,
  };
}
