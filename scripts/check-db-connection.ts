/**
 * Database Connection Health Check
 *
 * Verifies that Prisma can connect to Supabase Postgres.
 * Run: npx tsx scripts/check-db-connection.ts
 */

import { loadEnvFile } from "node:process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildPrismaPgPoolConfig } from "../src/lib/pg-pool-config";

// Load .env before doing anything
loadEnvFile(".env");

function resolveHostType(url: string | undefined): "session pooler" | "direct" | "unknown" {
  if (!url) return "unknown";
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes(".pooler.supabase.com")) return "session pooler";
    if (hostname.startsWith("db.") && hostname.endsWith(".supabase.co")) return "direct";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function extractPrismaErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.length > 0) {
      return code;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const matched = message.match(/\bP\d{4}\b/);
  return matched?.[0] ?? "UNKNOWN";
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  console.log("🔍 EBPLS Database Connection Check\n");
  console.log(`Runtime host type: ${resolveHostType(dbUrl)}`);
  console.log(`Migration host type: ${resolveHostType(directUrl)}\n`);
  
  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL is not set");
    process.exit(1);
  }

  if (!directUrl) {
    console.error("❌ WARNING: DIRECT_URL is not set (migrations may fail)");
  }

  try {
    console.log("Attempting connection with 15-second timeout...\n");
    
    // Set a timeout to avoid hanging indefinitely
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout after 15 seconds")), 15000)
    );

    const connectPromise = (async () => {
      const adapter = new PrismaPg(buildPrismaPgPoolConfig(dbUrl), { schema: "ebpls" });
      const prisma = new PrismaClient({ adapter });

      try {
        const result = await prisma.$queryRaw`SELECT 1 as ok`;
        console.log("✅ Raw query succeeded:", result);

        const userCount = await prisma.user.count();
        console.log(`✅ Schema 'ebpls' is reachable. User table count: ${userCount}`);

        await prisma.$disconnect();
        console.log("\n✅ All checks passed. Database connection is healthy.");
        return true;
      } finally {
        await prisma.$disconnect().catch(() => {});
      }
    })();

    await Promise.race([connectPromise, timeoutPromise]);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection failed");
    console.error(`Prisma error code: ${extractPrismaErrorCode(error)}`);
    console.error(`Runtime host type: ${resolveHostType(dbUrl)}`);
    process.exit(1);
  }
}

main();
