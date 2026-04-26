import { Page } from "@playwright/test";

export async function loginAsBPLO(page: Page): Promise<boolean> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("bplo@lgu.gov.ph");
  await page.locator('input[type="password"]').fill("Password123!");
  await page.locator('button[type="submit"]').click();
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

export async function loginAsApplicant(page: Page): Promise<boolean> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("applicant@example.com");
  await page.locator('input[type="password"]').fill("Password123!");
  await page.locator('button[type="submit"]').click();
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
