/**
 * Full white-box test suite runner.
 * Reference: docs/TEST_CASE_ANALYSIS_BY_OBJECTIVE.md
 *
 * Run: npm run test:whitebox:full
 */

import "./ebpls-env";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runWhiteboxDbTests, type DbSuiteResult } from "./whitebox-db-tests";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WHITEBOX_DIR = path.join(ROOT, "..", "whitebox");
const EVIDENCE_DIR = path.join(WHITEBOX_DIR, "evidence");
const COVERAGE_DIR = path.join(WHITEBOX_DIR, "coverage");

type SuiteBlock = {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  optional?: boolean;
  needsDb?: boolean;
  nodeImportShim?: boolean;
};

type BlockResult = {
  name: string;
  ok: boolean;
  exitCode: number;
  durationMs: number;
  logFile: string;
  optional: boolean;
};

function ensureDirs() {
  for (const d of [WHITEBOX_DIR, EVIDENCE_DIR, COVERAGE_DIR, path.join(WHITEBOX_DIR, "db")]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

function safeLogName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "-").toLowerCase();
}

function runBlock(block: SuiteBlock): BlockResult {
  const logFile = path.join(EVIDENCE_DIR, `${safeLogName(block.name)}.log`);
  const start = Date.now();
  console.log(`\n▶ ${block.name}...`);

  const shimPath = pathToFileURL(path.join(ROOT, "scripts", "shim-server-only.mjs")).href;
  const result = spawnSync(block.command, block.args, {
    cwd: block.cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...(block.nodeImportShim ? { NODE_OPTIONS: `--import ${shimPath}` } : {}),
    },
  });

  const output = [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n");
  fs.writeFileSync(logFile, output, "utf8");

  const ok = result.status === 0;
  const icon = ok ? "✓" : block.optional ? "○ (optional failed)" : "✗";
  console.log(`  ${icon} ${block.name} (${Date.now() - start}ms) → ${logFile}`);

  return {
    name: block.name,
    ok,
    exitCode: result.status ?? 1,
    durationMs: Date.now() - start,
    logFile,
    optional: Boolean(block.optional),
  };
}

type VitestJson = {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  testResults?: Array<{
    name: string;
    status: string;
    assertionResults?: Array<{ fullName: string; status: string; title: string }>;
  }>;
};

function readVitestJson(): VitestJson | null {
  const p = path.join(EVIDENCE_DIR, "vitest-results.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as VitestJson;
  } catch {
    return null;
  }
}

function readCoverageSummary(): Record<string, unknown> | null {
  const p = path.join(COVERAGE_DIR, "coverage-summary.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatVitestTable(vitest: VitestJson | null): string {
  if (!vitest?.testResults) return "_No Vitest JSON found._\n";
  const lines: string[] = [
    "| # | Test file | Cases | Pass | Fail |",
    "|---:|---|---:|---:|---:|",
  ];
  let i = 0;
  for (const file of vitest.testResults) {
    i++;
    const cases = file.assertionResults ?? [];
    const pass = cases.filter((c) => c.status === "passed").length;
    const fail = cases.filter((c) => c.status === "failed").length;
    const shortName = path.basename(file.name);
    lines.push(`| ${i} | \`${shortName}\` | ${cases.length} | ${pass} | ${fail} |`);
  }
  lines.push("");
  lines.push(
    `**Vitest totals:** ${vitest.numPassedTests ?? "?"} passed / ${vitest.numFailedTests ?? "?"} failed / ${vitest.numTotalTests ?? "?"} total`
  );
  return lines.join("\n");
}

function formatDbTable(db: DbSuiteResult): string {
  const lines: string[] = [
    "| Objective | Passed | Failed | Skipped |",
    "|---|---:|---:|---:|",
  ];
  const objectiveNames: Record<string, string> = {
    "OBJ-1": "Authentication",
    "OBJ-2": "Registration",
    "OBJ-3": "New Application",
    "OBJ-4": "Renewal",
    "OBJ-5": "Business Closure",
    "OBJ-6": "JIT Inspection",
    "OBJ-7": "Compliance",
    "OBJ-8": "SMS",
    "OBJ-9": "Business Mapping",
    "OBJ-10": "Other",
  };

  for (const [key, obj] of Object.entries(db.objectives)) {
    const label = objectiveNames[key] ?? key;
    lines.push(`| ${key} ${label} | ${obj.passed} | ${obj.failed} | ${obj.skipped} |`);
  }
  lines.push("");
  lines.push(
    `**DB totals:** ${db.summary.passed} passed / ${db.summary.failed} failed / ${db.summary.skipped} skipped / ${db.summary.total} total`
  );
  lines.push(`**Connected:** ${db.connected ? "yes" : "no"} | **DATABASE_URL set:** ${db.databaseUrlConfigured ? "yes" : "no"}`);
  return lines.join("\n");
}

function formatDbDetailCases(db: DbSuiteResult): string {
  const lines: string[] = [
    "| ID | Objective | Test | Result | Detail |",
    "|---|---|---|---|---|",
  ];
  for (const obj of Object.values(db.objectives)) {
    for (const c of obj.cases) {
      const result = c.detail.startsWith("SKIPPED:") ? "SKIP" : c.ok ? "PASS" : "FAIL";
      const detail = c.detail.replace(/\|/g, "\\|").slice(0, 80);
      lines.push(`| ${c.id} | ${c.objective} | ${c.name} | ${result} | ${detail} |`);
    }
  }
  return lines.join("\n");
}

function formatCoverage(cov: Record<string, unknown> | null): string {
  if (!cov) return "_Coverage not generated (run with --coverage)._ \n";
  const total = cov.total as { lines?: { pct?: number }; branches?: { pct?: number }; functions?: { pct?: number } } | undefined;
  if (!total) return "_Coverage summary missing total._\n";
  return [
    "| Metric | Coverage % |",
    "|---|---:|",
    `| Lines | ${total.lines?.pct?.toFixed(2) ?? "—"} |`,
    `| Branches | ${total.branches?.pct?.toFixed(2) ?? "—"} |`,
    `| Functions | ${total.functions?.pct?.toFixed(2) ?? "—"} |`,
  ].join("\n");
}

function writeResultsMd(
  ranAt: string,
  blocks: BlockResult[],
  vitest: VitestJson | null,
  db: DbSuiteResult,
  cov: Record<string, unknown> | null
) {
  const vitestPass = vitest?.numFailedTests === 0;
  const dbPass = db.summary.failed === 0;
  const requiredBlocks = blocks.filter((b) => !b.optional);
  const blocksPass = requiredBlocks.every((b) => b.ok);
  const overallPass = vitestPass && dbPass && blocksPass;

  const md = `# EBPLS White-Box Test Results

**Reference:** \`EBPLS/docs/TEST_CASE_ANALYSIS_BY_OBJECTIVE.md\`  
**Run at:** ${ranAt}  
**Output folder:** \`whitebox/\`  
**Verdict:** ${overallPass ? "**PASS**" : "**FAIL**"}

> **Full per-case report:** [\`whitebox/WHITEBOX_DETAILED_RESULTS.md\`](../whitebox/WHITEBOX_DETAILED_RESULTS.md) (all 129 Vitest + 47 DB cases)

---

## 1. Executive summary

| Layer | Result | Detail |
|---|---|---|
| Vitest domain tests (WB-*, UT-*) | ${vitestPass ? "PASS" : "FAIL"} | ${vitest?.numPassedTests ?? 0}/${vitest?.numTotalTests ?? 0} cases |
| Database tests (WB-DB-*) | ${dbPass ? "PASS" : "FAIL"} | ${db.summary.passed} passed, ${db.summary.skipped} skipped, ${db.summary.failed} failed (${db.summary.total} total) |
| Verify scripts | ${blocks.filter((b) => b.name.includes("Verify")).every((b) => b.ok || b.optional) ? "PASS" : "MIXED"} | See §4 |
| Code coverage (instrumented lib) | ${cov ? "Generated" : "N/A"} | See §3 |

---

## 2. Vitest white-box results (domain logic)

${formatVitestTable(vitest)}

Evidence: \`whitebox/evidence/vitest-results.json\`, \`vitest-junit.xml\`

---

## 3. Code coverage

${formatCoverage(cov)}

HTML report: \`whitebox/coverage/index.html\` (if generated)

---

## 4. Suite blocks executed

| Block | Result | Duration | Log |
|---|---|---|---|
${blocks.map((b) => `| ${b.name} | ${b.ok ? "PASS" : b.optional ? "SKIP/FAIL" : "FAIL"} | ${b.durationMs}ms | \`${path.relative(WHITEBOX_DIR, b.logFile)}\` |`).join("\n")}

---

## 5. Database tests by objective

${formatDbTable(db)}

### 5.1 DB test case detail

${formatDbDetailCases(db)}

Evidence: \`whitebox/evidence/db-test-results.json\`

---

## 6. Objectives covered

| # | Objective | Vitest (WB-*) | DB (WB-DB-*) |
|---|---|---|---|
| 1 | Authentication & Account Access | WB-RBAC-*, WB-RATE-*, WB-UTIL-* | WB-DB-AUTH-* |
| 2 | Registration | (OTP in WB-UTIL-05) | WB-DB-REG-* |
| 3 | New Application | WB-E2E-*, WB-DOCS-*, WB-DOCVAL-* | WB-DB-NEW-* |
| 4 | Renewal | WB-ELIG-* | WB-DB-RENEW-* |
| 5 | Business Closure | WB-DOCS-05, WB-ELIG-05 | WB-DB-CLOSE-* |
| 6 | JIT Inspection | WB-JIT-* | WB-DB-JIT-* |
| 7 | Compliance Management | WB-E2E-17..19 | WB-DB-COMP-* |
| 8 | SMS Notification | (wiring via verify) | WB-DB-SMS-* |
| 9 | Business Mapping | WB-GEO-*, WB-JIT-05 | WB-DB-MAP-* |
| 10 | Other processes | WB-PAY-*, WB-PAGE-*, etc. | WB-DB-OTHER-* |

---

## 7. How to re-run

\`\`\`bash
cd EBPLS
npm run test:whitebox:full
\`\`\`

Prerequisites:
- \`.env\` with valid \`DATABASE_URL\` for DB tests
- \`npx tsx scripts/seed-smoke-test-data.ts\` for smoke-dependent DB cases (SM-01..08) — auto-run by full suite
- Full \`npm run db:seed\` for Phase 6 map scenarios (P6 markers) and VR-P6-* verify script

---

## 8. Known skips and optional failures

| Item | Reason | Action to enable |
|---|---|---|
| WB-DB-MAP-04 | P6 map seed not in DB | Run \`npm run db:seed\` in EBPLS |
| WB-DB-CLOSE-04 | No CLOSED business for applicant | Expected if no closure released yet |
| VR-P6-* (optional) | Requires P6 DEBUG-SEED map businesses | Run \`npm run db:seed\` |

---

*Generated by \`scripts/run-whitebox-suite.ts\`*
`;

  fs.writeFileSync(path.join(WHITEBOX_DIR, "WHITEBOX_TEST_RESULTS.md"), md, "utf8");
}

function writeReadme() {
  const readme = `# EBPLS White-Box Test Results

This folder contains outputs from the full white-box test suite aligned with
\`EBPLS/docs/TEST_CASE_ANALYSIS_BY_OBJECTIVE.md\`.

## Contents

| Path | Description |
|---|---|
| \`WHITEBOX_TEST_RESULTS.md\` | Main detailed report (Vitest + DB + verify) |
| \`evidence/vitest-results.json\` | Vitest JSON results |
| \`evidence/vitest-junit.xml\` | JUnit XML for CI |
| \`evidence/db-test-results.json\` | Database tests by objective |
| \`evidence/*.log\` | Per-suite console logs |
| \`coverage/\` | V8 coverage (HTML + summary) |

## Run

\`\`\`powershell
cd EBPLS
npm run test:whitebox:full
\`\`\`

## DB-only

\`\`\`powershell
cd EBPLS
npx tsx scripts/whitebox-db-tests.ts
\`\`\`

## Vitest-only

\`\`\`powershell
cd EBPLS
npm run test:whitebox
\`\`\`
`;
  fs.writeFileSync(path.join(WHITEBOX_DIR, "README.md"), readme, "utf8");
}

async function main() {
  const ranAt = new Date().toISOString();
  ensureDirs();
  console.log("EBPLS Full White-Box Suite");
  console.log(`Output: ${WHITEBOX_DIR}`);
  console.log(`Reference: docs/TEST_CASE_ANALYSIS_BY_OBJECTIVE.md\n`);

  const blocks: BlockResult[] = [];

  blocks.push(
    runBlock({
      name: "Vitest white-box with coverage",
      command: "npx",
      args: ["vitest", "run", "--config", "vitest.whitebox.config.ts", "--coverage"],
      cwd: ROOT,
    })
  );

  console.log("\n▶ Ensuring smoke test data (idempotent)...");
  const smokeSeed = spawnSync("npx", ["tsx", "scripts/seed-smoke-test-data.ts"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (smokeSeed.status !== 0) {
    console.log("  ○ Smoke seed skipped or failed (some DB cases may fail)");
  } else {
    console.log("  ✓ Smoke seed OK");
  }

  console.log("\n▶ Database tests by objective...");
  const dbStart = Date.now();
  const db = await runWhiteboxDbTests();
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "db-test-results.json"),
    JSON.stringify(db, null, 2),
    "utf8"
  );
  blocks.push({
    name: "Database tests (WB-DB-*)",
    ok: db.summary.failed === 0,
    exitCode: db.summary.failed > 0 ? 1 : 0,
    durationMs: Date.now() - dbStart,
    logFile: path.join(EVIDENCE_DIR, "db-test-results.json"),
    optional: false,
  });
  console.log(
    `  ${db.summary.failed === 0 ? "✓" : "✗"} DB tests: ${db.summary.passed} passed, ${db.summary.failed} failed`
  );

  const verifyBlocks: SuiteBlock[] = [
    {
      name: "Verify security (VR-SEC-*)",
      command: "npx",
      args: ["tsx", "scripts/verify-security-hardening.ts"],
      cwd: ROOT,
    },
    {
      name: "Verify logic alignment (VR-ALIGN-*)",
      command: "npx",
      args: ["tsx", "scripts/verify-ebpls-logic-alignment.ts"],
      cwd: ROOT,
    },
    {
      name: "Verify core logic (VR-CORE-*)",
      command: "npx",
      args: ["tsx", "scripts/verify-core-logic.ts"],
      cwd: ROOT,
      optional: true,
    },
  ];

  if (db.connected) {
    verifyBlocks.push(
      {
        name: "Verify Phase 6 regression (VR-P6-*)",
        command: "npx",
        args: ["tsx", "scripts/verify-phase6-regression.ts"],
        cwd: ROOT,
        needsDb: true,
        optional: true,
        nodeImportShim: true,
      },
      {
        name: "Verify SMS delivery (VR-SMS-*)",
        command: "npx",
        args: ["tsx", "scripts/verify-sms-delivery-log.ts"],
        cwd: ROOT,
        needsDb: true,
        optional: true,
      }
    );
  }

  for (const block of verifyBlocks) {
    blocks.push(runBlock(block));
  }

  const vitest = readVitestJson();
  const cov = readCoverageSummary();
  writeResultsMd(ranAt, blocks, vitest, db, cov);
  writeReadme();

  spawnSync("npx", ["tsx", "scripts/generate-whitebox-detailed-report.ts"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  // Detailed per-case report + thesis tables
  spawnSync("npx", ["tsx", "scripts/generate-whitebox-thesis-tables.ts"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  const manifest = {
    ranAt,
    reference: "EBPLS/docs/TEST_CASE_ANALYSIS_BY_OBJECTIVE.md",
    blocks: blocks.map((b) => ({
      name: b.name,
      ok: b.ok,
      exitCode: b.exitCode,
      durationMs: b.durationMs,
      logFile: path.relative(WHITEBOX_DIR, b.logFile),
      optional: b.optional,
    })),
    vitest: {
      passed: vitest?.numPassedTests ?? null,
      failed: vitest?.numFailedTests ?? null,
      total: vitest?.numTotalTests ?? null,
    },
    db: db.summary,
    overallPass:
      (vitest?.numFailedTests ?? 1) === 0 &&
      db.summary.failed === 0 &&
      blocks.filter((b) => !b.optional).every((b) => b.ok),
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, "suite-manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\nReport: ${path.join(WHITEBOX_DIR, "WHITEBOX_TEST_RESULTS.md")}`);
  console.log(`Verdict: ${manifest.overallPass ? "PASS" : "FAIL"}`);

  process.exit(manifest.overallPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
