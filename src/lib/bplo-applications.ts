import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import type { BusinessInfo } from "@/lib/applicant-types";

type DbApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSESSED"
  | "APPROVED_FOR_PAYMENT"
  | "PAID"
  | "FOR_RELEASE"
  | "RELEASED"
  | "RETURNED_FOR_CORRECTION"
  | "REJECTED";

const BPLO_VISIBLE_STATUSES: DbApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSESSED",
  "APPROVED_FOR_PAYMENT",
  "PAID",
  "FOR_RELEASE",
  "RELEASED",
  "RETURNED_FOR_CORRECTION",
  "REJECTED",
];

export type BploReviewAction =
  | "MARK_UNDER_REVIEW"
  | "RETURN_FOR_CORRECTION"
  | "REJECT_APPLICATION"
  | "APPROVE_FOR_ASSESSMENT";

export interface BploQueueRow {
  id: string;
  applicationNumber: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  status: string;
  dateSubmitted: string;
}

interface BploQueueFilters {
  search?: string;
  type?: "ALL" | "NEW" | "RENEWAL" | "CLOSURE";
  status?:
    | "ALL"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "ASSESSED"
    | "APPROVED_FOR_PAYMENT"
    | "PAID"
    | "FOR_RELEASE"
    | "RELEASED"
    | "RETURNED_FOR_CORRECTION"
    | "REJECTED";
}

function toDateOnly(date: Date | null): string {
  if (!date) return "-";
  return date.toISOString().slice(0, 10);
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const maybeForm = formData as Partial<BusinessInfo>;
  return maybeForm.businessName ?? fallback ?? "-";
}

function canTransition(from: DbApplicationStatus, action: BploReviewAction): boolean {
  if (action === "MARK_UNDER_REVIEW") return from === "SUBMITTED";
  if (action === "RETURN_FOR_CORRECTION") return from === "SUBMITTED" || from === "UNDER_REVIEW";
  if (action === "REJECT_APPLICATION") return from === "SUBMITTED" || from === "UNDER_REVIEW";
  if (action === "APPROVE_FOR_ASSESSMENT") return from === "UNDER_REVIEW";
  return false;
}

function getNextStatus(action: BploReviewAction): DbApplicationStatus {
  if (action === "MARK_UNDER_REVIEW") return "UNDER_REVIEW";
  if (action === "RETURN_FOR_CORRECTION") return "RETURNED_FOR_CORRECTION";
  if (action === "REJECT_APPLICATION") return "REJECTED";
  return "ASSESSED";
}

function remarksRequired(action: BploReviewAction): boolean {
  return action === "RETURN_FOR_CORRECTION" || action === "REJECT_APPLICATION";
}

export async function getBploDashboardSummary() {
  const statuses: DbApplicationStatus[] = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "RETURNED_FOR_CORRECTION",
    "ASSESSED",
    "APPROVED_FOR_PAYMENT",
    "PAID",
    "FOR_RELEASE",
    "RELEASED",
  ];

  const counts = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.businessApplication.count({ where: { status } }),
    }))
  );

  const byStatus = Object.fromEntries(counts.map((row) => [row.status, row.count])) as Record<DbApplicationStatus, number>;

  return {
    submittedApplications: byStatus.SUBMITTED ?? 0,
    underReview: byStatus.UNDER_REVIEW ?? 0,
    returnedForCorrection: byStatus.RETURNED_FOR_CORRECTION ?? 0,
    assessedApplications: byStatus.ASSESSED ?? 0,
    approvedForPayment: byStatus.APPROVED_FOR_PAYMENT ?? 0,
    paidApplications: byStatus.PAID ?? 0,
    forRelease: byStatus.FOR_RELEASE ?? 0,
    releasedPermits: byStatus.RELEASED ?? 0,
  };
}

export async function getBploApplicationTypeSummary() {
  const [totalNew, totalRenewal, totalClosure] = await Promise.all([
    prisma.businessApplication.count({ where: { applicationType: "NEW" } }),
    prisma.businessApplication.count({ where: { applicationType: "RENEWAL" } }),
    prisma.businessApplication.count({ where: { applicationType: "CLOSURE" } }),
  ]);

  return {
    totalNew,
    totalRenewal,
    totalClosure,
  };
}

export async function listRecentBploSubmissions(limit = 5): Promise<BploQueueRow[]> {
  return listBploApplications({ status: "SUBMITTED" }, limit);
}

export async function listBploApplications(filters: BploQueueFilters = {}, limit?: number): Promise<BploQueueRow[]> {
  const normalizedSearch = filters.search?.trim();
  const rows = await prisma.businessApplication.findMany({
    where: {
      ...(filters.type && filters.type !== "ALL" ? { applicationType: filters.type } : {}),
      ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { applicationNumber: { contains: normalizedSearch } },
              { applicant: { name: { contains: normalizedSearch } } },
              { applicant: { email: { contains: normalizedSearch } } },
            ],
          }
        : {}),
    },
    include: {
      applicant: {
        select: {
          name: true,
          email: true,
        },
      },
      businessRecord: {
        select: {
          businessName: true,
        },
      },
    },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    ...(limit ? { take: limit } : {}),
  });

  const mapped = rows.map((row: any) => ({
    id: row.id,
    applicationNumber: row.applicationNumber,
    businessName: resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null),
    applicantName: row.applicant.name,
    applicantEmail: row.applicant.email,
    applicationType: row.applicationType,
    status: mapDbStatusToUi(row.status),
    dateSubmitted: toDateOnly(row.submittedAt),
  }));

  if (!normalizedSearch) return mapped;

  const searchLower = normalizedSearch.toLowerCase();
  return mapped.filter(
    (row: BploQueueRow) =>
      row.businessName.toLowerCase().includes(searchLower) ||
      row.applicantName.toLowerCase().includes(searchLower) ||
      row.applicantEmail.toLowerCase().includes(searchLower) ||
      row.applicationNumber.toLowerCase().includes(searchLower)
  );
}

export async function getBploApplicationDetail(applicationId: string) {
  const row = await prisma.businessApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      businessRecord: true,
      documents: {
        orderBy: { uploadedAt: "asc" },
      },
      history: {
        include: {
          actor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    applicationNumber: row.applicationNumber,
    applicant: row.applicant,
    applicationType: row.applicationType,
    status: mapDbStatusToUi(row.status),
    rawStatus: row.status,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    businessName: resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null),
    formData: row.formData,
    documents: row.documents.map((doc: any) => ({
      id: doc.id,
      documentName: doc.documentName,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt.toISOString(),
    })),
    history: row.history.map((item: any) => ({
      id: item.id,
      fromStatus: item.fromStatus ? mapDbStatusToUi(item.fromStatus) : null,
      toStatus: mapDbStatusToUi(item.toStatus),
      remarks: item.remarks,
      actorName: item.actor?.name ?? "System",
      actorRole: item.actorRole,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function getBploApplicationDocument(applicationId: string, documentId: string) {
  const application = await prisma.businessApplication.findFirst({
    where: {
      id: applicationId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (!BPLO_VISIBLE_STATUSES.includes(application.status as DbApplicationStatus)) {
    throw new Error("Application is not available for BPLO review");
  }

  const document = await prisma.applicationDocument.findFirst({
    where: {
      id: documentId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.applicationId !== applicationId) {
    throw new Error("Document does not belong to the requested application");
  }

  return document;
}

export async function applyBploReviewAction(
  applicationId: string,
  bploUserId: string,
  action: BploReviewAction,
  remarks?: string
) {
  const normalizedRemarks = remarks?.trim();

  if (remarksRequired(action) && !normalizedRemarks) {
    throw new Error("Remarks are required for this action");
  }

  return prisma.$transaction(async (tx: any) => {
    const current = await tx.businessApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!current) {
      throw new Error("Application not found");
    }

    if (!canTransition(current.status, action)) {
      throw new Error("Invalid status transition");
    }

    const nextStatus = getNextStatus(action);

    const updated = await tx.businessApplication.update({
      where: { id: current.id },
      data: {
        status: nextStatus,
      },
      select: {
        id: true,
        applicationNumber: true,
        status: true,
      },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId: current.id,
        actorId: bploUserId,
        actorRole: "BPLO",
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
