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

  addFeeSeedRow(itemMap, {
    category: "BANKS",
    classification: "Rural / Thrift / Savings Banks",
    amount: 4000,
  });
  addFeeSeedRow(itemMap, {
    category: "BANKS",
    classification: "Commercial and Development Banks",
    amount: 6000,
  });
  addFeeSeedRow(itemMap, {
    category: "BANKS",
    classification: "Universal Banks",
    amount: 8000,
  });
  addFeeSeedRow(itemMap, {
    category: "POWER_COMPANY",
    classification: "Fixed Fee",
    amount: DEFAULT_SYSTEM_FEE_SETTINGS.powerDistributionFixedFee,
  });
  addFeeSeedRow(itemMap, {
    category: "POWER_GEN_DIST",
    classification: "Fixed Fee",
    amount: DEFAULT_SYSTEM_FEE_SETTINGS.powerDistributionFixedFee,
  });
  addFeeSeedRow(itemMap, {
    category: "PRIVATE_PORT",
    classification: "Fixed Fee",
    amount: DEFAULT_SYSTEM_FEE_SETTINGS.privatePortFixedFee,
  });

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

function buildBusinessInfo(overrides: Record<string, unknown> = {}) {
  return {
    businessType: "Sole Proprietorship",
    registrationNumber: "",
    paymentFrequency: "ANNUAL",
    tin: "123456789000",
    businessName: "Debug Business",
    tradeName: "Debug Trade",
    ownerName: "Debug Owner",
    nationality: "Filipino",
    email: "applicant@example.com",
    phone: "+639123456789",
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
    taxDeclarationNumber: "TD-DBG-001",
    propertyIdentificationNumber: "PIN-DBG-001",
    taxIncentives: "None",
    businessActivity: "Retail and wholesale of general merchandise",
    lineOfBusiness: "Trading",
    assetSize: "5000000",
    ...overrides,
  };
}

async function seedBaseData() {
  console.log("Seeding base data...");

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

  console.log("Base seed complete");
}

async function syncDebugHistory(
  applicationId: string,
  events: Array<{
    actorId: string;
    actorRole: "APPLICANT" | "BPLO" | "SUPER_ADMIN";
    fromStatus: string | null;
    toStatus: string;
    remarks: string;
  }>
) {
  await withPrismaRetry(`clear debug history ${applicationId}`, () =>
    prisma.applicationHistory.deleteMany({
      where: {
        applicationId,
        remarks: {
          startsWith: "[DEBUG-SEED]",
        },
      },
    })
  );

  const baseTime = new Date("2026-05-01T08:00:00.000Z").getTime();
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    await withPrismaRetry(`create debug history ${applicationId}#${i + 1}`, () =>
      prisma.applicationHistory.create({
        data: {
          applicationId,
          actorId: event.actorId,
          actorRole: event.actorRole,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          remarks: `[DEBUG-SEED] ${event.remarks}`,
          createdAt: new Date(baseTime + i * 60_000),
        },
      })
    );
  }
}

async function seedUiDebugData() {
  console.log("Seeding debug UI data...");

  const [applicant, bplo, superAdmin] = await Promise.all([
    prisma.user.findUnique({ where: { email: "applicant@example.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "bplo@example.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "superadmin@example.com" }, select: { id: true } }),
  ]);

  if (!applicant?.id || !bplo?.id || !superAdmin?.id) {
    throw new Error("Debug seed requires base users to exist.");
  }

  const debugRecords = [
    {
      registrationNumber: "DTI-2026-0001",
      businessType: "Sole Proprietorship",
      businessName: "DTI Debug Trading",
      tradeName: "DTI Debug",
      ownerName: "Debug Sole Owner",
      nationality: "Filipino",
      email: "applicant@example.com",
      phone: "+639111000001",
      mainOfficeAddress: "DTI Main Office Address",
      businessAddress: "DTI Main Office Address",
      sameAsMainOffice: true,
      businessActivity: "General retail",
      lineOfBusiness: "Trading",
      assetSize: "2000000",
      businessStatus: "ACTIVE",
      closedAt: null,
      closureApplicationId: null,
    },
    {
      registrationNumber: "SEC-2026-0001",
      businessType: "Corporation",
      businessName: "SEC Corp Debug",
      tradeName: "SEC Corp",
      ownerName: "Debug Corporate President",
      nationality: "Japanese",
      email: "applicant@example.com",
      phone: "+639111000002",
      mainOfficeAddress: "SEC Main Office Address",
      businessAddress: "SEC Branch Address",
      sameAsMainOffice: false,
      businessActivity: "Professional services",
      lineOfBusiness: "Services",
      assetSize: "7500000",
      businessStatus: "ACTIVE",
      closedAt: null,
      closureApplicationId: null,
    },
    {
      registrationNumber: "SEC-2026-0002",
      businessType: "Partnership",
      businessName: "SEC Partnership Debug",
      tradeName: "SEC Partner",
      ownerName: "Debug Managing Partner",
      nationality: "Korean",
      email: "applicant@example.com",
      phone: "+639111000003",
      mainOfficeAddress: "SEC Partnership Main Address",
      businessAddress: "SEC Partnership Main Address",
      sameAsMainOffice: true,
      businessActivity: "Wholesale",
      lineOfBusiness: "Distribution",
      assetSize: "4500000",
      businessStatus: "ACTIVE",
      closedAt: null,
      closureApplicationId: null,
    },
    {
      registrationNumber: "CDA-2026-0001",
      businessType: "Cooperative",
      businessName: "CDA Cooperative Debug",
      tradeName: "CDA Coop",
      ownerName: "Debug Cooperative Chair",
      nationality: "Filipino",
      email: "applicant@example.com",
      phone: "+639111000004",
      mainOfficeAddress: "CDA Main Office Address",
      businessAddress: "CDA Main Office Address",
      sameAsMainOffice: true,
      businessActivity: "Agriculture cooperative",
      lineOfBusiness: "Cooperative",
      assetSize: "3500000",
      businessStatus: "ACTIVE",
      closedAt: null,
      closureApplicationId: null,
    },
  ];

  const recordsByReg = new Map<string, { id: string }>();
  for (const record of debugRecords) {
    const upserted = await withPrismaRetry(`upsert debug business record ${record.registrationNumber}`, () =>
      prisma.businessRecord.upsert({
        where: { registrationNumber: record.registrationNumber },
        update: {
          applicantId: applicant.id,
          businessType: record.businessType,
          tin: `TIN-${record.registrationNumber}`,
          businessName: record.businessName,
          tradeName: record.tradeName,
          ownerName: record.ownerName,
          nationality: record.nationality,
          email: record.email,
          phone: record.phone,
          mainOfficeAddress: record.mainOfficeAddress,
          businessAddress: record.businessAddress,
          sameAsMainOffice: record.sameAsMainOffice,
          businessArea: "150",
          totalFloorArea: "250",
          totalEmployees: "18",
          maleEmployees: "10",
          femaleEmployees: "8",
          employeesWithinMunicipality: "12",
          deliveryVehicles: "3",
          propertyOwnership: "Owned",
          taxDeclarationNumber: `TD-${record.registrationNumber}`,
          propertyIdentificationNumber: `PIN-${record.registrationNumber}`,
          taxIncentives: "None",
          businessActivity: record.businessActivity,
          lineOfBusiness: record.lineOfBusiness,
          assetSize: record.assetSize,
          businessStatus: record.businessStatus,
          closedAt: record.closedAt,
          closureApplicationId: record.closureApplicationId,
        },
        create: {
          applicantId: applicant.id,
          businessType: record.businessType,
          registrationNumber: record.registrationNumber,
          tin: `TIN-${record.registrationNumber}`,
          businessName: record.businessName,
          tradeName: record.tradeName,
          ownerName: record.ownerName,
          nationality: record.nationality,
          email: record.email,
          phone: record.phone,
          mainOfficeAddress: record.mainOfficeAddress,
          businessAddress: record.businessAddress,
          sameAsMainOffice: record.sameAsMainOffice,
          businessArea: "150",
          totalFloorArea: "250",
          totalEmployees: "18",
          maleEmployees: "10",
          femaleEmployees: "8",
          employeesWithinMunicipality: "12",
          deliveryVehicles: "3",
          propertyOwnership: "Owned",
          taxDeclarationNumber: `TD-${record.registrationNumber}`,
          propertyIdentificationNumber: `PIN-${record.registrationNumber}`,
          taxIncentives: "None",
          businessActivity: record.businessActivity,
          lineOfBusiness: record.lineOfBusiness,
          assetSize: record.assetSize,
          businessStatus: record.businessStatus,
          closedAt: record.closedAt,
          closureApplicationId: record.closureApplicationId,
        },
        select: { id: true },
      })
    );
    recordsByReg.set(record.registrationNumber, upserted as { id: string });
  }

  const debugApplications = [
    {
      applicationNumber: "NEW-DRAFT-001",
      applicationType: "NEW",
      status: "DRAFT",
      businessRecordRegistration: "DTI-2026-0001",
      formData: buildBusinessInfo({
        businessType: "Sole Proprietorship",
        registrationNumber: "DTI-2026-0001",
        businessName: "NEW-DRAFT-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-SUBMITTED-001",
      applicationType: "NEW",
      status: "SUBMITTED",
      businessRecordRegistration: "SEC-2026-0001",
      formData: buildBusinessInfo({
        businessType: "Corporation",
        registrationNumber: "SEC-2026-0001",
        nationality: "Japanese",
        sameAsMainOffice: false,
        mainOfficeAddress: "SEC Main Office Address",
        businessAddress: "SEC Branch Address",
        businessName: "NEW-SUBMITTED-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-UNDER-REVIEW-001",
      applicationType: "NEW",
      status: "UNDER_REVIEW",
      businessRecordRegistration: "SEC-2026-0002",
      formData: buildBusinessInfo({
        businessType: "Partnership",
        registrationNumber: "SEC-2026-0002",
        nationality: "Korean",
        businessName: "NEW-UNDER-REVIEW-001 Business",
      }),
    },
    {
      applicationNumber: "RENEWAL-ASSESSED-001",
      applicationType: "RENEWAL",
      status: "ASSESSED",
      businessRecordRegistration: "CDA-2026-0001",
      formData: buildBusinessInfo({
        businessType: "Cooperative",
        registrationNumber: "CDA-2026-0001",
        paymentFrequency: "BI_ANNUAL",
        businessName: "RENEWAL-ASSESSED-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-APPROVED-PAYMENT-001",
      applicationType: "NEW",
      status: "APPROVED_FOR_PAYMENT",
      businessRecordRegistration: "DTI-2026-0001",
      formData: buildBusinessInfo({
        registrationNumber: "DTI-2026-0001",
        paymentFrequency: "ANNUAL",
        businessName: "NEW-APPROVED-PAYMENT-001 Business",
      }),
    },
    {
      applicationNumber: "RENEWAL-PAID-001",
      applicationType: "RENEWAL",
      status: "PAID",
      businessRecordRegistration: "SEC-2026-0002",
      formData: buildBusinessInfo({
        businessType: "Partnership",
        registrationNumber: "SEC-2026-0002",
        paymentFrequency: "BI_ANNUAL",
        businessName: "RENEWAL-PAID-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-FOR-RELEASE-001",
      applicationType: "NEW",
      status: "FOR_RELEASE",
      businessRecordRegistration: "SEC-2026-0001",
      formData: buildBusinessInfo({
        businessType: "Corporation",
        registrationNumber: "SEC-2026-0001",
        paymentFrequency: "QUARTERLY",
        businessName: "NEW-FOR-RELEASE-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-RELEASED-001",
      applicationType: "NEW",
      status: "RELEASED",
      businessRecordRegistration: "DTI-2026-0001",
      formData: buildBusinessInfo({
        registrationNumber: "DTI-2026-0001",
        paymentFrequency: "ANNUAL",
        businessName: "NEW-RELEASED-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-RETURNED-001",
      applicationType: "NEW",
      status: "RETURNED_FOR_CORRECTION",
      businessRecordRegistration: "CDA-2026-0001",
      formData: buildBusinessInfo({
        businessType: "Cooperative",
        registrationNumber: "CDA-2026-0001",
        businessName: "NEW-RETURNED-001 Business",
      }),
    },
    {
      applicationNumber: "NEW-REJECTED-001",
      applicationType: "NEW",
      status: "REJECTED",
      businessRecordRegistration: "SEC-2026-0001",
      formData: buildBusinessInfo({
        businessType: "Corporation",
        registrationNumber: "SEC-2026-0001",
        businessName: "NEW-REJECTED-001 Business",
      }),
    },
    {
      applicationNumber: "CLOSURE-SUBMITTED-001",
      applicationType: "CLOSURE",
      status: "SUBMITTED",
      businessRecordRegistration: "SEC-2026-0002",
      formData: buildBusinessInfo({
        businessType: "Partnership",
        registrationNumber: "SEC-2026-0002",
        businessName: "CLOSURE-SUBMITTED-001 Business",
      }),
    },
    {
      applicationNumber: "CLOSURE-RELEASED-001",
      applicationType: "CLOSURE",
      status: "RELEASED",
      businessRecordRegistration: "SEC-2026-0002",
      formData: buildBusinessInfo({
        businessType: "Partnership",
        registrationNumber: "SEC-2026-0002",
        businessName: "CLOSURE-RELEASED-001 Business",
      }),
    },
    {
      applicationNumber: "DRAFT-MISSING-REGISTRATION",
      applicationType: "NEW",
      status: "DRAFT",
      businessRecordRegistration: null,
      formData: buildBusinessInfo({
        registrationNumber: "",
        businessName: "Draft Missing Registration",
      }),
    },
    {
      applicationNumber: "DRAFT-MISSING-NATIONALITY",
      applicationType: "NEW",
      status: "DRAFT",
      businessRecordRegistration: null,
      formData: buildBusinessInfo({
        nationality: "",
        businessName: "Draft Missing Nationality",
      }),
    },
    {
      applicationNumber: "DRAFT-MISSING-BUSINESS-ADDRESS",
      applicationType: "NEW",
      status: "DRAFT",
      businessRecordRegistration: null,
      formData: buildBusinessInfo({
        sameAsMainOffice: false,
        businessAddress: "",
        businessName: "Draft Missing Business Address",
      }),
    },
    {
      applicationNumber: "DRAFT-MISSING-PAYMENT-FREQUENCY",
      applicationType: "NEW",
      status: "DRAFT",
      businessRecordRegistration: null,
      formData: buildBusinessInfo({
        paymentFrequency: undefined,
        businessName: "Draft Missing Payment Frequency",
      }),
    },
    {
      applicationNumber: "DRAFT-MISSING-DOCUMENTS",
      applicationType: "NEW",
      status: "DRAFT",
      businessRecordRegistration: null,
      formData: buildBusinessInfo({
        businessName: "Draft Missing Documents",
      }),
    },
  ] as const;

  const applicationsByNumber = new Map<string, { id: string; status: string }>();
  for (const app of debugApplications) {
    const linkedRecord = app.businessRecordRegistration
      ? recordsByReg.get(app.businessRecordRegistration)
      : null;

    const submittedAt = app.status === "DRAFT" ? null : new Date("2026-05-01T09:00:00.000Z");

    const upserted = await withPrismaRetry(`upsert debug application ${app.applicationNumber}`, () =>
      prisma.businessApplication.upsert({
        where: { applicationNumber: app.applicationNumber },
        update: {
          applicantId: applicant.id,
          businessRecordId: linkedRecord?.id ?? null,
          applicationType: app.applicationType,
          status: app.status,
          formData: app.formData,
          submittedAt,
        },
        create: {
          applicationNumber: app.applicationNumber,
          applicantId: applicant.id,
          businessRecordId: linkedRecord?.id ?? null,
          applicationType: app.applicationType,
          status: app.status,
          formData: app.formData,
          submittedAt,
        },
        select: { id: true, status: true },
      })
    );

    applicationsByNumber.set(app.applicationNumber, upserted as { id: string; status: string });
  }

  const assessmentSeeds = [
    {
      applicationNumber: "NEW-APPROVED-PAYMENT-001",
      assessmentNumber: "TOP-DBG-ANNUAL-001",
      paymentFrequency: "ANNUAL",
      status: "GENERATED",
      annualAssessedAmount: 12000,
      releasePaymentAmount: 12000,
      amountPaid: 0,
      remainingBalance: 12000,
      paymentStatus: "UNPAID",
      mayorsPermitFee: 8000,
      regulatoryFees: 2500,
      additionalCharges: 500,
      penalties: 0,
      surcharge: 500,
      interest: 500,
      closureCertificateFee: 0,
      arrears: 0,
      otherCharges: 0,
      totalAmount: 12000,
      remarks: "[DEBUG-SEED] Annual payment frequency sample",
    },
    {
      applicationNumber: "RENEWAL-ASSESSED-001",
      assessmentNumber: "TOP-DBG-BIANNUAL-001",
      paymentFrequency: "BI_ANNUAL",
      status: "DRAFT",
      annualAssessedAmount: 9000,
      releasePaymentAmount: 4500,
      amountPaid: 0,
      remainingBalance: 9000,
      paymentStatus: "UNPAID",
      mayorsPermitFee: 5000,
      regulatoryFees: 2500,
      additionalCharges: 500,
      penalties: 500,
      surcharge: 250,
      interest: 250,
      closureCertificateFee: 0,
      arrears: 0,
      otherCharges: 0,
      totalAmount: 9000,
      remarks: "[DEBUG-SEED] Bi-annual payment frequency sample",
    },
    {
      applicationNumber: "NEW-FOR-RELEASE-001",
      assessmentNumber: "TOP-DBG-QUARTERLY-001",
      paymentFrequency: "QUARTERLY",
      status: "GENERATED",
      annualAssessedAmount: 8000,
      releasePaymentAmount: 2000,
      amountPaid: 2000,
      remainingBalance: 6000,
      paymentStatus: "PARTIALLY_PAID",
      mayorsPermitFee: 4500,
      regulatoryFees: 2500,
      additionalCharges: 500,
      penalties: 250,
      surcharge: 125,
      interest: 125,
      closureCertificateFee: 0,
      arrears: 0,
      otherCharges: 0,
      totalAmount: 8000,
      remarks: "[DEBUG-SEED] Quarterly payment frequency sample",
    },
    {
      applicationNumber: "CLOSURE-RELEASED-001",
      assessmentNumber: "TOP-DBG-CLOSURE-001",
      paymentFrequency: "ANNUAL",
      status: "GENERATED",
      annualAssessedAmount: 1000,
      releasePaymentAmount: 1000,
      amountPaid: 1000,
      remainingBalance: 0,
      paymentStatus: "PAID",
      mayorsPermitFee: 0,
      regulatoryFees: 0,
      additionalCharges: 0,
      penalties: 250,
      surcharge: 0,
      interest: 0,
      closureCertificateFee: 100,
      arrears: 500,
      otherCharges: 150,
      totalAmount: 1000,
      remarks: "[DEBUG-SEED] Closure fee sample",
    },
  ];

  for (const seed of assessmentSeeds) {
    const app = applicationsByNumber.get(seed.applicationNumber);
    if (!app) continue;

    await withPrismaRetry(`upsert debug fee assessment ${seed.applicationNumber}`, () =>
      prisma.feeAssessment.upsert({
        where: { applicationId: app.id },
        update: {
          assessmentNumber: seed.assessmentNumber,
          status: seed.status,
          paymentFrequency: seed.paymentFrequency,
          annualAssessedAmount: seed.annualAssessedAmount,
          releasePaymentAmount: seed.releasePaymentAmount,
          amountPaid: seed.amountPaid,
          remainingBalance: seed.remainingBalance,
          paymentStatus: seed.paymentStatus,
          mayorsPermitFee: seed.mayorsPermitFee,
          regulatoryFees: seed.regulatoryFees,
          additionalCharges: seed.additionalCharges,
          penalties: seed.penalties,
          surcharge: seed.surcharge,
          interest: seed.interest,
          closureCertificateFee: seed.closureCertificateFee,
          arrears: seed.arrears,
          otherCharges: seed.otherCharges,
          totalAmount: seed.totalAmount,
          remarks: seed.remarks,
          computedById: bplo.id,
          generatedAt: seed.status === "GENERATED" ? new Date("2026-05-02T08:00:00.000Z") : null,
        },
        create: {
          applicationId: app.id,
          assessmentNumber: seed.assessmentNumber,
          status: seed.status,
          paymentFrequency: seed.paymentFrequency,
          annualAssessedAmount: seed.annualAssessedAmount,
          releasePaymentAmount: seed.releasePaymentAmount,
          amountPaid: seed.amountPaid,
          remainingBalance: seed.remainingBalance,
          paymentStatus: seed.paymentStatus,
          mayorsPermitFee: seed.mayorsPermitFee,
          regulatoryFees: seed.regulatoryFees,
          additionalCharges: seed.additionalCharges,
          penalties: seed.penalties,
          surcharge: seed.surcharge,
          interest: seed.interest,
          closureCertificateFee: seed.closureCertificateFee,
          arrears: seed.arrears,
          otherCharges: seed.otherCharges,
          totalAmount: seed.totalAmount,
          remarks: seed.remarks,
          computedById: bplo.id,
          generatedAt: seed.status === "GENERATED" ? new Date("2026-05-02T08:00:00.000Z") : null,
        },
      })
    );
  }

  const releasedPermitApp = applicationsByNumber.get("NEW-RELEASED-001");
  if (releasedPermitApp) {
    await withPrismaRetry("upsert debug permit issuance NEW-RELEASED-001", () =>
      prisma.permitIssuance.upsert({
        where: { applicationId: releasedPermitApp.id },
        update: {
          documentNumber: "DBG-BP-NEW-RELEASED-001",
          documentType: "BUSINESS_PERMIT",
          status: "RELEASED",
          issuedAt: new Date("2026-05-03T08:00:00.000Z"),
          releasedAt: new Date("2026-05-04T08:00:00.000Z"),
          preparedById: bplo.id,
          releasedById: bplo.id,
          remarks: "[DEBUG-SEED] Released business permit sample",
        },
        create: {
          applicationId: releasedPermitApp.id,
          documentNumber: "DBG-BP-NEW-RELEASED-001",
          documentType: "BUSINESS_PERMIT",
          status: "RELEASED",
          issuedAt: new Date("2026-05-03T08:00:00.000Z"),
          releasedAt: new Date("2026-05-04T08:00:00.000Z"),
          preparedById: bplo.id,
          releasedById: bplo.id,
          remarks: "[DEBUG-SEED] Released business permit sample",
        },
      })
    );
  }

  const releasedClosureApp = applicationsByNumber.get("CLOSURE-RELEASED-001");
  if (releasedClosureApp) {
    await withPrismaRetry("upsert debug permit issuance CLOSURE-RELEASED-001", () =>
      prisma.permitIssuance.upsert({
        where: { applicationId: releasedClosureApp.id },
        update: {
          documentNumber: "DBG-CC-CLOSURE-RELEASED-001",
          documentType: "CLOSURE_CERTIFICATE",
          status: "RELEASED",
          issuedAt: new Date("2026-05-03T08:00:00.000Z"),
          releasedAt: new Date("2026-05-04T09:00:00.000Z"),
          preparedById: bplo.id,
          releasedById: bplo.id,
          remarks: "[DEBUG-SEED] Released closure certificate sample",
        },
        create: {
          applicationId: releasedClosureApp.id,
          documentNumber: "DBG-CC-CLOSURE-RELEASED-001",
          documentType: "CLOSURE_CERTIFICATE",
          status: "RELEASED",
          issuedAt: new Date("2026-05-03T08:00:00.000Z"),
          releasedAt: new Date("2026-05-04T09:00:00.000Z"),
          preparedById: bplo.id,
          releasedById: bplo.id,
          remarks: "[DEBUG-SEED] Released closure certificate sample",
        },
      })
    );

    const closureBusinessRecord = recordsByReg.get("SEC-2026-0002");
    if (closureBusinessRecord) {
      await withPrismaRetry("mark closure business record closed", () =>
        prisma.businessRecord.update({
          where: { id: closureBusinessRecord.id },
          data: {
            businessStatus: "CLOSED",
            closedAt: new Date(),
            closureApplicationId: releasedClosureApp.id,
          },
        })
      );
    }
  }

  const historyPlan: Record<string, Array<{
    actorId: string;
    actorRole: "APPLICANT" | "BPLO" | "SUPER_ADMIN";
    fromStatus: string | null;
    toStatus: string;
    remarks: string;
  }>> = {
    "NEW-DRAFT-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: null,
        toStatus: "DRAFT",
        remarks: "Applicant saved draft application",
      },
    ],
    "NEW-SUBMITTED-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        remarks: "Applicant submitted application",
      },
    ],
    "NEW-UNDER-REVIEW-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        remarks: "Applicant submitted application",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "SUBMITTED",
        toStatus: "UNDER_REVIEW",
        remarks: "BPLO marked application under review",
      },
    ],
    "RENEWAL-ASSESSED-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        remarks: "Applicant submitted renewal",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "SUBMITTED",
        toStatus: "UNDER_REVIEW",
        remarks: "BPLO started review",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "UNDER_REVIEW",
        toStatus: "ASSESSED",
        remarks: "BPLO completed assessment",
      },
    ],
    "NEW-APPROVED-PAYMENT-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        remarks: "Applicant submitted application",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "SUBMITTED",
        toStatus: "UNDER_REVIEW",
        remarks: "BPLO started review",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "UNDER_REVIEW",
        toStatus: "ASSESSED",
        remarks: "BPLO completed assessment",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "ASSESSED",
        toStatus: "APPROVED_FOR_PAYMENT",
        remarks: "BPLO generated TOP",
      },
    ],
    "RENEWAL-PAID-001": [
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "APPROVED_FOR_PAYMENT",
        toStatus: "PAID",
        remarks: "BPLO verified payment",
      },
    ],
    "NEW-FOR-RELEASE-001": [
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "PAID",
        toStatus: "FOR_RELEASE",
        remarks: "BPLO prepared permit for release",
      },
    ],
    "NEW-RELEASED-001": [
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "FOR_RELEASE",
        toStatus: "RELEASED",
        remarks: "BPLO released business permit",
      },
    ],
    "NEW-RETURNED-001": [
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "UNDER_REVIEW",
        toStatus: "RETURNED_FOR_CORRECTION",
        remarks: "BPLO returned application for correction",
      },
    ],
    "NEW-REJECTED-001": [
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "UNDER_REVIEW",
        toStatus: "REJECTED",
        remarks: "BPLO rejected application",
      },
    ],
    "CLOSURE-SUBMITTED-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        remarks: "Applicant submitted closure application",
      },
    ],
    "CLOSURE-RELEASED-001": [
      {
        actorId: applicant.id,
        actorRole: "APPLICANT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        remarks: "Applicant submitted closure application",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "SUBMITTED",
        toStatus: "UNDER_REVIEW",
        remarks: "BPLO started closure review",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "UNDER_REVIEW",
        toStatus: "ASSESSED",
        remarks: "BPLO assessed closure",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "ASSESSED",
        toStatus: "APPROVED_FOR_PAYMENT",
        remarks: "BPLO generated closure TOP",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "APPROVED_FOR_PAYMENT",
        toStatus: "PAID",
        remarks: "BPLO verified closure payment",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "PAID",
        toStatus: "FOR_RELEASE",
        remarks: "BPLO prepared closure certificate",
      },
      {
        actorId: bplo.id,
        actorRole: "BPLO",
        fromStatus: "FOR_RELEASE",
        toStatus: "RELEASED",
        remarks: "BPLO released closure certificate",
      },
    ],
  };

  for (const [applicationNumber, events] of Object.entries(historyPlan)) {
    const app = applicationsByNumber.get(applicationNumber);
    if (!app) continue;
    await syncDebugHistory(app.id, events);
  }

  console.log("Debug seed complete");
}

async function main() {
  console.log("Seeding database...");

  await seedBaseData();

  if (process.env.SEED_DEBUG === "true") {
    await seedUiDebugData();
  } else {
    console.log("Debug seed skipped unless SEED_DEBUG=true");
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

export {};
