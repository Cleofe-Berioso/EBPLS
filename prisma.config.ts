import "dotenv/config";
import { defineConfig } from "prisma/config";

/** prisma generate does not connect to the DB; a placeholder is enough at build time. */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://build:build@127.0.0.1:5432/build?schema=ebpls";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
