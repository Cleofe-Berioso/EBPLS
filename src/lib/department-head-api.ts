import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertStatusTransition } from "@/lib/application-status";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import { createAuditLog } from "@/lib/audit-log";

type DepartmentHeadAction = "APPROVE" | "RETURN" | "REJECT";
type RevocationDecisionAction = "APPROVE" | "DENY";

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

export interface DepartmentHeadApprovalRow {
  id: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  ownerName: string;
  businessName: string;
  businessType: string;
  lineOfBusiness: string;
  businessAddress: string;
  submittedDate: string;
  updatedDate: string;
  currentStatus: string;
  bploRemarks: string | null;
  formData: Record<string, unknown>;
  history: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorRole: string;
    remarks: string | null;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    documentName: string;
    fileName: string;
    uploadedAt: string;
  }>;
}

export interface DepartmentHeadPermitToRevokeRow {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  businessType: string;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  lineOfBusiness: string;
  inspectionDate: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  inspectorName: string;
  inspectorComment: string | null;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  inspectionStatus: string;
  applicationStatus: string;
}

export interface DepartmentHeadInspectionVerificationRow {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  businessType: string;
  lineOfBusiness: string;
  inspectionDate: string;
  inspectorName: string;
  inspectionStatus: string;
  complianceStatus: string;
  inspectorComment: string | null;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  applicationStatus: string;
}

export interface DepartmentHeadCompliantListRow {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  businessType: string;
  lineOfBusiness: string;
  jitComment: string | null;
  inspectionDate: string;
  verifiedAt: string;
  verifiedBy: string;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  inspectionStatus: string;
}

export interface DepartmentHeadRevokedPermitRow {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  lineOfBusiness: string;
  jitInspectionDate: string;
  jitInspectorName: string;
  jitComment: string | null;
  revocationRemarks: string | null;
  revocationDecisionDate: string;
  decidedByName: string;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  inspectionStatus: string;
  applicationStatus: string;
  businessStatus: string;
  revocationSettledAt: string | null;
  revocationSettledBy: string | null;
  revocationSettlementRemarks: string | null;
  isSettled: boolean;
}

function toDateTime(date: Date | null): string {
  if (!date) return "-";
  return date.toISOString();
}

function getTextField(formData: unknown, key: string, fallback = "-"): string {
  const maybe = formData as Record<string, unknown>;
  const value = maybe[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
}

function getNextStatus(action: DepartmentHeadAction): DbApplicationStatus {
  if (action === "APPROVE") return "DEPARTMENT_HEAD_APPROVED";
  if (action === "RETURN") return "RETURNED_FOR_CORRECTION";
  return "REJECTED";
}

function remarksRequired(action: DepartmentHeadAction): boolean {
  return action === "RETURN" || action === "REJECT";
}

function toRevocationInspectionStatus(action: RevocationDecisionAction) {
  return action === "APPROVE" ? "REVOKED" : "REVOCATION_DENIED";
}

export async function listDepartmentHeadApprovalQueue(): Promise<DepartmentHeadApprovalRow[]> {
  const rows = await prisma.businessApplication.findMany({
    where: { status: "DEPARTMENT_HEAD_REVIEW" },
    include: {
      applicant: { select: { name: true } },
      businessRecord: { select: { businessName: true } },
      documents: { orderBy: { uploadedAt: "asc" } },
      history: {
        include: {
          actor: {
            select: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((row: any) => ({
    id: row.id,
    applicationNumber: row.applicationNumber,
    applicationType: row.applicationType,
    ownerName: getTextField(row.formData, "ownerName", row.applicant?.name ?? "-"),
    businessName: getTextField(row.formData, "businessName", row.businessRecord?.businessName ?? "-"),
    businessType: getTextField(row.formData, "businessType"),
    lineOfBusiness: getTextField(row.formData, "lineOfBusiness"),
    businessAddress: getTextField(row.formData, "businessAddress"),
    submittedDate: toDateTime(row.submittedAt),
    updatedDate: toDateTime(row.updatedAt),
    currentStatus: mapDbStatusToUi(row.status),
    bploRemarks:
      row.history.find((item: any) => item.actorRole === "BPLO" && typeof item.remarks === "string" && item.remarks.trim().length > 0)?.remarks?.trim() || null,
    formData: (row.formData ?? {}) as Record<string, unknown>,
    history: row.history.map((item: any) => ({
      id: item.id,
      fromStatus: item.fromStatus ? mapDbStatusToUi(item.fromStatus) : null,
      toStatus: mapDbStatusToUi(item.toStatus),
      actorRole: item.actorRole,
      remarks: item.remarks,
      createdAt: item.createdAt.toISOString(),
    })),
    documents: row.documents.map((doc: any) => ({
      id: doc.id,
      documentName: doc.documentName,
      fileName: doc.fileName,
      uploadedAt: doc.uploadedAt.toISOString(),
    })),
  }));
}

export async function applyDepartmentHeadAction(
  applicationId: string,
  departmentHeadUserId: string,
  action: DepartmentHeadAction,
  remarks?: string
) {
  const normalizedRemarks = remarks?.trim();

  if (remarksRequired(action) && !normalizedRemarks) {
    throw new Error("Remarks are required for this action");
  }

  return prisma.$transaction(async (tx: any) => {
    const current = await tx.businessApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, status: true, applicationNumber: true, applicationType: true },
    });

    if (!current) {
      throw new Error("Application not found");
    }

    if (current.status !== "DEPARTMENT_HEAD_REVIEW") {
      throw new Error("Application is not in Department Head review stage");
    }

    const nextStatus = getNextStatus(action);
    assertStatusTransition(current.status, nextStatus);

    const updated = await tx.businessApplication.update({
      where: { id: current.id },
      data: { status: nextStatus },
      select: { id: true, applicationNumber: true, status: true },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: current.id,
        actorId: departmentHeadUserId,
        actorRole: "DEPARTMENT_HEAD",
        fromStatus: current.status,
        toStatus: nextStatus,
        remarks: normalizedRemarks ?? null,
      },
    });

    return {
      id: updated.id,
      applicationNumber: updated.applicationNumber,
      applicationType: current.applicationType,
      status: mapDbStatusToUi(updated.status),
    };
  });
}

export async function listDepartmentHeadRevocationQueue(): Promise<DepartmentHeadPermitToRevokeRow[]> {
  const rows = await prisma.inspection.findMany({
    where: {
      status: "VERIFIED_NON_COMPLIANT",
      complianceStatus: "NON_COMPLIANT",
      application: {
        status: "REVOCATION_REVIEW",
      },
    },
    include: {
      inspector: { select: { name: true } },
      decidedBy: { select: { name: true } },
      revocationSettledBy: { select: { name: true } },
      application: {
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          permitIssuance: { select: { documentNumber: true } },
        },
      },
      businessRecord: {
        select: {
          businessName: true,
          tradeName: true,
          businessType: true,
          ownerName: true,
          businessAddress: true,
          lineOfBusiness: true,
          applicant: { select: { name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return rows
    .filter((row: any) => Boolean(row.application))
    .map((row: any) => ({
      inspectionId: row.id,
      businessRecordId: row.businessRecordId,
      applicationId: row.applicationId,
      applicationNumber: row.application.applicationNumber,
      permitOrCertificateNumber: row.application.permitIssuance?.documentNumber ?? null,
      businessName: row.businessRecord.businessName,
      tradeName: row.businessRecord.tradeName ?? null,
      businessType: row.businessRecord.businessType ?? "-",
      ownerName: row.businessRecord.ownerName,
      applicantName: row.businessRecord.applicant?.name ?? "-",
      businessAddress: row.businessRecord.businessAddress,
      lineOfBusiness: row.businessRecord.lineOfBusiness ?? "-",
      inspectionDate: row.createdAt.toISOString(),
      verifiedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
      verifiedBy: row.decidedBy?.name ?? null,
      inspectorName: row.inspector.name,
      inspectorComment: row.comment?.trim() || null,
      evidenceFileName: row.evidenceFileName,
      evidenceMimeType: row.evidenceMimeType,
      hasEvidence: Boolean(row.evidenceStoragePath),
      inspectionStatus: row.status,
      applicationStatus: mapDbStatusToUi(row.application.status),
    }));
}

export async function listDepartmentHeadInspectionVerificationQueue(): Promise<DepartmentHeadInspectionVerificationRow[]> {
  const rows = await prisma.inspection.findMany({
    where: {
      status: "DH_VERIFICATION_PENDING",
      application: {
        status: "RELEASED",
      },
      businessRecord: {
        businessStatus: "ACTIVE",
      },
    },
    include: {
      inspector: { select: { name: true } },
      application: {
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          applicationType: true,
          permitIssuance: { select: { documentNumber: true } },
        },
      },
      businessRecord: {
        select: {
          businessName: true,
          tradeName: true,
          businessType: true,
          ownerName: true,
          businessAddress: true,
          lineOfBusiness: true,
          applicant: { select: { name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return rows
    .filter((row: any) => Boolean(row.application))
    .map((row: any) => ({
      inspectionId: row.id,
      businessRecordId: row.businessRecordId,
      applicationId: row.applicationId,
      applicationNumber: row.application.applicationNumber,
      permitOrCertificateNumber: row.application.permitIssuance?.documentNumber ?? null,
      businessName: row.businessRecord.businessName,
      tradeName: row.businessRecord.tradeName ?? null,
      ownerName: row.businessRecord.ownerName,
      applicantName: row.businessRecord.applicant?.name ?? "-",
      businessAddress: row.businessRecord.businessAddress,
      businessType: row.businessRecord.businessType ?? "-",
      lineOfBusiness: row.businessRecord.lineOfBusiness ?? "-",
      inspectionDate: row.createdAt.toISOString(),
      inspectorName: row.inspector.name,
      inspectionStatus: row.status,
      complianceStatus: row.complianceStatus,
      inspectorComment: row.comment?.trim() || null,
      evidenceFileName: row.evidenceFileName,
      evidenceMimeType: row.evidenceMimeType,
      hasEvidence: Boolean(row.evidenceStoragePath),
      applicationStatus: mapDbStatusToUi(row.application.status),
    }));
}

export interface DepartmentHeadSettlementRow {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string | null;
  applicationNumber: string | null;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  lineOfBusiness: string;
  nonComplianceType: string | null;
  violationSeverity: string | null;
  complianceCaseStatus: string;
  inspectionRemarks: string | null;
  verificationRemarks: string | null;
  verifiedAt: string | null;
  deadlineAt: string | null;
}

/**
 * List eligible settlement cases for Department Head
 */
export async function listDepartmentHeadSettlementCases(): Promise<DepartmentHeadSettlementRow[]> {
  const rows = await prisma.inspection.findMany({
    where: {
      nonComplianceType: "GOVERNMENT_AGENCY_RELATED",
      violationSeverity: { in: ["MINOR", "MAJOR"] },
      complianceCaseStatus: "FLAGGED_UNSETTLED",
      isSettled: false,
      forcedClosure: false,
    },
    include: {
      decidedBy: { select: { name: true } },
      application: { select: { id: true, applicationNumber: true, permitIssuance: { select: { documentNumber: true } } } },
      businessRecord: { select: { businessName: true, tradeName: true, ownerName: true, businessAddress: true, lineOfBusiness: true, applicant: { select: { name: true, id: true } }, phone: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return rows.map((row: any) => ({
    inspectionId: row.id,
    businessRecordId: row.businessRecordId,
    applicationId: row.applicationId ?? null,
    applicationNumber: row.application?.applicationNumber ?? null,
    permitOrCertificateNumber: row.application?.permitIssuance?.documentNumber ?? null,
    businessName: row.businessRecord.businessName,
    tradeName: row.businessRecord.tradeName ?? null,
    ownerName: row.businessRecord.ownerName,
    applicantName: row.businessRecord.applicant?.name ?? "-",
    businessAddress: row.businessRecord.businessAddress,
    lineOfBusiness: row.businessRecord.lineOfBusiness ?? "-",
    nonComplianceType: row.nonComplianceType ?? null,
    violationSeverity: row.violationSeverity ?? null,
    complianceCaseStatus: row.complianceCaseStatus,
    inspectionRemarks: row.comment?.trim() || null,
    verificationRemarks: row.decidedAt ? `Verified by Department Head` : null,
    verifiedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    deadlineAt: row.deadlineAt ? row.deadlineAt.toISOString() : null,
  }));
}

/**
 * Mark an eligible inspection compliance case as settled
 */
export async function applyDepartmentHeadSettlement(
  inspectionId: string,
  departmentHeadUserId: string,
  settlementRemarks?: string
) {
  const normalizedRemarks = settlementRemarks?.trim();
  if (!normalizedRemarks) throw new Error("Settlement remarks are required");

  return prisma.$transaction(async (tx: any) => {
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        application: { select: { id: true, applicationNumber: true, status: true } },
        businessRecord: { select: { id: true, businessName: true, ownerName: true, applicant: { select: { id: true, name: true } }, phone: true } },
      },
    });

    if (!inspection) throw new Error("Inspection not found");

    if (inspection.nonComplianceType !== "GOVERNMENT_AGENCY_RELATED") {
      throw new Error("Only government-agency-related cases can be settled here");
    }

    if (!inspection.violationSeverity || !["MINOR", "MAJOR"].includes(inspection.violationSeverity)) {
      throw new Error("Only MINOR or MAJOR cases can be settled through this action");
    }

    if (inspection.complianceCaseStatus !== "FLAGGED_UNSETTLED") {
      throw new Error("Case is not in FLAGGED_UNSETTLED status");
    }

    if (inspection.isSettled) {
      throw new Error("Case is already settled");
    }

    if (inspection.forcedClosure) {
      throw new Error("Forced closure cases cannot be settled here");
    }

    // RENEWAL_RELATED cannot be settled here
    if (inspection.nonComplianceType === "RENEWAL_RELATED") {
      throw new Error("RENEWAL_RELATED cases cannot be settled through this action");
    }

    const previousStatus = inspection.complianceCaseStatus;

    const updated = await tx.inspection.update({
      where: { id: inspection.id },
      data: {
        isSettled: true,
        settledAt: new Date(),
        settledById: departmentHeadUserId,
        complianceCaseStatus: "SETTLED",
        settlementRemarks: normalizedRemarks,
      },
    });

    if (inspection.application && inspection.application.id) {
      await tx.applicationHistory.create({
        data: {
          applicationId: inspection.application.id,
          actorId: departmentHeadUserId,
          actorRole: "DEPARTMENT_HEAD",
          fromStatus: inspection.application.status,
          toStatus: inspection.application.status,
          remarks: `Department Head marked flagged case as SETTLED. Remarks: ${normalizedRemarks}`,
        },
      });
    }

    // Audit log (non-blocking)
    try {
      await createAuditLog({
        actorId: departmentHeadUserId,
        actorRole: "DEPARTMENT_HEAD",
        action: "SETTLED",
        module: "INSPECTION",
        entityType: "INSPECTION",
        entityId: inspection.id,
        inspectionId: inspection.id,
        applicationId: inspection.application?.id ?? null,
        businessRecordId: inspection.businessRecordId,
        beforeStatus: previousStatus,
        afterStatus: "SETTLED",
        description: "Department Head marked government-agency-related compliance case as SETTLED.",
        metadata: {
          settlementRemarks: normalizedRemarks,
        },
      });
    } catch (err) {
      // non-blocking: ignore
      console.error("[Settlement] audit failed", err instanceof Error ? err.message : String(err));
    }

    // Best-effort notification record (non-blocking). Only create if linked application exists.
    try {
      if (inspection.application && inspection.application.id) {
        const phone = inspection.businessRecord?.phone ?? null;
        await tx.smsDeliveryLog.create({
          data: {
            applicationId: inspection.application.id,
            applicantId: inspection.businessRecord?.applicant?.id ?? null,
            phoneNumber: phone,
            provider: "none",
            status: "SKIPPED",
            messageBody: "Your business compliance case has been marked as settled. You may continue with eligible transactions subject to normal system rules.",
          },
        });
      }
    } catch (err) {
      console.error("[Settlement] notification log failed", err instanceof Error ? err.message : String(err));
    }

    return {
      inspectionId: updated.id,
      applicationId: inspection.application?.id ?? null,
      businessRecordId: inspection.businessRecordId,
      complianceCaseStatus: updated.complianceCaseStatus,
      settledAt: updated.settledAt,
    };
  });
}

export async function applyDepartmentHeadInspectionVerification(
  inspectionId: string,
  departmentHeadUserId: string,
  remarks?: string,
  nonComplianceType?: string,
  violationSeverity?: string
) {
  const normalizedRemarks = remarks?.trim();

  if (!normalizedRemarks) {
    throw new Error("Verification remarks are required");
  }

  return prisma.$transaction(async (tx: any) => {
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            applicationNumber: true,
          },
        },
        businessRecord: {
          select: {
            id: true,
            businessStatus: true,
          },
        },
      },
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    if (inspection.status !== "DH_VERIFICATION_PENDING") {
      throw new Error("Inspection is not pending Department Head verification");
    }

    if (!inspection.application || inspection.application.status !== "RELEASED") {
      throw new Error("Inspection application is not released");
    }

    if (!inspection.businessRecord || inspection.businessRecord.businessStatus !== "ACTIVE") {
      throw new Error("Business is not active");
    }

    if (inspection.inspectorId === departmentHeadUserId) {
      throw new Error("JIT cannot verify its own submitted inspection");
    }

    if (inspection.complianceStatus === "COMPLIANT") {
      await tx.inspection.update({
        where: { id: inspection.id },
        data: {
          status: "VERIFIED_COMPLIANT",
          decidedById: departmentHeadUserId,
          decidedAt: new Date(),
        },
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: inspection.application.id,
          actorId: departmentHeadUserId,
          actorRole: "DEPARTMENT_HEAD",
          fromStatus: "RELEASED",
          toStatus: "RELEASED",
          remarks: `Department Head verified COMPLIANT inspection. Remarks: ${normalizedRemarks}`,
        },
      });

      return {
        inspectionId: inspection.id,
        applicationId: inspection.application.id,
        applicationNumber: inspection.application.applicationNumber,
        inspectionStatus: "VERIFIED_COMPLIANT",
        applicationStatus: mapDbStatusToUi(inspection.application.status),
        complianceStatus: inspection.complianceStatus,
      };
    }

    // NON_COMPLIANT path: require nonComplianceType and violationSeverity
    const validNonComplianceTypes = ["GOVERNMENT_AGENCY_RELATED", "RENEWAL_RELATED"];
    const validViolationSeverities = ["MINOR", "MAJOR", "SEVERE"];

    if (!nonComplianceType || !validNonComplianceTypes.includes(nonComplianceType)) {
      throw new Error("non-compliance type is required and must be GOVERNMENT_AGENCY_RELATED or RENEWAL_RELATED");
    }

    if (!violationSeverity || !validViolationSeverities.includes(violationSeverity)) {
      throw new Error("violation severity is required and must be MINOR, MAJOR, or SEVERE");
    }

    // Determine complianceCaseStatus and forced closure flags based on severity and type
    let complianceCaseStatus = "FLAGGED_UNSETTLED";
    let forcedClosureFlag = false;
    let forcedClosureAtTime: Date | null = null;

    // GOVERNMENT_AGENCY_RELATED + SEVERE => FORCED_CLOSURE_PENDING + forcedClosure
    if (nonComplianceType === "GOVERNMENT_AGENCY_RELATED" && violationSeverity === "SEVERE") {
      complianceCaseStatus = "FORCED_CLOSURE_PENDING";
      forcedClosureFlag = true;
      forcedClosureAtTime = new Date();
    }

    // All other combinations are FLAGGED_UNSETTLED for settlement workflow

    assertStatusTransition(inspection.application.status, "REVOCATION_REVIEW");

    await tx.businessApplication.update({
      where: { id: inspection.application.id },
      data: { status: "REVOCATION_REVIEW" },
    });

    await tx.inspection.update({
      where: { id: inspection.id },
      data: {
        status: "VERIFIED_NON_COMPLIANT",
        decidedById: departmentHeadUserId,
        decidedAt: new Date(),
        nonComplianceType: nonComplianceType,
        violationSeverity: violationSeverity,
        complianceCaseStatus: complianceCaseStatus,
        isSettled: false,
        forcedClosure: forcedClosureFlag,
        forcedClosureAt: forcedClosureAtTime,
        forcedClosureById: forcedClosureFlag ? departmentHeadUserId : null,
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: inspection.application.id,
        actorId: departmentHeadUserId,
        actorRole: "DEPARTMENT_HEAD",
        fromStatus: "RELEASED",
        toStatus: "REVOCATION_REVIEW",
        remarks: `Department Head verified NON_COMPLIANT inspection. Type: ${nonComplianceType}, Severity: ${violationSeverity}. Remarks: ${normalizedRemarks}`,
      },
    });

    return {
      inspectionId: inspection.id,
      applicationId: inspection.application.id,
      applicationNumber: inspection.application.applicationNumber,
      inspectionStatus: "VERIFIED_NON_COMPLIANT",
      applicationStatus: mapDbStatusToUi("REVOCATION_REVIEW"),
      complianceStatus: inspection.complianceStatus,
      nonComplianceType,
      violationSeverity,
      complianceCaseStatus,
    };
  });
}

export async function listDepartmentHeadCompliantList(): Promise<DepartmentHeadCompliantListRow[]> {
  const rows = await prisma.inspection.findMany({
    where: {
      status: "VERIFIED_COMPLIANT",
      complianceStatus: "COMPLIANT",
      application: {
        status: "RELEASED",
      },
      businessRecord: {
        businessStatus: "ACTIVE",
      },
    },
    include: {
      inspector: { select: { name: true } },
      decidedBy: { select: { name: true } },
      application: {
        select: {
          id: true,
          applicationNumber: true,
          permitIssuance: { select: { documentNumber: true } },
        },
      },
      businessRecord: {
        select: {
          businessName: true,
          tradeName: true,
          businessType: true,
          ownerName: true,
          businessAddress: true,
          lineOfBusiness: true,
          applicant: { select: { name: true } },
        },
      },
    },
    orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
  });

  return rows
    .filter((row: any) => Boolean(row.application) && Boolean(row.decidedAt) && Boolean(row.decidedBy))
    .map((row: any) => ({
      inspectionId: row.id,
      businessRecordId: row.businessRecordId,
      applicationId: row.applicationId,
      applicationNumber: row.application.applicationNumber,
      permitOrCertificateNumber: row.application.permitIssuance?.documentNumber ?? null,
      businessName: row.businessRecord.businessName,
      tradeName: row.businessRecord.tradeName ?? null,
      ownerName: row.businessRecord.ownerName,
      applicantName: row.businessRecord.applicant?.name ?? "-",
      businessAddress: row.businessRecord.businessAddress,
      businessType: row.businessRecord.businessType ?? "-",
      lineOfBusiness: row.businessRecord.lineOfBusiness ?? "-",
      jitComment: row.comment?.trim() || null,
      inspectionDate: row.createdAt.toISOString(),
      verifiedAt: row.decidedAt.toISOString(),
      verifiedBy: row.decidedBy?.name ?? row.inspector.name,
      evidenceFileName: row.evidenceFileName,
      evidenceMimeType: row.evidenceMimeType,
      hasEvidence: Boolean(row.evidenceStoragePath),
      inspectionStatus: row.status,
    }));
}

export async function listDepartmentHeadRevokedPermitList(): Promise<DepartmentHeadRevokedPermitRow[]> {
  const rows = await prisma.inspection.findMany({
    where: {
      revocationDecision: "APPROVED",
      status: "REVOKED",
      application: {
        status: "REVOKED",
      },
      businessRecord: {
        businessStatus: "INACTIVE",
      },
    },
    include: {
      inspector: { select: { name: true } },
      decidedBy: { select: { name: true } },
      application: {
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          permitIssuance: { select: { documentNumber: true } },
        },
      },
      businessRecord: {
        select: {
          businessName: true,
          ownerName: true,
          businessAddress: true,
          lineOfBusiness: true,
          businessStatus: true,
          applicant: { select: { name: true } },
        },
      },
    },
    orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
  });

  return rows
    .filter((row: any) => Boolean(row.application) && Boolean(row.decidedAt))
    .map((row: any) => ({
      inspectionId: row.id,
      businessRecordId: row.businessRecordId,
      applicationId: row.applicationId,
      applicationNumber: row.application.applicationNumber,
      permitOrCertificateNumber: row.application.permitIssuance?.documentNumber ?? null,
      businessName: row.businessRecord.businessName,
      ownerName: row.businessRecord.ownerName,
      applicantName: row.businessRecord.applicant?.name ?? "-",
      businessAddress: row.businessRecord.businessAddress,
      lineOfBusiness: row.businessRecord.lineOfBusiness ?? "-",
      jitInspectionDate: row.createdAt.toISOString(),
      jitInspectorName: row.inspector.name,
      jitComment: row.comment?.trim() || null,
      revocationRemarks: row.revocationRemarks?.trim() || null,
      revocationDecisionDate: row.decidedAt.toISOString(),
      decidedByName: row.decidedBy?.name ?? "-",
      evidenceFileName: row.evidenceFileName,
      evidenceMimeType: row.evidenceMimeType,
      hasEvidence: Boolean(row.evidenceStoragePath),
      inspectionStatus: row.status,
      applicationStatus: mapDbStatusToUi(row.application.status),
      businessStatus: row.businessRecord.businessStatus,
      revocationSettledAt: row.revocationSettledAt ? row.revocationSettledAt.toISOString() : null,
      revocationSettledBy: row.revocationSettledBy?.name ?? null,
      revocationSettlementRemarks: row.revocationSettlementRemarks?.trim() || null,
      isSettled: Boolean(row.revocationSettledAt),
    }));
}

export async function applyDepartmentHeadRevocationDecision(
  inspectionId: string,
  departmentHeadUserId: string,
  action: RevocationDecisionAction,
  remarks?: string
) {
  const normalizedRemarks = remarks?.trim();

  if (!normalizedRemarks) {
    throw new Error("Remarks are required for revocation decisions");
  }

  return prisma.$transaction(async (tx: any) => {
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            applicationNumber: true,
          },
        },
        businessRecord: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    const allowedRevocationStatuses = new Set(["VERIFIED_NON_COMPLIANT", "REVOCATION_REVIEW"]);
    if (!allowedRevocationStatuses.has(inspection.status)) {
      throw new Error("Inspection is not in revocation review stage");
    }

    if (inspection.status === "REVOCATION_REVIEW" && !inspection.decidedById) {
      throw new Error("Only Department Head verified non-compliant inspections can be decided");
    }

    if (inspection.revocationDecision || inspection.decidedAt) {
      throw new Error("Revocation decision was already finalized");
    }

    if (!inspection.application || inspection.application.status !== "REVOCATION_REVIEW") {
      throw new Error("Application is not in REVOCATION_REVIEW status");
    }

    await tx.applicationHistory.create({
      data: {
        applicationId: inspection.application.id,
        actorId: departmentHeadUserId,
        actorRole: "DEPARTMENT_HEAD",
        fromStatus: "REVOCATION_REVIEW",
        toStatus: "REVOCATION_REVIEW",
        remarks: "Department Head reviewed flagged case.",
      },
    });

    if (action === "APPROVE") {
      assertStatusTransition(inspection.application.status, "REVOKED");

      await tx.businessApplication.update({
        where: { id: inspection.application.id },
        data: { status: "REVOKED" },
      });

      await tx.businessRecord.update({
        where: { id: inspection.businessRecord.id },
        data: { businessStatus: "INACTIVE" },
      });

      await tx.inspection.update({
        where: { id: inspection.id },
        data: {
          status: toRevocationInspectionStatus(action),
          revocationDecision: "APPROVED",
          revocationRemarks: normalizedRemarks,
          decidedById: departmentHeadUserId,
          decidedAt: new Date(),
        },
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: inspection.application.id,
          actorId: departmentHeadUserId,
          actorRole: "DEPARTMENT_HEAD",
          fromStatus: "REVOCATION_REVIEW",
          toStatus: "REVOKED",
          remarks: `Revocation approved. Remarks: ${normalizedRemarks}`,
        },
      });
    } else {
      assertStatusTransition(inspection.application.status, "RELEASED");

      await tx.businessApplication.update({
        where: { id: inspection.application.id },
        data: { status: "RELEASED" },
      });

      await tx.businessRecord.update({
        where: { id: inspection.businessRecord.id },
        data: { businessStatus: "ACTIVE" },
      });

      await tx.inspection.update({
        where: { id: inspection.id },
        data: {
          status: toRevocationInspectionStatus(action),
          revocationDecision: "DENIED",
          revocationRemarks: normalizedRemarks,
          decidedById: departmentHeadUserId,
          decidedAt: new Date(),
        },
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: inspection.application.id,
          actorId: departmentHeadUserId,
          actorRole: "DEPARTMENT_HEAD",
          fromStatus: "REVOCATION_REVIEW",
          toStatus: "RELEASED",
          remarks: `Revocation denied. Remarks: ${normalizedRemarks}`,
        },
      });
    }

    return {
      inspectionId: inspection.id,
      applicationId: inspection.application.id,
      applicationNumber: inspection.application.applicationNumber,
      inspectionStatus: toRevocationInspectionStatus(action),
      applicationStatus: action === "APPROVE" ? mapDbStatusToUi("REVOKED") : mapDbStatusToUi("RELEASED"),
    };
  });
}

export async function requireDepartmentHeadSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "DEPARTMENT_HEAD") {
    return null;
  }

  return session;
}

export async function getDepartmentHeadApprovalDocument(applicationId: string, documentId: string) {
  const application = await prisma.businessApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.status !== "DEPARTMENT_HEAD_REVIEW") {
    throw new Error("Application is not in Department Head review stage");
  }

  const document = await prisma.applicationDocument.findFirst({
    where: {
      id: documentId,
      applicationId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
}
