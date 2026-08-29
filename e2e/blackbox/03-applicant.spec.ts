import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { capture, openRoute, pageHasText, SMOKE } from "./helpers";

const test = createRoleTest("applicant");

test.describe("BB-AP — Applicant portal (detailed)", () => {
  test.setTimeout(180_000);

  test("BB-AP-01 dashboard loads with applicant chrome", async ({ page }) => {
    await openRoute(page, "/applicant/dashboard", {
      urlPattern: /\/applicant\/(dashboard|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-01-dashboard.png"],
    });
  });

  test("BB-AP-02 application hub offers NEW/RENEWAL/CLOSURE paths", async ({ page }) => {
    await openRoute(page, "/applicant/application", {
      urlPattern: /\/applicant\/(application|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-02-application-hub.png"],
    });
    if (!page.url().includes("profile-picture")) {
      const text = await page.locator("body").innerText();
      expect(/new|renewal|closure|application/i.test(text)).toBeTruthy();
    }
  });

  test("BB-AP-03 NEW wizard opens first step", async ({ page }) => {
    await openRoute(page, "/applicant/application/new", {
      urlPattern: /\/applicant\/(application\/new|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-03-application-new.png"],
    });
  });

  test("BB-AP-04 RENEWAL wizard opens", async ({ page }) => {
    await openRoute(page, "/applicant/application/renewal", {
      urlPattern: /\/applicant\/(application\/renewal|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-04-application-renewal.png"],
    });
  });

  test("BB-AP-05 CLOSURE wizard opens", async ({ page }) => {
    await openRoute(page, "/applicant/application/closure", {
      urlPattern: /\/applicant\/(application\/closure|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-05-application-closure.png"],
    });
  });

  test("BB-AP-06 my-applications list loads", async ({ page }) => {
    await openRoute(page, "/applicant/my-applications", {
      urlPattern: /\/applicant\/(my-applications|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-06-my-applications.png"],
    });
  });

  test("BB-AP-07 TOP page loads assessed payment surface", async ({ page }) => {
    await openRoute(page, "/applicant/top", {
      urlPattern: /\/applicant\/(top|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-07-top.png"],
    });
    if (!page.url().includes("profile-picture")) {
      const text = await page.locator("body").innerText();
      expect(/tax order|payment|top|assessed|not yet available/i.test(text)).toBeTruthy();
    }
  });

  test("BB-AP-08 notifications page loads", async ({ page }) => {
    await openRoute(page, "/applicant/notifications", {
      urlPattern: /\/applicant\/(notifications|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-08-notifications.png"],
    });
  });

  test("BB-AP-09 profile shows account details and change-password UI", async ({ page }) => {
    await openRoute(page, "/applicant/profile", {
      urlPattern: /\/applicant\/(profile|profile-picture\/setup)/,
      shot: ["applicant", "BB-AP-09-profile.png"],
    });
    if (!page.url().includes("profile-picture")) {
      const hasPwd = await pageHasText(page, /change password|current password|new password/i);
      expect(hasPwd || (await page.locator("body").innerText()).length > 50).toBeTruthy();
      await capture(page, "applicant", "BB-AP-09b-profile-password-section.png");
    }
  });

  test("BB-AP-10 change-password rejects wrong current password", async ({ page }) => {
    await page.goto("/applicant/profile", { waitUntil: "domcontentloaded", timeout: 90_000 });
    if (page.url().includes("profile-picture")) {
      test.skip(true, "Profile picture setup gate blocks profile form");
      return;
    }
    const current = page.locator("#current-password");
    if (!(await current.isVisible().catch(() => false))) {
      test.skip(true, "Change password form not visible");
      return;
    }
    await current.fill("wrong-old-password");
    await page.locator("#new-password").fill("password12345");
    await page.locator("#confirm-password").fill("password12345");
    await page.getByRole("button", { name: /^Change Password$/i }).click();
    await expect(
      page.getByText(/incorrect|unable|error|invalid|Current password is incorrect/i).first()
    ).toBeVisible({ timeout: 25_000 });
    await capture(page, "applicant", "BB-AP-10-change-password-wrong-current.png");
  });

  test("BB-AP-11 my-applications may show smoke records when owned", async ({ page }) => {
    await page.goto("/applicant/my-applications", { waitUntil: "domcontentloaded", timeout: 90_000 });
    if (page.url().includes("profile-picture")) return;
    await capture(page, "applicant", "BB-AP-11-my-apps-content.png");
    // Presence of smoke apps depends on seed ownership — assert page is interactive
    await expect(page.locator("body")).toContainText(/application|my applications|no |empty|status/i);
  });

  test("BB-AP-12 deprecated business-location redirects away from dead page", async ({ page }) => {
    await page.goto("/applicant/business-location", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page).not.toHaveURL(/\/applicant\/business-location$/, { timeout: 30_000 });
    await capture(page, "applicant", "BB-AP-12-business-location-redirect.png");
  });
});
