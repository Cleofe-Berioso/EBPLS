/**
 * Seed Mayor's Permit Fee schedule (Chapter III, Article A) into
 * FeeConfigurationItem + SystemFeeSetting.
 *
 * Source: municipal ordinance fee tables (photos) + FEE_TABLES defaults
 * for categories not shown on the provided pages (contractors, wholesalers, etc.).
 *
 * Run: npx tsx scripts/seed-mayors-permit-fees.ts
 */
import "./ebpls-env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildPrismaPgPoolConfig } from "../src/lib/pg-pool-config";
import {
  BANK_CLASSIFICATIONS,
  DEFAULT_SYSTEM_FEE_SETTINGS,
  FIXED_FEE_CLASSIFICATION,
} from "../src/lib/fee-settings";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(buildPrismaPgPoolConfig(dbUrl), { schema: "ebpls" }),
});

type FeeSeedRow = {
  category: string;
  classification: string;
  amount: number;
};

/** Ordinance amounts keyed by category + classification labels used by the app. */
const FEE_SEED_ROWS: FeeSeedRow[] = [
  // ── Manufacturers / Importers / Producers ──────────────────────────────
  { category: "MANUFACTURERS", classification: "Micro Industry", amount: 200 },
  { category: "MANUFACTURERS", classification: "Cottage Industries A", amount: 400 },
  { category: "MANUFACTURERS", classification: "Cottage Industries B", amount: 650 },
  { category: "MANUFACTURERS", classification: "Small-Scale Industries A", amount: 1800 },
  { category: "MANUFACTURERS", classification: "Small-Scale Industries B", amount: 3000 },
  { category: "MANUFACTURERS", classification: "Medium-Scale Industries", amount: 4000 },
  { category: "MANUFACTURERS", classification: "Large-Scale Industries", amount: 6000 },
  { category: "MANUFACTURERS", classification: "Micro Industry (no workers)", amount: 200 },
  { category: "MANUFACTURERS", classification: "Micro Industry (1–5)", amount: 200 },
  { category: "MANUFACTURERS", classification: "Cottage Industries A (6–10)", amount: 400 },
  { category: "MANUFACTURERS", classification: "Small-Scale Industries A (11–50)", amount: 1800 },
  { category: "MANUFACTURERS", classification: "Small-Scale Industries B (51–99)", amount: 3000 },
  { category: "MANUFACTURERS", classification: "Medium-Scale Industries (100–150)", amount: 4000 },
  { category: "MANUFACTURERS", classification: "Large-Scale Industries (200+)", amount: 6000 },

  // ── Banks ──────────────────────────────────────────────────────────────
  { category: "BANKS", classification: BANK_CLASSIFICATIONS[0], amount: 4000 },
  { category: "BANKS", classification: BANK_CLASSIFICATIONS[1], amount: 6000 },
  { category: "BANKS", classification: BANK_CLASSIFICATIONS[2], amount: 8000 },

  // ── Other Financial Institutions ───────────────────────────────────────
  { category: "OTHER_FINANCIAL", classification: "Micro Industry", amount: 1000 },
  { category: "OTHER_FINANCIAL", classification: "Cottage Industry (₱100K–₱250K)", amount: 3000 },
  { category: "OTHER_FINANCIAL", classification: "Cottage Industry (₱250K–₱500K)", amount: 3000 },
  { category: "OTHER_FINANCIAL", classification: "Small Industry (₱500K–₱2M)", amount: 4000 },
  { category: "OTHER_FINANCIAL", classification: "Medium Industry (₱2M–₱5M)", amount: 5000 },
  { category: "OTHER_FINANCIAL", classification: "Large Industry (₱5M–₱20M)", amount: 6000 },
  { category: "OTHER_FINANCIAL", classification: "Large Industry (Over ₱20M)", amount: 6000 },
  { category: "OTHER_FINANCIAL", classification: "Micro Industry (no workers)", amount: 1000 },
  { category: "OTHER_FINANCIAL", classification: "Micro Industry (1–5)", amount: 1000 },
  { category: "OTHER_FINANCIAL", classification: "Cottage Industry (6–10)", amount: 3000 },
  { category: "OTHER_FINANCIAL", classification: "Small Industry (11–50)", amount: 4000 },
  { category: "OTHER_FINANCIAL", classification: "Medium Industry (51–99)", amount: 5000 },
  { category: "OTHER_FINANCIAL", classification: "Large Industry (100–150)", amount: 6000 },
  { category: "OTHER_FINANCIAL", classification: "Large Industry (200+)", amount: 6000 },

  // ── Contractors (from system fee tables; middle ordinance pages not provided) ─
  { category: "CONTRACTORS", classification: "Micro", amount: 250 },
  { category: "CONTRACTORS", classification: "Cottage A", amount: 500 },
  { category: "CONTRACTORS", classification: "Cottage B", amount: 1000 },
  { category: "CONTRACTORS", classification: "Small A", amount: 1500 },
  { category: "CONTRACTORS", classification: "Small B", amount: 3000 },
  { category: "CONTRACTORS", classification: "Medium", amount: 4000 },
  { category: "CONTRACTORS", classification: "Large", amount: 6000 },
  { category: "CONTRACTORS", classification: "Micro (no workers)", amount: 250 },
  { category: "CONTRACTORS", classification: "Micro (1–5)", amount: 250 },
  { category: "CONTRACTORS", classification: "Cottage A (6–10)", amount: 500 },
  { category: "CONTRACTORS", classification: "Small A (11–50)", amount: 1500 },
  { category: "CONTRACTORS", classification: "Small B (51–99)", amount: 3000 },
  { category: "CONTRACTORS", classification: "Medium (100–150)", amount: 4000 },
  { category: "CONTRACTORS", classification: "Large (200+)", amount: 6000 },

  // ── Wholesalers / Retailers ────────────────────────────────────────────
  { category: "WHOLESALERS_RETAILERS", classification: "Micro", amount: 200 },
  { category: "WHOLESALERS_RETAILERS", classification: "Cottage A", amount: 500 },
  { category: "WHOLESALERS_RETAILERS", classification: "Cottage B", amount: 1200 },
  { category: "WHOLESALERS_RETAILERS", classification: "Small A", amount: 2500 },
  { category: "WHOLESALERS_RETAILERS", classification: "Small B", amount: 3500 },
  { category: "WHOLESALERS_RETAILERS", classification: "Medium", amount: 5000 },
  { category: "WHOLESALERS_RETAILERS", classification: "Large", amount: 6000 },
  { category: "WHOLESALERS_RETAILERS", classification: "Micro (no workers)", amount: 200 },
  { category: "WHOLESALERS_RETAILERS", classification: "Micro (1–5)", amount: 200 },
  { category: "WHOLESALERS_RETAILERS", classification: "Cottage A (6–10)", amount: 500 },
  { category: "WHOLESALERS_RETAILERS", classification: "Small A (11–50)", amount: 2500 },
  { category: "WHOLESALERS_RETAILERS", classification: "Small B (51–99)", amount: 3500 },
  { category: "WHOLESALERS_RETAILERS", classification: "Medium (100–150)", amount: 5000 },
  { category: "WHOLESALERS_RETAILERS", classification: "Large (200+)", amount: 6000 },

  // ── Transportation ─────────────────────────────────────────────────────
  { category: "TRANSPORTATION", classification: "Small-Scale", amount: 4000 },
  { category: "TRANSPORTATION", classification: "Medium-Scale", amount: 6000 },
  { category: "TRANSPORTATION", classification: "Large-Scale", amount: 10000 },
  { category: "TRANSPORTATION", classification: "Small-Scale (no workers)", amount: 4000 },
  { category: "TRANSPORTATION", classification: "Small-Scale (1–5)", amount: 4000 },
  { category: "TRANSPORTATION", classification: "Small-Scale (6–10)", amount: 4000 },
  { category: "TRANSPORTATION", classification: "Medium-Scale (11–50)", amount: 6000 },
  { category: "TRANSPORTATION", classification: "Medium-Scale (51–99)", amount: 6000 },
  { category: "TRANSPORTATION", classification: "Large-Scale (100–150)", amount: 10000 },
  { category: "TRANSPORTATION", classification: "Large-Scale (200+)", amount: 10000 },

  // ── Communications ─────────────────────────────────────────────────────
  { category: "COMMUNICATIONS", classification: "Micro", amount: 500 },
  { category: "COMMUNICATIONS", classification: "Cottage", amount: 1500 },
  { category: "COMMUNICATIONS", classification: "Small", amount: 3000 },
  { category: "COMMUNICATIONS", classification: "Medium", amount: 5000 },
  { category: "COMMUNICATIONS", classification: "Large", amount: 8000 },
  { category: "COMMUNICATIONS", classification: "Micro (no workers)", amount: 500 },
  { category: "COMMUNICATIONS", classification: "Micro (1–5)", amount: 500 },
  { category: "COMMUNICATIONS", classification: "Cottage (6–10)", amount: 1500 },
  { category: "COMMUNICATIONS", classification: "Small (11–50)", amount: 3000 },
  { category: "COMMUNICATIONS", classification: "Medium (51–99)", amount: 5000 },
  { category: "COMMUNICATIONS", classification: "Large (100–150)", amount: 8000 },
  { category: "COMMUNICATIONS", classification: "Large (200+)", amount: 8000 },

  // ── Lessors – Land ─────────────────────────────────────────────────────
  { category: "LESSORS_LAND", classification: "Micro", amount: 500 },
  { category: "LESSORS_LAND", classification: "Cottage", amount: 1000 },
  { category: "LESSORS_LAND", classification: "Small", amount: 1500 },
  { category: "LESSORS_LAND", classification: "Medium", amount: 2500 },
  { category: "LESSORS_LAND", classification: "Large", amount: 4000 },
  { category: "LESSORS_LAND", classification: "Micro (no workers)", amount: 500 },
  { category: "LESSORS_LAND", classification: "Micro (1–5)", amount: 500 },
  { category: "LESSORS_LAND", classification: "Cottage (6–10)", amount: 1000 },
  { category: "LESSORS_LAND", classification: "Small (11–50)", amount: 1500 },
  { category: "LESSORS_LAND", classification: "Medium (51–99)", amount: 2500 },
  { category: "LESSORS_LAND", classification: "Large (100–150)", amount: 4000 },
  { category: "LESSORS_LAND", classification: "Large (200+)", amount: 4000 },

  // ── Lessors – Commercial ───────────────────────────────────────────────
  { category: "LESSORS_COMMERCIAL", classification: "Micro", amount: 500 },
  { category: "LESSORS_COMMERCIAL", classification: "Cottage", amount: 1000 },
  { category: "LESSORS_COMMERCIAL", classification: "Small", amount: 2000 },
  { category: "LESSORS_COMMERCIAL", classification: "Medium", amount: 3000 },
  { category: "LESSORS_COMMERCIAL", classification: "Large", amount: 5000 },
  { category: "LESSORS_COMMERCIAL", classification: "Micro (no workers)", amount: 500 },
  { category: "LESSORS_COMMERCIAL", classification: "Micro (1–5)", amount: 500 },
  { category: "LESSORS_COMMERCIAL", classification: "Cottage (6–10)", amount: 1000 },
  { category: "LESSORS_COMMERCIAL", classification: "Small (11–50)", amount: 2000 },
  { category: "LESSORS_COMMERCIAL", classification: "Medium (51–99)", amount: 3000 },
  { category: "LESSORS_COMMERCIAL", classification: "Large (100–150)", amount: 5000 },
  { category: "LESSORS_COMMERCIAL", classification: "Large (200+)", amount: 5000 },

  // ── Hotels / Motels / Pension / Apartelles (ordinance §9) ───────────────
  { category: "HOTELS_MOTELS", classification: "Cottage (below ₱100K)", amount: 800 },
  { category: "HOTELS_MOTELS", classification: "Cottage", amount: 800 },
  { category: "HOTELS_MOTELS", classification: "Small", amount: 1500 },
  { category: "HOTELS_MOTELS", classification: "Medium", amount: 2500 },
  { category: "HOTELS_MOTELS", classification: "Large", amount: 4000 },
  { category: "HOTELS_MOTELS", classification: "Cottage (no workers)", amount: 800 },
  { category: "HOTELS_MOTELS", classification: "Cottage (1–5)", amount: 800 },
  { category: "HOTELS_MOTELS", classification: "Cottage (6–10)", amount: 800 },
  { category: "HOTELS_MOTELS", classification: "Small (11–50)", amount: 1500 },
  { category: "HOTELS_MOTELS", classification: "Medium (51–99)", amount: 2500 },
  { category: "HOTELS_MOTELS", classification: "Large (100–150)", amount: 4000 },
  { category: "HOTELS_MOTELS", classification: "Large (200+)", amount: 4000 },

  // ── Lodging / Boarding (ordinance §10) ──────────────────────────────────
  { category: "LODGING", classification: "Micro", amount: 300 },
  { category: "LODGING", classification: "Cottage", amount: 500 },
  { category: "LODGING", classification: "Small", amount: 800 },
  { category: "LODGING", classification: "Medium", amount: 1200 },
  { category: "LODGING", classification: "Large", amount: 2000 },
  { category: "LODGING", classification: "Micro (no workers)", amount: 300 },
  { category: "LODGING", classification: "Micro (1–5)", amount: 300 },
  { category: "LODGING", classification: "Cottage (6–10)", amount: 500 },
  { category: "LODGING", classification: "Small (11–50)", amount: 800 },
  { category: "LODGING", classification: "Medium (51–99)", amount: 1200 },
  { category: "LODGING", classification: "Large (100–150)", amount: 2000 },
  { category: "LODGING", classification: "Large (200+)", amount: 2000 },

  // ── Amusement Places (ordinance §11) ───────────────────────────────────
  { category: "AMUSEMENT", classification: "Micro", amount: 300 },
  { category: "AMUSEMENT", classification: "Cottage", amount: 500 },
  { category: "AMUSEMENT", classification: "Small", amount: 1000 },
  { category: "AMUSEMENT", classification: "Medium", amount: 2000 },
  { category: "AMUSEMENT", classification: "Large", amount: 3000 },
  { category: "AMUSEMENT", classification: "Micro (no workers)", amount: 300 },
  { category: "AMUSEMENT", classification: "Micro (1–5)", amount: 300 },
  { category: "AMUSEMENT", classification: "Cottage (6–10)", amount: 500 },
  { category: "AMUSEMENT", classification: "Small (11–50)", amount: 1000 },
  { category: "AMUSEMENT", classification: "Medium (51–99)", amount: 2000 },
  { category: "AMUSEMENT", classification: "Large (100–150)", amount: 3000 },
  { category: "AMUSEMENT", classification: "Large (200+)", amount: 3000 },

  // ── Restaurants (ordinance §12 — Medium = ₱2,500) ───────────────────────
  { category: "RESTAURANTS", classification: "Micro", amount: 300 },
  { category: "RESTAURANTS", classification: "Cottage", amount: 500 },
  { category: "RESTAURANTS", classification: "Small", amount: 1000 },
  { category: "RESTAURANTS", classification: "Medium", amount: 2500 },
  { category: "RESTAURANTS", classification: "Large", amount: 3000 },
  { category: "RESTAURANTS", classification: "Micro (no workers)", amount: 300 },
  { category: "RESTAURANTS", classification: "Micro (1–5)", amount: 300 },
  { category: "RESTAURANTS", classification: "Cottage (6–10)", amount: 500 },
  { category: "RESTAURANTS", classification: "Small (11–50)", amount: 1000 },
  { category: "RESTAURANTS", classification: "Medium (51–99)", amount: 2500 },
  { category: "RESTAURANTS", classification: "Large (100–150)", amount: 3000 },
  { category: "RESTAURANTS", classification: "Large (200+)", amount: 3000 },

  // ── Other Industrial (ordinance §16) ───────────────────────────────────
  { category: "OTHER_INDUSTRIAL", classification: "Small", amount: 3000 },
  { category: "OTHER_INDUSTRIAL", classification: "Medium", amount: 5000 },
  { category: "OTHER_INDUSTRIAL", classification: "Large", amount: 10000 },
  { category: "OTHER_INDUSTRIAL", classification: "Small (no workers)", amount: 3000 },
  { category: "OTHER_INDUSTRIAL", classification: "Small (1–5)", amount: 3000 },
  { category: "OTHER_INDUSTRIAL", classification: "Small (6–10)", amount: 3000 },
  { category: "OTHER_INDUSTRIAL", classification: "Small (11–50)", amount: 3000 },
  { category: "OTHER_INDUSTRIAL", classification: "Medium (51–99)", amount: 5000 },
  { category: "OTHER_INDUSTRIAL", classification: "Large (100–150)", amount: 10000 },
  { category: "OTHER_INDUSTRIAL", classification: "Large (200+)", amount: 10000 },

  // ── Fixed fees (ordinance §§14–15, §17) ─────────────────────────────────
  { category: "POWER_COMPANY", classification: FIXED_FEE_CLASSIFICATION, amount: 10000 },
  { category: "POWER_GEN_DIST", classification: FIXED_FEE_CLASSIFICATION, amount: 10000 },
  { category: "PRIVATE_PORT", classification: FIXED_FEE_CLASSIFICATION, amount: 50000 },
];

async function main() {
  const admin =
    (await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN", isActive: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, email: true },
    })) ??
    (await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, email: true },
    }));

  if (!admin) {
    throw new Error("No SUPER_ADMIN user found. Seed IT admin first.");
  }

  console.log(`Using updatedBy: ${admin.email} (${admin.id})`);
  console.log(`Upserting ${FEE_SEED_ROWS.length} fee configuration rows...`);

  let upserted = 0;
  for (const row of FEE_SEED_ROWS) {
    await prisma.feeConfigurationItem.upsert({
      where: {
        category_classification: {
          category: row.category,
          classification: row.classification,
        },
      },
      create: {
        category: row.category,
        classification: row.classification,
        amount: row.amount,
        isActive: true,
        updatedById: admin.id,
      },
      update: {
        amount: row.amount,
        isActive: true,
        updatedById: admin.id,
      },
    });
    upserted += 1;
  }

  const existingSetting = await prisma.systemFeeSetting.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (existingSetting) {
    await prisma.systemFeeSetting.update({
      where: { id: existingSetting.id },
      data: {
        renewalSurchargePercent: DEFAULT_SYSTEM_FEE_SETTINGS.renewalSurchargePercent,
        monthlyInterestPercent: DEFAULT_SYSTEM_FEE_SETTINGS.monthlyInterestPercent,
        liquorTobaccoAddOnPercent: DEFAULT_SYSTEM_FEE_SETTINGS.liquorTobaccoAddOnPercent,
        powerDistributionFixedFee: DEFAULT_SYSTEM_FEE_SETTINGS.powerDistributionFixedFee,
        privatePortFixedFee: DEFAULT_SYSTEM_FEE_SETTINGS.privatePortFixedFee,
        updatedById: admin.id,
      },
    });
    console.log(`Updated SystemFeeSetting ${existingSetting.id}`);
  } else {
    const created = await prisma.systemFeeSetting.create({
      data: {
        ...DEFAULT_SYSTEM_FEE_SETTINGS,
        updatedById: admin.id,
      },
    });
    console.log(`Created SystemFeeSetting ${created.id}`);
  }

  const byCategory = await prisma.feeConfigurationItem.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { _all: true },
    orderBy: { category: "asc" },
  });

  console.log(`Done. Upserted ${upserted} rows.`);
  console.log("Active fee rows by category:");
  for (const group of byCategory) {
    console.log(`  ${group.category}: ${group._count._all}`);
  }
  console.log(
    "System settings: surcharge 25%, interest 2%/mo, liquor/tobacco +25%, power ₱10,000, private port ₱50,000"
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
