import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

/**
 * Katalon-equivalent Auth suite (mirrors EBPLS/katalon Scripts/Auth/*)
 */

const SHOT_DIR = path.join(process.cwd(), "e2e", "screenshots", "katalon-auth");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const PASSWORD = "password123";

type LoginCase = {
  id: string;
  email: string;
  password: string;
  homePath: string;
  expectedPath: RegExp;
};

const CASES: LoginCase[] = [
  {
    id: "TC_AUTH_Login_Applicant",
    email: "applicant@example.com",
    password: PASSWORD,
    homePath: "/applicant/profile",
    expectedPath: /\/applicant\/(dashboard|profile|profile-picture\/setup)/,
  },
  {
    id: "TC_AUTH_Login_BPLO",
    email: "bplo@example.com",
    password: PASSWORD,
    homePath: "/bplo/dashboard",
    expectedPath: /\/bplo\/dashboard/,
  },
  {
    id: "TC_AUTH_Login_DeptHead",
    email: "dept-head@example.com",
    password: PASSWORD,
    homePath: "/department-head/dashboard",
    expectedPath: /\/department-head\/dashboard/,
  },
  {
    id: "TC_AUTH_Login_JIT",
    email: "jit@example.com",
    password: PASSWORD,
    homePath: "/jit/dashboard",
    expectedPath: /\/jit\/(dashboard|portal-disabled)/,
  },
  {
    id: "TC_AUTH_Login_ITAdmin",
    email: "superadmin@example.com",
    password: PASSWORD,
    homePath: "/superadmin/dashboard",
    expectedPath: /\/superadmin\/dashboard/,
  },
];

async function establishSession(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.locator("#email")).toBeVisible({ timeout: 30_000 });

  // Fill fields (Katalon Object Repository parity: #email, #password)
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);

  const csrfRes = await page.request.get("/api/auth/csrf");
  expect(csrfRes.ok(), "CSRF endpoint should succeed").toBeTruthy();
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
  expect([200, 302], `credentials callback status for ${email}`).toContain(callback.status());
}

test.describe("Katalon suite TS_Auth_Role_Login (equivalent execution)", () => {
  for (const c of CASES) {
    test(`${c.id} — login ${c.email}`, async ({ page }) => {
      test.setTimeout(180_000);
      await establishSession(page, c.email, c.password);
      await page.goto(c.homePath, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page).toHaveURL(c.expectedPath, { timeout: 45_000 });
      await expect(page).not.toHaveURL(/\/login(\?|$)/);
      const shot = path.join(SHOT_DIR, `${c.id}.png`);
      await page.screenshot({ path: shot, fullPage: true });
    });
  }

  test("TC_AUTH_Login_InvalidPassword — wrong password stays on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("#email")).toBeVisible({ timeout: 30_000 });
    await page.locator("#email").fill("applicant@example.com");
    await page.locator("#password").fill("wrong-password-!!!");
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/login/);
    const shot = path.join(SHOT_DIR, "TC_AUTH_Login_InvalidPassword.png");
    await page.screenshot({ path: shot, fullPage: true });
  });
});
