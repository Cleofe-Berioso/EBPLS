import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertStatusTransition } from "@/lib/application-status";
import { mapDbStatusToUi } from "@/lib/application-mappers";

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
  currentStatus: string;
  bploRemarks: string | null;
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
        where: {
          actorRole: "BPLO",
          remarks: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
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
    currentStatus: mapDbStatusToUi(row.status),
    bploRemarks: row.history[0]?.remarks?.trim() || null,
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
      select: { id: true, status: true, applicationNumber: true },
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

export async function applyDepartmentHeadInspectionVerification(
  inspectionId: string,
  departmentHeadUserId: string,
  remarks?: string
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
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: inspection.application.id,
        actorId: departmentHeadUserId,
        actorRole: "DEPARTMENT_HEAD",
        fromStatus: "RELEASED",
        toStatus: "REVOCATION_REVIEW",
        remarks: `Department Head verified NON_COMPLIANT inspection. Remarks: ${normalizedRemarks}`,
      },
    });

    return {
      inspectionId: inspection.id,
      applicationId: inspection.application.id,
      applicationNumber: inspection.application.applicationNumber,
      inspectionStatus: "VERIFIED_NON_COMPLIANT",
      applicationStatus: mapDbStatusToUi("REVOCATION_REVIEW"),
      complianceStatus: inspection.complianceStatus,
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
