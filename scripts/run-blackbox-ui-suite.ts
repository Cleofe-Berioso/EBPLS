import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_JSON = path.join(ROOT, "..", "blackbox", "evidence", "ui-inspection-results.json");
const RUN_LOG = path.join(ROOT, "..", "blackbox", "evidence", "ui-inspection-run.log");

const specs = [
  "e2e/blackbox/10-ui-inspection-auth.spec.ts",
  "e2e/blackbox/11-ui-inspection-applicant.spec.ts",
  "e2e/blackbox/12-ui-inspection-staff.spec.ts",
  "e2e/blackbox/13-ui-inspection-e2e.spec.ts",
];

const playwright = spawnSync(
  "npx",
  ["playwright", "test", ...specs, "--config", "playwright.blackbox.config.ts"],
  { cwd: ROOT, stdio: "inherit", shell: true }
);

if (!fs.existsSync(RESULTS_JSON) && fs.existsSync(RUN_LOG)) {
  spawnSync("npx", ["tsx", "scripts/build-ui-inspection-results-from-log.ts", path.relative(ROOT, RUN_LOG)], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
}

spawnSync("npx", ["tsx", "scripts/update-blackbox-ui-checklist.ts"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
});

process.exit(playwright.status ?? 1);
