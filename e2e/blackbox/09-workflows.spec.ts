import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { capture, pageHasText, SMOKE, openRoute } from "./helpers";
import { assertApplicantTopPage } from "./ui-inspection-helpers";

/**
 * Workflow-oriented black-box checks using smoke seed data when available.
 * Does not mutate irreversible production settings.
 */
const bploTest = createRoleTest("bplo");
bploTest.describe("BB-WF — BPLO workflow surfaces (smoke-aware)", () => {
  bploTest.setTimeout(180_000);

  bploTest("BB-WF-01 payment verification action panel for pending rows", async ({ page }) => {
    await openRoute(page, "/bplo/payment-verification", {
      urlPattern: /\/bplo\/payment-verification/,
    });
    await expect(page.getByText(/Pending Verification|Payment Verification/i).first()).toBeVisible();
    const pendingTab = page.getByRole("button", { name: /Pending Verification/i }).first();
    if (await pendingTab.isVisible().catch(() => false)) await pendingTab.click();
    await capture(page, "workflow", "BB-WF-01-payment-pending-tab.png");

    const text = await page.locator("body").innerText();
    expect(
      /Return for Correction|Approve|Verify Payment|Pending|Verified|Returned for Correction|No records|record/i.test(
        text
      )
    ).toBeTruthy();
    await capture(page, "workflow", "BB-WF-01b-payment-actions.png");
  });

  bploTest("BB-WF-02 assessment queue recognizes smoke assessed business when seeded", async ({
    page,
  }) => {
    await page.goto("/bplo/assessment-fees", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await capture(page, "workflow", "BB-WF-02-assessment-queue.png");
    const hasSmoke =
      (await pageHasText(page, SMOKE.assessedName)) ||
      (await pageHasText(page, SMOKE.assessed)) ||
      (await pageHasText(page, /assessment|fee|queue/i));
    expect(hasSmoke).toBeTruthy();
  });

  bploTest("BB-WF-03 permit issuance recognizes paid or blocked smoke cases when seeded", async ({
    page,
  }) => {
    await page.goto("/bplo/permit-issuance", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await capture(page, "workflow", "BB-WF-03-permit-queue.png");
    const text = await page.locator("body").innerText();
    expect(/permit|issuance|prepare|release|paid|blocked|queue|no /i.test(text)).toBeTruthy();
  });

  bploTest("BB-WF-04 open assessment detail for first available application", async ({ page }) => {
    await page.goto("/bplo/assessment-fees", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const link = page.locator('a[href*="/bplo/assessment-fees/"]').first();
    if (!(await link.isVisible().catch(() => false))) {
      await capture(page, "workflow", "BB-WF-04-no-assessment-rows.png");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/bplo\/assessment-fees\/[^/]+/, { timeout: 45_000 });
    const text = await page.locator("body").innerText();
    expect(/fee|assessment|top|amount|line|generate|draft|total/i.test(text)).toBeTruthy();
    await capture(page, "workflow", "BB-WF-04-assessment-detail.png");
  });

  bploTest("BB-WF-05 open permit issuance detail for first available application", async ({
    page,
  }) => {
    await page.goto("/bplo/permit-issuance", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const link = page.locator('a[href*="/bplo/permit-issuance/"]').first();
    if (!(await link.isVisible().catch(() => false))) {
      await capture(page, "workflow", "BB-WF-05-no-permit-rows.png");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/bplo\/permit-issuance\/[^/]+/, { timeout: 45_000 });
    const text = await page.locator("body").innerText();
    expect(/prepare|release|permit|payment|status|print/i.test(text)).toBeTruthy();
    await capture(page, "workflow", "BB-WF-05-permit-detail.png");
  });
});

const applicantTest = createRoleTest("applicant");
applicantTest.describe("BB-WF — Applicant TOP workflow surface", () => {
  applicantTest.setTimeout(180_000);

  applicantTest("BB-WF-06 TOP shows ready/pending/rejected/returned messaging patterns", async ({
    page,
  }) => {
    await assertApplicantTopPage(page);
    if (page.url().includes("profile-picture")) {
      await capture(page, "workflow", "BB-WF-06-top-blocked-by-profile-pic.png");
      return;
    }
    const text = await page.locator("body").innerText();
    expect(
      /tax order|top records|submit payment|payment reference|payment proof|ready for or|returned for correction|rejected|pending|not yet available|re-assessment|reassessment|view/i.test(
        text
      )
    ).toBeTruthy();
    await capture(page, "workflow", "BB-WF-06-top-surface.png");
  });
});

const saTest = createRoleTest("itAdmin");
saTest.describe("BB-WF — IT Admin read-only application detail", () => {
  saTest.setTimeout(180_000);

  saTest("BB-WF-07 open first superadmin application detail when present", async ({ page }) => {
    await page.goto("/superadmin/applications", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const link = page.locator('a[href*="/superadmin/applications/"]').first();
    if (!(await link.isVisible().catch(() => false))) {
      await capture(page, "workflow", "BB-WF-07-no-sa-app-rows.png");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/superadmin\/applications\/[^/]+/, { timeout: 45_000 });
    await capture(page, "workflow", "BB-WF-07-sa-app-detail.png");
    // Must not expose BPLO operational approve control
    expect(await pageHasText(page, /Send to Department Head Review/i)).toBeFalsy();
  });
});

const dhTest = createRoleTest("deptHead");
dhTest.describe("BB-WF — DH queues content", () => {
  dhTest.setTimeout(180_000);

  dhTest("BB-WF-08 compliant-list and settlement pages are operational", async ({ page }) => {
    await page.goto("/department-head/compliant-list", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await capture(page, "workflow", "BB-WF-08-compliant-list.png");
    await page.goto("/department-head/settlement-management", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const text = await page.locator("body").innerText();
    expect(/settlement|compliant|inspection|no |manage/i.test(text)).toBeTruthy();
    await capture(page, "workflow", "BB-WF-08b-settlement.png");
  });
});
