const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load DATABASE_URL from .env manually
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database (minimal)...\n");

  // Clean existing data
  await prisma.permitIssuance.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.claimReference.deleteMany();
  await prisma.slotReservation.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.claimSchedule.deleteMany();
  await prisma.clearance.deleteMany();
  await prisma.clearanceOffice.deleteMany();
  await prisma.reviewAction.deleteMany();
  await prisma.applicationHistory.deleteMany();
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

  const admin = await prisma.user.create({
    data: {
      email: "admin@lgu.gov.ph",
      password,
      firstName: "System",
      lastName: "Administrator",
      phone: "09171234567",
      role: "BPLO_OFFICE",
      status: "ACTIVE",
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: "reviewer@lgu.gov.ph",
      password,
      firstName: "Maria",
      lastName: "Santos",
      phone: "09181234567",
      role: "BPLO_OFFICE",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@lgu.gov.ph",
      password,
      firstName: "Jose",
      lastName: "Reyes",
      phone: "09191234567",
      role: "BPLO_OFFICE",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const applicant1 = await prisma.user.create({
    data: {
      email: "juan@example.com",
      password,
      firstName: "Juan",
      lastName: "Dela Cruz",
      middleName: "Bautista",
      phone: "09201234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const applicant2 = await prisma.user.create({
    data: {
      email: "pedro@example.com",
      password,
      firstName: "Pedro",
      lastName: "Garcia",
      phone: "09211234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const applicant4 = await prisma.user.create({
    data: {
      email: "maria@example.com",
      password,
      firstName: "Maria",
      lastName: "Gonzales",
      phone: "09231234567",
      role: "APPLICANT",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log(`  ✓ Created 6 users`);

  // ── ClearanceOffice ────────────────────────────────────────────────────
  console.log("🏢 Creating clearance offices...");

  const offices = await Promise.all([
    prisma.clearanceOffice.create({
      data: {
        code: "SANITARY",
        name: "Department of Health - Sanitary Division",
        description: "Health and sanitation clearance",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "ZONING",
        name: "City Planning & Development Office",
        description: "Zoning compliance",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "ENVIRONMENT",
        name: "Department of Environment & Natural Resources",
        description: "Environmental compliance",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "ENGINEERING",
        name: "City Engineering Office",
        description: "Building compliance",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "BFP_FIRE",
        name: "Bureau of Fire Protection",
        description: "Fire safety certificate",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "RPT_CLEARANCE",
        name: "City Treasurer's Office - Real Property Tax",
        description: "Real property tax clearance (CLOSURE only)",
        applicationTypes: ["NEW", "RENEWAL", "CLOSURE"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "MARKET",
        name: "Market Regulatory Office",
        description: "Market compliance",
        applicationTypes: ["NEW", "RENEWAL"],
        isActive: true,
      },
    }),
    prisma.clearanceOffice.create({
      data: {
        code: "AGRICULTURE",
        name: "City Agriculture Office",
        description: "Agricultural compliance",
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
      applicationNumber: "BP-2026-000001",
      type: "NEW",
      status: "APPROVED",
      applicantId: applicant1.id,
      businessName: "Juan's Sari-Sari Store",
      businessType: "Retail - General Merchandise",
      businessAddress: "123 Rizal Street, Barangay 1",
      businessBarangay: "Barangay 1",
      businessCity: "Quezon City",
      businessProvince: "Metro Manila",
      businessZipCode: "1100",
      dtiSecRegistration: "DTI-2026-001234",
      tinNumber: "123-456-789-000",
      numberOfEmployees: 3,
      capitalInvestment: 250000,
      grossSales: 500000,
      submittedAt: new Date("2026-01-15"),
      reviewedAt: new Date("2026-01-20"),
      approvedAt: new Date("2026-01-20"),
    },
  });

  const app6 = await prisma.application.create({
    data: {
      applicationNumber: "BP-2026-000006",
      type: "RENEWAL",
      status: "APPROVED",
      applicantId: applicant4.id,
      businessName: "Maria's Beauty Salon",
      businessType: "Service - Beauty & Wellness",
      businessAddress: "555 Ortigas Avenue, Barangay 7",
      businessBarangay: "Barangay 7",
      businessCity: "Quezon City",
      businessProvince: "Metro Manila",
      businessZipCode: "1103",
      businessPhone: "09231234567",
      numberOfEmployees: 4,
      capitalInvestment: 300000,
      grossSales: 800000,
      submittedAt: new Date("2026-02-05"),
      reviewedAt: new Date("2026-02-10"),
      approvedAt: new Date("2026-02-10"),
    },
  });

  console.log(`  ✓ Created 2 applications`);

  // ── Permits ────────────────────────────────────────────────────
  console.log("🏛️ Creating permits...");

  const permit1 = await prisma.permit.create({
    data: {
      permitNumber: "PERMIT-2026-000001",
      applicationId: app1.id,
      businessName: "Juan's Sari-Sari Store",
      businessAddress: "123 Rizal Street, Barangay 1, Quezon City",
      ownerName: "Juan Bautista Dela Cruz",
      issueDate: new Date("2026-01-20"),
      expiryDate: new Date("2027-01-20"),
      status: "ACTIVE",
    },
  });

  await prisma.permitIssuance.create({
    data: {
      permitId: permit1.id,
      issuedById: staff.id,
      status: "ISSUED",
      issuedAt: new Date("2026-01-20"),
    },
  });

  const permit2 = await prisma.permit.create({
    data: {
      permitNumber: "PERMIT-2026-000002",
      applicationId: app6.id,
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
      issuedById: staff.id,
      status: "ISSUED",
      issuedAt: new Date("2026-02-11"),
    },
  });

  console.log("  ✓ Created 2 permits with issuance records");

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📌 Test Credentials:");
  console.log("  👤 NEW Applicant (no permits):");
  console.log("     pedro@example.com / Password123!");
  console.log("");
  console.log("  👤 RENEWAL ELIGIBLE Applicants (have ACTIVE permits):");
  console.log("     juan@example.com / Password123!");
  console.log("     maria@example.com / Password123!");
  console.log("");
  console.log("  👤 Staff/Admin:");
  console.log("     admin@lgu.gov.ph / Password123!");
  console.log("     reviewer@lgu.gov.ph / Password123!");
  console.log("     staff@lgu.gov.ph / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
