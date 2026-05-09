import { prisma } from "@/lib/prisma";
import { mapDbStatusToUi } from "@/lib/application-mappers";
import { assertStatusTransition } from "@/lib/application-status";
import { computeMayorsPermitFee } from "@/lib/fee-computation";
import { getRuntimeFeeSettings } from "@/lib/fee-settings";
import { toMoneyNumber } from "@/lib/money";
import type { BusinessInfo, FeeLineItemInput } from "@/lib/applicant-types";

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

type PaymentFrequency = "ANNUAL" | "BI_ANNUAL" | "QUARTERLY";
const PAYMENT_FREQUENCIES: PaymentFrequency[] = ["ANNUAL", "BI_ANNUAL", "QUARTERLY"];

const MAYORS_PERMIT_FEE_LABEL = "Mayor's Permit Fee";
const REGULATORY_FEES_LABEL = "Regulatory Fees";
const RENEWAL_SURCHARGE_LABEL = "Renewal Surcharge";
const RENEWAL_INTEREST_LABEL = "Renewal Interest";
const LIQUOR_TOBACCO_SURCHARGE_LABEL = "Liquor/Tobacco Surcharge (25%)";
const CLOSURE_CERTIFICATE_FEE_LABEL = "Closure Certificate Fee";

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

export interface AssessmentLineItem {
  id: string;
  description: string;
  amount: number;
  sortOrder: number;
  isSystemGenerated: boolean;
}

export interface AssessmentDetail {
  id: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  status: string;
  rawStatus: DbApplicationStatus;
  submittedAt: string | null;
  applicant: { id: string; name: string; email: string };
  businessName: string;
  lineOfBusiness: string;
  assetSize: string;
  totalEmployees: string;
  businessType: string;
  businessActivity: string;
  applicantPaymentFrequency: PaymentFrequency | null;
  suggestedFees: {
    mayorsPermitFee: number;
    regulatoryFees: number;
    surcharge: number;
    liquorTobaccoSurcharge: number;
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
    overdueMonths: number;
  };
  suggestedLineItems: AssessmentLineItem[];
  assessment: SavedAssessment | null;
}

export interface SavedAssessment {
  id: string;
  assessmentNumber: string;
  status: "DRAFT" | "GENERATED";
  paymentFrequency: PaymentFrequency;
  annualAssessedAmount: number;
  releasePaymentAmount: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  mayorsPermitFee: number;
  regulatoryFees: number;
  additionalCharges: number;
  penalties: number;
  surcharge: number;
  interest: number;
  closurePaymentDues: number;
  closureCertificateFee: number;
  arrears: number;
  otherCharges: number;
  totalAmount: number;
  remarks: string | null;
  computedById: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: AssessmentLineItem[];
}

export interface AssessmentInput {
  lineItems: FeeLineItemInput[];
  closurePaymentDues?: number;
  remarks?: string;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampMoney(value: unknown): number {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) && parsed > 0 ? roundMoney(parsed) : 0;
}

function resolveBusinessName(formData: unknown, fallback: string | null): string {
  const maybeForm = formData as Partial<BusinessInfo>;
  return maybeForm.businessName ?? fallback ?? "-";
}

function resolveField(formData: unknown, key: keyof BusinessInfo): string {
  const form = formData as Partial<BusinessInfo>;
  const value = form[key];
  return (typeof value === "string" ? value : null) ?? "-";
}

function resolveLiquorOrTobacco(formData: unknown): boolean {
  const maybeForm = formData as Partial<BusinessInfo>;
  return Boolean(maybeForm.isLiquorOrTobacco);
}

function toDateOnly(date: Date | null): string {
  if (!date) return "-";
  return date.toISOString().slice(0, 10);
}

async function generateAssessmentNumber(dbClient: any = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const count = await dbClient.feeAssessment.count();
  return `TOP-${year}-${String(count + 1).padStart(5, "0")}`;
}

function toAssessmentLineItem(row: any): AssessmentLineItem {
  return {
    id: row.id,
    description: row.description,
    amount: toMoneyNumber(row.amount),
    sortOrder: row.sortOrder,
    isSystemGenerated: row.isSystemGenerated,
  };
}

function toSavedAssessment(row: any): SavedAssessment {
  return {
    id: row.id,
    assessmentNumber: row.assessmentNumber,
    status: row.status as "DRAFT" | "GENERATED",
    paymentFrequency: row.paymentFrequency as PaymentFrequency,
    annualAssessedAmount: toMoneyNumber(row.annualAssessedAmount),
    releasePaymentAmount: toMoneyNumber(row.releasePaymentAmount),
    amountPaid: toMoneyNumber(row.amountPaid),
    remainingBalance: toMoneyNumber(row.remainingBalance),
    paymentStatus: row.paymentStatus as "UNPAID" | "PARTIALLY_PAID" | "PAID",
    mayorsPermitFee: toMoneyNumber(row.mayorsPermitFee),
    regulatoryFees: toMoneyNumber(row.regulatoryFees),
    additionalCharges: toMoneyNumber(row.additionalCharges),
    penalties: toMoneyNumber(row.penalties),
    surcharge: toMoneyNumber(row.surcharge),
    interest: toMoneyNumber(row.interest),
    closurePaymentDues: toMoneyNumber(row.closurePaymentDues),
    closureCertificateFee: toMoneyNumber(row.closureCertificateFee),
    arrears: toMoneyNumber(row.arrears),
    otherCharges: toMoneyNumber(row.otherCharges),
    totalAmount: toMoneyNumber(row.totalAmount),
    remarks: row.remarks,
    computedById: row.computedById,
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lineItems: (row.lineItems ?? []).map(toAssessmentLineItem),
  };
}

function monthDifference(startDate: Date, endDate: Date): number {
  const yearDiff = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  const monthDiff = endDate.getUTCMonth() - startDate.getUTCMonth();
  const rawMonths = yearDiff * 12 + monthDiff;
  return endDate.getUTCDate() > startDate.getUTCDate() ? rawMonths + 1 : rawMonths;
}

function resolvePermitExpirationDate(application: any): Date | null {
  const directDate = application.businessRecord?.permitExpirationDate ?? null;
  if (directDate) {
    return directDate;
  }

  const latestReleased = application.businessRecord?.applications?.[0]?.permitIssuance?.releasedAt ?? null;
  if (!latestReleased) {
    return null;
  }

  return new Date(Date.UTC(latestReleased.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
}

function resolveOverdueMonths(application: any): number {
  if (application.applicationType !== "RENEWAL") {
    return 0;
  }

  const expirationDate = resolvePermitExpirationDate(application);
  if (!expirationDate) {
    return 0;
  }

  const now = new Date();
  if (now <= expirationDate) {
    return 0;
  }

  return Math.max(0, monthDifference(expirationDate, now));
}

function buildSuggestedLineItems(
  applicationType: "NEW" | "RENEWAL" | "CLOSURE",
  suggestedFees: AssessmentDetail["suggestedFees"]
): AssessmentLineItem[] {
  const items: AssessmentLineItem[] = [];

  if (applicationType !== "CLOSURE") {
    items.push({
      id: `${MAYORS_PERMIT_FEE_LABEL}-suggested`,
      description: MAYORS_PERMIT_FEE_LABEL,
      amount: suggestedFees.mayorsPermitFee,
      sortOrder: items.length,
      isSystemGenerated: false,
    });

    if (suggestedFees.regulatoryFees > 0) {
      items.push({
        id: `${REGULATORY_FEES_LABEL}-suggested`,
        description: REGULATORY_FEES_LABEL,
        amount: suggestedFees.regulatoryFees,
        sortOrder: items.length,
        isSystemGenerated: false,
      });
    }

    if (suggestedFees.liquorTobaccoSurcharge > 0) {
      items.push({
        id: `${LIQUOR_TOBACCO_SURCHARGE_LABEL}-system`,
        description: LIQUOR_TOBACCO_SURCHARGE_LABEL,
        amount: suggestedFees.liquorTobaccoSurcharge,
        sortOrder: items.length,
        isSystemGenerated: true,
      });
    }
  }

  if (applicationType === "RENEWAL" && suggestedFees.overdueMonths > 12) {
    items.push({
      id: `${RENEWAL_SURCHARGE_LABEL}-system`,
      description: RENEWAL_SURCHARGE_LABEL,
      amount: suggestedFees.surcharge,
      sortOrder: items.length,
      isSystemGenerated: true,
    });
    items.push({
      id: `${RENEWAL_INTEREST_LABEL}-system`,
      description: RENEWAL_INTEREST_LABEL,
      amount: suggestedFees.interest,
      sortOrder: items.length,
      isSystemGenerated: true,
    });
  }

  if (applicationType === "CLOSURE") {
    items.push({
      id: `${CLOSURE_CERTIFICATE_FEE_LABEL}-system`,
      description: CLOSURE_CERTIFICATE_FEE_LABEL,
      amount: suggestedFees.closureCertificateFee,
      sortOrder: items.length,
      isSystemGenerated: true,
    });
  }

  return items;
}

function toReleasePaymentAmount(annualAssessedAmount: number, frequency: PaymentFrequency): number {
  // TOP release now requires full payment amount regardless of installment preference metadata.
  void frequency;
  return annualAssessedAmount;
}

function resolveApplicantPaymentFrequency(formData: unknown): PaymentFrequency | null {
  const maybeForm = (formData ?? {}) as Record<string, unknown>;
  const raw = maybeForm.paymentFrequency;
  if (typeof raw !== "string") return null;
  const normalized = raw.trim() as PaymentFrequency;
  return PAYMENT_FREQUENCIES.includes(normalized) ? normalized : null;
}

function validateCustomLineItems(lineItems: FeeLineItemInput[]): void {
  const customItems = lineItems.filter((item) => !item.isSystemGenerated);
  customItems.forEach((item, index) => {
    const trimmedDesc = item.description?.trim() ?? "";
    if (!trimmedDesc) {
      throw new Error(`Custom fee item #${index + 1} has an empty description. Please enter a fee description.`);
    }
    if (item.amount <= 0) {
      throw new Error(`Custom fee item #${index + 1} "${trimmedDesc}" has an amount of ${item.amount}. Amount must be greater than 0.`);
    }
  });
}

function sanitizeCustomLineItems(lineItems: FeeLineItemInput[]): Array<{ description: string; amount: number }> {
  return lineItems
    .filter((item) => !item.isSystemGenerated)
    .map((item) => ({
      description: item.description.trim(),
      amount: clampMoney(item.amount),
    }));
}

function buildAutomaticRenewalCharges(baseMayorPermitFee: number, overdueMonths: number, settings: any) {
  if (overdueMonths <= 12 || baseMayorPermitFee <= 0) {
    return { surcharge: 0, interest: 0 };
  }

  const surchargeRate = typeof settings?.lateRenewalSurchargeRate === "number"
    ? settings.lateRenewalSurchargeRate
    : 0.25;
  const interestRate = typeof settings?.lateRenewalMonthlyInterestRate === "number"
    ? settings.lateRenewalMonthlyInterestRate
    : 0.02;

  return {
    surcharge: roundMoney(baseMayorPermitFee * surchargeRate),
    interest: roundMoney(baseMayorPermitFee * interestRate * overdueMonths),
  };
}

function buildAutomaticLiquorTobaccoSurcharge(
  applicationType: "NEW" | "RENEWAL" | "CLOSURE",
  baseMayorPermitFee: number,
  isLiquorOrTobacco: boolean,
  settings: any
) {
  if (applicationType === "CLOSURE") {
    return 0;
  }

  if (!isLiquorOrTobacco || baseMayorPermitFee <= 0) {
    return 0;
  }

  const percent = typeof settings?.penalties?.liquorTobaccoAddOnPercent === "number"
    ? settings.penalties.liquorTobaccoAddOnPercent
    : 25;

  return roundMoney(baseMayorPermitFee * (percent / 100));
}

function buildAssessmentTotals(
  applicationType: "NEW" | "RENEWAL" | "CLOSURE",
  customLineItems: Array<{ description: string; amount: number }>,
  isLiquorOrTobacco: boolean,
  closurePaymentDues: number,
  overdueMonths: number,
  runtimeSettings: any
) {
  const isClosure = applicationType === "CLOSURE";
  const mayorLine = isClosure
    ? undefined
    : customLineItems.find((item) => item.description === MAYORS_PERMIT_FEE_LABEL);
  const regulatoryLine = isClosure
    ? undefined
    : customLineItems.find((item) => item.description === REGULATORY_FEES_LABEL);
  const automaticRenewal = isClosure
    ? { surcharge: 0, interest: 0 }
    : buildAutomaticRenewalCharges(mayorLine?.amount ?? 0, overdueMonths, runtimeSettings);
  const liquorTobaccoSurcharge = buildAutomaticLiquorTobaccoSurcharge(
    applicationType,
    mayorLine?.amount ?? 0,
    isLiquorOrTobacco,
    runtimeSettings
  );

  const systemLineItems: Array<{ description: string; amount: number; isSystemGenerated: boolean }> = [];
  if (!isClosure && liquorTobaccoSurcharge > 0) {
    systemLineItems.push({
      description: LIQUOR_TOBACCO_SURCHARGE_LABEL,
      amount: liquorTobaccoSurcharge,
      isSystemGenerated: true,
    });
  }
  if (applicationType === "RENEWAL" && overdueMonths > 12) {
    systemLineItems.push({
      description: RENEWAL_SURCHARGE_LABEL,
      amount: automaticRenewal.surcharge,
      isSystemGenerated: true,
    });
    systemLineItems.push({
      description: RENEWAL_INTEREST_LABEL,
      amount: automaticRenewal.interest,
      isSystemGenerated: true,
    });
  }
  if (isClosure) {
    systemLineItems.push({
      description: CLOSURE_CERTIFICATE_FEE_LABEL,
      amount: 100,
      isSystemGenerated: true,
    });
  }

  const allLineItems = [
    ...customLineItems.map((item) => ({ ...item, isSystemGenerated: false })),
    ...systemLineItems,
  ].filter((item) => item.amount > 0);

  const totalCustom = customLineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalSystem = systemLineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = roundMoney(totalCustom + totalSystem + closurePaymentDues);

  const knownCustomAmount = [mayorLine?.amount ?? 0, regulatoryLine?.amount ?? 0].reduce((sum, item) => sum + item, 0);
  const uncategorizedCustomAmount = roundMoney(totalCustom - knownCustomAmount);

  return {
    lineItems: allLineItems,
    mayorsPermitFee: isClosure ? 0 : mayorLine?.amount ?? 0,
    regulatoryFees: isClosure ? 0 : regulatoryLine?.amount ?? 0,
    additionalCharges: 0,
    penalties: 0,
    surcharge: roundMoney(automaticRenewal.surcharge + liquorTobaccoSurcharge),
    interest: automaticRenewal.interest,
    closurePaymentDues,
    closureCertificateFee: isClosure ? 100 : 0,
    arrears: 0,
    otherCharges: uncategorizedCustomAmount,
    totalAmount,
  };
}

function sanitizeAssessmentInput(input: AssessmentInput): AssessmentInput {
  return {
    lineItems: input.lineItems ?? [],
    closurePaymentDues: clampMoney(input.closurePaymentDues),
    remarks: input.remarks?.trim() ?? undefined,
  };
}

function ensureTopHasPayableItems(applicationType: "NEW" | "RENEWAL" | "CLOSURE", totals: ReturnType<typeof buildAssessmentTotals>) {
  if (totals.totalAmount > 0) {
    return;
  }

  if (applicationType === "CLOSURE") {
    throw new Error("Closure assessment must include at least the fixed closure certificate fee or payment dues.");
  }

  throw new Error("Assessment must include at least one fee item before generating the Tax Order of Payment.");
}

async function getAssessmentApplication(applicationId: string, dbClient: any = prisma) {
  return dbClient.businessApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      businessRecord: {
        include: {
          applications: {
            where: { status: "RELEASED" },
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: {
              permitIssuance: {
                select: { releasedAt: true },
              },
            },
          },
        },
      },
      feeAssessment: {
        include: {
          lineItems: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
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

export async function getApplicationForAssessment(applicationId: string): Promise<AssessmentDetail | null> {
  const row = await getAssessmentApplication(applicationId);
  if (!row || row.status !== "ASSESSED") {
    return null;
  }

  const lineOfBusiness = resolveField(row.formData, "lineOfBusiness");
  const assetSize = resolveField(row.formData, "assetSize");
  const totalEmployees = resolveField(row.formData, "totalEmployees");
  const businessActivity = resolveField(row.formData, "businessActivity");
  const businessType = resolveField(row.formData, "businessType");
  const businessName = resolveBusinessName(row.formData, row.businessRecord?.businessName ?? null);
  const overdueMonths = resolveOverdueMonths(row);
  const runtimeSettings = await getRuntimeFeeSettings();
  const isLiquorOrTobacco = resolveLiquorOrTobacco(row.formData);

  const computed = computeMayorsPermitFee(
    {
      applicationType: row.applicationType as "NEW" | "RENEWAL" | "CLOSURE",
      lineOfBusiness: lineOfBusiness !== "-" ? lineOfBusiness : null,
      assetSize: assetSize !== "-" ? assetSize : null,
      totalEmployees: totalEmployees !== "-" ? totalEmployees : null,
    },
    runtimeSettings
  );

  const automaticRenewal = buildAutomaticRenewalCharges(
    computed.selectedMayorPermitFee,
    overdueMonths,
    runtimeSettings
  );
  const automaticLiquorTobaccoSurcharge = buildAutomaticLiquorTobaccoSurcharge(
    row.applicationType,
    computed.mayorsPermitFee,
    isLiquorOrTobacco,
    runtimeSettings
  );

  const suggestedFees = {
    mayorsPermitFee: computed.mayorsPermitFee,
    regulatoryFees: computed.regulatoryFees,
    surcharge: automaticRenewal.surcharge,
    liquorTobaccoSurcharge: automaticLiquorTobaccoSurcharge,
    interest: automaticRenewal.interest,
    closureCertificateFee: row.applicationType === "CLOSURE" ? 100 : computed.closureCertificateFee,
    computation: computed.computation,
    category: computed.category,
    sizeClassification: computed.sizeClassification,
    detectedCategory: computed.detectedCategory,
    assetClassification: computed.assetClassification,
    workerClassification: computed.workerClassification,
    selectedClassification: computed.selectedClassification,
    assetBasedFee: computed.assetBasedFee,
    workerBasedFee: computed.workerBasedFee,
    selectedMayorPermitFee: computed.selectedMayorPermitFee,
    specialRuleApplied:
      automaticLiquorTobaccoSurcharge > 0
        ? `${computed.specialRuleApplied ? `${computed.specialRuleApplied} | ` : ""}Liquor/Tobacco surcharge applies at assessment based on Mayor's Permit Fee`
        : overdueMonths > 12
          ? `Late renewal beyond 1 year (${overdueMonths} months overdue)`
          : computed.specialRuleApplied,
    overdueMonths,
  };

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
    applicantPaymentFrequency: resolveApplicantPaymentFrequency(row.formData),
    suggestedFees,
    suggestedLineItems: buildSuggestedLineItems(row.applicationType, suggestedFees),
    assessment: row.feeAssessment ? toSavedAssessment(row.feeAssessment) : null,
  };
}

async function persistAssessment(
  applicationId: string,
  bploUserId: string,
  input: AssessmentInput,
  mode: "DRAFT" | "GENERATED"
): Promise<SavedAssessment> {
  const sanitized = sanitizeAssessmentInput(input);

  return prisma.$transaction(async (tx: any) => {
    const application = await getAssessmentApplication(applicationId, tx);
    if (!application) {
      throw new Error("Application not found");
    }

    if (application.status !== "ASSESSED") {
      throw new Error(
        mode === "GENERATED"
          ? `Tax Order of Payment can only be generated for ASSESSED applications. Current status: ${application.status}`
          : "Assessment can only be saved for ASSESSED applications"
      );
    }

    const existing = application.feeAssessment
      ? {
          id: application.feeAssessment.id,
          assessmentNumber: application.feeAssessment.assessmentNumber,
          status: application.feeAssessment.status,
        }
      : null;

    if (existing?.status === "GENERATED" && mode === "DRAFT") {
      throw new Error("Tax Order of Payment has already been generated. Cannot revert to draft.");
    }

    const runtimeSettings = await getRuntimeFeeSettings();
    const applicantPaymentFrequency = resolveApplicantPaymentFrequency(application.formData);
    if (!applicantPaymentFrequency) {
      throw new Error("Payment frequency must be selected by the applicant before assessment finalization.");
    }

    validateCustomLineItems(sanitized.lineItems);
    const customLineItems = sanitizeCustomLineItems(sanitized.lineItems);
    const overdueMonths = resolveOverdueMonths(application);
    const isLiquorOrTobacco = resolveLiquorOrTobacco(application.formData);
    const totals = buildAssessmentTotals(
      application.applicationType,
      customLineItems,
      isLiquorOrTobacco,
      clampMoney(sanitized.closurePaymentDues),
      overdueMonths,
      runtimeSettings
    );

    if (mode === "GENERATED") {
      ensureTopHasPayableItems(application.applicationType, totals);
    }

    const annualAssessedAmount = totals.totalAmount;
    const releasePaymentAmount = toReleasePaymentAmount(annualAssessedAmount, applicantPaymentFrequency);
    const assessmentNumber = existing?.assessmentNumber ?? (await generateAssessmentNumber(tx));
    const now = new Date();

    const saved = await tx.feeAssessment.upsert({
      where: { applicationId },
      create: {
        applicationId,
        assessmentNumber,
        status: mode,
        paymentFrequency: applicantPaymentFrequency,
        annualAssessedAmount,
        releasePaymentAmount,
        amountPaid: 0,
        remainingBalance: annualAssessedAmount,
        paymentStatus: "UNPAID",
        mayorsPermitFee: totals.mayorsPermitFee,
        regulatoryFees: totals.regulatoryFees,
        additionalCharges: totals.additionalCharges,
        penalties: totals.penalties,
        surcharge: totals.surcharge,
        interest: totals.interest,
        closurePaymentDues: totals.closurePaymentDues,
        closureCertificateFee: totals.closureCertificateFee,
        arrears: totals.arrears,
        otherCharges: totals.otherCharges,
        totalAmount: totals.totalAmount,
        remarks: sanitized.remarks ?? null,
        computedById: bploUserId,
        generatedAt: mode === "GENERATED" ? now : null,
      },
      update: {
        status: mode,
        paymentFrequency: applicantPaymentFrequency,
        annualAssessedAmount,
        releasePaymentAmount,
        amountPaid: 0,
        remainingBalance: annualAssessedAmount,
        paymentStatus: "UNPAID",
        mayorsPermitFee: totals.mayorsPermitFee,
        regulatoryFees: totals.regulatoryFees,
        additionalCharges: totals.additionalCharges,
        penalties: totals.penalties,
        surcharge: totals.surcharge,
        interest: totals.interest,
        closurePaymentDues: totals.closurePaymentDues,
        closureCertificateFee: totals.closureCertificateFee,
        arrears: totals.arrears,
        otherCharges: totals.otherCharges,
        totalAmount: totals.totalAmount,
        remarks: sanitized.remarks ?? null,
        computedById: bploUserId,
        generatedAt: mode === "GENERATED" ? now : null,
      },
    });

    await tx.feeAssessmentLineItem.deleteMany({
      where: { feeAssessmentId: saved.id },
    });

    if (totals.lineItems.length > 0) {
      await tx.feeAssessmentLineItem.createMany({
        data: totals.lineItems.map((item, index) => ({
          feeAssessmentId: saved.id,
          description: item.description,
          amount: item.amount,
          sortOrder: index,
          isSystemGenerated: item.isSystemGenerated,
        })),
      });
    }

    if (mode === "GENERATED") {
      assertStatusTransition(application.status, "APPROVED_FOR_PAYMENT");
      await tx.businessApplication.update({
        where: { id: applicationId },
        data: { status: "APPROVED_FOR_PAYMENT" },
      });
    }

    await tx.applicationHistory.create({
      data: {
        applicationId,
        actorId: bploUserId,
        actorRole: "BPLO",
        fromStatus: application.status,
        toStatus: mode === "GENERATED" ? "APPROVED_FOR_PAYMENT" : application.status,
        remarks:
          mode === "GENERATED"
            ? `Tax Order of Payment generated. TOP No.: ${assessmentNumber}, Total Amount Due: ₱${totals.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
            : `Assessment draft saved. Assessment No.: ${assessmentNumber}, Total: ₱${totals.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      },
    });

    const savedWithLineItems = await tx.feeAssessment.findUniqueOrThrow({
      where: { id: saved.id },
      include: {
        lineItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return toSavedAssessment(savedWithLineItems);
  });
}

export async function saveAssessmentDraft(
  applicationId: string,
  bploUserId: string,
  input: AssessmentInput
): Promise<SavedAssessment> {
  return persistAssessment(applicationId, bploUserId, input, "DRAFT");
}

export async function generateTop(
  applicationId: string,
  bploUserId: string,
  input: AssessmentInput
): Promise<SavedAssessment> {
  return persistAssessment(applicationId, bploUserId, input, "GENERATED");
}
