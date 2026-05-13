import { assertStatusTransition } from "@/lib/application-status";
import { listActivePermittedBusinessLocations, type BusinessLocationMapRow } from "@/lib/business-location";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus, Role } from "@prisma/client";

type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT";

interface EvidencePayload {
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

interface CreateInspectionInput {
  complianceStatus: ComplianceStatus;
  comment?: string;
  evidence?: EvidencePayload;
}

export interface JitInspectableBusinessRow extends BusinessLocationMapRow {
  latestInspection: {
    complianceStatus: ComplianceStatus;
    status: "COMPLIANT" | "NON_COMPLIANT" | "REVOCATION_REVIEW" | "REVOCATION_DENIED" | "REVOKED";
    createdAt: string;
  } | null;
}

export async function listJitInspectableBusinesses(): Promise<JitInspectableBusinessRow[]> {
  const rows = await listActivePermittedBusinessLocations();
  const businessRecordIds = rows.map((row) => row.businessRecordId);

  if (businessRecordIds.length === 0) {
    return [];
  }

  const inspectionModel = (prisma as any).inspection;
  const inspections = await inspectionModel.findMany({
    where: {
      businessRecordId: {
        in: businessRecordIds,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      businessRecordId: true,
      complianceStatus: true,
      status: true,
      createdAt: true,
    },
  });

  const latestByRecord = new Map<string, (typeof inspections)[number]>();
  for (const row of inspections) {
    if (!latestByRecord.has(row.businessRecordId)) {
      latestByRecord.set(row.businessRecordId, row);
    }
  }

  return rows.map((row) => {
    const latest = latestByRecord.get(row.businessRecordId);

    return {
      ...row,
      latestInspection: latest
        ? {
            complianceStatus: latest.complianceStatus as ComplianceStatus,
            status: latest.status as "COMPLIANT" | "NON_COMPLIANT" | "REVOCATION_REVIEW" | "REVOCATION_DENIED" | "REVOKED",
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
    };
  });
}

export async function createJitInspection(
  businessRecordId: string,
  inspectorId: string,
  input: CreateInspectionInput
) {
  const revocationReviewStatus = "REVOCATION_REVIEW" as unknown as ApplicationStatus;
  const jitActorRole = "JIT" as unknown as Role;
  const complianceStatus = input.complianceStatus;
  const trimmedComment = input.comment?.trim() ?? "";

  if (complianceStatus !== "COMPLIANT" && complianceStatus !== "NON_COMPLIANT") {
    throw new Error("complianceStatus must be COMPLIANT or NON_COMPLIANT");
  }

  if (complianceStatus === "NON_COMPLIANT") {
    if (!trimmedComment) {
      throw new Error("Comment is required for NON_COMPLIANT inspections");
    }
    if (!input.evidence) {
      throw new Error("Photo evidence is required for NON_COMPLIANT inspections");
    }
  }

  const activeBusiness = await prisma.businessRecord.findFirst({
    where: {
      id: businessRecordId,
      businessStatus: "ACTIVE",
    },
    select: {
      id: true,
      applications: {
        where: {
          status: "RELEASED",
          applicationType: {
            in: ["NEW", "RENEWAL"],
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const releasedApplication = activeBusiness?.applications[0] ?? null;

  if (!activeBusiness || !releasedApplication) {
    throw new Error("Only active released businesses can be inspected");
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const inspectionStatus =
      complianceStatus === "NON_COMPLIANT" ? "REVOCATION_REVIEW" : "COMPLIANT";

    const created = await tx.inspection.create({
      data: {
        businessRecordId,
        applicationId: releasedApplication.id,
        inspectorId,
        complianceStatus,
        status: inspectionStatus,
        comment: trimmedComment || null,
        evidenceFileName: input.evidence?.fileName ?? null,
        evidenceStoragePath: input.evidence?.storagePath ?? null,
        evidenceMimeType: input.evidence?.mimeType ?? null,
        evidenceSizeBytes: input.evidence?.sizeBytes ?? null,
      },
      select: {
        id: true,
        applicationId: true,
        complianceStatus: true,
        status: true,
        createdAt: true,
      },
    });

    if (complianceStatus === "NON_COMPLIANT") {
      assertStatusTransition(releasedApplication.status, revocationReviewStatus);

      await tx.businessApplication.update({
        where: {
          id: releasedApplication.id,
        },
        data: {
          status: revocationReviewStatus,
        },
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: releasedApplication.id,
          actorId: inspectorId,
          actorRole: jitActorRole,
          fromStatus: "RELEASED",
          toStatus: revocationReviewStatus,
          remarks: `JIT inspection marked NON_COMPLIANT.${trimmedComment ? ` Remarks: ${trimmedComment}` : ""}`,
        },
      });
    }

    return created;
  });

  return {
    id: result.id,
    applicationId: result.applicationId,
    complianceStatus: result.complianceStatus as ComplianceStatus,
    status: result.status as "COMPLIANT" | "NON_COMPLIANT" | "REVOCATION_REVIEW",
    createdAt: result.createdAt.toISOString(),
  };
}
