import { prisma } from "@/lib/prisma";

export type FeeCategoryKey =
  | "MANUFACTURERS"
  | "BANKS"
  | "OTHER_FINANCIAL"
  | "CONTRACTORS"
  | "WHOLESALERS_RETAILERS"
  | "TRANSPORTATION"
  | "COMMUNICATIONS"
  | "LESSORS_LAND"
  | "LESSORS_COMMERCIAL"
  | "HOTELS_MOTELS"
  | "LODGING"
  | "AMUSEMENT"
  | "RESTAURANTS"
  | "LIQUOR_TOBACCO"
  | "POWER_COMPANY"
  | "POWER_GEN_DIST"
  | "OTHER_INDUSTRIAL"
  | "PRIVATE_PORT"
  | "GENERAL";

export type FeeCategoryOption = {
  key: FeeCategoryKey;
  label: string;
  classifications: string[];
};

export const FIXED_FEE_CLASSIFICATION = "Fixed Fee";

export const BANK_CLASSIFICATIONS = [
  "Rural / Thrift / Savings Banks",
  "Commercial and Development Banks",
  "Universal Banks",
] as const;

export const DEFAULT_CLASSIFICATIONS = [
  "Micro Industry",
  "Cottage Industries A",
  "Cottage Industries B",
  "Small-Scale Industries A",
  "Small-Scale Industries B",
  "Medium-Scale Industries",
  "Large-Scale Industries",
] as const;

export const FEE_CATEGORY_OPTIONS: FeeCategoryOption[] = [
  {
    key: "MANUFACTURERS",
    label: "Manufacturers / Importers / Producers",
    classifications: [...DEFAULT_CLASSIFICATIONS],
  },
  {
    key: "BANKS",
    label: "Banks",
    classifications: [...BANK_CLASSIFICATIONS],
  },
  {
    key: "OTHER_FINANCIAL",
    label: "Other Financial Institutions",
    classifications: [
      "Micro Industry",
      "Cottage Industry (₱100K–₱250K)",
      "Cottage Industry (₱250K–₱500K)",
      "Small Industry (₱500K–₱2M)",
      "Medium Industry (₱2M–₱5M)",
      "Large Industry (₱5M–₱20M)",
      "Large Industry (Over ₱20M)",
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
    key: "CONTRACTORS",
    label: "Contractors and Service Providers",
    classifications: [
      "Micro",
      "Cottage A",
      "Cottage B",
      "Small A",
      "Small B",
      "Medium",
      "Large",
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
    key: "WHOLESALERS_RETAILERS",
    label: "Wholesalers / Retailers / Dealers / Distributors",
    classifications: [
      "Micro",
      "Cottage A",
      "Cottage B",
      "Small A",
      "Small B",
      "Medium",
      "Large",
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
    key: "TRANSPORTATION",
    label: "Transportation Operations",
    classifications: [
      "Small-Scale",
      "Medium-Scale",
      "Large-Scale",
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
    key: "COMMUNICATIONS",
    label: "Communications",
    classifications: [
      "Micro",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "LESSORS_LAND",
    label: "Lessors of Real Estate - Land",
    classifications: [
      "Micro",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "LESSORS_COMMERCIAL",
    label: "Lessors of Real Estate - Commercial Buildings",
    classifications: [
      "Micro",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "HOTELS_MOTELS",
    label: "Hotels / Motels / Pension Houses / Apartelles",
    classifications: [
      "Cottage (below ₱100K)",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "LODGING",
    label: "Lodging / Boarding Houses",
    classifications: [
      "Micro",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "AMUSEMENT",
    label: "Amusement Places",
    classifications: [
      "Micro",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "RESTAURANTS",
    label: "Restaurants / Cafes / Catering Services",
    classifications: [
      "Micro",
      "Cottage",
      "Small",
      "Medium",
      "Large",
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
    key: "LIQUOR_TOBACCO",
    label: "Liquor and Tobacco Businesses",
    classifications: [
      "Micro",
      "Cottage A",
      "Cottage B",
      "Small A",
      "Small B",
      "Medium",
      "Large",
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
    key: "POWER_COMPANY",
    label: "Power Companies / Hydropower Plants",
    classifications: [FIXED_FEE_CLASSIFICATION],
  },
  {
    key: "POWER_GEN_DIST",
    label: "Power Generation and Distribution",
    classifications: [FIXED_FEE_CLASSIFICATION],
  },
  {
    key: "OTHER_INDUSTRIAL",
    label: "Other Industrial Companies",
    classifications: [
      "Small",
      "Medium",
      "Large",
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
    key: "PRIVATE_PORT",
    label: "Private Ports / Wharves",
    classifications: [FIXED_FEE_CLASSIFICATION],
  },
  {
    key: "GENERAL",
    label: "General Business",
    classifications: [
      "Micro",
      "Cottage A",
      "Cottage B",
      "Small A",
      "Small B",
      "Medium",
      "Large",
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

export const DEFAULT_SYSTEM_FEE_SETTINGS = {
  renewalSurchargePercent: 25,
  monthlyInterestPercent: 2,
  liquorTobaccoAddOnPercent: 25,
  powerDistributionFixedFee: 10000,
  privatePortFixedFee: 50000,
} as const;

export type FeeConfigurationItemDto = {
  id: string;
  category: FeeCategoryKey;
  classification: string;
  amount: number;
  isActive: boolean;
  updatedAt: string;
};

export type SystemFeeSettingDto = {
  id: string;
  renewalSurchargePercent: number;
  monthlyInterestPercent: number;
  liquorTobaccoAddOnPercent: number;
  powerDistributionFixedFee: number;
  privatePortFixedFee: number;
  updatedAt: string;
};

export type RenewalExtensionDto = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  waiveSurcharge: boolean;
  waiveInterest: boolean;
  remarks: string | null;
  updatedAt: string;
};

export type RuntimeFeeSettings = {
  penalties: {
    renewalSurchargePercent: number;
    monthlyInterestPercent: number;
    liquorTobaccoAddOnPercent: number;
  };
  fixed: {
    powerCompanyFixedFee: number;
    powerGenerationDistributionFixedFee: number;
    privatePortFixedFee: number;
  };
  feeOverrides: Array<{
    category: FeeCategoryKey;
    classification: string;
    amount: number;
  }>;
  activeExtension: {
    id: string;
    waiveSurcharge: boolean;
    waiveInterest: boolean;
    startDate: string;
    endDate: string;
  } | null;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return roundMoney(value);
}

function findFixedFeeOverride(
  rows: Array<{
    category: FeeCategoryKey;
    classification: string;
    amount: number;
    updatedAt: Date;
  }>,
  category: FeeCategoryKey
) {
  return rows.find(
    (row) => row.category === category && row.classification === FIXED_FEE_CLASSIFICATION
  );
}

function resolveFixedFeeAmount(input: {
  legacyAmount: number;
  legacyUpdatedAt: Date;
  overrideRow?: { amount: number; updatedAt: Date };
}): number {
  if (!input.overrideRow) {
    return input.legacyAmount;
  }

  return input.overrideRow.updatedAt >= input.legacyUpdatedAt
    ? input.overrideRow.amount
    : input.legacyAmount;
}

export async function listFeeConfigurationItems(): Promise<FeeConfigurationItemDto[]> {
  const items = await prisma.feeConfigurationItem.findMany({
    orderBy: [{ category: "asc" }, { classification: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    category: item.category as FeeCategoryKey,
    classification: item.classification,
    amount: item.amount,
    isActive: item.isActive,
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function upsertFeeConfigurationItem(input: {
  category: FeeCategoryKey;
  classification: string;
  amount: number;
  isActive: boolean;
  updatedById: string;
}): Promise<FeeConfigurationItemDto> {
  const classification = input.classification.trim();
  if (!classification) {
    throw new Error("Size classification is required.");
  }

  const amount = clampNonNegative(input.amount);
  const row = await prisma.feeConfigurationItem.upsert({
    where: {
      category_classification: {
        category: input.category,
        classification,
      },
    },
    create: {
      category: input.category,
      classification,
      amount,
      isActive: input.isActive,
      updatedById: input.updatedById,
    },
    update: {
      amount,
      isActive: input.isActive,
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    category: row.category as FeeCategoryKey,
    classification: row.classification,
    amount: row.amount,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateFeeConfigurationItemById(input: {
  id: string;
  amount?: number;
  isActive?: boolean;
  updatedById: string;
}): Promise<FeeConfigurationItemDto> {
  const row = await prisma.feeConfigurationItem.update({
    where: { id: input.id },
    data: {
      ...(typeof input.amount === "number" ? { amount: clampNonNegative(input.amount) } : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    category: row.category as FeeCategoryKey,
    classification: row.classification,
    amount: row.amount,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getOrCreateSystemFeeSetting(): Promise<SystemFeeSettingDto> {
  const existing = await prisma.systemFeeSetting.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const row =
    existing ??
    (await prisma.systemFeeSetting.create({
      data: {
        ...DEFAULT_SYSTEM_FEE_SETTINGS,
      },
    }));

  return {
    id: row.id,
    renewalSurchargePercent: row.renewalSurchargePercent,
    monthlyInterestPercent: row.monthlyInterestPercent,
    liquorTobaccoAddOnPercent: row.liquorTobaccoAddOnPercent,
    powerDistributionFixedFee: row.powerDistributionFixedFee,
    privatePortFixedFee: row.privatePortFixedFee,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateSystemFeeSetting(input: {
  renewalSurchargePercent: number;
  monthlyInterestPercent: number;
  liquorTobaccoAddOnPercent: number;
  powerDistributionFixedFee?: number;
  privatePortFixedFee?: number;
  updatedById: string;
}): Promise<SystemFeeSettingDto> {
  const current = await getOrCreateSystemFeeSetting();
  const row = await prisma.systemFeeSetting.update({
    where: { id: current.id },
    data: {
      renewalSurchargePercent: clampNonNegative(input.renewalSurchargePercent),
      monthlyInterestPercent: clampNonNegative(input.monthlyInterestPercent),
      liquorTobaccoAddOnPercent: clampNonNegative(input.liquorTobaccoAddOnPercent),
      powerDistributionFixedFee:
        typeof input.powerDistributionFixedFee === "number"
          ? clampNonNegative(input.powerDistributionFixedFee)
          : undefined,
      privatePortFixedFee:
        typeof input.privatePortFixedFee === "number"
          ? clampNonNegative(input.privatePortFixedFee)
          : undefined,
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    renewalSurchargePercent: row.renewalSurchargePercent,
    monthlyInterestPercent: row.monthlyInterestPercent,
    liquorTobaccoAddOnPercent: row.liquorTobaccoAddOnPercent,
    powerDistributionFixedFee: row.powerDistributionFixedFee,
    privatePortFixedFee: row.privatePortFixedFee,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRenewalExtensions(): Promise<RenewalExtensionDto[]> {
  const rows = await prisma.renewalExtension.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
    waiveSurcharge: row.waiveSurcharge,
    waiveInterest: row.waiveInterest,
    remarks: row.remarks,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

async function ensureNoActiveOverlap(startDate: Date, endDate: Date, ignoreId?: string) {
  const overlap = await prisma.renewalExtension.findFirst({
    where: {
      isActive: true,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true, title: true },
  });

  if (overlap) {
    throw new Error(`Active extension overlaps with existing extension: ${overlap.title}.`);
  }
}

export async function createRenewalExtension(input: {
  title: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  waiveSurcharge: boolean;
  waiveInterest: boolean;
  remarks?: string;
  updatedById: string;
}): Promise<RenewalExtensionDto> {
  const title = input.title.trim();
  if (!title) throw new Error("Extension title is required.");
  if (input.endDate < input.startDate) {
    throw new Error("End date cannot be before start date.");
  }

  if (input.isActive) {
    await ensureNoActiveOverlap(input.startDate, input.endDate);
  }

  const row = await prisma.renewalExtension.create({
    data: {
      title,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: input.isActive,
      waiveSurcharge: input.waiveSurcharge,
      waiveInterest: input.waiveInterest,
      remarks: input.remarks?.trim() || null,
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
    waiveSurcharge: row.waiveSurcharge,
    waiveInterest: row.waiveInterest,
    remarks: row.remarks,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function toggleRenewalExtension(input: {
  extensionId: string;
  isActive: boolean;
  updatedById: string;
}): Promise<RenewalExtensionDto> {
  const current = await prisma.renewalExtension.findUnique({
    where: { id: input.extensionId },
  });

  if (!current) {
    throw new Error("Extension not found.");
  }

  if (input.isActive) {
    await ensureNoActiveOverlap(current.startDate, current.endDate, current.id);
  }

  const row = await prisma.renewalExtension.update({
    where: { id: input.extensionId },
    data: {
      isActive: input.isActive,
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
    waiveSurcharge: row.waiveSurcharge,
    waiveInterest: row.waiveInterest,
    remarks: row.remarks,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getRuntimeFeeSettings(now = new Date()): Promise<RuntimeFeeSettings> {
  const [penalties, feeOverrides, activeExtension] = await Promise.all([
    getOrCreateSystemFeeSetting(),
    prisma.feeConfigurationItem.findMany({
      where: { isActive: true },
      select: { category: true, classification: true, amount: true, updatedAt: true },
      orderBy: [{ category: "asc" }, { classification: "asc" }],
    }),
    prisma.renewalExtension.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        waiveSurcharge: true,
        waiveInterest: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  const feeOverrideRows = feeOverrides.map((row) => ({
    category: row.category as FeeCategoryKey,
    classification: row.classification,
    amount: row.amount,
    updatedAt: row.updatedAt,
  }));
  const penaltiesUpdatedAt = new Date(penalties.updatedAt);
  const powerCompanyOverride = findFixedFeeOverride(feeOverrideRows, "POWER_COMPANY");
  const powerGenDistOverride = findFixedFeeOverride(feeOverrideRows, "POWER_GEN_DIST");
  const privatePortOverride = findFixedFeeOverride(feeOverrideRows, "PRIVATE_PORT");

  return {
    penalties: {
      renewalSurchargePercent: penalties.renewalSurchargePercent,
      monthlyInterestPercent: penalties.monthlyInterestPercent,
      liquorTobaccoAddOnPercent: penalties.liquorTobaccoAddOnPercent,
    },
    fixed: {
      powerCompanyFixedFee: resolveFixedFeeAmount({
        legacyAmount: penalties.powerDistributionFixedFee,
        legacyUpdatedAt: penaltiesUpdatedAt,
        overrideRow: powerCompanyOverride,
      }),
      powerGenerationDistributionFixedFee: resolveFixedFeeAmount({
        legacyAmount: penalties.powerDistributionFixedFee,
        legacyUpdatedAt: penaltiesUpdatedAt,
        overrideRow: powerGenDistOverride,
      }),
      privatePortFixedFee: resolveFixedFeeAmount({
        legacyAmount: penalties.privatePortFixedFee,
        legacyUpdatedAt: penaltiesUpdatedAt,
        overrideRow: privatePortOverride,
      }),
    },
    feeOverrides: feeOverrideRows.map((row) => ({
      category: row.category,
      classification: row.classification,
      amount: row.amount,
    })),
    activeExtension: activeExtension
      ? {
          id: activeExtension.id,
          waiveSurcharge: activeExtension.waiveSurcharge,
          waiveInterest: activeExtension.waiveInterest,
          startDate: activeExtension.startDate.toISOString(),
          endDate: activeExtension.endDate.toISOString(),
        }
      : null,
  };
}
