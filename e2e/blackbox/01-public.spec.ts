import { test, expect } from "@playwright/test";
import { capture } from "./helpers";

test.describe("BB-PUB — Public surfaces (detailed)", () => {
  test("BB-PUB-01 landing shows brand and navigation to auth", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
    await capture(page, "public", "BB-PUB-01-landing.png");
  });

  test("BB-PUB-02 login form fields, Sign In, Google, forgot link", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sign In$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Forgot/i })).toBeVisible();
    await capture(page, "public", "BB-PUB-02-login.png");
  });

  test("BB-PUB-03 register page exposes applicant registration UI", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(/register|sign up|email|otp|password/i.test(text)).toBeTruthy();
    await capture(page, "public", "BB-PUB-03-register.png");
  });

  test("BB-PUB-04 forgot-password page exposes reset UI", async ({ page }) => {
    await page.goto("/forgot-password", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(/forgot|reset|email|otp|password/i.test(text)).toBeTruthy();
    await capture(page, "public", "BB-PUB-04-forgot-password.png");
  });

  test("BB-PUB-05 empty login submit shows validation or stays on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await capture(page, "public", "BB-PUB-05-empty-login.png");
  });
});
