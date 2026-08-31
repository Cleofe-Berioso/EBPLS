import { expect, type Browser, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const PASSWORD = "password123";

export const USERS = {
  applicant: { email: "applicant@example.com", home: "/applicant/dashboard" },
  applicant1: { email: "applicant1@example.com", home: "/applicant/dashboard" },
  bplo: { email: "bplo@example.com", home: "/bplo/dashboard" },
  deptHead: { email: "dept-head@example.com", home: "/department-head/dashboard" },
  jit: { email: "jit@example.com", home: "/jit/dashboard" },
  jitDisabled: { email: "jit-disabled@example.com", home: "/jit/dashboard" },
  itAdmin: { email: "superadmin@example.com", home: "/superadmin/dashboard" },
} as const;

/** Smoke seed application numbers (scripts/seed-smoke-test-data.ts). */
export const SMOKE = {
  retailReleased: "SMOKE-APP-RETAIL-RELEASED",
  foodReleased: "SMOKE-APP-FOOD-RELEASED",
  annualPaid: "SMOKE-APP-NEW-ANNUAL-PAID",
  assessed: "SMOKE-APP-NEW-ASSESSED",
  renewalBiApproved: "SMOKE-APP-RENEWAL-BI-APPROVED",
  closureQtrApproved: "SMOKE-APP-CLOSURE-QTR-APPROVED",
  permitBlocked: "SMOKE-APP-PERMIT-BLOCKED-UNPAID",
  duplicateApproved: "SMOKE-APP-DUPLICATE-APPROVED",
  retailName: "Smoke Retail Hub",
  foodName: "Smoke Food Corner",
  assessedName: "Smoke Assessed Services",
  paidName: "Smoke Permit Ready Trading",
  blockedName: "Smoke Permit Blocked Shop",
} as const;

const OUT_ROOT = path.join(__dirname, "..", "..", "..", "blackbox");
const SHOT_ROOT = path.join(OUT_ROOT, "screenshots");
const AUTH_DIR = path.join(__dirname, ".auth");

fs.mkdirSync(SHOT_ROOT, { recursive: true });
fs.mkdirSync(AUTH_DIR, { recursive: true });
fs.mkdirSync(path.join(OUT_ROOT, "evidence"), { recursive: true });

export function authStatePath(role: keyof typeof USERS) {
  return path.join(AUTH_DIR, `${role}.json`);
}

export function shotPath(...parts: string[]) {
  const dir = path.join(SHOT_ROOT, ...parts.slice(0, -1));
  fs.mkdirSync(dir, { recursive: true });
  return path.join(SHOT_ROOT, ...parts);
}

export async function capture(page: Page, ...parts: string[]) {
  await page.screenshot({ path: shotPath(...parts), fullPage: true });
}

export async function loginAs(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.locator("#email")).toBeVisible({ timeout: 30_000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);

  let lastStatus = 0;
  for (let attempt = 0; attempt < 10; attempt++) {
    const csrfRes = await page.request.get("/api/auth/csrf");
    expect(csrfRes.ok(), "CSRF endpoint").toBeTruthy();
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

    const callback = await page.request.post("/api/auth/callback/credentials", {
      form: {
        csrfToken,
        email,
        password,
        callbackUrl: "/",
        json: "true",
      },
    });
    lastStatus = callback.status();
    if (lastStatus === 429) {
      await page.waitForTimeout(8_000 + attempt * 5_000);
      continue;
    }
    expect([200, 302], `login ${email} status ${lastStatus}`).toContain(lastStatus);
    await page.waitForTimeout(400);
    return;
  }
  throw new Error(`login rate-limited for ${email}; last status ${lastStatus}`);
}

export async function ensureAuthState(browser: Browser, role: keyof typeof USERS) {
  const statePath = authStatePath(role);
  if (fs.existsSync(statePath)) {
    const ageMs = Date.now() - fs.statSync(statePath).mtimeMs;
    if (ageMs < 120 * 60_000) return statePath;
  }

  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
  });
  const page = await context.newPage();
  await loginAs(page, USERS[role].email);
  await page.goto(USERS[role].home, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 45_000 });
  await context.storageState({ path: statePath });
  await context.close();
  return statePath;
}

export async function expectNotLogin(page: Page) {
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 45_000 });
}

function isTransientServerPage(text: string) {
  return /max clients|Internal Server Error|Application error|something went wrong|DriverAdapterError/i.test(
    text
  );
}

export async function openRoute(
  page: Page,
  route: string,
  opts?: { urlPattern?: RegExp; shot?: string[] }
) {
  let lastText = "";
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expectNotLogin(page);
      if (opts?.urlPattern) {
        await expect(page).toHaveURL(opts.urlPattern, { timeout: 45_000 });
      }
      await expect(page.locator("body")).toBeVisible();
      lastText = await page.locator("body").innerText();
      if (!isTransientServerPage(lastText)) break;
      await page.waitForTimeout(2_000 * (attempt + 1));
    } catch (error) {
      lastError = error;
      const message = String(error);
      if (
        attempt < 2 &&
        /ERR_NO_BUFFER_SPACE|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|ECONNRESET/i.test(message)
      ) {
        await page.waitForTimeout(3_000 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  if (isTransientServerPage(lastText)) {
    throw lastError ?? new Error(`Transient server page after retries for ${route}`);
  }
  expect(isTransientServerPage(lastText)).toBeFalsy();
  if (opts?.shot) await capture(page, ...opts.shot);
}

/** Soft-search page text; returns whether found (does not fail test). */
export async function pageHasText(page: Page, pattern: RegExp | string) {
  const content = await page.locator("body").innerText();
  if (typeof pattern === "string") return content.includes(pattern);
  return pattern.test(content);
}

export async function clickFirstMatching(page: Page, name: RegExp) {
  const btn = page.getByRole("button", { name }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    return true;
  }
  const link = page.getByRole("link", { name }).first();
  if (await link.isVisible().catch(() => false)) {
    await link.click();
    return true;
  }
  return false;
}
