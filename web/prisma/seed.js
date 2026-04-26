const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SYSTEM_SETTINGS = [
  { key: "system_name", value: "Online Business Permit System" },
  { key: "lgu_name", value: "Municipality of Enrique B. Magalona" },
  { key: "lgu_email", value: "permits@lgu.gov.ph" },
  { key: "office_hours", value: "Mon-Fri 8:00 AM – 5:00 PM" },
  { key: "session_timeout_minutes", value: "30" },
];

function atUtc(dateString) {
  return new Date(dateString);
}

function extensionFromMimeType(mimeType) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  throw new Error(`Unsupported MIME type for seed document: ${mimeType}`);
}

function storageDocumentPath(dateString, applicationId, fileId, extension) {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `documents/${year}/${month}/${applicationId}/${fileId}.${extension}`;
}

function buildDocumentSeed({
  applicationId,
  uploadedBy,
  originalName,
  mimeType = "application/pdf",
  fileSize,
  documentType,
  status,
  createdAt,
  verifiedBy,
  verifiedAt,
  rejectionReason,
}) {
  const extension = extensionFromMimeType(mimeType);
  const fileId = randomUUID();

  return {
    uploadedBy,
    fileName: `${fileId}.${extension}`,
    originalName,
    mimeType,
    fileSize,
    filePath: storageDocumentPath(createdAt, applicationId, fileId, extension),
    documentType,
    status,
    ...(verifiedBy ? { verifiedBy } : {}),
    ...(verifiedAt ? { verifiedAt: atUtc(verifiedAt) } : {}),
    ...(rejectionReason ? { rejectionReason } : {}),
  };
}

async function resetData() {
  await prisma.activityLog.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.permitIssuance.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.document.deleteMany();
  await prisma.reviewAction.deleteMany();
  await prisma.applicationHistory.deleteMany();
  await prisma.clearance.deleteMany();
  await prisma.businessLocation.deleteMany();
  await prisma.application.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("Resetting and seeding EBPLS for APPLICANT, BPLO_OFFICE, and ADMIN only...");

  await resetData();

  const password = await bcrypt.hash("Password123!", 12);

  const [admin, bploOfficer, juan, maria, ana] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@lgu.gov.ph",
        password,
        firstName: "System",
        lastName: "Admin",
        phone: "09170000002",
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "bplo@lgu.gov.ph",
        password,
        firstName: "Bianca",
        lastName: "Lopez",
        phone: "09170000001",
        role: "BPLO_OFFICE",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "juan@example.com",
        password,
        firstName: "Juan",
        lastName: "Dela Cruz",
        phone: "09171234567",
        role: "APPLICANT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "maria@example.com",
        password,
        firstName: "Maria",
        lastName: "Santos",
        phone: "09181234567",
        role: "APPLICANT",
        status: "ACTIVE",
        emailVerified: new Date(),
        renewalEligible: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "ana@example.com",
        password,
        firstName: "Ana",
        lastName: "Reyes",
        phone: "09192223344",
        role: "APPLICANT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    }),
  ]);

  await prisma.systemSetting.createMany({ data: SYSTEM_SETTINGS });

  const historicalPermitApplicationId = randomUUID();
  const historicalPermitApplication = await prisma.application.create({
    data: {
      id: historicalPermitApplicationId,
      applicationNumber: "APP-20250418-NEW001",
      type: "NEW",
      status: "COMPLETED",
      applicantId: maria.id,
      businessName: "Santos Trading",
      businessType: "SOLE_PROPRIETORSHIP",
      lineOfBusiness: "Retail",
      businessAddress: "Old Highway, Enrique B. Magalona, Negros Occidental",
      businessBarangay: "Tabigue",
      businessCity: "Enrique B. Magalona",
      businessProvince: "Negros Occidental",
      businessZipCode: "6118",
      businessPhone: maria.phone,
      businessEmail: maria.email,
      dtiSecRegistration: "DTI-2025-009",
      tinNumber: "987-654-321-000",
      businessArea: 42,
      numberOfEmployees: 4,
      capitalInvestment: 95000,
      grossSales: 380000,
      documentVerified: true,
      applicationApproved: true,
      paymentConfirmed: true,
      submittedAt: atUtc("2025-04-18T08:00:00Z"),
      reviewedAt: atUtc("2025-04-19T09:00:00Z"),
      approvedAt: atUtc("2025-04-20T10:00:00Z"),
      documents: {
        create: [
          buildDocumentSeed({
            applicationId: historicalPermitApplicationId,
            uploadedBy: maria.id,
            originalName: "DTI Registration 2025.pdf",
            fileSize: 2104,
            documentType: "PROOF_OF_REGISTRATION",
            status: "VERIFIED",
            createdAt: "2025-04-19T09:15:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2025-04-19T09:15:00Z",
          }),
          buildDocumentSeed({
            applicationId: historicalPermitApplicationId,
            uploadedBy: maria.id,
            originalName: "Barangay Clearance 2025.pdf",
            fileSize: 1840,
            documentType: "BARANGAY_CLEARANCE",
            status: "VERIFIED",
            createdAt: "2025-04-19T09:20:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2025-04-19T09:20:00Z",
          }),
        ],
      },
      payments: {
        create: [
          {
            payerId: maria.id,
            amount: 2400,
            method: "GCASH",
            status: "PAID",
            transactionId: "seed-paymongo-2025-0001",
            receiptNumber: "OR-2025-0001",
            referenceNumber: "PM-2025-0001",
            paidAt: atUtc("2025-04-20T11:30:00Z"),
            notes: "Initial permit payment seeded for renewal history.",
          },
        ],
      },
      history: {
        create: [
          {
            previousStatus: "DRAFT",
            newStatus: "SUBMITTED",
            comment: "Historical application submitted by applicant",
            changedBy: maria.id,
          },
          {
            previousStatus: "SUBMITTED",
            newStatus: "UNDER_REVIEW",
            comment: "BPLO began review for 2025 permit",
            changedBy: bploOfficer.id,
          },
          {
            previousStatus: "UNDER_REVIEW",
            newStatus: "PAID",
            comment: "Payment confirmed by BPLO",
            changedBy: bploOfficer.id,
          },
          {
            previousStatus: "PAID",
            newStatus: "COMPLETED",
            comment: "Permit released to applicant",
            changedBy: bploOfficer.id,
          },
        ],
      },
      reviewActions: {
        create: [
          {
            reviewerId: bploOfficer.id,
            action: "APPROVE",
            comment: "Historical application approved by BPLO.",
          },
        ],
      },
      clearances: {
        create: [
          {
            requirementCode: "BARANGAY_CLEARANCE",
            requirementName: "Barangay Business Clearance",
            status: "CLEARED",
            remarks: "Validated by BPLO against submitted clearance copy.",
            dateCleared: atUtc("2025-04-19T09:30:00Z"),
          },
          {
            requirementCode: "SANITARY_PERMIT",
            requirementName: "Sanitary Permit or Clearance",
            status: "CLEARED",
            remarks: "Requirement marked complete during BPLO review.",
            dateCleared: atUtc("2025-04-19T09:45:00Z"),
          },
        ],
      },
    },
  });

  const historicalPermit = await prisma.permit.create({
    data: {
      permitNumber: "BP-2025-000118",
      applicationId: historicalPermitApplication.id,
      businessName: historicalPermitApplication.businessName,
      businessAddress: historicalPermitApplication.businessAddress,
      ownerName: `${maria.firstName} ${maria.lastName}`,
      issueDate: atUtc("2025-04-20T13:00:00Z"),
      expiryDate: atUtc("2026-04-20T13:00:00Z"),
      status: "RENEWED",
    },
  });

  await prisma.permitIssuance.create({
    data: {
      permitId: historicalPermit.id,
      issuedById: bploOfficer.id,
      status: "COMPLETED",
      issuedAt: atUtc("2025-04-20T13:00:00Z"),
      releasedAt: atUtc("2025-04-20T15:00:00Z"),
      completedAt: atUtc("2025-04-20T15:15:00Z"),
      staffNotes: "Historical permit record seeded for renewal linkage.",
      mayorSigningStatus: "SIGNED",
      mayorSignedAt: atUtc("2025-04-20T12:30:00Z"),
      mayorSignedBy: "Hon. Municipal Mayor",
    },
  });

  const underReviewNewApplicationId = randomUUID();
  const underReviewNewApplication = await prisma.application.create({
    data: {
      id: underReviewNewApplicationId,
      applicationNumber: "APP-20260425-NEW001",
      type: "NEW",
      status: "UNDER_REVIEW",
      applicantId: juan.id,
      businessName: "Dela Cruz Eatery",
      businessType: "SOLE_PROPRIETORSHIP",
      lineOfBusiness: "Restaurant",
      businessAddress: "Poblacion, Enrique B. Magalona, Negros Occidental",
      businessBarangay: "Poblacion",
      businessCity: "Enrique B. Magalona",
      businessProvince: "Negros Occidental",
      businessZipCode: "6118",
      businessPhone: juan.phone,
      businessEmail: juan.email,
      dtiSecRegistration: "DTI-2026-001",
      tinNumber: "123-456-789-000",
      businessArea: 65,
      numberOfEmployees: 6,
      capitalInvestment: 150000,
      ownerBirthdate: atUtc("1990-01-15T00:00:00Z"),
      ownerResidenceAddress: "San Jose, Enrique B. Magalona, Negros Occidental",
      ownerPhone: juan.phone,
      submittedAt: atUtc("2026-04-23T08:00:00Z"),
      reviewedAt: atUtc("2026-04-24T09:00:00Z"),
      documents: {
        create: [
          buildDocumentSeed({
            applicationId: underReviewNewApplicationId,
            uploadedBy: juan.id,
            originalName: "DTI Registration.pdf",
            fileSize: 1024,
            documentType: "PROOF_OF_REGISTRATION",
            status: "VERIFIED",
            createdAt: "2026-04-24T09:15:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-24T09:15:00Z",
          }),
          buildDocumentSeed({
            applicationId: underReviewNewApplicationId,
            uploadedBy: juan.id,
            originalName: "Location Plan.pdf",
            fileSize: 1136,
            documentType: "LOCATION_PLAN",
            status: "PENDING_VERIFICATION",
            createdAt: "2026-04-24T09:00:00Z",
          }),
          buildDocumentSeed({
            applicationId: underReviewNewApplicationId,
            uploadedBy: juan.id,
            originalName: "Barangay Clearance.pdf",
            fileSize: 976,
            documentType: "BARANGAY_CLEARANCE",
            status: "VERIFIED",
            createdAt: "2026-04-24T09:20:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-24T09:20:00Z",
          }),
        ],
      },
      history: {
        create: [
          {
            previousStatus: "DRAFT",
            newStatus: "SUBMITTED",
            comment: "Application submitted by applicant",
            changedBy: juan.id,
          },
          {
            previousStatus: "SUBMITTED",
            newStatus: "UNDER_REVIEW",
            comment: "BPLO initialized requirement tracking",
            changedBy: bploOfficer.id,
          },
        ],
      },
      reviewActions: {
        create: [
          {
            reviewerId: bploOfficer.id,
            action: "INITIAL_REVIEW",
            comment: "Waiting for location plan validation and final requirement checks.",
          },
        ],
      },
      clearances: {
        create: [
          {
            requirementCode: "BARANGAY_CLEARANCE",
            requirementName: "Barangay Business Clearance",
            status: "CLEARED",
            dateCleared: atUtc("2026-04-24T09:30:00Z"),
            remarks: "Requirement reviewed by BPLO.",
          },
          {
            requirementCode: "ZONING_CLEARANCE",
            requirementName: "Locational or Zoning Clearance",
            status: "PENDING",
            remarks: "Awaiting final submitted copy from applicant.",
          },
          {
            requirementCode: "FIRE_SAFETY",
            requirementName: "Fire Safety Inspection Certificate",
            status: "FOR_INSPECTION",
            remarks: "BPLO flagged the requirement for follow-up inspection.",
          },
        ],
      },
    },
  });

  const returnedNewApplicationId = randomUUID();
  const returnedNewApplication = await prisma.application.create({
    data: {
      id: returnedNewApplicationId,
      applicationNumber: "APP-20260425-NEW002",
      type: "NEW",
      status: "RETURNED_FOR_CORRECTION",
      applicantId: ana.id,
      businessName: "Reyes Mini Mart",
      businessType: "SOLE_PROPRIETORSHIP",
      lineOfBusiness: "Convenience Store",
      businessAddress: "San Isidro, Enrique B. Magalona, Negros Occidental",
      businessBarangay: "San Isidro",
      businessCity: "Enrique B. Magalona",
      businessProvince: "Negros Occidental",
      businessZipCode: "6118",
      businessPhone: ana.phone,
      businessEmail: ana.email,
      dtiSecRegistration: "DTI-2026-014",
      tinNumber: "555-333-111-000",
      businessArea: 32,
      numberOfEmployees: 2,
      capitalInvestment: 60000,
      submittedAt: atUtc("2026-04-22T08:30:00Z"),
      reviewedAt: atUtc("2026-04-23T10:00:00Z"),
      rejectionReason: "Uploaded proof of ownership is unreadable and FSIC copy is missing.",
      documents: {
        create: [
          buildDocumentSeed({
            applicationId: returnedNewApplicationId,
            uploadedBy: ana.id,
            originalName: "DTI Registration.pdf",
            fileSize: 1420,
            documentType: "PROOF_OF_REGISTRATION",
            status: "VERIFIED",
            createdAt: "2026-04-23T10:05:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-23T10:05:00Z",
          }),
          buildDocumentSeed({
            applicationId: returnedNewApplicationId,
            uploadedBy: ana.id,
            originalName: "Proof of Ownership.pdf",
            fileSize: 860,
            documentType: "PROOF_OF_OWNERSHIP",
            status: "REJECTED",
            createdAt: "2026-04-23T10:10:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-23T10:10:00Z",
            rejectionReason: "Document scan is blurry and missing the lessor signature page.",
          }),
        ],
      },
      history: {
        create: [
          {
            previousStatus: "DRAFT",
            newStatus: "SUBMITTED",
            comment: "Application submitted by applicant",
            changedBy: ana.id,
          },
          {
            previousStatus: "SUBMITTED",
            newStatus: "UNDER_REVIEW",
            comment: "BPLO started review",
            changedBy: bploOfficer.id,
          },
          {
            previousStatus: "UNDER_REVIEW",
            newStatus: "RETURNED_FOR_CORRECTION",
            comment: "BPLO returned the application for document correction",
            changedBy: bploOfficer.id,
          },
        ],
      },
      reviewActions: {
        create: [
          {
            reviewerId: bploOfficer.id,
            action: "RETURN",
            comment: "Please re-upload proof of ownership and complete the fire safety requirement.",
          },
        ],
      },
      clearances: {
        create: [
          {
            requirementCode: "BARANGAY_CLEARANCE",
            requirementName: "Barangay Business Clearance",
            status: "CLEARED",
            dateCleared: atUtc("2026-04-23T10:20:00Z"),
            remarks: "Requirement accepted by BPLO.",
          },
          {
            requirementCode: "FIRE_SAFETY",
            requirementName: "Fire Safety Inspection Certificate",
            status: "RETURNED",
            remarks: "Applicant must upload a valid FSIC copy.",
          },
        ],
      },
    },
  });

  const renewalApplicationId = randomUUID();
  const renewalApplication = await prisma.application.create({
    data: {
      id: renewalApplicationId,
      applicationNumber: "APP-20260425-REN001",
      type: "RENEWAL",
      status: "COMPLETED",
      applicantId: maria.id,
      previousPermitId: historicalPermit.id,
      businessName: "Santos Trading",
      businessType: "SOLE_PROPRIETORSHIP",
      lineOfBusiness: "Retail",
      businessAddress: "Old Highway, Enrique B. Magalona, Negros Occidental",
      businessBarangay: "Tabigue",
      businessCity: "Enrique B. Magalona",
      businessProvince: "Negros Occidental",
      businessZipCode: "6118",
      businessPhone: maria.phone,
      businessEmail: maria.email,
      dtiSecRegistration: "DTI-2025-009",
      tinNumber: "987-654-321-000",
      businessArea: 44,
      numberOfEmployees: 4,
      capitalInvestment: 110000,
      grossSales: 460000,
      documentVerified: true,
      applicationApproved: true,
      paymentConfirmed: true,
      acknowledgedOutstandingFees: true,
      submittedAt: atUtc("2026-04-10T08:00:00Z"),
      reviewedAt: atUtc("2026-04-11T08:00:00Z"),
      approvedAt: atUtc("2026-04-12T08:00:00Z"),
      documents: {
        create: [
          buildDocumentSeed({
            applicationId: renewalApplicationId,
            uploadedBy: maria.id,
            originalName: "Renewal Registration.pdf",
            fileSize: 2048,
            documentType: "PROOF_OF_REGISTRATION",
            status: "VERIFIED",
            createdAt: "2026-04-11T08:10:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-11T08:10:00Z",
          }),
          buildDocumentSeed({
            applicationId: renewalApplicationId,
            uploadedBy: maria.id,
            originalName: "Barangay Clearance Renewal.pdf",
            fileSize: 1812,
            documentType: "BARANGAY_CLEARANCE",
            status: "VERIFIED",
            createdAt: "2026-04-11T08:15:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-11T08:15:00Z",
          }),
        ],
      },
      payments: {
        create: [
          {
            payerId: maria.id,
            amount: 2500,
            method: "GCASH",
            status: "PAID",
            transactionId: "seed-paymongo-2026-0001",
            receiptNumber: "OR-2026-0001",
            referenceNumber: "PM-2026-0001",
            paidAt: atUtc("2026-04-12T09:00:00Z"),
            notes: "Renewal payment completed through seeded online payment.",
          },
        ],
      },
      history: {
        create: [
          {
            previousStatus: "DRAFT",
            newStatus: "SUBMITTED",
            comment: "Renewal application submitted by applicant",
            changedBy: maria.id,
          },
          {
            previousStatus: "SUBMITTED",
            newStatus: "UNDER_REVIEW",
            comment: "BPLO began renewal review",
            changedBy: bploOfficer.id,
          },
          {
            previousStatus: "UNDER_REVIEW",
            newStatus: "PAID",
            comment: "Payment confirmed by BPLO",
            changedBy: bploOfficer.id,
          },
          {
            previousStatus: "PAID",
            newStatus: "COMPLETED",
            comment: "Renewed permit released to applicant",
            changedBy: bploOfficer.id,
          },
        ],
      },
      reviewActions: {
        create: [
          {
            reviewerId: bploOfficer.id,
            action: "APPROVE",
            comment: "Renewal requirements completed and approved by BPLO.",
          },
        ],
      },
      clearances: {
        create: [
          {
            requirementCode: "BARANGAY_CLEARANCE",
            requirementName: "Updated Barangay Business Clearance",
            status: "CLEARED",
            remarks: "Renewal barangay clearance accepted by BPLO.",
            dateCleared: atUtc("2026-04-11T08:30:00Z"),
          },
          {
            requirementCode: "SANITARY_PERMIT",
            requirementName: "Updated Sanitary Permit or Clearance",
            status: "CLEARED",
            remarks: "Renewal sanitary requirement validated by BPLO.",
            dateCleared: atUtc("2026-04-11T08:40:00Z"),
          },
        ],
      },
    },
  });

  const renewalPermit = await prisma.permit.create({
    data: {
      permitNumber: "BP-2026-000001",
      applicationId: renewalApplication.id,
      businessName: renewalApplication.businessName,
      businessAddress: renewalApplication.businessAddress,
      ownerName: `${maria.firstName} ${maria.lastName}`,
      issueDate: atUtc("2026-04-12T09:30:00Z"),
      expiryDate: atUtc("2027-04-12T09:30:00Z"),
      status: "ACTIVE",
    },
  });

  await prisma.permitIssuance.create({
    data: {
      permitId: renewalPermit.id,
      issuedById: bploOfficer.id,
      status: "RELEASED",
      issuedAt: atUtc("2026-04-12T09:30:00Z"),
      releasedAt: atUtc("2026-04-12T10:00:00Z"),
      completedAt: atUtc("2026-04-12T10:05:00Z"),
      mayorSigningStatus: "SIGNED",
      mayorSignedAt: atUtc("2026-04-12T09:00:00Z"),
      mayorSignedBy: "Hon. Municipal Mayor",
      staffNotes: "Renewed permit released over the BPLO counter.",
    },
  });

  await prisma.businessLocation.createMany({
    data: [
      {
        applicationId: underReviewNewApplication.id,
        latitude: 10.8839,
        longitude: 122.9662,
        label: "Dela Cruz Eatery",
        businessType: "Restaurant",
        markerColor: "green",
      },
      {
        applicationId: returnedNewApplication.id,
        latitude: 10.8894,
        longitude: 122.9723,
        label: "Reyes Mini Mart",
        businessType: "Convenience Store",
        markerColor: "orange",
      },
      {
        applicationId: renewalApplication.id,
        latitude: 10.891,
        longitude: 122.9686,
        label: "Santos Trading",
        businessType: "Retail",
        markerColor: "blue",
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "ADMIN_CREATE_USER",
        entity: "User",
        entityId: bploOfficer.id,
        details: { role: "BPLO_OFFICE" },
      },
      {
        userId: admin.id,
        action: "ADMIN_REVIEW_SETTINGS",
        entity: "SystemSetting",
        details: { seeded: true },
      },
      {
        userId: bploOfficer.id,
        action: "REQUIREMENTS_INITIALIZED",
        entity: "Application",
        entityId: underReviewNewApplication.id,
        details: { applicationNumber: underReviewNewApplication.applicationNumber },
      },
      {
        userId: bploOfficer.id,
        action: "APPLICATION_RETURNED",
        entity: "Application",
        entityId: returnedNewApplication.id,
        details: { applicationNumber: returnedNewApplication.applicationNumber },
      },
      {
        userId: bploOfficer.id,
        action: "REVIEW_APPROVE",
        entity: "Application",
        entityId: renewalApplication.id,
        details: { applicationNumber: renewalApplication.applicationNumber },
      },
    ],
  });

  console.log("Seed complete:");
  console.log("  admin@lgu.gov.ph  / Password123! / ADMIN");
  console.log("  bplo@lgu.gov.ph   / Password123! / BPLO_OFFICE");
  console.log("  juan@example.com  / Password123! / APPLICANT");
  console.log("  maria@example.com / Password123! / APPLICANT");
  console.log("  ana@example.com   / Password123! / APPLICANT");
  console.log("Seeded applications:");
  console.log("  APP-20250418-NEW001  / historical NEW permit record for renewal linkage");
  console.log("  APP-20260425-NEW001  / NEW application under BPLO review");
  console.log("  APP-20260425-NEW002  / NEW application returned for correction");
  console.log("  APP-20260425-REN001  / completed RENEWAL with payment and permit");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
