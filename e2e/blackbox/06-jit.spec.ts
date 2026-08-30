import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { capture, expectNotLogin } from "./helpers";

const test = createRoleTest("jit");

test.describe("BB-JIT — JIT portal (detailed)", () => {
  test.setTimeout(180_000);

  test("BB-JIT-01 dashboard or portal-disabled gate", async ({ page }) => {
    await page.goto("/jit/dashboard", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expectNotLogin(page);
    await expect(page).toHaveURL(/\/jit\/(dashboard|portal-disabled)/, { timeout: 45_000 });
    await capture(page, "jit", "BB-JIT-01-dashboard-or-disabled.png");
  });

  test("BB-JIT-02 inspect-a-business page or disabled redirect", async ({ page }) => {
    await page.goto("/jit/inspect-a-business", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expectNotLogin(page);
    await expect(page).toHaveURL(/\/jit\/(inspect-a-business|portal-disabled)/, { timeout: 45_000 });
    const text = await page.locator("body").innerText();
    expect(/inspect|business|portal|disabled|checklist|no /i.test(text)).toBeTruthy();
    await capture(page, "jit", "BB-JIT-02-inspect.png");
  });

  test("BB-JIT-03 no-permit-record page or disabled redirect", async ({ page }) => {
    await page.goto("/jit/no-permit-record", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expectNotLogin(page);
    await expect(page).toHaveURL(/\/jit\/(no-permit-record|portal-disabled)/, { timeout: 45_000 });
    const text = await page.locator("body").innerText();
    expect(/no.?permit|ticket|record|portal|disabled|create|print/i.test(text)).toBeTruthy();
    await capture(page, "jit", "BB-JIT-03-no-permit.png");
  });

  test("BB-JIT-04 business-map page or disabled redirect", async ({ page }) => {
    await page.goto("/jit/business-map", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expectNotLogin(page);
    await expect(page).toHaveURL(/\/jit\/(business-map|portal-disabled)/, { timeout: 45_000 });
    await page.waitForTimeout(1500);
    await capture(page, "jit", "BB-JIT-04-map.png");
  });

  test("BB-JIT-05 portal-disabled page is reachable directly", async ({ page }) => {
    await page.goto("/jit/portal-disabled", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expectNotLogin(page);
    await expect(page).toHaveURL(/\/jit\/portal-disabled/, { timeout: 30_000 });
    await capture(page, "jit", "BB-JIT-05-portal-disabled-direct.png");
  });
});
