const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load DATABASE_URL from .env manually (Prisma 7 seed runs outside Next.js)
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with 3-role system (APPLICANT, BPLO_OFFICE, MTO)...\n");

  // Clean existing data
  await prisma.permitIssuance.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.clearance.deleteMany();
  await prisma.clearanceOffice.deleteMany();
  await prisma.reviewAction.deleteMany();
  await prisma.applicationHistory.deleteMany();
  await prisma.businessLocation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Password123!", 12);

  // ── Users ──────────────────────────────────────────────────────────
  console.log("👤 Creating users...");

  // 3 BPLO Office staff (handling applications & permits)
  const bplo1 = await prisma.user.create({
    data: {
      email: "bplo1@lgu.gov.ph",
      password,
      firstName: "Maria",
      lastName: "Santos",
      phone: "09181234567",
      role: "BPLO_OFFICE",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const bplo2 = await prisma.user.create({
    data: {
      email: "bplo2@lgu.gov.ph",
      password,
      firstName: "Jose",
      lastName: "Reyes",
      phone: "09191234567",
      role: "BPLO_OFFICE",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const bplo3 = await prisma.user.create({
    data: {
      email: "bplo3@lgu.gov.ph",
      password,
      firstName: "Ana",
      lastName: "Cruz",
      phone: "09201234567",
      role: "BPLO_OFFICE",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // 2 MTO staff (handling payments)
  const mto1 = await prisma.user.create({
    data: {
      email: "mto1@lgu.gov.ph",
      password,
      firstName: "Roberto",
      lastName: "Torres",
      phone: "09211234567",
      role: "MTO",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const mto2 = await prisma.user.create({
    data: {
      email: "mto2@lgu.gov.ph",
      password,
      firstName: "Elena",
      lastName: "Gonzalez",
      phone: "09221234567",
      role: "MTO",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // 5 Applicants (business owners)
  const applicant1 = await prisma.user.create({
    data: {
      email: "juan@example.com",
      password,
      firstName: "Juan",
      lastName: "Dela Cruz",
      phone: "09231234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
      renewalEligible: true,
    },
  });

  const applicant2 = await prisma.user.create({
    data: {
      email: "pedro@example.com",
      password,
      firstName: "Pedro",
      lastName: "Garcia",
      phone: "09241234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
      renewalEligible: false,
    },
  });

  const applicant3 = await prisma.user.create({
    data: {
      email: "ana@example.com",
      password,
      firstName: "Ana",
      lastName: "Reyes",
      phone: "09251234567",
      role: "APPLICANT",
      status: "PENDING_VERIFICATION",
      renewalEligible: false,
    },
  });

  const applicant4 = await prisma.user.create({
    data: {
      email: "maria@example.com",
      password,
      firstName: "Maria",
      lastName: "Gonzales",
      phone: "09261234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
      renewalEligible: true,
    },
  });

  const applicant5 = await prisma.user.create({
    data: {
      email: "carlos@example.com",
      password,
      firstName: "Carlos",
      lastName: "Mendoza",
      phone: "09271234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
      renewalEligible: false,
    },
  });

  console.log(`  ✓ Created 12 users (3 BPLO_OFFICE, 2 MTO, 7 APPLICANT)`);

  // ── ClearanceOffice ────────────────────────────────────────────────────
  console.log("🏢 Creating clearance offices...");

  const offices = await Promise.all([
    prisma.clearanceOffice.create({
      data: {
        code: "SANITARY",
        name: "Department of Health - Sanitary Division",
        description: "Health and sanitation clearance for food and beverage businesses",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "ZONING",
        name: "City Planning & Development Office - Zoning Division",
        description: "Zoning compliance and land use verification",
        applicationTypes: ["NEW"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "BFP_FIRE",
        name: "Bureau of Fire Protection - Fire Safety",
        description: "Fire safety certificate and compliance",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
  ]);

  console.log(`  ✓ Created ${offices.length} clearance offices`);

  // ── Applications ───────────────────────────────────────────────────
  console.log("📋 Creating applications...");

  const app1 = await prisma.application.create({
    data: {
      applicationNumber: "APP-2026-000001",
      type: "NEW",
      status: "APPROVED",
      applicantId: applicant1.id,
      businessName: "Juan's Sari-Sari Store",
      businessType: "Retail - General Merchandise",
      businessAddress: "123 Rizal Street, Barangay 1",
      businessCity: "Quezon City",
      businessProvince: "Metro Manila",
      businessZipCode: "1100",
      businessPhone: "09231234567",
      businessEmail: "juan@store.example.com",
      dtiSecRegistration: "DTI-2026-001234",
      numberOfEmployees: 3,
      capitalInvestment: 250000,
      grossSales: 500000,
      documentVerified: true,
      applicationApproved: true,
      submittedAt: new Date("2026-01-15"),
      approvedAt: new Date("2026-01-20"),
    },
  });

  const app2 = await prisma.application.create({
    data: {
      applicationNumber: "APP-2026-000002",
      type: "NEW",
      status: "UNDER_REVIEW",
      applicantId: applicant2.id,
      businessName: "Pedro's Computer Shop",
      businessType: "Service - Internet Cafe",
      businessAddress: "456 Mabini Street, Barangay 5",
      businessCity: "Quezon City",
      businessProvince: "Metro Manila",
      businessZipCode: "1101",
      dtiSecRegistration: "DTI-2026-005678",
      numberOfEmployees: 5,
      capitalInvestment: 500000,
      documentVerified: false,
      applicationApproved: false,
      submittedAt: new Date("2026-02-01"),
    },
  });

  const app3 = await prisma.application.create({
    data: {
      applicationNumber: "APP-2026-000003",
      type: "RENEWAL",
      status: "APPROVED",
      applicantId: applicant4.id,
      businessName: "Maria's Beauty Salon",
      businessType: "Service - Beauty & Wellness",
      businessAddress: "555 Ortigas Avenue, Barangay 7",
      businessCity: "Quezon City",
      businessProvince: "Metro Manila",
      businessZipCode: "1103",
      businessPhone: "09261234567",
      dtiSecRegistration: "DTI-2025-003456",
      numberOfEmployees: 4,
      capitalInvestment: 300000,
      grossSales: 800000,
      documentVerified: true,
      applicationApproved: true,
      submittedAt: new Date("2026-02-05"),
      approvedAt: new Date("2026-02-10"),
    },
  });

  console.log(`  ✓ Created 3 applications`);

  // ── Application History ────────────────────────────────────────────
  console.log("📜 Creating application history...");

  const historyEntries = [
    { applicationId: app1.id, newStatus: "DRAFT", comment: "Application created", changedBy: applicant1.id },
    { applicationId: app1.id, previousStatus: "DRAFT", newStatus: "SUBMITTED", comment: "Application submitted", changedBy: applicant1.id },
    { applicationId: app1.id, previousStatus: "SUBMITTED", newStatus: "UNDER_REVIEW", comment: "Under review by BPLO", changedBy: bplo1.id },
    { applicationId: app1.id, previousStatus: "UNDER_REVIEW", newStatus: "APPROVED", comment: "All requirements met. Approved.", changedBy: bplo2.id },
    { applicationId: app2.id, newStatus: "SUBMITTED", comment: "Application submitted", changedBy: applicant2.id },
    { applicationId: app2.id, previousStatus: "SUBMITTED", newStatus: "UNDER_REVIEW", comment: "Under review by BPLO", changedBy: bplo1.id },
    { applicationId: app3.id, newStatus: "SUBMITTED", comment: "Renewal submitted", changedBy: applicant4.id },
    { applicationId: app3.id, previousStatus: "SUBMITTED", newStatus: "UNDER_REVIEW", comment: "Renewal under review", changedBy: bplo2.id },
    { applicationId: app3.id, previousStatus: "UNDER_REVIEW", newStatus: "APPROVED", comment: "Renewal approved. All documents verified.", changedBy: bplo3.id },
  ];

  for (const entry of historyEntries) {
    await prisma.applicationHistory.create({ data: entry });
  }
  console.log(`  ✓ Created ${historyEntries.length} history entries`);

  // ── Documents ──────────────────────────────────────────────────────
  console.log("📄 Creating documents...");

  const docs = [
    { applicationId: app1.id, uploadedBy: applicant1.id, fileName: "dti_cert.pdf", originalName: "DTI Certificate.pdf", mimeType: "application/pdf", fileSize: 524288, filePath: "uploads/app1/dti_cert.pdf", documentType: "PROOF_OF_REGISTRATION", status: "VERIFIED", verifiedBy: bplo1.id, verifiedAt: new Date("2026-01-19") },
    { applicationId: app1.id, uploadedBy: applicant1.id, fileName: "fire_cert.pdf", originalName: "Fire Safety Certificate.pdf", mimeType: "application/pdf", fileSize: 410000, filePath: "uploads/app1/fire_cert.pdf", documentType: "FSIC", status: "VERIFIED", verifiedBy: bplo1.id, verifiedAt: new Date("2026-01-19") },
    { applicationId: app2.id, uploadedBy: applicant2.id, fileName: "dti_cert2.pdf", originalName: "DTI Certificate.pdf", mimeType: "application/pdf", fileSize: 530000, filePath: "uploads/app2/dti_cert2.pdf", documentType: "PROOF_OF_REGISTRATION", status: "PENDING_VERIFICATION" },
    { applicationId: app3.id, uploadedBy: applicant4.id, fileName: "dti_renewal.pdf", originalName: "DTI Renewal Certificate.pdf", mimeType: "application/pdf", fileSize: 520000, filePath: "uploads/app3/dti_renewal.pdf", documentType: "PROOF_OF_REGISTRATION", status: "VERIFIED", verifiedBy: bplo2.id, verifiedAt: new Date("2026-02-09") },
  ];

  for (const doc of docs) {
    await prisma.document.create({ data: doc });
  }
  console.log(`  ✓ Created ${docs.length} documents`);

  // ── Review Actions ─────────────────────────────────────────────────
  console.log("✅ Creating review actions...");

  await prisma.reviewAction.create({
    data: {
      applicationId: app1.id,
      reviewerId: bplo2.id,
      action: "APPROVE",
      comment: "All requirements complete. Approved.",
    },
  });

  await prisma.reviewAction.create({
    data: {
      applicationId: app3.id,
      reviewerId: bplo3.id,
      action: "APPROVE",
      comment: "Renewal documents verified and complete.",
    },
  });

  console.log("  ✓ Created 2 review actions");

  // ── Permits (for approved apps) ──────────────────────────────────────
  console.log("🏛️ Creating permits...");

  const permit1 = await prisma.permit.create({
    data: {
      permitNumber: "PERMIT-2026-000001",
      applicationId: app1.id,
      businessName: "Juan's Sari-Sari Store",
      businessAddress: "123 Rizal Street, Barangay 1, Quezon City",
      ownerName: "Juan Dela Cruz",
      issueDate: new Date("2026-01-20"),
      expiryDate: new Date("2027-01-20"),
      status: "ACTIVE",
    },
  });

  await prisma.permitIssuance.create({
    data: {
      permitId: permit1.id,
      issuedById: bplo1.id,
      status: "ISSUED",
      issuedAt: new Date("2026-01-20"),
    },
  });

  const permit2 = await prisma.permit.create({
    data: {
      permitNumber: "PERMIT-2026-000002",
      applicationId: app3.id,
      businessName: "Maria's Beauty Salon",
      businessAddress: "555 Ortigas Avenue, Barangay 7, Quezon City",
      ownerName: "Maria Gonzales",
      issueDate: new Date("2026-02-11"),
      expiryDate: new Date("2027-02-11"),
      status: "ACTIVE",
    },
  });

  await prisma.permitIssuance.create({
    data: {
      permitId: permit2.id,
      issuedById: bplo2.id,
      status: "ISSUED",
      issuedAt: new Date("2026-02-11"),
    },
  });

  console.log("  ✓ Created 2 permits with issuance records");

  // ── System Settings ────────────────────────────────────────────────
  console.log("⚙️ Creating system settings...");

  const settings = [
    { key: "lgu_name", value: "City of Quezon", type: "string" },
    { key: "lgu_address", value: "Quezon City Hall, Elliptical Road, Diliman, Quezon City", type: "string" },
    { key: "lgu_phone", value: "(02) 8988-4242", type: "string" },
    { key: "lgu_email", value: "bplo@quezoncity.gov.ph", type: "string" },
    { key: "permit_validity_days", value: "365", type: "number" },
    { key: "max_file_size_mb", value: "10", type: "number" },
    { key: "otp_expiry_minutes", value: "15", type: "number" },
    { key: "session_timeout_minutes", value: "30", type: "number" },
    { key: "maintenance_mode", value: "false", type: "boolean" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.create({ data: setting });
  }
  console.log(`  ✓ Created ${settings.length} system settings`);

  // ── Activity Logs ──────────────────────────────────────────────────
  console.log("📊 Creating activity logs...");

  const logs = [
    { userId: bplo1.id, action: "LOGIN", entity: "User", entityId: bplo1.id },
    { userId: applicant1.id, action: "REGISTER", entity: "User", entityId: applicant1.id },
    { userId: applicant1.id, action: "LOGIN", entity: "User", entityId: applicant1.id },
    { userId: applicant1.id, action: "CREATE_APPLICATION", entity: "Application", entityId: app1.id },
    { userId: applicant1.id, action: "SUBMIT_APPLICATION", entity: "Application", entityId: app1.id },
    { userId: bplo2.id, action: "REVIEW_APPROVE", entity: "Application", entityId: app1.id },
    { userId: applicant2.id, action: "REGISTER", entity: "User", entityId: applicant2.id },
    { userId: applicant4.id, action: "REGISTER", entity: "User", entityId: applicant4.id },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }
  console.log(`  ✓ Created ${logs.length} activity logs`);

  // ── Payments ───────────────────────────────────────────────────────
  console.log("💳 Creating payment records...");

  // App1: Paid (APPROVED application with payment confirmed)
  const payment1 = await prisma.payment.create({
    data: {
      applicationId: app1.id,
      payerId: applicant1.id,
      amount: 5000,
      method: "GCASH",
      status: "PAID",
      referenceNumber: "REF-GCH-20260120-001",
      transactionId: "TXN-GCH-001",
      paidAt: new Date("2026-01-20"),
    },
  });

  // Update app1 to have paymentConfirmed
  await prisma.application.update({
    where: { id: app1.id },
    data: { paymentConfirmed: true }
  });

  // App2: Pending payment (waiting for MTO confirmation)
  await prisma.payment.create({
    data: {
      applicationId: app2.id,
      payerId: applicant2.id,
      amount: 5000,
      method: "BANK_TRANSFER",
      status: "PENDING",
      referenceNumber: "REF-BNK-20260215-001",
    },
  });

  // App3: Paid (RENEWAL approved with payment confirmed)
  const payment3 = await prisma.payment.create({
    data: {
      applicationId: app3.id,
      payerId: applicant4.id,
      amount: 3500,
      method: "MAYA",
      status: "PAID",
      referenceNumber: "REF-MAY-20260211-001",
      transactionId: "TXN-MAY-001",
      paidAt: new Date("2026-02-11"),
    },
  });

  // Update app3 to have paymentConfirmed
  await prisma.application.update({
    where: { id: app3.id },
    data: { paymentConfirmed: true }
  });

  console.log("  ✓ Created 3 payment records");

  console.log("\n✅ Database seeded successfully!\n");

  console.log("📌 Test Credentials:\n");

  console.log("🔹 APPLICANTS (Business Owners):");
  console.log("   Email                | Status                | Renewal Eligible?");
  console.log("   -------------------- | --------------------- | -----------------");
  console.log("   juan@example.com     | ACTIVE, HAS PERMIT     | YES ✓");
  console.log("   pedro@example.com    | ACTIVE, NO PERMITS     | NO");
  console.log("   maria@example.com    | ACTIVE, HAS PERMIT     | YES ✓");
  console.log("   carlos@example.com   | ACTIVE, NO PERMITS     | NO");
  console.log("   ana@example.com      | PENDING_VERIFICATION   | NO");
  console.log("   Password: Password123!\n");

  console.log("🔹 BPLO OFFICE (Application Processing):");
  console.log("   bplo1@lgu.gov.ph");
  console.log("   bplo2@lgu.gov.ph");
  console.log("   bplo3@lgu.gov.ph");
  console.log("   Password: Password123!\n");

  console.log("🔹 MTO (Payment Validation):");
  console.log("   mto1@lgu.gov.ph");
  console.log("   mto2@lgu.gov.ph");
  console.log("   Password: Password123!\n");

  console.log("📊 Test Data Summary:");
  console.log("   • 12 users (5 applicants, 3 BPLO_OFFICE, 2 MTO)");
  console.log("   • 3 applications (1 NEW approved, 1 NEW under review, 1 RENEWAL approved)");
  console.log("   • 4 documents (2 verified, 2 pending)");
  console.log("   • 2 permits (ACTIVE, ready for distribution)");
  console.log("   • 3 payments (2 paid with confirmed status, 1 pending)");
  console.log("   • 9 activity logs\n");

  console.log("✅ Ready to test:\n");
  console.log("   • Applicant can view My Applications sidebar (NOT New Application)");
  console.log("   • Renewal-eligible users (juan, maria) → Separate renewal portal");
  console.log("   • Non-eligible users (pedro, carlos) → Cannot access renewal");
  console.log("   • BPLO processes applications and issues permits");
  console.log("   • MTO validates payments before permit issuance");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
