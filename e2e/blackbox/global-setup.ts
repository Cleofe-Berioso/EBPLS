import { chromium } from "@playwright/test";
import { ensureAuthState, USERS } from "./helpers";

/** Pre-warm role auth once before the long UI suite to avoid mid-run login rate limits. */
export default async function globalSetup() {
  const browser = await chromium.launch();
  const roles = Object.keys(USERS).filter((role) => role !== "jitDisabled") as Array<
    keyof typeof USERS
  >;

  for (const role of roles) {
    await ensureAuthState(browser, role);
  }

  await browser.close();
}
