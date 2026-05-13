import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import { getPaymentReferencesFromFormData } from "@/lib/payment-reference";
import { toMoneyNumber } from "@/lib/money";

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

type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";
type PaymentRefStatus = "PENDING" | "VERIFIED" | "REJECTED";
type ActorRole = "APPLICANT" | "BPLO" | "SUPER_ADMIN";

const STATUS_ORDER: DbApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSESSED",
  "APPROVED_FOR_PAYMENT",
  "PAID",
  "FOR_RELEASE",
  "RELEASED",
  "REJECTED",
  "RETURNED_FOR_CORRECTION",
  "DRAFT",
];

function toDateOnly(date: Date | null): string {
  if (!date) return "-";
  return date.toISOString().slice(0, 10);
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const data = (formData ?? {}) as Record<string, unknown>;
  const fromForm =
    typeof data.businessName === "string" && data.businessName.trim()
      ? data.businessName.trim()
      : null;
  return fromForm ?? fallback ?? "-";
}

function latestPaymentReference(
  formData: unknown,
  applicationId: string,
  status: DbApplicationStatus
): {
  id: string;
  transactionNumber: string;
  amountPaid: number;
  submittedAt: string;
  status: PaymentRefStatus;
  reviewerRemarks: string | null;
  reviewedAt: string | null;
} | null {
  const refs = getPaymentReferencesFromFormData(formData, applicationId, status);
  return refs.length > 0 ? refs[refs.length - 1] : null;
}

export interface SuperAdminDashboardSummary {
  totalApplications: number;
  byStatus: Record<DbApplicationStatus, number>;
  totalBusinessRecords: number;
  totalUsers: number;
  totalAssessedAmount: number;
  totalRevenueEstimate: number;
}

export interface SuperAdminApplicationListRow {
  id: string;
  applicationNumber: string;
  businessName: string;
  applicantEmail: string;
  applicationType: ApplicationType;
  status: string;
  topNumber: string | null;
  permitOrCertificateNumber: string | null;
  dateSubmitted: string;
  lastUpdated: string;
}

export interface SuperAdminApplicationDetail {
  application: {
    id: string;
    applicationNumber: string;
    applicationType: ApplicationType;
    status: string;
    rawStatus: DbApplicationStatus;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  applicant: {
    id: string;
    name: string;
    email: string;
  };
  businessInfo: {
    businessName: string;
    businessType: string;
    registrationNumber: string;
    tin: string;
    tradeName: string;
    ownerName: string;
    email: string;
    phone: string;
    mainOfficeAddress: string;
    businessAddress: string;
    lineOfBusiness: string;
    businessActivity: string;
    assetSize: string;
    totalEmployees: string;
  };
  documents: Array<{
    id: string;
    documentName: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
  }>;
  feeAssessment: {
    assessmentNumber: string | null;
    status: "DRAFT" | "GENERATED" | null;
    paymentFrequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY" | null;
    mayorsPermitFee: number;
    regulatoryFees: number;
    additionalCharges: number;
    penalties: number;
    surcharge: number;
    interest: number;
    closureCertificateFee: number;
    arrears: number;
    otherCharges: number;
    totalAmount: number;
    remarks: string | null;
    generatedAt: string | null;
  };
  paymentReference: {
    id: string;
    transactionNumber: string;
    amountPaid: number;
    submittedAt: string;
    status: PaymentRefStatus;
    reviewerRemarks: string | null;
    reviewedAt: string | null;
  } | null;
  permitIssuance: {
    id: string;
    documentType: "BUSINESS_PERMIT" | "CLOSURE_CERTIFICATE";
    documentNumber: string;
    status: "PREPARED" | "FOR_RELEASE" | "RELEASED";
    issuedAt: string;
    releasedAt: string | null;
    preparedBy: string | null;
    releasedBy: string | null;
    remarks: string | null;
  } | null;
  history: Array<{
    id: string;
    createdAt: string;
    actorEmail: string | null;
    actorRole: string | null;
    fromStatus: string | null;
    toStatus: string;
    remarks: string | null;
  }>;
}

export interface SuperAdminActivityRow {
  id: string;
  dateTime: string;
  actorEmail: string;
  actorRole: string;
  applicationNumber: string;
  fromStatus: string;
  toStatus: string;
  transition: string;
  remarks: string | null;
}

export interface SuperAdminActivityFilters {
  actorRole?: "ALL" | ActorRole;
  transition?: string;
  date?: string;
  applicationNumber?: string;
}

export interface SuperAdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "APPLICANT" | "BPLO" | "SUPER_ADMIN" | "DEPARTMENT_HEAD" | "JIT";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminUserSummary {
  totalUsers: number;
  applicants: number;
  bploAccounts: number;
  superAdmins: number;
  departmentHeads: number;
  jitInspectors: number;
  activeUsers: number;
  disabledUsers: number;
}

export interface SuperAdminReportsSummary {
  applicationsByStatus: Array<{ status: string; count: number }>;
  applicationsByType: Array<{ type: ApplicationType; count: number }>;
  totalAssessedAmount: number;
  totalRevenueEstimate: number;
  releasedPermits: number;
  closureCertificates: number;
  bploActivityCount: number;
}

async function countStatuses(): Promise<Record<DbApplicationStatus, number>> {
  const counts = await Promise.all(
    [
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASSESSED",
      "APPROVED_FOR_PAYMENT",
      "PAID",
      "FOR_RELEASE",
      "RELEASED",
      "RETURNED_FOR_CORRECTION",
      "REJECTED",
    ].map(async (status) => ({
      status: status as DbApplicationStatus,
      count: await prisma.businessApplication.count({
        where: { status: status as DbApplicationStatus },
      }),
    }))
  );

  const byStatus = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    ASSESSED: 0,
    APPROVED_FOR_PAYMENT: 0,
    PAID: 0,
    FOR_RELEASE: 0,
    RELEASED: 0,
    RETURNED_FOR_CORRECTION: 0,
    REJECTED: 0,
  } satisfies Record<DbApplicationStatus, number>;

  for (const row of counts) {
    byStatus[row.status] = row.count;
  }

  return byStatus;
}

async function computeTotals() {
  const feeRows = await prisma.feeAssessment.findMany({
    select: {
      totalAmount: true,
      application: {
        select: {
          status: true,
        },
      },
    },
  });

  let totalAssessedAmount = 0;
  let totalRevenueEstimate = 0;
  for (const row of feeRows) {
    totalAssessedAmount += toMoneyNumber(row.totalAmount);
    if (["PAID", "FOR_RELEASE", "RELEASED"].includes(row.application.status)) {
      totalRevenueEstimate += toMoneyNumber(row.totalAmount);
    }
  }

  return {
    totalAssessedAmount: Math.round(totalAssessedAmount * 100) / 100,
    totalRevenueEstimate: Math.round(totalRevenueEstimate * 100) / 100,
  };
}

// Cached query for dashboard summary - deduplicates per-request
const getCachedSuperAdminDashboardSummary = cache(async () => {
  const [
    totalApplications,
    byStatus,
    totalBusinessRecords,
    totalUsers,
    totals,
  ] = await Promise.all([
    prisma.businessApplication.count(),
    countStatuses(),
    prisma.businessRecord.count(),
    prisma.user.count(),
    computeTotals(),
  ]);

  return {
    totalApplications,
    byStatus,
    totalBusinessRecords,
    totalUsers,
    totalAssessedAmount: totals.totalAssessedAmount,
    totalRevenueEstimate: totals.totalRevenueEstimate,
  };
});

export async function getSuperAdminDashboardSummary(): Promise<SuperAdminDashboardSummary> {
  return getCachedSuperAdminDashboardSummary();
}

export async function listSuperAdminApplications(
  search?: string
): Promise<SuperAdminApplicationListRow[]> {
  const normalizedSearch = search?.trim();

  const rows = await prisma.businessApplication.findMany({
    where: normalizedSearch
      ? {
          OR: [
            { applicationNumber: { contains: normalizedSearch } },
            { applicant: { email: { contains: normalizedSearch } } },
          ],
        }
      : undefined,
    include: {
      applicant: { select: { email: true } },
      businessRecord: { select: { businessName: true } },
      feeAssessment: { select: { assessmentNumber: true } },
      permitIssuance: { select: { documentNumber: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    applicationNumber: row.applicationNumber,
    businessName: resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null),
    applicantEmail: row.applicant.email,
    applicationType: row.applicationType as ApplicationType,
    status: mapDbStatusToUi(row.status),
    topNumber: row.feeAssessment?.assessmentNumber ?? null,
    permitOrCertificateNumber: row.permitIssuance?.documentNumber ?? null,
    dateSubmitted: toDateOnly(row.submittedAt),
    lastUpdated: toDateOnly(row.updatedAt),
  }));
}

export async function getSuperAdminApplicationDetail(
  applicationId: string
): Promise<SuperAdminApplicationDetail | null> {
  const row = await prisma.businessApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      businessRecord: { select: { businessName: true } },
      documents: {
        select: {
          id: true,
          documentName: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: "asc" },
      },
      feeAssessment: true,
      paymentReferences: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: {
          id: true,
          transactionNumber: true,
          amountPaid: true,
          submittedAt: true,
          status: true,
          reviewerRemarks: true,
          reviewedAt: true,
        },
      },
      permitIssuance: {
        include: {
          preparedBy: { select: { name: true } },
          releasedBy: { select: { name: true } },
        },
      },
      history: {
        include: {
          actor: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!row) return null;

  const latestDbPaymentRef = row.paymentReferences[0] ?? null;
  const paymentRef = latestDbPaymentRef
    ? {
        id: latestDbPaymentRef.id,
        transactionNumber: latestDbPaymentRef.transactionNumber,
        amountPaid: toMoneyNumber(latestDbPaymentRef.amountPaid),
        submittedAt: latestDbPaymentRef.submittedAt.toISOString(),
        status: latestDbPaymentRef.status as PaymentRefStatus,
        reviewerRemarks: latestDbPaymentRef.reviewerRemarks,
        reviewedAt: latestDbPaymentRef.reviewedAt
          ? latestDbPaymentRef.reviewedAt.toISOString()
          : null,
      }
    : latestPaymentReference(row.formData, row.id, row.status as DbApplicationStatus);

  const form = (row.formData ?? {}) as Record<string, unknown>;
  const formValue = (key: string) =>
    typeof form[key] === "string" && String(form[key]).trim()
      ? String(form[key]).trim()
      : "-";

  return {
    application: {
      id: row.id,
      applicationNumber: row.applicationNumber,
      applicationType: row.applicationType as ApplicationType,
      status: mapDbStatusToUi(row.status),
      rawStatus: row.status as DbApplicationStatus,
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    applicant: row.applicant,
    businessInfo: {
      businessName: resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null),
      businessType: formValue("businessType"),
      registrationNumber: formValue("registrationNumber"),
      tin: formValue("tin"),
      tradeName: formValue("tradeName"),
      ownerName: formValue("ownerName"),
      email: formValue("email"),
      phone: formValue("phone"),
      mainOfficeAddress: formValue("mainOfficeAddress"),
      businessAddress: formValue("businessAddress"),
      lineOfBusiness: formValue("lineOfBusiness"),
      businessActivity: formValue("businessActivity"),
      assetSize: formValue("assetSize"),
      totalEmployees: formValue("totalEmployees"),
    },
    documents: row.documents.map((doc) => ({
      id: doc.id,
      documentName: doc.documentName,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt.toISOString(),
    })),
    feeAssessment: {
      assessmentNumber: row.feeAssessment?.assessmentNumber ?? null,
      status: (row.feeAssessment?.status as "DRAFT" | "GENERATED" | null) ?? null,
      paymentFrequency:
        (row.feeAssessment?.paymentFrequency as
          | "ANNUAL"
          | "BI_ANNUAL"
          | "QUARTERLY"
          | null) ?? null,
      mayorsPermitFee: toMoneyNumber(row.feeAssessment?.mayorsPermitFee),
      regulatoryFees: toMoneyNumber(row.feeAssessment?.regulatoryFees),
      additionalCharges: toMoneyNumber(row.feeAssessment?.additionalCharges),
      penalties: toMoneyNumber(row.feeAssessment?.penalties),
      surcharge: toMoneyNumber(row.feeAssessment?.surcharge),
      interest: toMoneyNumber(row.feeAssessment?.interest),
      closureCertificateFee: toMoneyNumber(row.feeAssessment?.closureCertificateFee),
      arrears: toMoneyNumber(row.feeAssessment?.arrears),
      otherCharges: toMoneyNumber(row.feeAssessment?.otherCharges),
      totalAmount: toMoneyNumber(row.feeAssessment?.totalAmount),
      remarks: row.feeAssessment?.remarks ?? null,
      generatedAt: row.feeAssessment?.generatedAt
        ? row.feeAssessment.generatedAt.toISOString()
        : null,
    },
    paymentReference: paymentRef,
    permitIssuance: row.permitIssuance
      ? {
          id: row.permitIssuance.id,
          documentType: row.permitIssuance.documentType,
          documentNumber: row.permitIssuance.documentNumber,
          status: row.permitIssuance.status,
          issuedAt: row.permitIssuance.issuedAt.toISOString(),
          releasedAt: row.permitIssuance.releasedAt
            ? row.permitIssuance.releasedAt.toISOString()
            : null,
          preparedBy: row.permitIssuance.preparedBy?.name ?? null,
          releasedBy: row.permitIssuance.releasedBy?.name ?? null,
          remarks: row.permitIssuance.remarks,
        }
      : null,
    history: row.history.map((item) => ({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      actorEmail: item.actor?.email ?? null,
      actorRole: item.actorRole,
      fromStatus: item.fromStatus ? mapDbStatusToUi(item.fromStatus) : null,
      toStatus: mapDbStatusToUi(item.toStatus),
      remarks: item.remarks,
    })),
  };
}

export async function listSuperAdminActivities(
  filters: SuperAdminActivityFilters = {}
): Promise<SuperAdminActivityRow[]> {
  const where: {
    actorRole?: ActorRole;
    application?: { applicationNumber?: { contains: string } };
    createdAt?: { gte: Date; lt: Date };
    fromStatus?: DbApplicationStatus;
    toStatus?: DbApplicationStatus;
  } = {};

  if (filters.actorRole && filters.actorRole !== "ALL") {
    where.actorRole = filters.actorRole;
  }

  if (filters.applicationNumber?.trim()) {
    where.application = {
      applicationNumber: { contains: filters.applicationNumber.trim() },
    };
  }

  if (filters.date?.trim()) {
    const start = new Date(`${filters.date.trim()}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    if (!Number.isNaN(start.getTime())) {
      where.createdAt = { gte: start, lt: end };
    }
  }

  if (filters.transition?.includes("->")) {
    const [from, to] = filters.transition.split("->").map((s) => s.trim());
    if (from && from !== "NONE") {
      where.fromStatus = from as DbApplicationStatus;
    }
    if (to) {
      where.toStatus = to as DbApplicationStatus;
    }
  }

  const rows = await prisma.applicationHistory.findMany({
    where,
    include: {
      actor: { select: { email: true } },
      application: { select: { applicationNumber: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 500,
  });

  return rows.map((row) => {
    const fromStatus = row.fromStatus ? mapDbStatusToUi(row.fromStatus) : "-";
    const toStatus = mapDbStatusToUi(row.toStatus);

    return {
      id: row.id,
      dateTime: row.createdAt.toISOString(),
      actorEmail: row.actor?.email ?? "System",
      actorRole: row.actorRole ?? "SYSTEM",
      applicationNumber: row.application.applicationNumber,
      fromStatus,
      toStatus,
      transition: `${row.fromStatus ?? "NONE"}->${row.toStatus}`,
      remarks: row.remarks,
    };
  });
}

export async function listSuperAdminUsers(filters?: {
  search?: string;
  role?: "ALL" | "APPLICANT" | "BPLO" | "SUPER_ADMIN";
  status?: "ALL" | "ACTIVE" | "DISABLED";
}): Promise<SuperAdminUserRow[]> {
  const normalizedSearch = filters?.search?.trim();
  const roleFilter = filters?.role ?? "ALL";
  const statusFilter = filters?.status ?? "ALL";

  const users = await prisma.user.findMany({
    where: {
      ...(normalizedSearch
        ? {
            OR: [
              { name: { contains: normalizedSearch } },
              { email: { contains: normalizedSearch } },
            ],
          }
        : {}),
      ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
      ...(statusFilter === "ALL"
        ? {}
        : {
            isActive: statusFilter === "ACTIVE",
          }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.isActive ? "ACTIVE" : "DISABLED",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function getSuperAdminUserSummary(): Promise<SuperAdminUserSummary> {
  const [totalUsers, applicants, bploAccounts, superAdmins, departmentHeads, jitInspectors, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "APPLICANT" } }),
    prisma.user.count({ where: { role: "BPLO" } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
    prisma.user.count({ where: { role: "DEPARTMENT_HEAD" } }),
    prisma.user.count({ where: { role: "JIT" } }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  return {
    totalUsers,
    applicants,
    bploAccounts,
    superAdmins,
    departmentHeads,
    jitInspectors,
    activeUsers,
    disabledUsers: totalUsers - activeUsers,
  };
}

// Cached query for reports summary - deduplicates per-request
const getCachedSuperAdminReportsSummary = cache(async (): Promise<SuperAdminReportsSummary> => {
  const [statusCounts, typeCounts, totals, releasedPermits, closureCertificates, bploActivityCount] =
    await Promise.all([
      countStatuses(),
      Promise.all(
        ["NEW", "RENEWAL", "CLOSURE"].map(async (type) => ({
          type: type as ApplicationType,
          count: await prisma.businessApplication.count({
            where: { applicationType: type as ApplicationType },
          }),
        }))
      ),
      computeTotals(),
      prisma.permitIssuance.count({
        where: { documentType: "BUSINESS_PERMIT", status: "RELEASED" },
      }),
      prisma.permitIssuance.count({
        where: { documentType: "CLOSURE_CERTIFICATE", status: "RELEASED" },
      }),
      prisma.applicationHistory.count({ where: { actorRole: "BPLO" } }),
    ]);

  return {
    applicationsByStatus: STATUS_ORDER.map((status) => ({
      status: mapDbStatusToUi(status),
      count: statusCounts[status],
    })),
    applicationsByType: typeCounts,
    totalAssessedAmount: totals.totalAssessedAmount,
    totalRevenueEstimate: totals.totalRevenueEstimate,
    releasedPermits,
    closureCertificates,
    bploActivityCount,
  };
});

export async function getSuperAdminReportsSummary(): Promise<SuperAdminReportsSummary> {
  return getCachedSuperAdminReportsSummary();
}
