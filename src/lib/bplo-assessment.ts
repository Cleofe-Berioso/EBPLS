import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import { computeMayorsPermitFee, sumFeeComponents } from "@/lib/fee-computation";
import { getRuntimeFeeSettings } from "@/lib/fee-settings";
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

export interface AssessmentFeeRow {
  id: string;
  applicationNumber: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  lineOfBusiness: string;
  status: string;
  lastUpdated: string;
  hasAssessment: boolean;
  assessmentStatus: "DRAFT" | "GENERATED" | null;
}

export interface AssessmentDetail {
  // Application summary
  id: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  status: string;
  rawStatus: DbApplicationStatus;
  submittedAt: string | null;
  // Applicant
  applicant: { id: string; name: string; email: string };
  // Business info
  businessName: string;
  lineOfBusiness: string;
  assetSize: string;
  totalEmployees: string;
  businessType: string;
  businessActivity: string;
  // Computed fees suggestion
  suggestedFees: {
    mayorsPermitFee: number;
    regulatoryFees: number;
    surcharge: number;
    interest: number;
    closureCertificateFee: number;
    computation: string;
    category: string;
    sizeClassification: string;
    detectedCategory: string;
    assetClassification: string;
    workerClassification: string;
    selectedClassification: string;
    assetBasedFee: number;
    workerBasedFee: number;
    selectedMayorPermitFee: number;
    specialRuleApplied: string | null;
  };
  // Existing assessment if any
  assessment: SavedAssessment | null;
}

export interface SavedAssessment {
  id: string;
  assessmentNumber: string;
  status: "DRAFT" | "GENERATED";
  paymentFrequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY";
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
  computedById: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentInput {
  paymentFrequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY";
  mayorsPermitFee: number;
  regulatoryFees: number;
  additionalCharges: number;
  penalties: number;
  surcharge: number;
  interest: number;
  closureCertificateFee: number;
  arrears: number;
  otherCharges: number;
  remarks?: string;
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const maybeForm = formData as Partial<BusinessInfo>;
  return maybeForm.businessName ?? fallback ?? "-";
}

function resolveField(formData: unknown, key: keyof BusinessInfo): string {
  const form = formData as Partial<BusinessInfo>;
  const val = form[key];
  return (typeof val === "string" ? val : null) ?? "-";
}

function toDateOnly(date: Date | null): string {
  if (!date) return "-";
  return date.toISOString().slice(0, 10);
}

async function generateAssessmentNumber(dbClient: any = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const count = await dbClient.feeAssessment.count();
  const seq = String(count + 1).padStart(5, "0");
  return `TOP-${year}-${seq}`;
}

function toSavedAssessment(row: {
  id: string;
  assessmentNumber: string;
  status: string;
  paymentFrequency: string;
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
  computedById: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SavedAssessment {
  return {
    id: row.id,
    assessmentNumber: row.assessmentNumber,
    status: row.status as "DRAFT" | "GENERATED",
    paymentFrequency: row.paymentFrequency as "ANNUAL" | "BI_ANNUAL" | "QUARTERLY",
    mayorsPermitFee: row.mayorsPermitFee,
    regulatoryFees: row.regulatoryFees,
    additionalCharges: row.additionalCharges,
    penalties: row.penalties,
    surcharge: row.surcharge,
    interest: row.interest,
    closureCertificateFee: row.closureCertificateFee,
    arrears: row.arrears,
    otherCharges: row.otherCharges,
    totalAmount: row.totalAmount,
    remarks: row.remarks,
    computedById: row.computedById,
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAssessmentFeeApplications(): Promise<AssessmentFeeRow[]> {
  const rows = await prisma.businessApplication.findMany({
    where: { status: "ASSESSED" },
    include: {
      applicant: { select: { name: true, email: true } },
      businessRecord: { select: { businessName: true } },
      feeAssessment: { select: { status: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rows.map((row: any) => ({
    id: row.id,
    applicationNumber: row.applicationNumber,
    businessName: resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null),
    applicantName: row.applicant.name,
    applicantEmail: row.applicant.email,
    applicationType: row.applicationType as "NEW" | "RENEWAL" | "CLOSURE",
    lineOfBusiness: resolveField(row.formData, "lineOfBusiness"),
    status: mapDbStatusToUi(row.status),
    lastUpdated: toDateOnly(row.updatedAt),
    hasAssessment: row.feeAssessment !== null,
    assessmentStatus: (row.feeAssessment?.status as "DRAFT" | "GENERATED" | null) ?? null,
  }));
}

export async function getApplicationForAssessment(
  applicationId: string
): Promise<AssessmentDetail | null> {
  const row = await prisma.businessApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      businessRecord: true,
      feeAssessment: true,
    },
  });

  if (!row) return null;

  const lineOfBusiness = resolveField(row.formData, "lineOfBusiness");
  const assetSize = resolveField(row.formData, "assetSize");
  const totalEmployees = resolveField(row.formData, "totalEmployees");
  const businessActivity = resolveField(row.formData, "businessActivity");
  const businessType = resolveField(row.formData, "businessType");
  const businessName = resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null);

  const runtimeSettings = await getRuntimeFeeSettings();
  const suggestedFees = computeMayorsPermitFee({
    applicationType: row.applicationType as "NEW" | "RENEWAL" | "CLOSURE",
    lineOfBusiness: lineOfBusiness !== "-" ? lineOfBusiness : null,
    assetSize: assetSize !== "-" ? assetSize : null,
    totalEmployees: totalEmployees !== "-" ? totalEmployees : null,
  }, runtimeSettings);

  return {
    id: row.id,
    applicationNumber: row.applicationNumber,
    applicationType: row.applicationType as "NEW" | "RENEWAL" | "CLOSURE",
    status: mapDbStatusToUi(row.status),
    rawStatus: row.status as DbApplicationStatus,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    applicant: row.applicant,
    businessName,
    lineOfBusiness,
    assetSize,
    totalEmployees,
    businessType,
    businessActivity,
    suggestedFees: {
      mayorsPermitFee: suggestedFees.mayorsPermitFee,
      regulatoryFees: suggestedFees.regulatoryFees,
      surcharge: suggestedFees.surcharge,
      interest: suggestedFees.interest,
      closureCertificateFee: suggestedFees.closureCertificateFee,
      computation: suggestedFees.computation,
      category: suggestedFees.category,
      sizeClassification: suggestedFees.sizeClassification,
      detectedCategory: suggestedFees.detectedCategory,
      assetClassification: suggestedFees.assetClassification,
      workerClassification: suggestedFees.workerClassification,
      selectedClassification: suggestedFees.selectedClassification,
      assetBasedFee: suggestedFees.assetBasedFee,
      workerBasedFee: suggestedFees.workerBasedFee,
      selectedMayorPermitFee: suggestedFees.selectedMayorPermitFee,
      specialRuleApplied: suggestedFees.specialRuleApplied,
    },
    assessment: row.feeAssessment ? toSavedAssessment(row.feeAssessment) : null,
  };
}

function sanitizeFeeInput(input: AssessmentInput): AssessmentInput {
  function clamp(val: unknown): number {
    const n = typeof val === "number" ? val : parseFloat(String(val ?? "0"));
    return isNaN(n) || n < 0 ? 0 : Math.round(n * 100) / 100;
  }
  return {
    paymentFrequency: input.paymentFrequency,
    mayorsPermitFee: clamp(input.mayorsPermitFee),
    regulatoryFees: clamp(input.regulatoryFees),
    additionalCharges: clamp(input.additionalCharges),
    penalties: clamp(input.penalties),
    surcharge: clamp(input.surcharge),
    interest: clamp(input.interest),
    closureCertificateFee: clamp(input.closureCertificateFee),
    arrears: clamp(input.arrears),
    otherCharges: clamp(input.otherCharges),
    remarks: input.remarks?.trim() ?? undefined,
  };
}

export async function saveAssessmentDraft(
  applicationId: string,
  bploUserId: string,
  input: AssessmentInput
): Promise<SavedAssessment> {
  const application = await prisma.businessApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true },
  });

  if (!application) throw new Error("Application not found");
  if (application.status !== "ASSESSED") {
    throw new Error("Assessment can only be saved for ASSESSED applications");
  }

  const fees = sanitizeFeeInput(input);
  // Server recomputes total — never trust client total
  const totalAmount = sumFeeComponents(fees);

  const existing = await prisma.feeAssessment.findUnique({
    where: { applicationId },
    select: { id: true, assessmentNumber: true, status: true },
  });

  // Cannot amend a GENERATED TOP (use generate-top to create a new one if needed)
  if (existing?.status === "GENERATED") {
    throw new Error("Tax Order of Payment has already been generated. Cannot revert to draft.");
  }

  const assessmentNumber = existing?.assessmentNumber ?? (await generateAssessmentNumber());

  const saved = await prisma.feeAssessment.upsert({
    where: { applicationId },
    create: {
      applicationId,
      assessmentNumber,
      status: "DRAFT",
      paymentFrequency: fees.paymentFrequency,
      mayorsPermitFee: fees.mayorsPermitFee,
      regulatoryFees: fees.regulatoryFees,
      additionalCharges: fees.additionalCharges,
      penalties: fees.penalties,
      surcharge: fees.surcharge,
      interest: fees.interest,
      closureCertificateFee: fees.closureCertificateFee,
      arrears: fees.arrears,
      otherCharges: fees.otherCharges,
      totalAmount,
      remarks: fees.remarks ?? null,
      computedById: bploUserId,
    },
    update: {
      paymentFrequency: fees.paymentFrequency,
      mayorsPermitFee: fees.mayorsPermitFee,
      regulatoryFees: fees.regulatoryFees,
      additionalCharges: fees.additionalCharges,
      penalties: fees.penalties,
      surcharge: fees.surcharge,
      interest: fees.interest,
      closureCertificateFee: fees.closureCertificateFee,
      arrears: fees.arrears,
      otherCharges: fees.otherCharges,
      totalAmount,
      remarks: fees.remarks ?? null,
      computedById: bploUserId,
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId,
      actorId: bploUserId,
      actorRole: "BPLO",
      fromStatus: "ASSESSED",
      toStatus: "ASSESSED",
      remarks: `Assessment draft saved. Assessment No.: ${assessmentNumber}, Total: ₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    },
  });

  return toSavedAssessment(saved);
}

export async function generateTop(
  applicationId: string,
  bploUserId: string,
  input: AssessmentInput
): Promise<SavedAssessment> {
  const fees = sanitizeFeeInput(input);
  // Server recomputes total — never trust client
  const totalAmount = sumFeeComponents(fees);

  return prisma.$transaction(async (tx: any) => {
    const application = await tx.businessApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, status: true },
    });

    if (!application) throw new Error("Application not found");
    // Only ASSESSED applications can have TOP generated
    if (application.status !== "ASSESSED") {
      throw new Error(
        "Tax Order of Payment can only be generated for ASSESSED applications. Current status: " +
          application.status
      );
    }

    const existing = await tx.feeAssessment.findUnique({
      where: { applicationId },
      select: { id: true, assessmentNumber: true, status: true },
    });

    const assessmentNumber = existing?.assessmentNumber ?? (await generateAssessmentNumber(tx));
    const now = new Date();

    const generated = await tx.feeAssessment.upsert({
      where: { applicationId },
      create: {
        applicationId,
        assessmentNumber,
        status: "GENERATED",
        paymentFrequency: fees.paymentFrequency,
        mayorsPermitFee: fees.mayorsPermitFee,
        regulatoryFees: fees.regulatoryFees,
        additionalCharges: fees.additionalCharges,
        penalties: fees.penalties,
        surcharge: fees.surcharge,
        interest: fees.interest,
        closureCertificateFee: fees.closureCertificateFee,
        arrears: fees.arrears,
        otherCharges: fees.otherCharges,
        totalAmount,
        remarks: fees.remarks ?? null,
        computedById: bploUserId,
        generatedAt: now,
      },
      update: {
        status: "GENERATED",
        paymentFrequency: fees.paymentFrequency,
        mayorsPermitFee: fees.mayorsPermitFee,
        regulatoryFees: fees.regulatoryFees,
        additionalCharges: fees.additionalCharges,
        penalties: fees.penalties,
        surcharge: fees.surcharge,
        interest: fees.interest,
        closureCertificateFee: fees.closureCertificateFee,
        arrears: fees.arrears,
        otherCharges: fees.otherCharges,
        totalAmount,
        remarks: fees.remarks ?? null,
        computedById: bploUserId,
        generatedAt: now,
      },
    });

    // Transition application: ASSESSED → APPROVED_FOR_PAYMENT
    await tx.businessApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED_FOR_PAYMENT" },
    });

    await tx.applicationHistory.create({
      data: {
        applicationId,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: "ASSESSED",
        toStatus: "APPROVED_FOR_PAYMENT",
        remarks: `Tax Order of Payment generated. TOP No.: ${assessmentNumber}, Total Amount Due: ₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      },
    });

    return toSavedAssessment(generated);
  });
}
