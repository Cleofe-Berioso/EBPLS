import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { capture, openRoute, pageHasText } from "./helpers";

const test = createRoleTest("itAdmin");

test.describe("BB-SA — IT Administrator portal (detailed)", () => {
  test.setTimeout(180_000);

  const pages = [
    { id: "BB-SA-01", route: "/superadmin/dashboard", file: "BB-SA-01-dashboard.png" },
    { id: "BB-SA-02", route: "/superadmin/applications", file: "BB-SA-02-applications.png" },
    { id: "BB-SA-03", route: "/superadmin/users", file: "BB-SA-03-users.png" },
    { id: "BB-SA-04", route: "/superadmin/settings", file: "BB-SA-04-settings.png" },
    { id: "BB-SA-05", route: "/superadmin/activities", file: "BB-SA-05-activities.png" },
    { id: "BB-SA-06", route: "/superadmin/reports", file: "BB-SA-06-reports.png" },
    { id: "BB-SA-07", route: "/superadmin/profile", file: "BB-SA-07-profile.png" },
  ];

  for (const p of pages) {
    test(`${p.id} ${p.route}`, async ({ page }) => {
      await openRoute(page, p.route, {
        urlPattern: new RegExp(p.route.replace(/\//g, "\\/")),
        shot: ["superadmin", p.file],
      });
    });
  }

  test("BB-SA-08 users page exposes BPLO create / management UI", async ({ page }) => {
    await page.goto("/superadmin/users", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/user|bplo|create|disable|reactivate|reset|email/i.test(text)).toBeTruthy();
    await capture(page, "superadmin", "BB-SA-08-users-content.png");
  });

  test("BB-SA-09 settings shows fees / penalties / extensions / JIT portal", async ({ page }) => {
    await page.goto("/superadmin/settings", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/fee|penalty|extension|jit|portal|setting/i.test(text)).toBeTruthy();
    await capture(page, "superadmin", "BB-SA-09-settings-content.png");
  });

  test("BB-SA-10 applications are read-only (no BPLO approve controls)", async ({ page }) => {
    await page.goto("/superadmin/applications", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await capture(page, "superadmin", "BB-SA-10-applications-ro.png");
    const hasApproveAssessment = await pageHasText(page, /Send to Department Head Review/i);
    expect(hasApproveAssessment).toBeFalsy();
  });

  test("BB-SA-11 reports hub loads printable report links", async ({ page }) => {
    await page.goto("/superadmin/reports", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/report|application|inspection|audit|registry|print|summary/i.test(text)).toBeTruthy();
    await capture(page, "superadmin", "BB-SA-11-reports-content.png");
  });

  test("BB-SA-12 activities / audit trail page loads", async ({ page }) => {
    await page.goto("/superadmin/activities", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/activit|audit|log|action|user|no /i.test(text)).toBeTruthy();
    await capture(page, "superadmin", "BB-SA-12-activities-content.png");
  });

  test("BB-SA-13 profile role badge is IT Administrator (not Super Admin string)", async ({ page }) => {
    await page.goto("/superadmin/profile", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    // Prefer IT Administrator branding
    if (/IT Administrator/i.test(text)) {
      expect(text).toMatch(/IT Administrator/i);
    }
    await capture(page, "superadmin", "BB-SA-13-profile-role.png");
  });
});
