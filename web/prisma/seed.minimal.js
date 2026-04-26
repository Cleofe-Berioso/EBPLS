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
  const password = await bcrypt.hash("Password123!", 12);

  await resetData();

  const [admin, bploOfficer, applicantOne, applicantTwo] = await Promise.all([
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
        email: "applicant.new@example.com",
        password,
        firstName: "Lito",
        lastName: "Ramos",
        phone: "09171112223",
        role: "APPLICANT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "applicant.renewal@example.com",
        password,
        firstName: "Grace",
        lastName: "Flores",
        phone: "09173334445",
        role: "APPLICANT",
        status: "ACTIVE",
        emailVerified: new Date(),
        renewalEligible: true,
      },
    }),
  ]);

  await prisma.systemSetting.createMany({
    data: [
      { key: "system_name", value: "Online Business Permit System" },
      { key: "lgu_name", value: "Municipality of Enrique B. Magalona" },
      { key: "office_hours", value: "Mon-Fri 8:00 AM – 5:00 PM" },
    ],
  });

  const newApplicationId = randomUUID();
  const newApplication = await prisma.application.create({
    data: {
      id: newApplicationId,
      applicationNumber: "APP-MIN-20260425-NEW001",
      type: "NEW",
      status: "UNDER_REVIEW",
      applicantId: applicantOne.id,
      businessName: "Ramos Variety Store",
      businessType: "SOLE_PROPRIETORSHIP",
      lineOfBusiness: "Retail",
      businessAddress: "Poblacion, Enrique B. Magalona, Negros Occidental",
      businessBarangay: "Poblacion",
      businessCity: "Enrique B. Magalona",
      businessProvince: "Negros Occidental",
      businessZipCode: "6118",
      businessPhone: applicantOne.phone,
      businessEmail: applicantOne.email,
      dtiSecRegistration: "DTI-MIN-2026-001",
      tinNumber: "111-222-333-000",
      submittedAt: atUtc("2026-04-24T08:00:00Z"),
      reviewedAt: atUtc("2026-04-24T09:00:00Z"),
      documents: {
        create: [
          buildDocumentSeed({
            applicationId: newApplicationId,
            uploadedBy: applicantOne.id,
            originalName: "Registration.pdf",
            fileSize: 1024,
            documentType: "PROOF_OF_REGISTRATION",
            status: "VERIFIED",
            createdAt: "2026-04-24T09:10:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-24T09:10:00Z",
          }),
        ],
      },
      clearances: {
        create: [
          {
            requirementCode: "BARANGAY_CLEARANCE",
            requirementName: "Barangay Business Clearance",
            status: "CLEARED",
            dateCleared: atUtc("2026-04-24T09:15:00Z"),
          },
          {
            requirementCode: "ZONING_CLEARANCE",
            requirementName: "Locational or Zoning Clearance",
            status: "PENDING",
          },
        ],
      },
    },
  });

  const renewalApplicationId = randomUUID();
  const renewalApplication = await prisma.application.create({
    data: {
      id: renewalApplicationId,
      applicationNumber: "APP-MIN-20260425-REN001",
      type: "RENEWAL",
      status: "COMPLETED",
      applicantId: applicantTwo.id,
      businessName: "Flores Pharmacy",
      businessType: "SOLE_PROPRIETORSHIP",
      lineOfBusiness: "Pharmacy",
      businessAddress: "Tabigue, Enrique B. Magalona, Negros Occidental",
      businessBarangay: "Tabigue",
      businessCity: "Enrique B. Magalona",
      businessProvince: "Negros Occidental",
      businessZipCode: "6118",
      businessPhone: applicantTwo.phone,
      businessEmail: applicantTwo.email,
      dtiSecRegistration: "DTI-MIN-2025-004",
      tinNumber: "444-555-666-000",
      documentVerified: true,
      applicationApproved: true,
      paymentConfirmed: true,
      submittedAt: atUtc("2026-04-10T08:00:00Z"),
      reviewedAt: atUtc("2026-04-11T08:00:00Z"),
      approvedAt: atUtc("2026-04-12T08:00:00Z"),
      documents: {
        create: [
          buildDocumentSeed({
            applicationId: renewalApplicationId,
            uploadedBy: applicantTwo.id,
            originalName: "Renewal Registration.pdf",
            fileSize: 2048,
            documentType: "PROOF_OF_REGISTRATION",
            status: "VERIFIED",
            createdAt: "2026-04-11T08:10:00Z",
            verifiedBy: bploOfficer.id,
            verifiedAt: "2026-04-11T08:10:00Z",
          }),
        ],
      },
      payments: {
        create: [
          {
            payerId: applicantTwo.id,
            amount: 2100,
            method: "GCASH",
            status: "PAID",
            transactionId: "seed-min-pay-0001",
            receiptNumber: "OR-MIN-0001",
            referenceNumber: "PM-MIN-0001",
            paidAt: atUtc("2026-04-12T09:00:00Z"),
          },
        ],
      },
      clearances: {
        create: [
          {
            requirementCode: "BARANGAY_CLEARANCE",
            requirementName: "Updated Barangay Business Clearance",
            status: "CLEARED",
            dateCleared: atUtc("2026-04-11T08:20:00Z"),
          },
          {
            requirementCode: "SANITARY_PERMIT",
            requirementName: "Updated Sanitary Permit or Clearance",
            status: "CLEARED",
            dateCleared: atUtc("2026-04-11T08:30:00Z"),
          },
        ],
      },
    },
  });

  const permit = await prisma.permit.create({
    data: {
      permitNumber: "BP-MIN-2026-0001",
      applicationId: renewalApplication.id,
      businessName: renewalApplication.businessName,
      businessAddress: renewalApplication.businessAddress,
      ownerName: `${applicantTwo.firstName} ${applicantTwo.lastName}`,
      issueDate: atUtc("2026-04-12T09:30:00Z"),
      expiryDate: atUtc("2027-04-12T09:30:00Z"),
      status: "ACTIVE",
    },
  });

  await prisma.permitIssuance.create({
    data: {
      permitId: permit.id,
      issuedById: bploOfficer.id,
      status: "RELEASED",
      issuedAt: atUtc("2026-04-12T09:30:00Z"),
      releasedAt: atUtc("2026-04-12T10:00:00Z"),
      mayorSigningStatus: "SIGNED",
      mayorSignedAt: atUtc("2026-04-12T09:00:00Z"),
      mayorSignedBy: "Hon. Municipal Mayor",
    },
  });

  await prisma.businessLocation.create({
    data: {
      applicationId: renewalApplication.id,
      latitude: 10.8798,
      longitude: 122.9764,
      businessCategory: "SERVICES",
      label: "Flores Pharmacy",
      businessType: renewalApplication.lineOfBusiness,
      status: "APPROVED",
      reviewedAt: atUtc("2026-04-12T10:10:00Z"),
      reviewedById: bploOfficer.id,
      reviewNotes: "Approved for GeoMap display after permit release.",
      markerColor: null,
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "ADMIN_SEED_BOOTSTRAP",
        entity: "User",
        entityId: bploOfficer.id,
        details: { role: "BPLO_OFFICE" },
      },
      {
        userId: bploOfficer.id,
        action: "REQUIREMENTS_INITIALIZED",
        entity: "Application",
        entityId: newApplication.id,
        details: { applicationNumber: newApplication.applicationNumber },
      },
    ],
  });

  console.log("Minimal three-role seed complete:");
  console.log("  admin@lgu.gov.ph             / Password123! / ADMIN");
  console.log("  bplo@lgu.gov.ph              / Password123! / BPLO_OFFICE");
  console.log("  applicant.new@example.com    / Password123! / APPLICANT");
  console.log("  applicant.renewal@example.com / Password123! / APPLICANT");
}

main()
  .catch((error) => {
    console.error("Minimal seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
