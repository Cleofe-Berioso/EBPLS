import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDirPath = path.dirname(scriptFilePath);
const ROOT = path.resolve(scriptDirPath, "..");

let prisma!: PrismaClient;

const PASSWORD = "password123";
const PROOF_FILE_PATH = path.resolve(scriptDirPath, "smoke-test-proof.txt");

type Role = "APPLICANT" | "BPLO" | "SUPER_ADMIN" | "DEPARTMENT_HEAD" | "JIT";
type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";
type ApplicationStatus =
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
type PaymentReferenceStatus = "PENDING" | "VERIFIED" | "REJECTED";
type PaymentSettlementStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";
type PermitIssuanceStatus = "FOR_RELEASE" | "RELEASED";
type BusinessLocationStatus = "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";

interface SmokeUserInput {
  email: string;
  name: string;
  role: Role;
  isActive?: boolean;
}

interface SmokeBusinessRecordInput {
  applicantId: string;
  registrationNumber: string;
  tin: string;
  businessType: string;
  businessName: string;
  tradeName: string;
  ownerName: string;
  nationality: string;
  email: string;
  phone: string;
  mainOfficeAddress: string;
  businessAddress: string;
  lineOfBusiness: string;
  businessActivity: string;
  assetSize: string;
  totalEmployees: string;
}

interface SmokeApplicationInput {
  applicantId: string;
  applicationNumber: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  businessRecordId?: string;
  formData: Prisma.InputJsonValue;
  submittedAt: Date;
}

interface SmokeAssessmentInput {
  applicationId: string;
  assessmentNumber: string;
  paymentFrequency: PaymentFrequency;
  annualAssessedAmount: number;
  amountPaid: number;
  status?: "DRAFT" | "GENERATED";
  computedById: string;
  remarks: string;
}

interface SmokePaymentReferenceInput {
  applicationId: string;
  transactionNumber: string;
  amountPaid: number;
  paymentDate: Date;
  status: PaymentReferenceStatus;
  proofFileName: string;
  proofStoragePath: string;
  proofMimeType: string;
  proofSizeBytes: number;
  submittedAt: Date;
  reviewerRemarks?: string | null;
  reviewedAt?: Date | null;
  reviewedById?: string | null;
}

interface SmokePermitInput {
  applicationId: string;
  documentNumber: string;
  documentType: "BUSINESS_PERMIT" | "CLOSURE_CERTIFICATE";
  status: PermitIssuanceStatus;
  issuedAt: Date;
  preparedById: string;
  releasedAt?: Date | null;
  releasedById?: string | null;
  remarks?: string | null;
}

interface SmokeLocationInput {
  businessRecordId: string;
  latitude: number;
  longitude: number;
  address: string;
  barangay: string;
  status: BusinessLocationStatus;
  submittedById: string;
  verifiedById?: string | null;
  remarks?: string | null;
}

function money(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function toReleasePaymentAmount(annual: number, frequency: PaymentFrequency): number {
  if (frequency === "BI_ANNUAL") return annual / 2;
  if (frequency === "QUARTERLY") return annual / 4;
  return annual;
}

function toSettlementStatus(amountPaid: number, annualAssessedAmount: number): PaymentSettlementStatus {
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid >= annualAssessedAmount) return "PAID";
  return "PARTIALLY_PAID";
}

function buildFormData(record: {
  registrationNumber: string;
  tin: string;
  businessType: string;
  businessName: string;
  tradeName: string;
  ownerName: string;
  nationality: string;
  email: string;
  phone: string;
  mainOfficeAddress: string;
  businessAddress: string;
  lineOfBusiness: string;
  businessActivity: string;
  assetSize: string;
  totalEmployees: string;
}): Prisma.InputJsonValue {
  return {
    registrationNumber: record.registrationNumber,
    tin: record.tin,
    businessType: record.businessType,
    businessName: record.businessName,
    tradeName: record.tradeName,
    ownerName: record.ownerName,
    nationality: record.nationality,
    email: record.email,
    contactNumber: record.phone,
    mainOfficeAddress: record.mainOfficeAddress,
    businessAddress: record.businessAddress,
    lineOfBusiness: record.lineOfBusiness,
    businessActivity: record.businessActivity,
    assetSize: record.assetSize,
    totalEmployees: record.totalEmployees,
  } satisfies Record<string, string>;
}

async function ensureUser(input: SmokeUserInput) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const isActive = input.isActive ?? true;
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      passwordHash,
      isActive,
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
      isActive,
    },
  });
}

async function ensureBusinessRecord(input: SmokeBusinessRecordInput) {
  const tin = BigInt(String(input.tin).replace(/\D/g, ""));
  const assetSize = input.assetSize ? String(input.assetSize).replace(/[,\s]/g, "") : null;
  const totalEmployees = input.totalEmployees
    ? Number.parseInt(String(input.totalEmployees).replace(/[,\s]/g, ""), 10)
    : null;

  const numericFields = {
    businessArea: 100,
    totalFloorArea: 120,
    maleEmployees: 2,
    femaleEmployees: 2,
    employeesWithinMunicipality: 3,
    deliveryVehicles: 1,
    assetSize,
    totalEmployees: Number.isFinite(totalEmployees) ? totalEmployees : null,
  };

  return prisma.businessRecord.upsert({
    where: { registrationNumber: input.registrationNumber },
    update: {
      applicantId: input.applicantId,
      businessType: input.businessType,
      tin,
      businessName: input.businessName,
      tradeName: input.tradeName,
      ownerName: input.ownerName,
      nationality: input.nationality,
      email: input.email,
      phone: input.phone,
      mainOfficeAddress: input.mainOfficeAddress,
      businessAddress: input.businessAddress,
      sameAsMainOffice: input.mainOfficeAddress === input.businessAddress,
      businessActivity: input.businessActivity,
      lineOfBusiness: input.lineOfBusiness,
      ...numericFields,
      propertyOwnership: "Owned",
      taxDeclarationNumber: `TD-${input.registrationNumber}`,
      propertyIdentificationNumber: `PIN-${input.registrationNumber}`,
      taxIncentives: "None",
    },
    create: {
      applicantId: input.applicantId,
      registrationNumber: input.registrationNumber,
      businessType: input.businessType,
      tin,
      businessName: input.businessName,
      tradeName: input.tradeName,
      ownerName: input.ownerName,
      nationality: input.nationality,
      email: input.email,
      phone: input.phone,
      mainOfficeAddress: input.mainOfficeAddress,
      businessAddress: input.businessAddress,
      sameAsMainOffice: input.mainOfficeAddress === input.businessAddress,
      businessActivity: input.businessActivity,
      lineOfBusiness: input.lineOfBusiness,
      ...numericFields,
      propertyOwnership: "Owned",
      taxDeclarationNumber: `TD-${input.registrationNumber}`,
      propertyIdentificationNumber: `PIN-${input.registrationNumber}`,
      taxIncentives: "None",
    },
  });
}

async function ensureApplication(input: SmokeApplicationInput) {
  return prisma.businessApplication.upsert({
    where: { applicationNumber: input.applicationNumber },
    update: {
      applicantId: input.applicantId,
      businessRecordId: input.businessRecordId ?? null,
      applicationType: input.applicationType,
      status: input.status,
      formData: input.formData,
      submittedAt: input.submittedAt,
    },
    create: {
      applicationNumber: input.applicationNumber,
      applicantId: input.applicantId,
      businessRecordId: input.businessRecordId ?? null,
      applicationType: input.applicationType,
      status: input.status,
      formData: input.formData,
      submittedAt: input.submittedAt,
    },
  });
}

async function ensureAssessment(input: SmokeAssessmentInput) {
  const releasePaymentAmount = toReleasePaymentAmount(
    input.annualAssessedAmount,
    input.paymentFrequency
  );
  const remainingBalance = Math.max(0, input.annualAssessedAmount - input.amountPaid);

  return prisma.feeAssessment.upsert({
    where: { applicationId: input.applicationId },
    update: {
      assessmentNumber: input.assessmentNumber,
      status: input.status ?? "GENERATED",
      paymentFrequency: input.paymentFrequency,
      annualAssessedAmount: money(input.annualAssessedAmount),
      releasePaymentAmount: money(releasePaymentAmount),
      amountPaid: money(input.amountPaid),
      remainingBalance: money(remainingBalance),
      paymentStatus: toSettlementStatus(input.amountPaid, input.annualAssessedAmount),
      mayorsPermitFee: money(input.annualAssessedAmount),
      regulatoryFees: money(0),
      additionalCharges: money(0),
      penalties: money(0),
      surcharge: money(0),
      interest: money(0),
      closureCertificateFee: money(0),
      arrears: money(0),
      otherCharges: money(0),
      totalAmount: money(input.annualAssessedAmount),
      remarks: input.remarks,
      computedById: input.computedById,
      generatedAt: input.status === "DRAFT" ? null : new Date(),
    },
    create: {
      applicationId: input.applicationId,
      assessmentNumber: input.assessmentNumber,
      status: input.status ?? "GENERATED",
      paymentFrequency: input.paymentFrequency,
      annualAssessedAmount: money(input.annualAssessedAmount),
      releasePaymentAmount: money(releasePaymentAmount),
      amountPaid: money(input.amountPaid),
      remainingBalance: money(remainingBalance),
      paymentStatus: toSettlementStatus(input.amountPaid, input.annualAssessedAmount),
      mayorsPermitFee: money(input.annualAssessedAmount),
      regulatoryFees: money(0),
      additionalCharges: money(0),
      penalties: money(0),
      surcharge: money(0),
      interest: money(0),
      closureCertificateFee: money(0),
      arrears: money(0),
      otherCharges: money(0),
      totalAmount: money(input.annualAssessedAmount),
      remarks: input.remarks,
      computedById: input.computedById,
      generatedAt: input.status === "DRAFT" ? null : new Date(),
    },
  });
}

async function ensurePaymentReference(input: SmokePaymentReferenceInput) {
  return prisma.paymentReference.upsert({
    where: { transactionNumber: input.transactionNumber },
    update: {
      applicationId: input.applicationId,
      amountPaid: money(input.amountPaid),
      paymentDate: input.paymentDate,
      proofFileName: input.proofFileName,
      proofStoragePath: input.proofStoragePath,
      proofMimeType: input.proofMimeType,
      proofSizeBytes: input.proofSizeBytes,
      status: input.status,
      reviewerRemarks: input.reviewerRemarks ?? null,
      submittedAt: input.submittedAt,
      reviewedAt: input.reviewedAt ?? null,
      reviewedById: input.reviewedById ?? null,
    },
    create: {
      applicationId: input.applicationId,
      transactionNumber: input.transactionNumber,
      amountPaid: money(input.amountPaid),
      paymentDate: input.paymentDate,
      proofFileName: input.proofFileName,
      proofStoragePath: input.proofStoragePath,
      proofMimeType: input.proofMimeType,
      proofSizeBytes: input.proofSizeBytes,
      status: input.status,
      reviewerRemarks: input.reviewerRemarks ?? null,
      submittedAt: input.submittedAt,
      reviewedAt: input.reviewedAt ?? null,
      reviewedById: input.reviewedById ?? null,
    },
  });
}

async function ensurePermitIssuance(input: SmokePermitInput) {
  return prisma.permitIssuance.upsert({
    where: { applicationId: input.applicationId },
    update: {
      documentNumber: input.documentNumber,
      documentType: input.documentType,
      status: input.status,
      issuedAt: input.issuedAt,
      releasedAt: input.releasedAt ?? null,
      preparedById: input.preparedById,
      releasedById: input.releasedById ?? null,
      remarks: input.remarks ?? null,
    },
    create: {
      applicationId: input.applicationId,
      documentNumber: input.documentNumber,
      documentType: input.documentType,
      status: input.status,
      issuedAt: input.issuedAt,
      releasedAt: input.releasedAt ?? null,
      preparedById: input.preparedById,
      releasedById: input.releasedById ?? null,
      remarks: input.remarks ?? null,
    },
  });
}

async function ensureBusinessLocation(input: SmokeLocationInput) {
  return prisma.businessLocation.upsert({
    where: { businessRecordId: input.businessRecordId },
    update: {
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      barangay: input.barangay,
      status: input.status,
      submittedById: input.submittedById,
      verifiedById: input.verifiedById ?? null,
      remarks: input.remarks ?? null,
    },
    create: {
      businessRecordId: input.businessRecordId,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      barangay: input.barangay,
      status: input.status,
      submittedById: input.submittedById,
      verifiedById: input.verifiedById ?? null,
      remarks: input.remarks ?? null,
    },
  });
}

/** Undo revocation/manual QA drift on released smoke rows (status, business record, inspections). */
async function resetReleasedSmokeRecord(applicationId: string, businessRecordId: string) {
  await prisma.businessApplication.update({
    where: { id: applicationId },
    data: { status: "RELEASED" },
  });

  await prisma.businessRecord.update({
    where: { id: businessRecordId },
    data: {
      businessStatus: "ACTIVE",
      closedAt: null,
      closureApplicationId: null,
    },
  });

  await prisma.inspection.updateMany({
    where: { applicationId, status: "REVOKED" },
    data: {
      status: "VERIFIED_COMPLIANT",
      complianceStatus: "COMPLIANT",
      revocationDecision: null,
      revocationRecommendationRemarks: null,
      revocationRemarks: null,
      decidedById: null,
      decidedAt: null,
      revocationSettledAt: null,
      revocationSettlementRemarks: null,
      revocationSettledById: null,
    },
  });

  await prisma.permitIssuance.updateMany({
    where: { applicationId },
    data: { status: "RELEASED" },
  });
}

async function ensureHistory(
  applicationId: string,
  actorId: string,
  actorRole: Role,
  fromStatus: ApplicationStatus | null,
  toStatus: ApplicationStatus,
  createdAt: Date,
  remarks: string
) {
  const existing = await prisma.applicationHistory.findFirst({
    where: {
      applicationId,
      actorId,
      actorRole,
      fromStatus,
      toStatus,
      remarks,
    },
    select: { id: true },
  });

  if (existing) return existing;

  return prisma.applicationHistory.create({
    data: {
      applicationId,
      actorId,
      actorRole,
      fromStatus,
      toStatus,
      remarks,
      createdAt,
    },
  });
}

async function main() {
  try {
    loadEnvFile(path.join(ROOT, ".env"));
  } catch {
    // Optional when DATABASE_URL is already in the environment
  }
  prisma = (await import("../src/lib/prisma")).prisma;

  console.log("[seed-smoke-test-data] start");
  console.log("[seed-smoke-test-data] no reset/delete operations will be performed");

  const applicant = await ensureUser({
    email: "applicant@example.com",
    name: "Juan dela Cruz",
    role: "APPLICANT",
  });
  const duplicateApplicant = await ensureUser({
    email: "smoke.duplicate@example.com",
    name: "Liza Duplicate",
    role: "APPLICANT",
  });
  const bplo = await ensureUser({
    email: "bplo@example.com",
    name: "BPLO Officer",
    role: "BPLO",
  });
  const superadmin = await ensureUser({
    email: "superadmin@example.com",
    name: "IT Administrator",
    role: "SUPER_ADMIN",
  });
  await ensureUser({
    email: "dept-head@example.com",
    name: "Department Head Officer",
    role: "DEPARTMENT_HEAD",
  });
  await ensureUser({
    email: "jit@example.com",
    name: "JIT Inspector",
    role: "JIT",
  });
  await ensureUser({
    email: "jit-disabled@example.com",
    name: "Disabled JIT Inspector",
    role: "JIT",
    isActive: false,
  });

  const retailRecord = await ensureBusinessRecord({
    applicantId: applicant.id,
    registrationNumber: "SMOKE-REG-RETAIL-001",
    tin: "900-000-001-001",
    businessType: "Sole Proprietorship",
    businessName: "Smoke Retail Hub",
    tradeName: "Retail Hub",
    ownerName: "Maria Santos",
    nationality: "Filipino",
    email: "applicant@example.com",
    phone: "09171230001",
    mainOfficeAddress: "Poblacion East, E.B. Magalona, Negros Occidental",
    businessAddress: "Poblacion East, E.B. Magalona, Negros Occidental",
    lineOfBusiness: "Retail grocery store",
    businessActivity: "Retail trading",
    assetSize: "500000",
    totalEmployees: "4",
  });

  const foodRecord = await ensureBusinessRecord({
    applicantId: applicant.id,
    registrationNumber: "SMOKE-REG-FOOD-001",
    tin: "900-000-001-002",
    businessType: "Sole Proprietorship",
    businessName: "Smoke Food Corner",
    tradeName: "Food Corner",
    ownerName: "Pedro Reyes",
    nationality: "Filipino",
    email: "applicant@example.com",
    phone: "09171230002",
    mainOfficeAddress: "San Jose, E.B. Magalona, Negros Occidental",
    businessAddress: "San Jose, E.B. Magalona, Negros Occidental",
    lineOfBusiness: "Restaurant and food service",
    businessActivity: "Food preparation",
    assetSize: "650000",
    totalEmployees: "6",
  });

  const paidRecord = await ensureBusinessRecord({
    applicantId: applicant.id,
    registrationNumber: "SMOKE-REG-PAID-001",
    tin: "900-000-001-003",
    businessType: "Sole Proprietorship",
    businessName: "Smoke Permit Ready Trading",
    tradeName: "Permit Ready Trading",
    ownerName: "Juan dela Cruz",
    nationality: "Filipino",
    email: "applicant@example.com",
    phone: "09171230003",
    mainOfficeAddress: "Poblacion West, E.B. Magalona, Negros Occidental",
    businessAddress: "Poblacion West, E.B. Magalona, Negros Occidental",
    lineOfBusiness: "General merchandise retail",
    businessActivity: "Retail trading",
    assetSize: "450000",
    totalEmployees: "3",
  });

  const assessedRecord = await ensureBusinessRecord({
    applicantId: applicant.id,
    registrationNumber: "SMOKE-REG-ASSESSED-001",
    tin: "900-000-001-004",
    businessType: "Sole Proprietorship",
    businessName: "Smoke Assessed Services",
    tradeName: "Assessed Services",
    ownerName: "Ana Gomez",
    nationality: "Filipino",
    email: "applicant@example.com",
    phone: "09171230004",
    mainOfficeAddress: "Gahit, E.B. Magalona, Negros Occidental",
    businessAddress: "Gahit, E.B. Magalona, Negros Occidental",
    lineOfBusiness: "Repair service shop",
    businessActivity: "Repair services",
    assetSize: "300000",
    totalEmployees: "2",
  });

  const blockedPermitRecord = await ensureBusinessRecord({
    applicantId: applicant.id,
    registrationNumber: "SMOKE-REG-PERMIT-BLOCK-001",
    tin: "900-000-001-006",
    businessType: "Sole Proprietorship",
    businessName: "Smoke Permit Blocked Shop",
    tradeName: "Permit Blocked Shop",
    ownerName: "Carla Ramos",
    nationality: "Filipino",
    email: "applicant@example.com",
    phone: "09171230006",
    mainOfficeAddress: "Manta-angan, E.B. Magalona, Negros Occidental",
    businessAddress: "Manta-angan, E.B. Magalona, Negros Occidental",
    lineOfBusiness: "Retail convenience store",
    businessActivity: "Retail trading",
    assetSize: "280000",
    totalEmployees: "2",
  });

  const duplicateRecord = await ensureBusinessRecord({
    applicantId: duplicateApplicant.id,
    registrationNumber: "SMOKE-REG-DUP-001",
    tin: "900-000-001-005",
    businessType: "Sole Proprietorship",
    businessName: "Smoke Duplicate Test Shop",
    tradeName: "Duplicate Test Shop",
    ownerName: "Liza Duplicate",
    nationality: "Filipino",
    email: "smoke.duplicate@example.com",
    phone: "09171230005",
    mainOfficeAddress: "Tabigue, E.B. Magalona, Negros Occidental",
    businessAddress: "Tabigue, E.B. Magalona, Negros Occidental",
    lineOfBusiness: "Retail store",
    businessActivity: "Retail trading",
    assetSize: "350000",
    totalEmployees: "2",
  });

  const releasedRetail = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-RETAIL-RELEASED",
    applicationType: "NEW",
    status: "RELEASED",
    businessRecordId: retailRecord.id,
    formData: buildFormData(retailRecord),
    submittedAt: new Date("2026-01-12T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: releasedRetail.id,
    assessmentNumber: "TOP-SMOKE-RETAIL-REL",
    paymentFrequency: "ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 6000,
    computedById: bplo.id,
    remarks: "Smoke retail released record for map filter testing.",
  });
  await ensurePaymentReference({
    applicationId: releasedRetail.id,
    transactionNumber: "SMOKE-OR-RETAIL-6000",
    amountPaid: 6000,
    paymentDate: new Date("2026-01-18T10:00:00.000Z"),
    status: "VERIFIED",
    proofFileName: "smoke-test-proof.txt",
    proofStoragePath: PROOF_FILE_PATH,
    proofMimeType: "text/plain",
    proofSizeBytes: 156,
    submittedAt: new Date("2026-01-18T10:05:00.000Z"),
    reviewerRemarks: "Smoke verified retail payment.",
    reviewedAt: new Date("2026-01-18T10:20:00.000Z"),
    reviewedById: bplo.id,
  });
  await ensurePermitIssuance({
    applicationId: releasedRetail.id,
    documentNumber: "BP-SMOKE-RETAIL-001",
    documentType: "BUSINESS_PERMIT",
    status: "RELEASED",
    issuedAt: new Date("2026-01-20T08:30:00.000Z"),
    preparedById: bplo.id,
    releasedAt: new Date("2026-01-20T09:00:00.000Z"),
    releasedById: bplo.id,
    remarks: "Smoke released retail permit for map testing.",
  });
  await ensureBusinessLocation({
    businessRecordId: retailRecord.id,
    latitude: 10.879421,
    longitude: 122.981332,
    address: "Poblacion East, E.B. Magalona, Negros Occidental",
    barangay: "Poblacion East",
    status: "VERIFIED",
    submittedById: applicant.id,
    verifiedById: bplo.id,
    remarks: "Smoke verified retail location.",
  });
  await resetReleasedSmokeRecord(releasedRetail.id, retailRecord.id);

  const releasedFood = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-FOOD-RELEASED",
    applicationType: "NEW",
    status: "RELEASED",
    businessRecordId: foodRecord.id,
    formData: buildFormData(foodRecord),
    submittedAt: new Date("2026-01-13T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: releasedFood.id,
    assessmentNumber: "TOP-SMOKE-FOOD-REL",
    paymentFrequency: "ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 6000,
    computedById: bplo.id,
    remarks: "Smoke food released record for map filter testing.",
  });
  await ensurePaymentReference({
    applicationId: releasedFood.id,
    transactionNumber: "SMOKE-OR-FOOD-6000",
    amountPaid: 6000,
    paymentDate: new Date("2026-01-19T11:00:00.000Z"),
    status: "VERIFIED",
    proofFileName: "smoke-test-proof.txt",
    proofStoragePath: PROOF_FILE_PATH,
    proofMimeType: "text/plain",
    proofSizeBytes: 156,
    submittedAt: new Date("2026-01-19T11:05:00.000Z"),
    reviewerRemarks: "Smoke verified food payment.",
    reviewedAt: new Date("2026-01-19T11:20:00.000Z"),
    reviewedById: bplo.id,
  });
  await ensurePermitIssuance({
    applicationId: releasedFood.id,
    documentNumber: "BP-SMOKE-FOOD-001",
    documentType: "BUSINESS_PERMIT",
    status: "RELEASED",
    issuedAt: new Date("2026-01-21T08:30:00.000Z"),
    preparedById: bplo.id,
    releasedAt: new Date("2026-01-21T09:00:00.000Z"),
    releasedById: bplo.id,
    remarks: "Smoke released food permit for map testing.",
  });
  await ensureBusinessLocation({
    businessRecordId: foodRecord.id,
    latitude: 10.884112,
    longitude: 122.986741,
    address: "San Jose, E.B. Magalona, Negros Occidental",
    barangay: "San Jose",
    status: "VERIFIED",
    submittedById: applicant.id,
    verifiedById: bplo.id,
    remarks: "Smoke verified food location.",
  });
  await resetReleasedSmokeRecord(releasedFood.id, foodRecord.id);

  const annualPaid = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-NEW-ANNUAL-PAID",
    applicationType: "NEW",
    status: "PAID",
    businessRecordId: paidRecord.id,
    formData: buildFormData(paidRecord),
    submittedAt: new Date("2026-02-10T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: annualPaid.id,
    assessmentNumber: "TOP-SMOKE-ANNUAL-PAID",
    paymentFrequency: "ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 6000,
    computedById: bplo.id,
    remarks: "Annual release amount smoke record for permit preparation.",
  });
  await ensurePaymentReference({
    applicationId: annualPaid.id,
    transactionNumber: "SMOKE-OR-ANNUAL-6000",
    amountPaid: 6000,
    paymentDate: new Date("2026-02-14T10:00:00.000Z"),
    status: "VERIFIED",
    proofFileName: "smoke-test-proof.txt",
    proofStoragePath: PROOF_FILE_PATH,
    proofMimeType: "text/plain",
    proofSizeBytes: 156,
    submittedAt: new Date("2026-02-14T10:05:00.000Z"),
    reviewerRemarks: "Verified for permit gating smoke test.",
    reviewedAt: new Date("2026-02-14T10:30:00.000Z"),
    reviewedById: bplo.id,
  });

  const assessedApp = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-NEW-ASSESSED",
    applicationType: "NEW",
    status: "ASSESSED",
    businessRecordId: assessedRecord.id,
    formData: buildFormData(assessedRecord),
    submittedAt: new Date("2026-03-01T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: assessedApp.id,
    assessmentNumber: "TOP-SMOKE-ASSESSED-001",
    paymentFrequency: "ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 0,
    computedById: bplo.id,
    remarks: "Assessed-only record for Assessment & Fees page.",
  });

  const renewalApproved = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-RENEWAL-BI-APPROVED",
    applicationType: "RENEWAL",
    status: "APPROVED_FOR_PAYMENT",
    businessRecordId: retailRecord.id,
    formData: buildFormData(retailRecord),
    submittedAt: new Date("2026-03-10T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: renewalApproved.id,
    assessmentNumber: "TOP-SMOKE-BI-APPROVED",
    paymentFrequency: "BI_ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 0,
    computedById: bplo.id,
    remarks: "Bi-annual release amount smoke record with pending payment verification.",
  });
  await ensurePaymentReference({
    applicationId: renewalApproved.id,
    transactionNumber: "SMOKE-OR-RENEWAL-BI-3000",
    amountPaid: 3000,
    paymentDate: new Date("2026-03-12T13:00:00.000Z"),
    status: "PENDING",
    proofFileName: "smoke-test-proof.txt",
    proofStoragePath: PROOF_FILE_PATH,
    proofMimeType: "text/plain",
    proofSizeBytes: 156,
    submittedAt: new Date("2026-03-12T13:05:00.000Z"),
  });

  const closureApproved = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-CLOSURE-QTR-APPROVED",
    applicationType: "CLOSURE",
    status: "APPROVED_FOR_PAYMENT",
    businessRecordId: foodRecord.id,
    formData: buildFormData(foodRecord),
    submittedAt: new Date("2026-03-14T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: closureApproved.id,
    assessmentNumber: "TOP-SMOKE-QTR-APPROVED",
    paymentFrequency: "QUARTERLY",
    annualAssessedAmount: 6000,
    amountPaid: 0,
    computedById: bplo.id,
    remarks: "Quarterly release amount smoke record for applicant payment submission.",
  });

  const permitBlocked = await ensureApplication({
    applicantId: applicant.id,
    applicationNumber: "SMOKE-APP-PERMIT-BLOCKED-UNPAID",
    applicationType: "NEW",
    status: "APPROVED_FOR_PAYMENT",
    businessRecordId: blockedPermitRecord.id,
    formData: buildFormData(blockedPermitRecord),
    submittedAt: new Date("2026-03-15T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: permitBlocked.id,
    assessmentNumber: "TOP-SMOKE-PERMIT-BLOCKED",
    paymentFrequency: "ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 0,
    computedById: bplo.id,
    remarks: "Dedicated blocked permit smoke record that must remain unpaid and unverified.",
  });

  const duplicateApproved = await ensureApplication({
    applicantId: duplicateApplicant.id,
    applicationNumber: "SMOKE-APP-DUPLICATE-APPROVED",
    applicationType: "NEW",
    status: "APPROVED_FOR_PAYMENT",
    businessRecordId: duplicateRecord.id,
    formData: buildFormData(duplicateRecord),
    submittedAt: new Date("2026-03-16T09:00:00.000Z"),
  });
  await ensureAssessment({
    applicationId: duplicateApproved.id,
    assessmentNumber: "TOP-SMOKE-DUP-APPROVED",
    paymentFrequency: "ANNUAL",
    annualAssessedAmount: 6000,
    amountPaid: 0,
    computedById: bplo.id,
    remarks: "Secondary applicant record for duplicate OR browser testing.",
  });

  const applicantTransitions: Array<{
    applicationId: string;
    actorId: string;
    actorRole: Role;
    statuses: ApplicationStatus[];
  }> = [
    {
      applicationId: releasedRetail.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT", "PAID", "FOR_RELEASE", "RELEASED"],
    },
    {
      applicationId: releasedFood.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT", "PAID", "FOR_RELEASE", "RELEASED"],
    },
    {
      applicationId: annualPaid.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT", "PAID"],
    },
    {
      applicationId: assessedApp.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED"],
    },
    {
      applicationId: renewalApproved.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT"],
    },
    {
      applicationId: closureApproved.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT"],
    },
    {
      applicationId: permitBlocked.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT"],
    },
    {
      applicationId: duplicateApproved.id,
      actorId: bplo.id,
      actorRole: "BPLO",
      statuses: ["SUBMITTED", "UNDER_REVIEW", "ASSESSED", "APPROVED_FOR_PAYMENT"],
    },
  ];

  for (const transitionSet of applicantTransitions) {
    let fromStatus: ApplicationStatus | null = null;
    for (let index = 0; index < transitionSet.statuses.length; index += 1) {
      const toStatus = transitionSet.statuses[index];
      await ensureHistory(
        transitionSet.applicationId,
        transitionSet.actorId,
        transitionSet.actorRole,
        fromStatus,
        toStatus,
        new Date(Date.UTC(2026, 0, 10 + index, 9, index * 5)),
        `Smoke workflow transition to ${toStatus}.`
      );
      fromStatus = toStatus;
    }
  }

  await ensureHistory(
    renewalApproved.id,
    applicant.id,
    "APPLICANT",
    "APPROVED_FOR_PAYMENT",
    "APPROVED_FOR_PAYMENT",
    new Date("2026-03-12T13:05:00.000Z"),
    "Applicant submitted payment reference: SMOKE-OR-RENEWAL-BI-3000, Amount: ₱3,000.00"
  );

  const summary = [
    {
      label: "annual_paid_prepare_permit",
      applicationId: annualPaid.id,
      applicationNumber: annualPaid.applicationNumber,
      businessName: paidRecord.businessName,
      ownerName: paidRecord.ownerName,
      status: "PAID",
      frequency: "ANNUAL",
      releasePaymentAmount: 6000,
      paymentReference: "SMOKE-OR-ANNUAL-6000",
    },
    {
      label: "bi_annual_pending_verification",
      applicationId: renewalApproved.id,
      applicationNumber: renewalApproved.applicationNumber,
      businessName: retailRecord.businessName,
      ownerName: retailRecord.ownerName,
      status: "APPROVED_FOR_PAYMENT",
      frequency: "BI_ANNUAL",
      releasePaymentAmount: 3000,
      paymentReference: "SMOKE-OR-RENEWAL-BI-3000",
    },
    {
      label: "quarterly_applicant_payment",
      applicationId: closureApproved.id,
      applicationNumber: closureApproved.applicationNumber,
      businessName: foodRecord.businessName,
      ownerName: foodRecord.ownerName,
      status: "APPROVED_FOR_PAYMENT",
      frequency: "QUARTERLY",
      releasePaymentAmount: 1500,
      paymentReference: null,
    },
    {
      label: "permit_blocked_unpaid",
      applicationId: permitBlocked.id,
      applicationNumber: permitBlocked.applicationNumber,
      businessName: blockedPermitRecord.businessName,
      ownerName: blockedPermitRecord.ownerName,
      frequency: "ANNUAL",
      expectedReleaseAmount: 6000,
      paymentReference: null,
    },
    {
      label: "assessed_queue_record",
      applicationId: assessedApp.id,
      applicationNumber: assessedApp.applicationNumber,
      businessName: assessedRecord.businessName,
      ownerName: assessedRecord.ownerName,
      status: "ASSESSED",
      frequency: "ANNUAL",
      releasePaymentAmount: 6000,
      paymentReference: null,
    },
    {
      label: "released_map_retail",
      applicationId: releasedRetail.id,
      applicationNumber: releasedRetail.applicationNumber,
      businessName: retailRecord.businessName,
      ownerName: retailRecord.ownerName,
      status: "RELEASED",
      frequency: "ANNUAL",
      releasePaymentAmount: 6000,
      paymentReference: "SMOKE-OR-RETAIL-6000",
    },
    {
      label: "released_map_food",
      applicationId: releasedFood.id,
      applicationNumber: releasedFood.applicationNumber,
      businessName: foodRecord.businessName,
      ownerName: foodRecord.ownerName,
      status: "RELEASED",
      frequency: "ANNUAL",
      releasePaymentAmount: 6000,
      paymentReference: "SMOKE-OR-FOOD-6000",
    },
    {
      label: "duplicate_or_secondary_applicant",
      applicationId: duplicateApproved.id,
      applicationNumber: duplicateApproved.applicationNumber,
      businessName: duplicateRecord.businessName,
      ownerName: duplicateRecord.ownerName,
      status: "APPROVED_FOR_PAYMENT",
      frequency: "ANNUAL",
      releasePaymentAmount: 6000,
      paymentReference: null,
    },
  ];

  console.log("[seed-smoke-test-data] accounts", {
    applicant: { email: applicant.email, password: PASSWORD },
    duplicateApplicant: { email: duplicateApplicant.email, password: PASSWORD },
    bplo: { email: bplo.email, password: PASSWORD },
    superadmin: { email: superadmin.email, password: PASSWORD },
  });

  console.log("[seed-smoke-test-data] summary");
  console.table(summary);

  console.log("[seed-smoke-test-data] duplicate_or_reference", {
    existingReference: "SMOKE-OR-RENEWAL-BI-3000",
    sourceApplicationNumber: renewalApproved.applicationNumber,
    duplicateAttemptAccount: duplicateApplicant.email,
    duplicateAttemptApplicationNumber: duplicateApproved.applicationNumber,
  });

  console.log("[seed-smoke-test-data] permit_gating", {
    blockedUnverifiedApplication: renewalApproved.applicationNumber,
    blockedReason: "APPROVED_FOR_PAYMENT with pending payment reference; not eligible for permit issuance queue",
    verifiedPaidApplication: annualPaid.applicationNumber,
    verifiedPaidReference: "SMOKE-OR-ANNUAL-6000",
  });

  console.log("[seed-smoke-test-data] map_filters", {
    retailOwner: retailRecord.ownerName,
    retailCategoryHint: "RETAIL",
    foodOwner: foodRecord.ownerName,
    foodCategoryHint: "FOOD",
  });

  console.log("[seed-smoke-test-data] proof_file", PROOF_FILE_PATH);
  console.log("[seed-smoke-test-data] complete");
}

main()
  .catch((error) => {
    console.error("[seed-smoke-test-data] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });