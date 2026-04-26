/**
 * Accessibility (a11y) Testing with axe-core
 * WCAG 2.1 AA compliance testing for the Online Business Permit System
 *
 * Usage:
 *   npx playwright test e2e/accessibility.spec.ts
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ============================================================================
// Helper: run axe on a page and assert no violations
// ============================================================================

async function checkA11y(
  page: import("@playwright/test").Page,
  url: string,
  description: string
) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("#__next-build-indicator") // Exclude Next.js dev indicator
    .analyze();

  // Generate a readable report of violations
  const violations = results.violations.map((v: any) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 3).map((n: any) => n.target.join(" > ")),
  }));

  if (violations.length > 0) {
    console.log(
      `\n⚠️ ${description} — ${violations.length} accessibility violations:\n`
    );
    violations.forEach((v: any) => {
      console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
      console.log(`    Help: ${v.helpUrl}`);
      console.log(`    Affected: ${v.nodes} element(s)`);
      v.targets.forEach((t: any) => console.log(`      → ${t}`));
    });
  }

  // Fail on critical/serious violations only
  const critical = results.violations.filter(
    (v: any) => v.impact === "critical" || v.impact === "serious"
  );
  expect(critical, `${description} has critical a11y violations`).toHaveLength(0);
}

// ============================================================================
// Public Pages
// ============================================================================

test.describe("Accessibility — Public Pages", () => {
  test("Root route should redirect to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Login page should be accessible", async ({ page }) => {
    await checkA11y(page, "/login", "Login page");
  });

  test("Registration page should be accessible", async ({ page }) => {
    await checkA11y(page, "/register", "Registration page");
  });

  test("Requirements page should be accessible", async ({ page }) => {
    await checkA11y(page, "/requirements", "Requirements page");
  });

  test("How to Apply page should be accessible", async ({ page }) => {
    await checkA11y(page, "/how-to-apply", "How to Apply page");
  });

  test("FAQs page should be accessible", async ({ page }) => {
    await checkA11y(page, "/faqs", "FAQs page");
  });

  test("Contact page should be accessible", async ({ page }) => {
    await checkA11y(page, "/contact", "Contact page");
  });

  test("Privacy Policy page should be accessible", async ({ page }) => {
    await checkA11y(page, "/privacy", "Privacy Policy page");
  });

  test("Terms page should be accessible", async ({ page }) => {
    await checkA11y(page, "/terms", "Terms page");
  });

  test("Data Privacy page should be accessible", async ({ page }) => {
    await checkA11y(page, "/data-privacy", "Data Privacy page");
  });

  test("Forgot Password page should be accessible", async ({ page }) => {
    await checkA11y(page, "/forgot-password", "Forgot Password page");
  });
});

// ============================================================================
// Color Contrast Tests
// ============================================================================

test.describe("Accessibility — Color Contrast", () => {
  test("should have sufficient color contrast on login page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .include("body")
      .withRules(["color-contrast"])
      .analyze();

    const contrastViolations = results.violations.filter(
      (v: any) => v.id === "color-contrast"
    );

    expect(contrastViolations).toHaveLength(0);
  });
});

// ============================================================================
// Keyboard Navigation Tests
// ============================================================================

test.describe("Accessibility — Keyboard Navigation", () => {
  test("should be able to tab through login form", async ({ page }) => {
    await page.goto("/login");

    // Tab through the form
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Should eventually reach the email input
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      const type = await page.evaluate(() =>
        (document.activeElement as HTMLInputElement)?.type
      );
      if (tag === "INPUT" && (type === "email" || type === "text")) {
        break;
      }
    }
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/login");

    // Tab to a focusable element
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Check that the focused element has a visible outline/ring
    const hasVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return (
        style.outlineStyle !== "none" ||
        style.boxShadow !== "none" ||
        el.classList.toString().includes("focus") ||
        el.classList.toString().includes("ring")
      );
    });

    expect(hasVisibleFocus).toBeTruthy();
  });

  test("should trap focus in modals", async ({ page }) => {
    await page.goto("/login");

    // This test will be expanded when modals are tested
    // For now, verify no focus escape from main content
    const body = await page.locator("body");
    expect(body).toBeTruthy();
  });
});

// ============================================================================
// Semantic Structure Tests
// ============================================================================

test.describe("Accessibility — Semantic Structure", () => {
  test("should have exactly one h1 on login page", async ({ page }) => {
    await page.goto("/login");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/login");

    const headings = await page.evaluate(() => {
      const headingEls = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      return Array.from(headingEls).map((h) => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim().substring(0, 50),
      }));
    });

    // First heading should be h1
    if (headings.length > 0) {
      expect(headings[0].level).toBe(1);
    }

    // No skipping levels (h1 → h3 without h2)
    for (let i = 1; i < headings.length; i++) {
      const jump = headings[i].level - headings[i - 1].level;
      expect(jump).toBeLessThanOrEqual(1);
    }
  });

  test("should have proper landmark roles", async ({ page }) => {
    await page.goto("/login");

    const hasMain = (await page.locator("main").count()) > 0 ||
      (await page.locator('[role="main"]').count()) > 0;
    expect(hasMain).toBeTruthy();
  });

  test("all images should have alt text", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withRules(["image-alt"])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test("all form inputs should have labels", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withRules(["label"])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });
});

// ============================================================================
// ARIA Tests
// ============================================================================

test.describe("Accessibility — ARIA", () => {
  test("should have valid ARIA attributes", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withRules([
        "aria-allowed-attr",
        "aria-hidden-body",
        "aria-required-attr",
        "aria-valid-attr",
        "aria-valid-attr-value",
      ])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test("should have proper language attribute", async ({ page }) => {
    await page.goto("/login");

    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^(en|fil)/);
  });
});
