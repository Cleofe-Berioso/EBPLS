/**
 * One-shot local-dev script: creates the `ebpls` database and `ebpls` schema
 * if they don't already exist. Uses the same credentials as DATABASE_URL.
 *
 * Run: npx tsx scripts/setup-local-db.ts
 */
import "dotenv/config";
import { Client } from "pg";

const LOCAL_DB_NAME = "ebpls";
const LOCAL_SCHEMA = "ebpls";

function parseLocalCredentials() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    user: u.username,
    password: u.password,
  };
}

async function run() {
  const creds = parseLocalCredentials();

  // Step 1 — connect to the default `postgres` database to CREATE DATABASE.
  const adminClient = new Client({ ...creds, database: "postgres" });
  await adminClient.connect();

  const { rows } = await adminClient.query<{ datname: string }>(
    "SELECT datname FROM pg_database WHERE datname = $1",
    [LOCAL_DB_NAME]
  );

  if (rows.length === 0) {
    // Cannot use parameterized queries for CREATE DATABASE — identifier.
    await adminClient.query(`CREATE DATABASE "${LOCAL_DB_NAME}"`);
    console.log(`✓ Database "${LOCAL_DB_NAME}" created`);
  } else {
    console.log(`  Database "${LOCAL_DB_NAME}" already exists`);
  }

  await adminClient.end();

  // Step 2 — connect to the target database and create the schema.
  const dbClient = new Client({ ...creds, database: LOCAL_DB_NAME });
  await dbClient.connect();
  await dbClient.query(`CREATE SCHEMA IF NOT EXISTS "${LOCAL_SCHEMA}"`);
  console.log(`✓ Schema "${LOCAL_SCHEMA}" ensured in database "${LOCAL_DB_NAME}"`);
  await dbClient.end();

  console.log("Done. Run: npx prisma db push");
}

run().catch((err) => {
  console.error("setup-local-db failed:", err.message);
  process.exit(1);
});
