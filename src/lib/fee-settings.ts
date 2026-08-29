import { prisma } from "@/lib/prisma";
import { toMoneyNumber } from "@/lib/money";

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
  key: FeeCategoryKey | string;
  label: string;
  classifications: string[];
  isCustom?: boolean;
};

const CONFIGURABLE_FEE_CATEGORY_KEYS = new Set<string>();

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
    label: "Restaurants / Cafés / Catering Services",
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
];

for (const option of FEE_CATEGORY_OPTIONS) {
  CONFIGURABLE_FEE_CATEGORY_KEYS.add(option.key);
}

export const DEFAULT_SYSTEM_FEE_SETTINGS = {
  renewalSurchargePercent: 25,
  monthlyInterestPercent: 2,
  liquorTobaccoAddOnPercent: 25,
  powerDistributionFixedFee: 10000,
  privatePortFixedFee: 50000,
  renewalComplianceMinorPenalty: 0,
  renewalComplianceMajorPenalty: 0,
  renewalComplianceSeverePenalty: 0,
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
  jitPortalEnabled: boolean;
  renewalComplianceMinorPenalty: number;
  renewalComplianceMajorPenalty: number;
  renewalComplianceSeverePenalty: number;
  updatedAt: string;
};

export type RenewalExtensionDto = {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  waiveSurcharge: boolean;
  waiveInterest: boolean;
  updatedAt: string;
};

export function formatRenewalExtensionPeriod(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return `${start.toLocaleDateString("en-PH")} - ${end.toLocaleDateString("en-PH")}`;
}

function buildRenewalExtensionTitle(startDate: Date, endDate: Date): string {
  return `Renewal Extension (${formatRenewalExtensionPeriod(startDate, endDate)})`;
}

export type RuntimeFeeSettings = {
  penalties: {
    renewalSurchargePercent: number;
    monthlyInterestPercent: number;
    liquorTobaccoAddOnPercent: number;
    renewalComplianceMinorPenalty: number;
    renewalComplianceMajorPenalty: number;
    renewalComplianceSeverePenalty: number;
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

function isConfigurableFeeCategory(category: FeeCategoryKey): boolean {
  return CONFIGURABLE_FEE_CATEGORY_KEYS.has(category);
}

function parseClassificationsJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function slugifyFeeCategoryKey(label: string): string {
  const normalized = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalized) return "CUSTOM_CATEGORY";
  return normalized.startsWith("CUSTOM_") ? normalized : `CUSTOM_${normalized}`;
}

export async function listCustomFeeCategories(): Promise<FeeCategoryOption[]> {
  const rows = await prisma.feeConfigurationCategory.findMany({
    where: { isActive: true },
    orderBy: { label: "asc" },
  });

  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    classifications: parseClassificationsJson(row.classifications),
    isCustom: true,
  }));
}

export async function getAllFeeCategoryOptions(): Promise<FeeCategoryOption[]> {
  const custom = await listCustomFeeCategories();
  return [...FEE_CATEGORY_OPTIONS, ...custom];
}

async function getConfigurableCategoryKeySet(): Promise<Set<string>> {
  const custom = await prisma.feeConfigurationCategory.findMany({
    where: { isActive: true },
    select: { key: true },
  });

  return new Set([...CONFIGURABLE_FEE_CATEGORY_KEYS, ...custom.map((row) => row.key)]);
}

async function isConfigurableFeeCategoryKey(category: string): Promise<boolean> {
  const keys = await getConfigurableCategoryKeySet();
  return keys.has(category);
}

export function isValidClassificationForOptions(
  category: string,
  classification: string,
  options: FeeCategoryOption[]
): boolean {
  const option = options.find((item) => item.key === category);
  if (!option) return false;
  return option.classifications.includes(classification.trim());
}

export async function createFeeConfigurationCategory(input: {
  label: string;
  key?: string;
  classifications: string[];
  updatedById: string;
}): Promise<FeeCategoryOption> {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Category label is required.");
  }

  const classifications = input.classifications.map((item) => item.trim()).filter(Boolean);
  if (classifications.length === 0) {
    throw new Error("At least one size classification is required.");
  }

  let key = (input.key?.trim() || slugifyFeeCategoryKey(label)).toUpperCase();
  if (!/^CUSTOM_[A-Z0-9_]+$/.test(key)) {
    key = slugifyFeeCategoryKey(label);
  }

  if (FEE_CATEGORY_OPTIONS.some((item) => item.key === key)) {
    throw new Error("This category key conflicts with a built-in category.");
  }

  const existing = await prisma.feeConfigurationCategory.findUnique({ where: { key } });
  if (existing) {
    throw new Error("A custom category with this key already exists.");
  }

  const row = await prisma.feeConfigurationCategory.create({
    data: {
      key,
      label,
      classifications,
      isActive: true,
      updatedById: input.updatedById,
    },
  });

  return {
    key: row.key,
    label: row.label,
    classifications: parseClassificationsJson(row.classifications),
    isCustom: true,
  };
}

export async function listFeeConfigurationItems(): Promise<FeeConfigurationItemDto[]> {
  const [items, configurableKeys] = await Promise.all([
    prisma.feeConfigurationItem.findMany({
      orderBy: [{ category: "asc" }, { classification: "asc" }],
    }),
    getConfigurableCategoryKeySet(),
  ]);

  return items
    .filter((item) => configurableKeys.has(item.category))
    .map((item) => ({
      id: item.id,
      category: item.category as FeeCategoryKey,
      classification: item.classification,
      amount: toMoneyNumber(item.amount),
      isActive: item.isActive,
      updatedAt: item.updatedAt.toISOString(),
    }));
}

export async function upsertFeeConfigurationItem(input: {
  category: string;
  classification: string;
  amount: number;
  isActive: boolean;
  updatedById: string;
}): Promise<FeeConfigurationItemDto> {
  if (!(await isConfigurableFeeCategoryKey(input.category))) {
    throw new Error("Invalid fee category.");
  }

  const options = await getAllFeeCategoryOptions();
  const classification = input.classification.trim();
  if (!classification) {
    throw new Error("Size classification is required.");
  }

  if (!isValidClassificationForOptions(input.category, classification, options)) {
    throw new Error("Invalid size classification for the selected business category.");
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
    amount: toMoneyNumber(row.amount),
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
    amount: toMoneyNumber(row.amount),
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
    powerDistributionFixedFee: toMoneyNumber(row.powerDistributionFixedFee),
    privatePortFixedFee: toMoneyNumber(row.privatePortFixedFee),
    jitPortalEnabled: row.jitPortalEnabled,
    renewalComplianceMinorPenalty: toMoneyNumber(row.renewalComplianceMinorPenalty),
    renewalComplianceMajorPenalty: toMoneyNumber(row.renewalComplianceMajorPenalty),
    renewalComplianceSeverePenalty: toMoneyNumber(row.renewalComplianceSeverePenalty),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateSystemFeeSetting(input: {
  renewalSurchargePercent: number;
  monthlyInterestPercent: number;
  liquorTobaccoAddOnPercent: number;
  powerDistributionFixedFee?: number;
  privatePortFixedFee?: number;
  renewalComplianceMinorPenalty?: number;
  renewalComplianceMajorPenalty?: number;
  renewalComplianceSeverePenalty?: number;
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
      renewalComplianceMinorPenalty:
        typeof input.renewalComplianceMinorPenalty === "number"
          ? clampNonNegative(input.renewalComplianceMinorPenalty)
          : undefined,
      renewalComplianceMajorPenalty:
        typeof input.renewalComplianceMajorPenalty === "number"
          ? clampNonNegative(input.renewalComplianceMajorPenalty)
          : undefined,
      renewalComplianceSeverePenalty:
        typeof input.renewalComplianceSeverePenalty === "number"
          ? clampNonNegative(input.renewalComplianceSeverePenalty)
          : undefined,
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    renewalSurchargePercent: row.renewalSurchargePercent,
    monthlyInterestPercent: row.monthlyInterestPercent,
    liquorTobaccoAddOnPercent: row.liquorTobaccoAddOnPercent,
    powerDistributionFixedFee: toMoneyNumber(row.powerDistributionFixedFee),
    privatePortFixedFee: toMoneyNumber(row.privatePortFixedFee),
    jitPortalEnabled: row.jitPortalEnabled,
    renewalComplianceMinorPenalty: toMoneyNumber(row.renewalComplianceMinorPenalty),
    renewalComplianceMajorPenalty: toMoneyNumber(row.renewalComplianceMajorPenalty),
    renewalComplianceSeverePenalty: toMoneyNumber(row.renewalComplianceSeverePenalty),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRenewalExtensions(): Promise<RenewalExtensionDto[]> {
  const rows = await prisma.renewalExtension.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
    waiveSurcharge: row.waiveSurcharge,
    waiveInterest: row.waiveInterest,
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
    select: { id: true, startDate: true, endDate: true },
  });

  if (overlap) {
    throw new Error(
      `Active extension overlaps with existing extension (${formatRenewalExtensionPeriod(overlap.startDate, overlap.endDate)}).`
    );
  }
}

export async function createRenewalExtension(input: {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  waiveSurcharge: boolean;
  waiveInterest: boolean;
  updatedById: string;
}): Promise<RenewalExtensionDto> {
  if (input.endDate < input.startDate) {
    throw new Error("End date cannot be before start date.");
  }

  if (input.isActive) {
    await ensureNoActiveOverlap(input.startDate, input.endDate);
  }

  const row = await prisma.renewalExtension.create({
    data: {
      title: buildRenewalExtensionTitle(input.startDate, input.endDate),
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: input.isActive,
      waiveSurcharge: input.waiveSurcharge,
      waiveInterest: input.waiveInterest,
      remarks: null,
      updatedById: input.updatedById,
    },
  });

  return {
    id: row.id,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
    waiveSurcharge: row.waiveSurcharge,
    waiveInterest: row.waiveInterest,
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
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    isActive: row.isActive,
    waiveSurcharge: row.waiveSurcharge,
    waiveInterest: row.waiveInterest,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getRuntimeFeeSettings(now = new Date()): Promise<RuntimeFeeSettings> {
  const [penalties, feeOverrides, activeExtension, configurableKeys] = await Promise.all([
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
    getConfigurableCategoryKeySet(),
  ]);

  const feeOverrideRows = feeOverrides
    .map((row) => ({
      category: row.category as FeeCategoryKey,
      classification: row.classification,
      amount: toMoneyNumber(row.amount),
      updatedAt: row.updatedAt,
    }))
    .filter((row) => configurableKeys.has(row.category));
  const penaltiesUpdatedAt = new Date(penalties.updatedAt);
  const powerCompanyOverride = findFixedFeeOverride(feeOverrideRows, "POWER_COMPANY");
  const powerGenDistOverride = findFixedFeeOverride(feeOverrideRows, "POWER_GEN_DIST");
  const privatePortOverride = findFixedFeeOverride(feeOverrideRows, "PRIVATE_PORT");

  return {
    penalties: {
      renewalSurchargePercent: penalties.renewalSurchargePercent,
      monthlyInterestPercent: penalties.monthlyInterestPercent,
      liquorTobaccoAddOnPercent: penalties.liquorTobaccoAddOnPercent,
      renewalComplianceMinorPenalty: penalties.renewalComplianceMinorPenalty,
      renewalComplianceMajorPenalty: penalties.renewalComplianceMajorPenalty,
      renewalComplianceSeverePenalty: penalties.renewalComplianceSeverePenalty,
    },
    fixed: {
      powerCompanyFixedFee: resolveFixedFeeAmount({
        legacyAmount: toMoneyNumber(penalties.powerDistributionFixedFee),
        legacyUpdatedAt: penaltiesUpdatedAt,
        overrideRow: powerCompanyOverride,
      }),
      powerGenerationDistributionFixedFee: resolveFixedFeeAmount({
        legacyAmount: toMoneyNumber(penalties.powerDistributionFixedFee),
        legacyUpdatedAt: penaltiesUpdatedAt,
        overrideRow: powerGenDistOverride,
      }),
      privatePortFixedFee: resolveFixedFeeAmount({
        legacyAmount: toMoneyNumber(penalties.privatePortFixedFee),
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
