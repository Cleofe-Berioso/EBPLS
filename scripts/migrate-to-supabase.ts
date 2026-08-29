/**
 * Migrate local EBPLS PostgreSQL (schema ebpls) to Supabase.
 *
 * Prerequisites:
 *   - Local DB running with data at DATABASE_URL (localhost)
 *   - Supabase project credentials in .env (SUPABASE_DB_PASSWORD or full URLs)
 *   - pg_dump / psql on PATH (PostgreSQL client tools)
 *
 * Run: npx tsx scripts/migrate-to-supabase.ts
 */
import "./ebpls-env";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "aipgbeasvjoflnswlhxt";
const REGION = process.env.SUPABASE_REGION ?? "ap-southeast-1";
const PASSWORD = process.env.SUPABASE_DB_PASSWORD ?? "ISCAPSTONE2026";

const POOLER_HOST = `aws-0-${REGION}.pooler.supabase.com`;
const POOLER_USER = `postgres.${PROJECT_REF}`;

function poolerUrl(user: string, forPrisma = false): string {
  const enc = encodeURIComponent(PASSWORD);
  const schema = forPrisma ? "&schema=ebpls" : "";
  return `postgresql://${user}:${enc}@${POOLER_HOST}:5432/postgres?sslmode=require${schema}`;
}

const SUPABASE_DATABASE_URL = poolerUrl(POOLER_USER, true);
const SUPABASE_PSQL_URL = poolerUrl(POOLER_USER, false);

const PG_BIN = process.env.PG_BIN ?? "C:\\Program Files\\PostgreSQL\\18\\bin";
const pg = (cmd: string) => path.join(PG_BIN, cmd);

function run(label: string, command: string, args: string[], env: NodeJS.ProcessEnv) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", env, shell: process.platform === "win32" });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) throw new Error(`${label} failed (exit ${r.status})`);
}

async function main() {
  console.log("EBPLS → Supabase migration");
  console.log(`Project: ${PROJECT_REF} (${REGION})`);

  // 1. Ensure ebpls schema exists on Supabase
  run("Create ebpls schema on Supabase", pg("psql.exe"), [
    SUPABASE_PSQL_URL,
    "-c",
    "CREATE SCHEMA IF NOT EXISTS ebpls;",
  ], { ...process.env, PGPASSWORD: PASSWORD });

  // 2. Apply Prisma migrations to Supabase
  run("Prisma migrate deploy → Supabase", "npx", ["prisma", "migrate", "deploy"], {
    ...process.env,
    DATABASE_URL: SUPABASE_DATABASE_URL,
    DIRECT_URL: SUPABASE_DATABASE_URL,
  });

  // 3. Dump local data (schema ebpls only)
  const dumpPath = path.join(ROOT, "scripts", "_local_ebpls_data.sql");
  const localUrl =
    (process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL)?.replace(
      /[?&]schema=[^&]*/g,
      ""
    ) ?? "";
  if (!localUrl?.includes("localhost")) {
    console.warn("Skipping data dump: set LOCAL_DATABASE_URL to localhost source if needed.");
  } else {
    run("pg_dump local data", pg("pg_dump.exe"), [
      localUrl,
      "--schema=ebpls",
      "--data-only",
      "--no-owner",
      "--no-privileges",
      "--exclude-table=ebpls._prisma_migrations",
      "-f",
      dumpPath,
    ], process.env);

    // 4. Restore data to Supabase
    run("Restore data to Supabase", pg("psql.exe"), [SUPABASE_PSQL_URL, "-f", dumpPath], {
      ...process.env,
      PGPASSWORD: PASSWORD,
    });

    fs.unlinkSync(dumpPath);
    console.log("Removed temporary dump file.");
  }

  // 5. Verify row counts
  run("Verify Supabase row counts", pg("psql.exe"), [
    SUPABASE_PSQL_URL,
    "-c",
    "SET search_path TO ebpls; SELECT 'User' AS tbl, count(*) FROM \"User\" UNION ALL SELECT 'BusinessApplication', count(*) FROM \"BusinessApplication\" UNION ALL SELECT 'BusinessRecord', count(*) FROM \"BusinessRecord\";",
  ], { ...process.env, PGPASSWORD: PASSWORD });

  console.log("\n✓ Migration complete.");
  console.log("\nUpdate .env with:");
  console.log(`DATABASE_URL="${SUPABASE_DATABASE_URL}"`);
  console.log(`DIRECT_URL="${SUPABASE_DATABASE_URL}"`);
  console.log(`NEXT_PUBLIC_SUPABASE_URL="https://${PROJECT_REF}.supabase.co"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
