/**
 * Update BLACKBOX_UI_INSPECTION_CHECKLIST.md from Playwright JSON results.
 * Run: npx tsx scripts/update-blackbox-ui-checklist.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECKLIST = path.join(ROOT, "..", "blackbox", "BLACKBOX_UI_INSPECTION_CHECKLIST.md");
const RESULTS_PRIMARY = path.join(ROOT, "..", "blackbox", "evidence", "results.json");
const RESULTS_UI = path.join(ROOT, "..", "blackbox", "evidence", "ui-inspection-results.json");
const RUN_LOG = path.join(ROOT, "..", "blackbox", "evidence", "ui-inspection-run.log");

type CaseResult = {
  title: string;
  status: "passed" | "failed" | "skipped" | "timedOut" | "interrupted";
  errors?: Array<{ message?: string }>;
};

type PlaywrightSpec = {
  title: string;
  ok?: boolean;
  tests?: Array<{
    results?: Array<{ status?: string; errors?: Array<{ message?: string }> }>;
  }>;
};

type PlaywrightSuite = {
  title: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
};

type PlaywrightReport = {
  suites?: PlaywrightSuite[];
};

function resolveSpecStatus(spec: PlaywrightSpec): CaseResult["status"] {
  if (spec.ok === true) return "passed";
  const result = spec.tests?.[0]?.results?.[0];
  const raw = result?.status ?? (spec.ok === false ? "failed" : "skipped");
  if (raw === "passed") return "passed";
  if (raw === "skipped") return "skipped";
  if (raw === "timedOut") return "timedOut";
  if (raw === "interrupted") return "interrupted";
  return "failed";
}

function collectTests(suite: PlaywrightSuite, out: CaseResult[]) {
  for (const spec of suite.specs ?? []) {
    const result = spec.tests?.[0]?.results?.[0];
    out.push({
      title: spec.title,
      status: resolveSpecStatus(spec),
      errors: result?.errors,
    });
  }
  for (const child of suite.suites ?? []) {
    collectTests(child, out);
  }
}

function flatten(report: PlaywrightReport): CaseResult[] {
  const all: CaseResult[] = [];
  for (const suite of report.suites ?? []) {
    collectTests(suite, all);
  }
  return all;
}

function flattenFromLog(log: string): CaseResult[] {
  const lineRe = /^\s+(ok|x|-)\s+\d+\s+\[chromium\].*?(BB-UI-[A-Z0-9-]+)/gm;
  const all: CaseResult[] = [];
  for (const match of log.matchAll(lineRe)) {
    const status = match[1] === "ok" ? "passed" : match[1] === "x" ? "failed" : "skipped";
    all.push({ title: match[2], status });
  }
  return all;
}

function extractCaseId(title: string): string | null {
  const m = title.match(/^(BB-UI-[A-Z0-9-]+)/);
  return m ? m[1] : null;
}

function shotRef(caseId: string): string {
  return `screenshots/ui-inspection/${caseId.replace(/[^a-zA-Z0-9-]/g, "_")}.png`;
}

function main() {
  const resultsPath = fs.existsSync(RESULTS_UI)
    ? RESULTS_UI
    : fs.existsSync(RESULTS_PRIMARY)
      ? RESULTS_PRIMARY
      : null;

  let tests: CaseResult[] = [];
  if (resultsPath) {
    const report = JSON.parse(fs.readFileSync(resultsPath, "utf8")) as PlaywrightReport;
    tests = flatten(report);
  }
  if (tests.length === 0 && fs.existsSync(RUN_LOG)) {
    tests = flattenFromLog(fs.readFileSync(RUN_LOG, "utf8"));
  }
  if (tests.length === 0) {
    console.error(`Missing results — run npm run test:blackbox:ui first`);
    process.exit(1);
  }

  const byId = new Map<string, CaseResult>();
  for (const t of tests) {
    const id = extractCaseId(t.title);
    if (id) byId.set(id, t);
  }

  let md = fs.readFileSync(CHECKLIST, "utf8");
  const ranAt = new Date().toISOString();
  let updated = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let missing = 0;

  md = md.replace(
    /\*\*Method:\*\*[^\n]*/,
    `**Method:** Playwright UI inspection (automated black-box) + manual follow-up`
  );
  if (!md.includes("**Last automated run:**")) {
    md = md.replace(
      /\*\*Base URL:\*\*[^\n]+\n/,
      (m) => `${m}**Last automated run:** ${ranAt}\n`
    );
  } else {
    md = md.replace(/\*\*Last automated run:\*\*[^\n]*/, `**Last automated run:** ${ranAt}`);
  }

  const rowRe =
    /^\|\s*(BB-UI-[A-Z0-9-]+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|$/gm;

  md = md.replace(rowRe, (_full, id: string, desc: string, expected: string) => {
    const t = byId.get(id.trim());
    if (!t) {
      missing += 1;
      return `| ${id.trim()} |${desc}|${expected}| _Not run_ | | |`;
    }

    updated += 1;
    const status =
      t.status === "passed" ? "PASS" : t.status === "skipped" ? "SKIP" : "FAIL";
    if (status === "PASS") passed += 1;
    else if (status === "SKIP") skipped += 1;
    else failed += 1;

    const actual =
      t.status === "passed"
        ? "Automated assertion passed; screenshot captured"
        : t.status === "skipped"
          ? "Skipped in automation"
          : (t.errors?.[0]?.message ?? "Assertion failed").split("\n")[0].slice(0, 120);

    const comment =
      t.status === "passed"
        ? `Evidence: \`${shotRef(id.trim())}\``
        : t.status === "skipped"
          ? "Manual verification may be required (OTP/email steps)"
          : fs.existsSync(path.join(ROOT, "..", "blackbox", shotRef(id.trim())))
            ? `FAIL — partial evidence: \`${shotRef(id.trim())}\`; see Playwright report`
            : "See Playwright report";

    return `| ${id.trim()} |${desc}|${expected}| ${actual} | ${status} | ${comment} |`;
  });

  const summaryBlock = `## Automated Run Summary

| Metric | Count |
|---|---:|
| Checklist cases updated | ${updated} |
| Pass | ${passed} |
| Fail | ${failed} |
| Skip | ${skipped} |
| Not run (no matching test) | ${missing} |
| Evidence folder | \`blackbox/screenshots/ui-inspection/\` |
| Results JSON | \`blackbox/evidence/ui-inspection-results.json\` |

---

`;

  if (md.includes("## Automated Run Summary")) {
    md = md.replace(/## Automated Run Summary[\s\S]*?(?=\n## )/, summaryBlock);
    md = md.replace(/\*\*Run date:\*\*[^\n]*\n\n?/, "");
  } else {
    md = md.replace(
      /> Fill \*\*Actual Outcome\*\*[^\n]+\n\n---/,
      `> Automated run fills **Actual Outcome**, **Pass/Fail**, and **Comments** for covered cases.\n\n---\n\n${summaryBlock}`
    );
  }

  fs.writeFileSync(CHECKLIST, md, "utf8");
  console.log(`Updated ${CHECKLIST}`);
  console.log(JSON.stringify({ updated, passed, failed, skipped, missing }, null, 2));
}

main();
