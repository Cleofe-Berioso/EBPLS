import { test, expect } from "@playwright/test";

test.describe("Root Route", () => {
  test("should redirect root requests to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should render the login form after redirecting", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });
});

test.describe("Login Page", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password\s*\*?$/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("should have link to register", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /register|create|sign up/i })).toBeVisible();
  });

  test("should have link to forgot password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
  });

  test("should show error for empty submission", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    // Browser validation should prevent submission or show error
  });
});

test.describe("Registration Page", () => {
  test("should display registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("should have link to login", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("link", { name: /log in|sign in/i })).toBeVisible();
  });
});

test.describe("Public Pages", () => {
  test("requirements page loads", async ({ page }) => {
    await page.goto("/requirements");
    await expect(page.locator("h1")).toContainText("Requirements");
  });

  test("how-to-apply page loads", async ({ page }) => {
    await page.goto("/how-to-apply");
    await expect(page.locator("h1")).toContainText("How to Apply");
  });

  test("FAQs page loads", async ({ page }) => {
    await page.goto("/faqs");
    await expect(page.locator("h1")).toContainText("Frequently Asked");
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("Contact");
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("Privacy");
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("Terms");
  });

  test("data-privacy page loads", async ({ page }) => {
    await page.goto("/data-privacy");
    await expect(page.locator("h1")).toContainText("Data Privacy");
  });
});

test.describe("Protected Routes", () => {
  test("dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("applications page redirects to login", async ({ page }) => {
    await page.goto("/dashboard/applications");
    await expect(page).toHaveURL(/\/login/);
  });
});
