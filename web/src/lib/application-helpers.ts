/**
 * Application Helpers - P2.0 Application Processing
 * Contains core business logic for application type validation, duplicate checks, and workflows
 */

import prisma from "@/lib/prisma";
import { ApplicationType, ApplicationStatus } from "@prisma/client";

const CLEARANCE_REQUIREMENTS: Record<
  ApplicationType,
  Array<{ requirementCode: string; requirementName: string; description: string | null }>
> = {
  NEW: [
    {
      requirementCode: "BARANGAY_CLEARANCE",
      requirementName: "Barangay Business Clearance",
      description: "Barangay-issued business clearance for the declared location.",
    },
    {
      requirementCode: "ZONING_CLEARANCE",
      requirementName: "Locational or Zoning Clearance",
      description: "Land-use compatibility requirement tracked by BPLO.",
    },
    {
      requirementCode: "FIRE_SAFETY",
      requirementName: "Fire Safety Inspection Certificate",
      description: "Fire safety compliance requirement tracked by BPLO.",
    },
    {
      requirementCode: "SANITARY_PERMIT",
      requirementName: "Sanitary Permit or Clearance",
      description: "Health and sanitation compliance requirement tracked by BPLO.",
    },
  ],
  RENEWAL: [
    {
      requirementCode: "BARANGAY_CLEARANCE",
      requirementName: "Current Barangay Business Clearance",
      description: "Current-year barangay business clearance.",
    },
    {
      requirementCode: "FIRE_SAFETY",
      requirementName: "Updated Fire Safety Inspection Certificate",
      description: "Updated fire safety compliance requirement tracked by BPLO.",
    },
    {
      requirementCode: "SANITARY_PERMIT",
      requirementName: "Updated Sanitary Permit or Clearance",
      description: "Updated sanitation compliance requirement tracked by BPLO.",
    },
  ],
  CLOSURE: [
    {
      requirementCode: "TAX_CLEARANCE",
      requirementName: "Tax Clearance",
      description: "Tax settlement requirement tracked by BPLO.",
    },
    {
      requirementCode: "CLOSURE_AFFIDAVIT",
      requirementName: "Affidavit of Business Closure",
      description: "Closure affidavit requirement tracked by BPLO.",
    },
  ],
};

// ============================================================================
// P2.1: Application Type Validation & Duplicate Checks
// ============================================================================

/**
 * Check if user has duplicate application (DRAFT or SUBMITTED status)
 * Prevents multiple active applications of the same type
 */
export async function checkDuplicateApplication(
  userId: string,
  type: ApplicationType
): Promise<{
  isDuplicate: boolean;
  existingAppId?: string;
  existingAppNumber?: string;
  existingStatus?: ApplicationStatus;
}> {
  const existing = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      type,
      status: {
        in: ["DRAFT", "SUBMITTED"],
      },
    },
    select: {
      id: true,
      applicationNumber: true,
      status: true,
    },
  });

  if (existing) {
    return {
      isDuplicate: true,
      existingAppId: existing.id,
      existingAppNumber: existing.applicationNumber,
      existingStatus: existing.status,
    };
  }

  return { isDuplicate: false };
}

/**
 * Validate RENEWAL application has a valid previous permit
 */
export async function validateRenewalPermit(previousPermitId: string): Promise<{
  isValid: boolean;
  error?: string;
  permitNumber?: string;
  expiryDate?: Date;
}> {
  const permit = await prisma.permit.findUnique({
    where: { id: previousPermitId },
    select: {
      id: true,
      permitNumber: true,
      status: true,
      expiryDate: true,
      applicationId: true,
    },
  });

  if (!permit) {
    return { isValid: false, error: "Permit not found" };
  }

  // Check if permit is in a valid state for renewal
  // Allow ACTIVE or expired permits (expired within 6 months grace period)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (permit.status === "REVOKED") {
    return { isValid: false, error: "This permit has been revoked and cannot be renewed" };
  }

  if (permit.expiryDate < sixMonthsAgo) {
    return { isValid: false, error: "This permit expired more than 6 months ago. Please apply as NEW instead." };
  }

  return {
    isValid: true,
    permitNumber: permit.permitNumber,
    expiryDate: permit.expiryDate,
  };
}

/**
 * P2.3: CLOSURE - Check if applicant has outstanding obligations for this specific permit
 * Block CLOSURE only if the permit being closed has pending, partial, or installment payments
 */
export async function checkClosureEligibility(
  userId: string,
  permitId: string
): Promise<{
  isEligible: boolean;
  reason?: string;
  permitNumber?: string;
  businessName?: string;
  outstandingBalance?: number;
  pendingPayments?: Array<{ id: string; amount: number; status: string }>;
}> {
  try {
    // Get the specific permit being closed
    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      select: {
        id: true,
        permitNumber: true,
        applicationId: true,
        application: {
          select: {
            applicantId: true,
            businessName: true,
          },
        },
      },
    });

    if (!permit) {
      return {
        isEligible: false,
        reason: "Permit not found",
      };
    }

    // Verify ownership
    if (permit.application.applicantId !== userId) {
      return {
        isEligible: false,
        reason: "You do not have permission to close this permit",
        permitNumber: permit.permitNumber,
      };
    }

    // Check for pending or failed payments for THIS PERMIT ONLY
    const pendingPayments = await prisma.payment.findMany({
      where: {
        applicationId: permit.applicationId,
        status: { in: ["PENDING", "FAILED"] },
      },
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    if (pendingPayments.length > 0) {
      const totalOutstanding = pendingPayments.reduce(
        (sum, p) => sum + (typeof p.amount === "number" ? p.amount : parseFloat(p.amount.toString())),
        0
      );
      return {
        isEligible: false,
        reason: `Cannot proceed with closure. Permit ${permit.permitNumber} has ${pendingPayments.length} pending payment(s) totaling ₱${totalOutstanding.toFixed(2)}. Please complete all payments before closing.`,
        permitNumber: permit.permitNumber,
        businessName: permit.application.businessName,
        outstandingBalance: totalOutstanding,
        pendingPayments: pendingPayments.map((p) => ({
          id: p.id,
          amount: typeof p.amount === "number" ? p.amount : parseFloat(p.amount.toString()),
          status: p.status,
        })),
      };
    }

    // All checks passed
    return {
      isEligible: true,
      permitNumber: permit.permitNumber,
      businessName: permit.application.businessName,
    };
  } catch (error) {
    console.error("Error checking closure eligibility:", error);
    return {
      isEligible: false,
      reason: "Unable to verify closure eligibility. Please try again later.",
    };
  }
}

/**
 * Per-Business Context: NEW Application Access Control
 * Check if user can start a NEW application for a specific DTI registration
 * Returns false if user already has pending/draft/active application for this DTI
 */
export async function canStartNewApplication(
  userId: string,
  dtiSecRegistration: string
): Promise<{
  isEligible: boolean;
  reason?: string;
  conflictingAppId?: string;
  conflictingAppNumber?: string;
}> {
  try {
    // Check for existing pending/draft NEW application for this DTI
    const existing = await prisma.application.findFirst({
      where: {
        applicantId: userId,
        type: "NEW",
        dtiSecRegistration,
        status: { in: ["DRAFT", "SUBMITTED"] },
      },
      select: {
        id: true,
        applicationNumber: true,
      },
    });

    if (existing) {
      return {
        isEligible: false,
        reason: `You already have a pending application for this business. Please complete or withdraw application ${existing.applicationNumber} first.`,
        conflictingAppId: existing.id,
        conflictingAppNumber: existing.applicationNumber,
      };
    }

    return { isEligible: true };
  } catch (error) {
    console.error("Error checking NEW application eligibility:", error);
    return {
      isEligible: false,
      reason: "Unable to verify eligibility. Please try again later.",
    };
  }
}

/**
 * Per-Permit Context: RENEWAL Eligibility Check
 * Check if user can start RENEWAL for a specific permit
 * Returns false if permit inactive, expired > 6 months, or user has pending renewal
 */
export async function getRenewalEligibility(
  userId: string,
  permitId: string
): Promise<{
  isEligible: boolean;
  permit?: {
    permitNumber: string;
    businessName: string;
    expiryDate: Date;
    status: string;
  };
  reason?: string;
  renewalWindowInfo?: {
    expirerOn: Date;
    earliestRenewalDate: Date;
    latestRenewalDate: Date;
  };
  pendingRenewalAppId?: string;
}> {
  try {
    // Fetch permit and verify ownership
    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      select: {
        id: true,
        permitNumber: true,
        status: true,
        expiryDate: true,
        application: {
          select: {
            applicantId: true,
            businessName: true,
          },
        },
      },
    });

    if (!permit) {
      return {
        isEligible: false,
        reason: "Permit not found.",
      };
    }

    if (permit.application.applicantId !== userId) {
      return {
        isEligible: false,
        reason: "You do not have permission to renew this permit.",
      };
    }

    // Check permit status
    if (permit.status === "REVOKED") {
      return {
        isEligible: false,
        reason: "This permit has been revoked and cannot be renewed.",
        permit: {
          permitNumber: permit.permitNumber,
          businessName: permit.application.businessName,
          expiryDate: permit.expiryDate,
          status: permit.status,
        },
      };
    }

    if (permit.status === "CLOSED") {
      return {
        isEligible: false,
        reason: "This permit has been closed and cannot be renewed.",
        permit: {
          permitNumber: permit.permitNumber,
          businessName: permit.application.businessName,
          expiryDate: permit.expiryDate,
          status: permit.status,
        },
      };
    }

    // Renewal window: 30 days before expiry to 6 months after expiry
    const today = new Date();
    const expiryDate = new Date(permit.expiryDate);
    const thirtyDaysBefore = new Date(expiryDate);
    thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);
    const sixMonthsAfter = new Date(expiryDate);
    sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);

    if (today < thirtyDaysBefore) {
      return {
        isEligible: false,
        reason: `Renewal window hasn't opened yet. You can renew starting ${thirtyDaysBefore.toLocaleDateString()}.`,
        permit: {
          permitNumber: permit.permitNumber,
          businessName: permit.application.businessName,
          expiryDate: permit.expiryDate,
          status: permit.status,
        },
        renewalWindowInfo: {
          expirerOn: expiryDate,
          earliestRenewalDate: thirtyDaysBefore,
          latestRenewalDate: sixMonthsAfter,
        },
      };
    }

    if (today > sixMonthsAfter) {
      return {
        isEligible: false,
        reason: `Permit expired more than 6 months ago (${expiryDate.toLocaleDateString()}). Please apply as NEW instead.`,
        permit: {
          permitNumber: permit.permitNumber,
          businessName: permit.application.businessName,
          expiryDate: permit.expiryDate,
          status: permit.status,
        },
      };
    }

    // Check for existing pending/draft RENEWAL application for this permit
    const existingRenewal = await prisma.application.findFirst({
      where: {
        applicantId: userId,
        type: "RENEWAL",
        previousPermitId: permitId,
        status: { in: ["DRAFT", "SUBMITTED"] },
      },
      select: {
        id: true,
      },
    });

    if (existingRenewal) {
      return {
        isEligible: false,
        reason: "You already have a pending renewal application for this permit.",
        permit: {
          permitNumber: permit.permitNumber,
          businessName: permit.application.businessName,
          expiryDate: permit.expiryDate,
          status: permit.status,
        },
        pendingRenewalAppId: existingRenewal.id,
      };
    }

    // All checks passed
    return {
      isEligible: true,
      permit: {
        permitNumber: permit.permitNumber,
        businessName: permit.application.businessName,
        expiryDate: permit.expiryDate,
        status: permit.status,
      },
      renewalWindowInfo: {
        expirerOn: expiryDate,
        earliestRenewalDate: thirtyDaysBefore,
        latestRenewalDate: sixMonthsAfter,
      },
    };
  } catch (error) {
    console.error("Error checking renewal eligibility:", error);
    return {
      isEligible: false,
      reason: "Unable to verify renewal eligibility. Please try again later.",
    };
  }
}

/**
 * Generate unique application number
 * Format: APP-YYYYMMDD-XXXXXX (e.g., APP-20260415-A1B2C3)
 */
export function generateApplicationNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${year}${month}${day}-${random}`;
}

/**
 * Check if user can create an application based on account status
 */
export async function canCreateApplication(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  userStatus?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return { canCreate: false, reason: "User not found" };
  }

  if (user.status !== "ACTIVE") {
    return {
      canCreate: false,
      reason: `Your account is ${user.status.toLowerCase()}. Please contact support.`,
      userStatus: user.status,
    };
  }

  if (!user.emailVerified) {
    return { canCreate: false, reason: "Please verify your email address first" };
  }

  return { canCreate: true };
}

// ============================================================================
// P2.2: Application Form & Status Management
// ============================================================================

/**
 * Create new application with validation
 */
export async function createApplication(
  userId: string,
  data: {
    type: ApplicationType;
    businessName: string;
    businessType: string;
    businessAddress: string;
    businessBarangay?: string;
    businessCity?: string;
    businessProvince?: string;
    businessZipCode?: string;
    businessPhone?: string;
    businessEmail?: string;
    tinNumber?: string;
    sssNumber?: string;
    numberOfEmployees?: number;
    capitalInvestment?: number;
    previousPermitId?: string;
  }
) {
  const appNumber = generateApplicationNumber();

  const application = await prisma.application.create({
    data: {
      applicationNumber: appNumber,
      type: data.type,
      status: "DRAFT",
      applicantId: userId,
      businessName: data.businessName,
      businessType: data.businessType,
      businessAddress: data.businessAddress,
      businessBarangay: data.businessBarangay,
      businessCity: data.businessCity,
      businessProvince: data.businessProvince,
      businessZipCode: data.businessZipCode,
      businessPhone: data.businessPhone,
      businessEmail: data.businessEmail,
      tinNumber: data.tinNumber,
      sssNumber: data.sssNumber,
      numberOfEmployees: data.numberOfEmployees,
      capitalInvestment: data.capitalInvestment
        ? parseFloat(data.capitalInvestment.toString())
        : null,
      previousPermitId: data.previousPermitId,
    },
    include: {
      documents: true,
    },
  });

  return application;
}

/**
 * Update application with partial data (DRAFT only)
 */
export async function updateApplicationDraft(
  applicationId: string,
  userId: string,
  data: Record<string, any>
) {
  // Verify ownership and status
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      applicantId: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.applicantId !== userId) {
    throw new Error("Unauthorized: Not application owner");
  }

  if (application.status !== "DRAFT") {
    throw new Error(`Cannot edit application with status: ${application.status}`);
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return updated;
}

// ============================================================================
// P2.4: Application Status Management & Workflows
// ============================================================================

/**
 * Submit application for review
 * Validates: all required documents present, application is DRAFT
 */
export async function submitApplicationForReview(
  applicationId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    // Get application with documents
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: {
        documents: {
          where: { status: { not: "REJECTED" } },
        },
      },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.applicantId !== userId) {
      throw new Error("Unauthorized: Not application owner");
    }

    if (application.status !== "DRAFT") {
      throw new Error(`Cannot submit application with status: ${application.status}`);
    }

    // Validate minimum documents uploaded (configurable per type)
    const minDocs = application.type === "NEW" ? 2 : 1; // RENEWAL needs fewer docs
    if (application.documents.length < minDocs) {
      throw new Error(`Please upload at least ${minDocs} required document(s)`);
    }

    // Update application status
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Create status history entry
    await tx.applicationHistory.create({
      data: {
        applicationId,
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED",
        comment: "Application submitted for review",
        changedBy: userId,
      },
    });

    // Mark all documents as PENDING_VERIFICATION
    await tx.document.updateMany({
      where: { applicationId },
      data: { status: "PENDING_VERIFICATION" },
    });

    // Create activity log
    await tx.activityLog.create({
      data: {
        userId,
        action: "APPLICATION_SUBMITTED",
        entity: "Application",
        entityId: applicationId,
        details: {
          applicationNumber: updated.applicationNumber,
          type: updated.type,
        },
      },
    });

    return updated;
  });
}

/**
 * Update application status with transaction
 * Used by BPLO office users to update application state
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  changedBy: string,
  comment?: string
) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      select: { status: true, applicantId: true },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    const previousStatus = application.status;

    // Update application
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        ...(["ASSESSED", "PAYMENT_PENDING", "PAID"].includes(newStatus) && { approvedAt: new Date() }),
        ...(newStatus === "REJECTED" && { rejectedAt: new Date() }),
      },
    });

    // Create status history
    await tx.applicationHistory.create({
      data: {
        applicationId,
        previousStatus,
        newStatus,
        comment,
        changedBy,
      },
    });

    // Create activity log
    await tx.activityLog.create({
      data: {
        userId: changedBy,
        action: `APPLICATION_${newStatus}`,
        entity: "Application",
        entityId: applicationId,
        details: { previousStatus, newStatus, comment },
      },
    });

    return updated;
  });
}

/**
 * Get application with full context (documents, history, reviews)
 */
export async function getApplicationContext(applicationId: string) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      documents: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          documentType: true,
          status: true,
          fileSize: true,
          verifiedBy: true,
          verifiedAt: true,
          rejectionReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      history: {
        select: {
          id: true,
          previousStatus: true,
          newStatus: true,
          comment: true,
          changedBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reviewActions: {
        select: {
          id: true,
          action: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          paidAt: true,
        },
      },
    },
  });
}

/**
 * Count documents by status for an application
 */
export async function countApplicationDocuments(applicationId: string) {
  const result = await prisma.document.groupBy({
    by: ["status"],
    where: { applicationId },
    _count: true,
  });

  return result.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Invalidate cached application data
 * Called after any application update
 */
export function invalidateApplicationCache(applicationId: string) {
  // This will be implemented with Redis in production
  // For now, it's a placeholder for cache library
  if (typeof window === "undefined") {
    // Server-side only
    console.log(`[Cache] Invalidating application ${applicationId}`);
  }
}

// ============================================================================
// P3.0: Clearance & Endorsement Workflow
// ============================================================================

/**
 * Get BPLO-managed requirement labels for an application type.
 */
export async function getClearanceRequirements(
  applicationType: ApplicationType
): Promise<
  Array<{
    requirementCode: string;
    requirementName: string;
    description: string | null;
  }>
> {
  return CLEARANCE_REQUIREMENTS[applicationType] ?? [];
}

/**
 * Generate BPLO-managed requirement tracking records for an application.
 * Can be used within a transaction for atomicity
 *
 * SECURITY FIX #5: Require userId and verify permission (BPLO_OFFICE only)
 */
export async function generateClearancePackages(
  applicationId: string,
  userId: string,
  tx?: any
): Promise<Array<{ id: string; requirementCode: string; requirementName: string }>> {
  const client = tx || prisma;

  // SECURITY: Verify user has permission to generate clearances
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!["BPLO_OFFICE"].includes(user.role)) {
    throw new Error(
      "Unauthorized: Only BPLO_OFFICE can generate requirement tracking records"
    );
  }

  // Get application to determine type
  const app = await client.application.findUnique({
    where: { id: applicationId },
    select: { type: true },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found`);
  }

  const requirements = CLEARANCE_REQUIREMENTS[app.type as ApplicationType] ?? [];

  const created = [];
  for (const requirement of requirements) {
    const clearance = await client.clearance.create({
      data: {
        applicationId,
        requirementCode: requirement.requirementCode,
        requirementName: requirement.requirementName,
        status: "PENDING",
      },
      select: {
        id: true,
        requirementCode: true,
        requirementName: true,
      },
    });
    created.push(clearance);
  }

  return created;
}

/**
 * Check if all clearances for an application have been received
 * Returns counts and details
 */
export async function checkAllClearancesReceived(applicationId: string): Promise<{
  allReceived: boolean;
  total: number;
  cleared: number;
  pending: number;
  deficiency: number;
  forInspection: number;
}> {
  const clearances = await prisma.clearance.groupBy({
    by: ["status"],
    where: { applicationId },
    _count: true,
  });

  const summary = clearances.reduce(
    (acc, item) => {
      acc.total += item._count;
      if (item.status === "CLEARED") acc.cleared += item._count;
      else if (item.status === "PENDING") acc.pending += item._count;
      else if (item.status === "WITH_DEFICIENCY") acc.deficiency += item._count;
      else if (item.status === "FOR_INSPECTION")
        acc.forInspection += item._count;
      return acc;
    },
    { total: 0, cleared: 0, pending: 0, deficiency: 0, forInspection: 0 }
  );

  return {
    ...summary,
    allReceived: summary.pending === 0 && summary.deficiency === 0 && summary.forInspection === 0,
  };
}

/**
 * Get comprehensive clearance summary for an application
 * Includes all clearance records, completion percentage, and readiness status
 */
export async function getClearanceSummary(applicationId: string): Promise<{
  applicationId: string;
  requiredOffices: number;
  clearancesReceived: Array<{
    id: string;
    requirementCode: string;
    requirementName: string;
    status: string;
    remarks: string | null;
  }>;
  completionPercentage: number;
  canProceedToReview: boolean;
  nextStep: "AWAITING_CLEARANCES" | "READY_FOR_REVIEW";
  statusCounts: {
    cleared: number;
    pending: number;
    deficiency: number;
    forInspection: number;
  };
}> {
  const clearances = await prisma.clearance.findMany({
    where: { applicationId },
    select: {
      id: true,
      requirementCode: true,
      requirementName: true,
      status: true,
      remarks: true,
    },
  });

  const summary = clearances.reduce(
    (acc, c) => {
      if (c.status === "CLEARED") acc.cleared++;
      else if (c.status === "PENDING") acc.pending++;
      else if (c.status === "WITH_DEFICIENCY") acc.deficiency++;
      else if (c.status === "FOR_INSPECTION") acc.forInspection++;
      return acc;
    },
    { cleared: 0, pending: 0, deficiency: 0, forInspection: 0 }
  );

  const totalRequired = clearances.length;
  const completionPercentage = totalRequired > 0 ? Math.round((summary.cleared / totalRequired) * 100) : 0;
  const canProceed = summary.pending === 0 && summary.deficiency === 0 && summary.forInspection === 0;

  return {
    applicationId,
    requiredOffices: totalRequired,
    clearancesReceived: clearances,
    completionPercentage,
    canProceedToReview: canProceed,
    nextStep: canProceed ? "READY_FOR_REVIEW" : "AWAITING_CLEARANCES",
    statusCounts: summary,
  };
}
