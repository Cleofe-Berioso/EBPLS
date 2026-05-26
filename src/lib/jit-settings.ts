import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";

/**
 * JIT Portal Settings & Compliance Enforcement - Phase 6
 * 
 * Handles:
 * - Retrieving JIT portal enabled status
 * - Enforcing unresolved government-agency compliance cases when portal is disabled
 * - Converting FLAGGED_UNSETTLED cases to EXPIRED_UNSETTLED
 * - Tracking enforcement actions for audit purposes
 */

export interface JitPortalEnforcementResult {
  casesEnforced: number;
  affectedInspectionIds: string[];
  details: {
    inspectionId: string;
    businessRegistrationNumber: string;
    nonComplianceType: string;
    previousStatus: string;
    newStatus: string;
  }[];
}

/**
 * Get current JIT portal enabled status
 */
export async function getJitPortalEnabled(): Promise<boolean> {
  const setting = await prisma.systemFeeSetting.findFirst({
    select: { jitPortalEnabled: true },
    orderBy: { updatedAt: "desc" },
  });
  return setting?.jitPortalEnabled ?? true;
}

/**
 * Enforce unresolved government-agency compliance cases
 * 
 * When disabling JIT portal:
 * - Find all FLAGGED_UNSETTLED government-agency-related cases
 * - Mark them as EXPIRED_UNSETTLED
 * - Set autoClosed = true
 * - Keep isSettled = false (not actually settled by applicant/department head)
 * - Keep forcedClosure = false (not a forced closure scenario)
 */
export async function enforceUnresolvedJitComplianceCases(): Promise<JitPortalEnforcementResult> {
  const casesToEnforce = await prisma.inspection.findMany({
    where: {
      nonComplianceType: "GOVERNMENT_AGENCY_RELATED",
      complianceCaseStatus: "FLAGGED_UNSETTLED",
      isSettled: false,
      forcedClosure: false,
    },
    select: {
      id: true,
      businessRecord: {
        select: {
          registrationNumber: true,
        },
      },
      nonComplianceType: true,
      complianceCaseStatus: true,
    },
  });

  if (casesToEnforce.length === 0) {
    return {
      casesEnforced: 0,
      affectedInspectionIds: [],
      details: [],
    };
  }

  const now = new Date();
  const details: JitPortalEnforcementResult["details"] = [];

  // Update all cases in a transaction to ensure atomicity
  await prisma.$transaction(
    casesToEnforce.map((inspection) => {
      details.push({
        inspectionId: inspection.id,
        businessRegistrationNumber: inspection.businessRecord?.registrationNumber ?? "UNKNOWN",
        nonComplianceType: inspection.nonComplianceType,
        previousStatus: inspection.complianceCaseStatus,
        newStatus: "EXPIRED_UNSETTLED",
      });

      return prisma.inspection.update({
        where: { id: inspection.id },
        data: {
          complianceCaseStatus: "EXPIRED_UNSETTLED",
          autoClosed: true,
          deadlineAt: now, // Set to current time if not already set
        },
      });
    })
  );

  return {
    casesEnforced: casesToEnforce.length,
    affectedInspectionIds: casesToEnforce.map((i) => i.id),
    details,
  };
}

/**
 * Update JIT portal enabled status with enforcement
 * 
 * When changing from true→false:
 * - Run enforcement
 * - Log enforcement action
 * 
 * When changing to true:
 * - Just update setting (does not reverse EXPIRED_UNSETTLED)
 * - Log the change
 */
export async function updateJitPortalEnabled(input: {
  enabled: boolean;
  changedById: string;
  changedByName: string | null;
  changedByRole: string | null;
}): Promise<{
  success: boolean;
  newValue: boolean;
  enforcementResult?: JitPortalEnforcementResult;
}> {
  const current = await getJitPortalEnabled();

  // If no change, return early
  if (current === input.enabled) {
    return { success: true, newValue: current };
  }

  let enforcementResult: JitPortalEnforcementResult | undefined;

  // Enforce cases only when disabling (true → false)
  if (current === true && input.enabled === false) {
    enforcementResult = await enforceUnresolvedJitComplianceCases();
  }

  // Update the setting
  const setting = await prisma.systemFeeSetting.findFirst({
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!setting) {
    throw new Error("No system fee setting found");
  }

  await prisma.systemFeeSetting.update({
    where: { id: setting.id },
    data: {
      jitPortalEnabled: input.enabled,
      updatedById: input.changedById,
    },
  });

  // Log the setting change
  void createAuditLog({
    actorId: input.changedById,
    actorName: input.changedByName,
    actorRole: input.changedByRole,
    action: "JIT_PORTAL_SETTING_CHANGED",
    module: "SETTINGS",
    entityType: "JIT_PORTAL",
    description: `JIT Portal status changed from ${current ? "enabled" : "disabled"} to ${input.enabled ? "enabled" : "disabled"}`,
    metadata: {
      previousValue: current,
      newValue: input.enabled,
      enforcedCases: enforcementResult?.casesEnforced ?? 0,
    },
  });

  // Log enforcement action if cases were enforced
  if (enforcementResult && enforcementResult.casesEnforced > 0) {
    void createAuditLog({
      actorId: input.changedById,
      actorName: input.changedByName,
      actorRole: input.changedByRole,
      action: "JIT_COMPLIANCE_ENFORCEMENT",
      module: "SETTINGS",
      entityType: "INSPECTION",
      description: `Enforced ${enforcementResult.casesEnforced} unresolved government-agency compliance cases to EXPIRED_UNSETTLED`,
      metadata: {
        totalCases: enforcementResult.casesEnforced,
        affectedInspectionIds: enforcementResult.affectedInspectionIds.slice(0, 100), // Limit to first 100 IDs in metadata
        details: enforcementResult.details.slice(0, 50), // Limit to first 50 details
      },
    });
  }

  return {
    success: true,
    newValue: input.enabled,
    enforcementResult,
  };
}
