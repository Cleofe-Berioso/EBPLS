/**
 * Seed only the IT Administrator account.
 * Run: npx tsx scripts/seed-it-admin.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildPrismaPgPoolConfig } from "../src/lib/pg-pool-config";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(buildPrismaPgPoolConfig(dbUrl), { schema: "ebpls" }),
});

async function main() {
  const email = "bpossuperadmin@gmail.com";
  const legacyEmail = "superadmin@example.com";
  const passwordHash = await bcrypt.hash("password123", 12);

  const legacy = await prisma.user.findUnique({ where: { email: legacyEmail } });
  if (legacy) {
    const user = await prisma.user.update({
      where: { id: legacy.id },
      data: {
        email,
        name: "IT Administrator",
        role: "SUPER_ADMIN",
        passwordHash,
        isActive: true,
      },
    });
    console.log(`Migrated IT Admin ${legacyEmail} → ${user.email} (${user.id})`);
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "IT Administrator",
      role: "SUPER_ADMIN",
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      name: "IT Administrator",
      role: "SUPER_ADMIN",
      passwordHash,
      isActive: true,
    },
  });

  console.log(`IT Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
