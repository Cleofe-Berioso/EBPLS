import fs from "node:fs";
import path from "node:path";

/** Load EBPLS .env so modules that import prisma at load-time can initialize. */
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL) {
  // Fallback so pure suites can still collect when .env is absent in CI sandboxes
  process.env.DATABASE_URL = "postgresql://localhost:5432/ebpls_whitebox";
}
