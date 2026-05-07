import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Relative path — libsql on Windows doesn't handle absolute file:/// URIs correctly
    url: "file:./prisma/dev.db",
  },
  migrations: {
    seed: "ts-node ./prisma/seed.ts",
  },
});
