import { defineConfig, devices } from "@playwright/test";

/**
 * Browser executor for Katalon-equivalent Auth suite.
 * Overrides AUTH/NEXTAUTH URLs to local so redirects stay on the test host
 * (project .env may point at an ngrok tunnel).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/playwright-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "on",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 3000 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NEXTAUTH_URL: "http://127.0.0.1:3000",
      AUTH_URL: "http://127.0.0.1:3000",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      AUTH_TRUST_HOST: "true",
    },
  },
  outputDir: "e2e/test-results",
});
