import { listActivePermittedBusinessLocations, listActivePermittedBusinessLocationsPaginated, type BusinessLocationMapRow } from "@/lib/business-location";
import {
  getChecklistQuestionForDepartment,
  type ChecklistItemInput,
} from "@/lib/jit-post-audit-checklist";
import { prisma } from "@/lib/prisma";
import type { PaginatedResult } from "@/lib/pagination";

type ComplianceStatus = "PENDING_REVIEW" | "COMPLIANT" | "NON_COMPLIANT";
type InspectionStatus =
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "DH_VERIFICATION_PENDING"
  | "VERIFIED_COMPLIANT"
  | "VERIFIED_NON_COMPLIANT"
  | "REVOCATION_REVIEW"
  | "REVOCATION_DENIED"
  | "REVOKED";

interface EvidencePayload {
  fileName: string;
  storagePath: string;
  bucket?: string;
  mimeType: string;
  sizeBytes: number;
}

interface CreateInspectionInput {
  comment?: string;
  evidence?: EvidencePayload;
  checklist: ChecklistItemInput[];
  referToBplo?: boolean;
  referralReason?: string;
  referralRemarks?: string;
}

export type JitMapMarkerStatus = "UNINSPECTED" | "PENDING_INSPECTION" | "COMPLIANT" | "REVOKED";

export interface JitInspectableBusinessRow extends BusinessLocationMapRow {
  latestInspection: {
    complianceStatus: ComplianceStatus;
    status: InspectionStatus;
    createdAt: string;
  } | null;
}

/**
 * Maps inspection status to JIT map marker status.
 * - No inspection record = UNINSPECTED (gray)
 * - Pending verification/review states = PENDING_INSPECTION (yellow)
 * - VERIFIED_COMPLIANT = COMPLIANT (green)
 * - REVOKED = REVOKED (red)
 */
export function getJitMapMarkerStatus(
  inspectionStatus: string | null
): JitMapMarkerStatus {
  if (!inspectionStatus) {
    return "UNINSPECTED";
  }

  if (
    inspectionStatus === "DH_VERIFICATION_PENDING" ||
    inspectionStatus === "COMPLIANT" ||
    inspectionStatus === "NON_COMPLIANT" ||
    inspectionStatus === "VERIFIED_NON_COMPLIANT" ||
    inspectionStatus === "REVOCATION_REVIEW" ||
    inspectionStatus === "REVOCATION_DENIED"
  ) {
    return "PENDING_INSPECTION";
  }

  if (inspectionStatus === "VERIFIED_COMPLIANT") {
    return "COMPLIANT";
  }

  if (inspectionStatus === "REVOKED") {
    return "REVOKED";
  }

  // Default to UNINSPECTED for other statuses (VERIFIED_NON_COMPLIANT, REVOCATION_REVIEW, etc)
  return "UNINSPECTED";
}

/**
 * Gets the hex color for a JIT map marker status.
 */
export function getJitMapMarkerColor(status: JitMapMarkerStatus): string {
  switch (status) {
    case "UNINSPECTED":
      return "#9ca3af"; // gray
    case "PENDING_INSPECTION":
      return "#fbbf24"; // yellow
    case "COMPLIANT":
      return "#10b981"; // green
    case "REVOKED":
      return "#ef4444"; // red
    default:
      return "#9ca3af"; // gray
  }
}

export async function listJitInspectableBusinesses(): Promise<JitInspectableBusinessRow[]> {
  const rows = await listActivePermittedBusinessLocations();
  return attachLatestInspections(rows);
}

async function attachLatestInspections(rows: BusinessLocationMapRow[]): Promise<JitInspectableBusinessRow[]> {
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
            status: latest.status as InspectionStatus,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
    };
  });
}

export async function listJitInspectableBusinessesPaginated(options?: {
  search?: string;
  page?: number | string;
  pageSize?: number | string;
}): Promise<PaginatedResult<JitInspectableBusinessRow>> {
  const locationResult = await listActivePermittedBusinessLocationsPaginated(
    { search: options?.search },
    options
  );

  const records = await attachLatestInspections(locationResult.records);

  return {
    ...locationResult,
    records,
  };
}

export async function createJitInspection(
  businessRecordId: string,
  inspectorId: string,
  input: CreateInspectionInput
) {
  const trimmedComment = input.comment?.trim() ?? "";
  const referToBplo = Boolean(input.referToBplo);
  const referralReason = input.referralReason?.trim() ?? "";
  const referralRemarks = input.referralRemarks?.trim() ?? "";

  if (!trimmedComment) {
    throw new Error("General inspection remarks are required");
  }

  if (!input.checklist || input.checklist.length !== 8) {
    throw new Error("All 8 post-audit checklist responses are required");
  }

  if (referToBplo && !referralReason) {
    throw new Error("Referral reason is required when referring to BPLO");
  }

  const created = await prisma.$transaction(async (tx: any) => {
    const activeBusiness = await tx.businessRecord.findFirst({
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

    const inspection = await tx.inspection.create({
      data: {
        businessRecordId,
        applicationId: releasedApplication.id,
        inspectorId,
        complianceStatus: "PENDING_REVIEW",
        status: "DH_VERIFICATION_PENDING",
        comment: trimmedComment || null,
        evidenceFileName: input.evidence?.fileName ?? null,
        evidenceStoragePath: input.evidence?.storagePath ?? null,
        evidenceBucket: input.evidence?.bucket ?? null,
        evidenceMimeType: input.evidence?.mimeType ?? null,
        evidenceSizeBytes: input.evidence?.sizeBytes ?? null,
        referToBplo,
        referralReason: referToBplo ? referralReason || null : null,
        referralRemarks: referToBplo ? referralRemarks || null : null,
        checklistItems: {
          create: input.checklist.map((item) => ({
            departmentKey: item.departmentKey,
            question: getChecklistQuestionForDepartment(item.departmentKey),
            response: item.response,
            remarks: item.remarks ?? null,
            evidenceFileName: item.evidence?.fileName ?? null,
            evidenceStoragePath: item.evidence?.storagePath ?? null,
            evidenceBucket: item.evidence?.bucket ?? null,
            evidenceMimeType: item.evidence?.mimeType ?? null,
            evidenceSizeBytes: item.evidence?.sizeBytes ?? null,
          })),
        },
      },
      select: {
        id: true,
        applicationId: true,
        complianceStatus: true,
        status: true,
        createdAt: true,
      },
    });

    const referralNote = referToBplo ? ` Referred to BPLO: ${referralReason}.` : "";
    await tx.applicationHistory.create({
      data: {
        applicationId: releasedApplication.id,
        actorId: inspectorId,
        actorRole: "JIT",
        fromStatus: "RELEASED",
        toStatus: "RELEASED",
        remarks: `JIT submitted inspection with post-audit checklist (pending BPLO compliance review).${referralNote}`,
      },
    });

    if (input.evidence) {
      await tx.applicationHistory.create({
        data: {
          applicationId: releasedApplication.id,
          actorId: inspectorId,
          actorRole: "JIT",
          fromStatus: "RELEASED",
          toStatus: "RELEASED",
          remarks: `JIT uploaded inspection evidence (${input.evidence.fileName}).`,
        },
      });
    }

    return inspection;
  });

  return {
    id: created.id,
    applicationId: created.applicationId,
    complianceStatus: created.complianceStatus as ComplianceStatus,
    status: created.status as "DH_VERIFICATION_PENDING",
    createdAt: created.createdAt.toISOString(),
  };
}
