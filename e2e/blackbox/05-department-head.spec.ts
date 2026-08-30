import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { capture, openRoute } from "./helpers";

const test = createRoleTest("deptHead");

test.describe("BB-DH — Department Head portal (detailed)", () => {
  test.setTimeout(180_000);

  const pages = [
    { id: "BB-DH-01", route: "/department-head/dashboard", file: "BB-DH-01-dashboard.png" },
    { id: "BB-DH-02", route: "/department-head/application-approval", file: "BB-DH-02-application-approval.png" },
    { id: "BB-DH-03", route: "/department-head/inspection-verification", file: "BB-DH-03-inspection-verification.png" },
    { id: "BB-DH-04", route: "/department-head/permit-to-revoke", file: "BB-DH-04-permit-to-revoke.png" },
    { id: "BB-DH-05", route: "/department-head/revoke-permit-list", file: "BB-DH-05-revoke-permit-list.png" },
    { id: "BB-DH-06", route: "/department-head/compliant-list", file: "BB-DH-06-compliant-list.png" },
    { id: "BB-DH-07", route: "/department-head/settlement-management", file: "BB-DH-07-settlement-management.png" },
  ];

  for (const p of pages) {
    test(`${p.id} ${p.route}`, async ({ page }) => {
      await openRoute(page, p.route, {
        urlPattern: new RegExp(p.route.replace(/\//g, "\\/")),
        shot: ["department-head", p.file],
      });
    });
  }

  test("BB-DH-08 application-approval workspace wording", async ({ page }) => {
    await page.goto("/department-head/application-approval", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const text = await page.locator("body").innerText();
    expect(/approval|application|approve|return|reject|department/i.test(text)).toBeTruthy();
    await capture(page, "department-head", "BB-DH-08-approval-content.png");
  });

  test("BB-DH-09 inspection-verification workspace wording", async ({ page }) => {
    await page.goto("/department-head/inspection-verification", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const text = await page.locator("body").innerText();
    expect(/inspection|verif|compliant|non-compliant|checklist|no /i.test(text)).toBeTruthy();
    await capture(page, "department-head", "BB-DH-09-inspection-content.png");
  });

  test("BB-DH-10 permit-to-revoke workspace wording", async ({ page }) => {
    await page.goto("/department-head/permit-to-revoke", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const text = await page.locator("body").innerText();
    expect(/revok|permit|approve|deny|no /i.test(text)).toBeTruthy();
    await capture(page, "department-head", "BB-DH-10-revoke-content.png");
  });
});
