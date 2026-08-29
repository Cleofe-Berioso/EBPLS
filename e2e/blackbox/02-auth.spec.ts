import { test, expect } from "@playwright/test";
import { USERS, loginAs, capture, expectNotLogin, PASSWORD, authStatePath } from "./helpers";

test.describe("BB-AUTH — Authentication (detailed)", () => {
  test.describe.configure({ mode: "serial" });

  const roles = [
    {
      id: "BB-AUTH-01",
      role: "applicant" as const,
      email: USERS.applicant.email,
      path: "/applicant/profile",
      expectUrl: /\/applicant\/(dashboard|profile|profile-picture\/setup)/,
    },
    {
      id: "BB-AUTH-02",
      role: "bplo" as const,
      email: USERS.bplo.email,
      path: "/bplo/dashboard",
      expectUrl: /\/bplo\/dashboard/,
    },
    {
      id: "BB-AUTH-03",
      role: "deptHead" as const,
      email: USERS.deptHead.email,
      path: "/department-head/dashboard",
      expectUrl: /\/department-head\/dashboard/,
    },
    {
      id: "BB-AUTH-04",
      role: "jit" as const,
      email: USERS.jit.email,
      path: "/jit/dashboard",
      expectUrl: /\/jit\/(dashboard|portal-disabled)/,
    },
    {
      id: "BB-AUTH-05",
      role: "itAdmin" as const,
      email: USERS.itAdmin.email,
      path: "/superadmin/dashboard",
      expectUrl: /\/superadmin\/dashboard/,
    },
  ];

  for (const c of roles) {
    test(`${c.id} ${c.role} reaches portal home`, async ({ page }) => {
      test.setTimeout(180_000);
      await loginAs(page, c.email);
      await page.goto(c.path, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page).toHaveURL(c.expectUrl, { timeout: 45_000 });
      await expectNotLogin(page);
      await capture(page, "auth", `${c.id}-${c.role}.png`);
      await page.context().storageState({ path: authStatePath(c.role) });
      await page.waitForTimeout(2000);
    });
  }

  test("BB-AUTH-06 wrong password shows alert and stays on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator("#email").fill(USERS.applicant.email);
    await page.locator("#password").fill("definitely-wrong-password!!!");
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 25_000 });
    await expect(page).toHaveURL(/\/login/);
    await capture(page, "auth", "BB-AUTH-06-invalid-password.png");
  });

  test("BB-AUTH-07 credentials session opens applicant profile", async ({ page }) => {
    await loginAs(page, USERS.applicant.email, PASSWORD);
    await page.goto("/applicant/profile", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page).toHaveURL(/\/applicant\/(profile|profile-picture\/setup)/, { timeout: 60_000 });
    await capture(page, "auth", "BB-AUTH-07-applicant-profile.png");
  });

  test("BB-AUTH-08 auth redirect page resolves for session", async ({ page }) => {
    await loginAs(page, USERS.bplo.email);
    await page.goto("/auth/redirect", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForURL(/\/(bplo|applicant|department-head|jit|superadmin)\//, { timeout: 60_000 });
    await expectNotLogin(page);
    await capture(page, "auth", "BB-AUTH-08-auth-redirect.png");
  });
});
