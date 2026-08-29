/**
 * Build Playwright-style JSON from list-reporter terminal output.
 * Usage: npx tsx scripts/build-ui-inspection-results-from-log.ts <log-file>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_LOG = path.join(ROOT, "..", "blackbox", "evidence", "ui-inspection-run.log");
const OUT = path.join(ROOT, "..", "blackbox", "evidence", "ui-inspection-results.json");

const logPath = process.argv[2] ?? DEFAULT_LOG;
if (!fs.existsSync(logPath)) {
  console.error(`Log file not found: ${logPath}`);
  process.exit(1);
}

const log = fs.readFileSync(logPath, "utf8");
const lineRe = /^\s+(ok|x|-)\s+\d+\s+\[chromium\].*?(BB-UI-[A-Z0-9-]+)/gm;

type TestResult = { title: string; status: "passed" | "failed" | "skipped" };
const specs: Array<{ title: string; tests: TestResult[] }> = [];

for (const match of log.matchAll(lineRe)) {
  const status = match[1] === "ok" ? "passed" : match[1] === "x" ? "failed" : "skipped";
  const id = match[2];
  specs.push({
    title: id,
    tests: [{ title: id, status }],
  });
}

const report = {
  suites: [{ title: "ui-inspection", specs }],
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");
console.log(`Wrote ${specs.length} results to ${OUT}`);
