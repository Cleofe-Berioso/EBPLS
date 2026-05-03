const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const bcrypt = require("bcryptjs");

const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const DEFAULT_SYSTEM_FEE_SETTINGS = {
  renewalSurchargePercent: 25,
  monthlyInterestPercent: 2,
  liquorTobaccoAddOnPercent: 25,
  powerDistributionFixedFee: 10000,
  privatePortFixedFee: 50000,
};

const FEE_TABLE_SEEDS = [
  {
    category: "MANUFACTURERS",
    assetFees: [200, 400, 650, 1800, 3000, 4000, 6000],
    workerFees: [200, 200, 400, 1800, 3000, 4000, 6000],
    assetTierNames: [
      "Micro Industry",
      "Cottage Industries A",
      "Cottage Industries B",
      "Small-Scale Industries A",
      "Small-Scale Industries B",
      "Medium-Scale Industries",
      "Large-Scale Industries",
    ],
    workerTierNames: [
      "Micro Industry (no workers)",
      "Micro Industry (1–5)",
      "Cottage Industries A (6–10)",
      "Small-Scale Industries A (11–50)",
      "Small-Scale Industries B (51–99)",
      "Medium-Scale Industries (100–150)",
      "Large-Scale Industries (200+)",
    ],
  },
  {
    category: "OTHER_FINANCIAL",
    assetFees: [1000, 3000, 3000, 4000, 5000, 6000, 6000],
    workerFees: [1000, 1000, 3000, 4000, 5000, 6000, 6000],
    assetTierNames: [
      "Micro Industry",
      "Cottage Industry (₱100K–₱250K)",
      "Cottage Industry (₱250K–₱500K)",
      "Small Industry (₱500K–₱2M)",
      "Medium Industry (₱2M–₱5M)",
      "Large Industry (₱5M–₱20M)",
      "Large Industry (Over ₱20M)",
    ],
    workerTierNames: [
      "Micro Industry (no workers)",
      "Micro Industry (1–5)",
      "Cottage Industry (6–10)",
      "Small Industry (11–50)",
      "Medium Industry (51–99)",
      "Large Industry (100–150)",
      "Large Industry (200+)",
    ],
  },
  {
    category: "CONTRACTORS",
    assetFees: [250, 500, 1000, 1500, 3000, 4000, 6000],
    workerFees: [250, 250, 500, 1500, 3000, 4000, 6000],
    assetTierNames: ["Micro", "Cottage A", "Cottage B", "Small A", "Small B", "Medium", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage A (6–10)",
      "Small A (11–50)",
      "Small B (51–99)",
      "Medium (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "WHOLESALERS_RETAILERS",
    assetFees: [200, 500, 1200, 2500, 3500, 5000, 6000],
    workerFees: [200, 200, 500, 2500, 3500, 5000, 6000],
    assetTierNames: ["Micro", "Cottage A", "Cottage B", "Small A", "Small B", "Medium", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage A (6–10)",
      "Small A (11–50)",
      "Small B (51–99)",
      "Medium (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "TRANSPORTATION",
    assetFees: [4000, 4000, 4000, 4000, 6000, 6000, 10000],
    workerFees: [4000, 4000, 4000, 6000, 6000, 10000, 10000],
    assetTierNames: [
      "Small-Scale",
      "Small-Scale",
      "Small-Scale",
      "Small-Scale",
      "Medium-Scale",
      "Medium-Scale",
      "Large-Scale",
    ],
    workerTierNames: [
      "Small-Scale (no workers)",
      "Small-Scale (1–5)",
      "Small-Scale (6–10)",
      "Medium-Scale (11–50)",
      "Medium-Scale (51–99)",
      "Large-Scale (100–150)",
      "Large-Scale (200+)",
    ],
  },
  {
    category: "COMMUNICATIONS",
    assetFees: [500, 1500, 1500, 3000, 5000, 8000, 8000],
    workerFees: [500, 500, 1500, 3000, 5000, 8000, 8000],
    assetTierNames: ["Micro", "Cottage", "Cottage", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "LESSORS_LAND",
    assetFees: [500, 1000, 1000, 1500, 2500, 4000, 4000],
    workerFees: [500, 500, 1000, 1500, 2500, 4000, 4000],
    assetTierNames: ["Micro", "Cottage", "Cottage", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "LESSORS_COMMERCIAL",
    assetFees: [500, 1000, 1000, 2000, 3000, 5000, 5000],
    workerFees: [500, 500, 1000, 2000, 3000, 5000, 5000],
    assetTierNames: ["Micro", "Cottage", "Cottage", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "HOTELS_MOTELS",
    assetFees: [800, 800, 1500, 1500, 2500, 4000, 4000],
    workerFees: [800, 800, 800, 1500, 2500, 4000, 4000],
    assetTierNames: [
      "Cottage (below ₱100K)",
      "Cottage",
      "Small",
      "Small",
      "Medium",
      "Large",
      "Large",
    ],
    workerTierNames: [
      "Cottage (no workers)",
      "Cottage (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "LODGING",
    assetFees: [300, 500, 500, 800, 1200, 2000, 2000],
    workerFees: [300, 300, 500, 800, 1200, 2000, 2000],
    assetTierNames: ["Micro", "Cottage", "Cottage", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "AMUSEMENT",
    assetFees: [300, 500, 500, 1000, 2000, 3000, 3000],
    workerFees: [300, 300, 500, 1000, 2000, 3000, 3000],
    assetTierNames: ["Micro", "Cottage", "Cottage", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "RESTAURANTS",
    assetFees: [300, 500, 500, 1000, 2000, 3000, 3000],
    workerFees: [300, 300, 500, 1000, 2000, 3000, 3000],
    assetTierNames: ["Micro", "Cottage", "Cottage", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "OTHER_INDUSTRIAL",
    assetFees: [3000, 3000, 3000, 3000, 5000, 10000, 10000],
    workerFees: [3000, 3000, 3000, 3000, 5000, 10000, 10000],
    assetTierNames: ["Small", "Small", "Small", "Small", "Medium", "Large", "Large"],
    workerTierNames: [
      "Small (no workers)",
      "Small (1–5)",
      "Small (6–10)",
      "Small (11–50)",
      "Medium (51–99)",
      "Large (100–150)",
      "Large (200+)",
    ],
  },
  {
    category: "GENERAL",
    assetFees: [200, 500, 1200, 2500, 3500, 5000, 6000],
    workerFees: [200, 200, 500, 2500, 3500, 5000, 6000],
    assetTierNames: ["Micro", "Cottage A", "Cottage B", "Small A", "Small B", "Medium", "Large"],
    workerTierNames: [
      "Micro (no workers)",
      "Micro (1–5)",
      "Cottage A (6–10)",
      "Small A (11–50)",
      "Small B (51–99)",
      "Medium (100–150)",
      "Large (200+)",
    ],
  },
];

function addFeeSeedRow(store: Map<string, { category: string; classification: string; amount: number }>, row: {
  category: string;
  classification: string;
  amount: number;
}) {
  const key = `${row.category}::${row.classification}`;
  const existing = store.get(key);
  if (existing && existing.amount !== row.amount) {
    throw new Error(
      `Conflicting default amount for ${row.category}/${row.classification}: ${existing.amount} vs ${row.amount}`
    );
  }
  if (!existing) {
    store.set(key, row);
  }
}

function buildDefaultFeeConfigurationItems() {
  const itemMap = new Map<string, { category: string; classification: string; amount: number }>();

  for (const table of FEE_TABLE_SEEDS) {
    for (let i = 0; i < 7; i += 1) {
      addFeeSeedRow(itemMap, {
        category: table.category,
        classification: table.assetTierNames[i],
        amount: table.assetFees[i],
      });
      addFeeSeedRow(itemMap, {
        category: table.category,
        classification: table.workerTierNames[i],
        amount: table.workerFees[i],
      });
    }
  }

  const wholesalerTable = FEE_TABLE_SEEDS.find((row) => row.category === "WHOLESALERS_RETAILERS");
  if (wholesalerTable) {
    for (let i = 0; i < 7; i += 1) {
      addFeeSeedRow(itemMap, {
        category: "LIQUOR_TOBACCO",
        classification: wholesalerTable.assetTierNames[i],
        amount: wholesalerTable.assetFees[i],
      });
      addFeeSeedRow(itemMap, {
        category: "LIQUOR_TOBACCO",
        classification: wholesalerTable.workerTierNames[i],
        amount: wholesalerTable.workerFees[i],
      });
    }
  }

  return Array.from(itemMap.values());
}

function isTransientPrismaError(error: unknown): boolean {
  const code = (error as { code?: string } | undefined)?.code;
  return code === "P1008" || code === "P2028";
}

async function withPrismaRetry<T>(label: string, fn: () => Promise<T>, retries = 5): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      if (!isTransientPrismaError(error) || attempt >= retries) {
        throw error;
      }
      const waitMs = attempt * 300;
      console.warn(`  ! Retry ${attempt}/${retries} for ${label} after transient DB error.`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

async function main() {
  console.log("Seeding database...");

  const users = [
    {
      email: "applicant@example.com",
      name: "Juan dela Cruz",
      password: "password123",
      role: "APPLICANT" as const,
    },
    {
      email: "bplo@example.com",
      name: "BPLO Officer",
      password: "password123",
      role: "BPLO" as const,
    },
    {
      email: "superadmin@example.com",
      name: "Super Admin",
      password: "password123",
      role: "SUPER_ADMIN" as const,
    },
  ];

  // Keep seed idempotent and avoid deleting user-managed accounts.

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = (await withPrismaRetry(`upsert user ${u.email}`, () =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role, passwordHash, isActive: true },
        create: { email: u.email, name: u.name, role: u.role, passwordHash, isActive: true },
      })
    )) as { role: string; email: string };
    console.log(`  ✓ ${user.role.padEnd(10)} ${user.email}`);
  }

  const superAdmin = await prisma.user.findUnique({
    where: { email: "superadmin@example.com" },
    select: { id: true },
  });

  const defaultFeeRows = buildDefaultFeeConfigurationItems();
  let feeCreated = 0;
  let feeExisting = 0;

  for (const row of defaultFeeRows) {
    const existing = await prisma.feeConfigurationItem.findUnique({
      where: {
        category_classification: {
          category: row.category,
          classification: row.classification,
        },
      },
      select: {
        id: true,
        amount: true,
        isActive: true,
        updatedById: true,
      },
    });

    await withPrismaRetry(`upsert fee config ${row.category}/${row.classification}`, () =>
      prisma.feeConfigurationItem.upsert({
        where: {
          category_classification: {
            category: row.category,
            classification: row.classification,
          },
        },
        update: {
          amount: existing?.amount,
          isActive: existing?.isActive,
          updatedById: existing?.updatedById,
        },
        create: {
          category: row.category,
          classification: row.classification,
          amount: row.amount,
          isActive: true,
          updatedById: superAdmin?.id ?? null,
        },
      })
    );

    if (existing) {
      feeExisting += 1;
    } else {
      feeCreated += 1;
    }
  }

  console.log(
    `  ✓ FeeConfigurationItem defaults seeded (${feeCreated} created, ${feeExisting} preserved existing)`
  );

  const existingSystemSetting = await prisma.systemFeeSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      renewalSurchargePercent: true,
      monthlyInterestPercent: true,
      liquorTobaccoAddOnPercent: true,
      powerDistributionFixedFee: true,
      privatePortFixedFee: true,
      updatedById: true,
    },
  });

  const systemSettingId = existingSystemSetting?.id ?? "system-fee-setting-default";

  await withPrismaRetry("upsert system fee setting", () =>
    prisma.systemFeeSetting.upsert({
      where: { id: systemSettingId },
      update: {
        renewalSurchargePercent: existingSystemSetting?.renewalSurchargePercent,
        monthlyInterestPercent: existingSystemSetting?.monthlyInterestPercent,
        liquorTobaccoAddOnPercent: existingSystemSetting?.liquorTobaccoAddOnPercent,
        powerDistributionFixedFee: existingSystemSetting?.powerDistributionFixedFee,
        privatePortFixedFee: existingSystemSetting?.privatePortFixedFee,
        updatedById: existingSystemSetting?.updatedById,
      },
      create: {
        id: systemSettingId,
        ...DEFAULT_SYSTEM_FEE_SETTINGS,
        updatedById: superAdmin?.id ?? null,
      },
    })
  );

  console.log(
    `  ✓ SystemFeeSetting defaults ${existingSystemSetting ? "preserved" : "created"} (surcharge 25%, interest 2%, liquor/tobacco 25%, power 10000, private port 50000)`
  );

  const existingRenewalExtension = await prisma.renewalExtension.findUnique({
    where: { id: "renewal-extension-example-disabled" },
    select: {
      title: true,
      startDate: true,
      endDate: true,
      isActive: true,
      waiveSurcharge: true,
      waiveInterest: true,
      remarks: true,
      updatedById: true,
    },
  });

  await withPrismaRetry("upsert renewal extension sample", () =>
    prisma.renewalExtension.upsert({
      where: { id: "renewal-extension-example-disabled" },
      update: {
        title: existingRenewalExtension?.title,
        startDate: existingRenewalExtension?.startDate,
        endDate: existingRenewalExtension?.endDate,
        isActive: existingRenewalExtension?.isActive,
        waiveSurcharge: existingRenewalExtension?.waiveSurcharge,
        waiveInterest: existingRenewalExtension?.waiveInterest,
        remarks: existingRenewalExtension?.remarks,
        updatedById: existingRenewalExtension?.updatedById,
      },
      create: {
        id: "renewal-extension-example-disabled",
        title: "Sample Renewal Extension (Disabled)",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-01-31T23:59:59.000Z"),
        isActive: false,
        waiveSurcharge: true,
        waiveInterest: true,
        remarks: "Seeded example row kept disabled by default.",
        updatedById: superAdmin?.id ?? null,
      },
    })
  );

  console.log("  ✓ RenewalExtension example seeded (disabled by default)");

  const applicant = await prisma.user.findUnique({
    where: { email: "applicant@example.com" },
    select: { id: true },
  });

  if (applicant) {
    await withPrismaRetry("delete applicant applications", () =>
      prisma.businessApplication.deleteMany({
        where: { applicantId: applicant.id },
      })
    );

    await withPrismaRetry("upsert default business record", () =>
      prisma.businessRecord.upsert({
        where: {
          registrationNumber: "DTI-2024-001223",
        },
        update: {
          applicantId: applicant.id,
          businessType: "Sole Proprietorship",
          tin: "123-456-789-000",
          businessName: "Green Valley Trading",
          tradeName: "Green Valley",
          ownerName: "Juan Dela Cruz",
          nationality: "Filipino",
          email: "applicant@example.com",
          phone: "+63 912 345 6789",
          mainOfficeAddress: "Poblacion, Enrique B. Magalona, Negros Occidental",
          businessAddress: "Poblacion, Enrique B. Magalona, Negros Occidental",
          sameAsMainOffice: true,
          businessArea: "120",
          totalFloorArea: "200",
          totalEmployees: "12",
          maleEmployees: "7",
          femaleEmployees: "5",
          employeesWithinMunicipality: "9",
          deliveryVehicles: "2",
          propertyOwnership: "Owned",
          taxDeclarationNumber: "TD-11-2233",
          propertyIdentificationNumber: "PIN-223344",
          taxIncentives: "None",
          businessActivity: "Retail and wholesale of general merchandise",
          lineOfBusiness: "Trading",
          assetSize: "5,000,000",
        },
        create: {
          applicantId: applicant.id,
          businessType: "Sole Proprietorship",
          registrationNumber: "DTI-2024-001223",
          tin: "123-456-789-000",
          businessName: "Green Valley Trading",
          tradeName: "Green Valley",
          ownerName: "Juan Dela Cruz",
          nationality: "Filipino",
          email: "applicant@example.com",
          phone: "+63 912 345 6789",
          mainOfficeAddress: "Poblacion, Enrique B. Magalona, Negros Occidental",
          businessAddress: "Poblacion, Enrique B. Magalona, Negros Occidental",
          sameAsMainOffice: true,
          businessArea: "120",
          totalFloorArea: "200",
          totalEmployees: "12",
          maleEmployees: "7",
          femaleEmployees: "5",
          employeesWithinMunicipality: "9",
          deliveryVehicles: "2",
          propertyOwnership: "Owned",
          taxDeclarationNumber: "TD-11-2233",
          propertyIdentificationNumber: "PIN-223344",
          taxIncentives: "None",
          businessActivity: "Retail and wholesale of general merchandise",
          lineOfBusiness: "Trading",
          assetSize: "5,000,000",
        },
      })
    );

    console.log("  ✓ Seeded default applicant business record");
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
