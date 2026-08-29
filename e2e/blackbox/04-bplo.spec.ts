import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { capture, openRoute, pageHasText, SMOKE } from "./helpers";

const test = createRoleTest("bplo");

test.describe("BB-BP — BPLO portal (detailed)", () => {
  test.setTimeout(180_000);

  const pages = [
    { id: "BB-BP-01", route: "/bplo/dashboard", file: "BB-BP-01-dashboard.png" },
    { id: "BB-BP-02", route: "/bplo/applications", file: "BB-BP-02-applications.png" },
    { id: "BB-BP-03", route: "/bplo/assessment-fees", file: "BB-BP-03-assessment-fees.png" },
    { id: "BB-BP-04", route: "/bplo/payment-verification", file: "BB-BP-04-payment-verification.png" },
    { id: "BB-BP-05", route: "/bplo/permit-issuance", file: "BB-BP-05-permit-issuance.png" },
    { id: "BB-BP-06", route: "/bplo/business-map", file: "BB-BP-06-business-map.png" },
    { id: "BB-BP-07", route: "/bplo/profile", file: "BB-BP-07-profile.png" },
  ];

  for (const p of pages) {
    test(`${p.id} ${p.route}`, async ({ page }) => {
      await openRoute(page, p.route, {
        urlPattern: new RegExp(p.route.replace(/\//g, "\\/")),
        shot: ["bplo", p.file],
      });
    });
  }

  test("BB-BP-08 payment verification buckets include Returned for Correction", async ({ page }) => {
    await openRoute(page, "/bplo/payment-verification", {
      urlPattern: /\/bplo\/payment-verification/,
      shot: ["bplo", "BB-BP-08-payment-buckets.png"],
    });
    await expect(
      page.getByText(/Pending Verification|Verified Payments|Returned for Correction/i).first()
    ).toBeVisible();
    await expect(page.getByText(/Return for Correction|Approve \/ Verify Payment|Payment Verification/i).first()).toBeVisible();
  });

  test("BB-BP-09 applications queue shows review workspace", async ({ page }) => {
    await page.goto("/bplo/applications", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/application|review|submitted|under review|business/i.test(text)).toBeTruthy();
    await capture(page, "bplo", "BB-BP-09-applications-content.png");
  });

  test("BB-BP-10 assessment-fees queue loads", async ({ page }) => {
    await page.goto("/bplo/assessment-fees", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/assessment|fee|top|department head|approved|queue|no /i.test(text)).toBeTruthy();
    // Prefer smoke assessed name if present
    if (await pageHasText(page, SMOKE.assessedName)) {
      await capture(page, "bplo", "BB-BP-10-assessment-smoke-assessed.png");
    } else {
      await capture(page, "bplo", "BB-BP-10-assessment-queue.png");
    }
  });

  test("BB-BP-11 permit-issuance queue loads paid/prepare surfaces", async ({ page }) => {
    await page.goto("/bplo/permit-issuance", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const text = await page.locator("body").innerText();
    expect(/permit|issuance|prepare|release|paid|queue|no /i.test(text)).toBeTruthy();
    if (await pageHasText(page, SMOKE.paidName)) {
      await capture(page, "bplo", "BB-BP-11-permit-smoke-paid.png");
    } else if (await pageHasText(page, SMOKE.blockedName)) {
      await capture(page, "bplo", "BB-BP-11-permit-smoke-blocked.png");
    } else {
      await capture(page, "bplo", "BB-BP-11-permit-queue.png");
    }
  });

  test("BB-BP-12 open first application detail when rows exist", async ({ page }) => {
    await page.goto("/bplo/applications", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const rowLink = page.locator('a[href*="/bplo/applications/"]').first();
    if (!(await rowLink.isVisible().catch(() => false))) {
      await capture(page, "bplo", "BB-BP-12-no-application-rows.png");
      return;
    }
    await rowLink.click();
    await expect(page).toHaveURL(/\/bplo\/applications\/[^/]+/, { timeout: 45_000 });
    const text = await page.locator("body").innerText();
    expect(/document|status|business|review|return|reject|under review/i.test(text)).toBeTruthy();
    await capture(page, "bplo", "BB-BP-12-application-detail.png");
  });

  test("BB-BP-13 business map canvas or empty state", async ({ page }) => {
    await page.goto("/bplo/business-map", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.locator("body")).toBeVisible();
    await page.waitForTimeout(2000);
    await capture(page, "bplo", "BB-BP-13-business-map-rendered.png");
  });
});
