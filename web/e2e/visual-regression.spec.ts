/**
 * Visual Regression Tests
 * Captures screenshots and compares against baselines
 *
 * First run creates baseline screenshots.
 * Subsequent runs compare against baselines.
 *
 * Usage:
 *   npx playwright test e2e/visual-regression.spec.ts
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 */

import { test, expect } from "@playwright/test";

// ============================================================================
// Configuration
// ============================================================================

const SNAPSHOT_OPTIONS = {
  maxDiffPixels: 100, // Allow minor rendering differences
  threshold: 0.2,     // Pixel comparison threshold (0-1)
};

// ============================================================================
// Public Pages — Visual Snapshots
// ============================================================================

test.describe("Visual Regression — Public Pages", () => {
  test("Login Page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("login.png", SNAPSHOT_OPTIONS);
  });

  test("Login Page — Mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("login-mobile.png", SNAPSHOT_OPTIONS);
  });

  test("Register Page", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("register.png", SNAPSHOT_OPTIONS);
  });

  test("Requirements Page", async ({ page }) => {
    await page.goto("/requirements");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("requirements.png", SNAPSHOT_OPTIONS);
  });

  test("How to Apply Page", async ({ page }) => {
    await page.goto("/how-to-apply");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("how-to-apply.png", SNAPSHOT_OPTIONS);
  });

  test("FAQs Page", async ({ page }) => {
    await page.goto("/faqs");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("faqs.png", SNAPSHOT_OPTIONS);
  });

  test("Contact Page", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("contact.png", SNAPSHOT_OPTIONS);
  });

  test("Forgot Password Page", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("forgot-password.png", SNAPSHOT_OPTIONS);
  });

  test("Privacy Policy Page", async ({ page }) => {
    await page.goto("/privacy");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("privacy.png", SNAPSHOT_OPTIONS);
  });

  test("Terms Page", async ({ page }) => {
    await page.goto("/terms");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("terms.png", SNAPSHOT_OPTIONS);
  });
});

// ============================================================================
// Component-Level Visual Tests
// ============================================================================

test.describe("Visual Regression — Components", () => {
  test("Login form with validation errors", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Submit empty form to trigger validation
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("login-validation-errors.png", SNAPSHOT_OPTIONS);
  });

  test("Login form with filled fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill form
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i).first();

    if (await emailInput.isVisible()) {
      await emailInput.fill("user@example.com");
    }
    if (await passwordInput.isVisible()) {
      await passwordInput.fill("TestPassword123!");
    }

    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot("login-filled.png", SNAPSHOT_OPTIONS);
  });
});

// ============================================================================
// Responsive Breakpoints
// ============================================================================

test.describe("Visual Regression — Responsive", () => {
  const breakpoints = [
    { name: "mobile-sm", width: 320, height: 568 },    // iPhone SE
    { name: "mobile-lg", width: 414, height: 896 },    // iPhone 11
    { name: "tablet", width: 768, height: 1024 },      // iPad
    { name: "laptop", width: 1366, height: 768 },      // Laptop
    { name: "desktop", width: 1920, height: 1080 },    // Full HD
  ];

  for (const bp of breakpoints) {
    test(`Login page at ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(
        `login-${bp.name}.png`,
        SNAPSHOT_OPTIONS
      );
    });
  }
});

// ============================================================================
// Dark Mode (if applicable)
// ============================================================================

test.describe("Visual Regression — Dark Mode", () => {
  test("Login page in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("login-dark.png", SNAPSHOT_OPTIONS);
  });
});
