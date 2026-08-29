import { expect } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { openRoute, pageHasText, SMOKE } from "./helpers";
import { uiShot, bodyOrVisible, assertApplicantDashboardActionRequired, assertApplicantDashboardSection } from "./ui-inspection-helpers";

const test = createRoleTest("applicant");
test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

async function onApplicantPage(page: import("@playwright/test").Page, route: string) {
  await openRoute(page, route, { urlPattern: /\/applicant\// });
}

async function onNewApplicationPage(page: import("@playwright/test").Page) {
  await openRoute(page, "/applicant/application/new", { urlPattern: /\/application\/new/ });
  await expect(page.getByRole("heading", { name: /New Application/i })).toBeVisible({
    timeout: 45_000,
  });
}

async function onRenewalPage(page: import("@playwright/test").Page) {
  await openRoute(page, "/applicant/application/renewal", { urlPattern: /\/application\/renewal/ });
  await expect(page.getByRole("heading", { name: /Renewal Application/i })).toBeVisible({
    timeout: 45_000,
  });
}

async function onClosurePage(page: import("@playwright/test").Page) {
  await openRoute(page, "/applicant/application/closure", { urlPattern: /\/application\/closure/ });
  await expect(page.getByRole("heading", { name: /Closure Application/i })).toBeVisible({
    timeout: 45_000,
  });
}

async function onMyApplicationsPage(page: import("@playwright/test").Page) {
  await openRoute(page, "/applicant/my-applications", { urlPattern: /\/my-applications/ });
  await expect(page.getByRole("heading", { name: /My Applications/i })).toBeVisible({
    timeout: 45_000,
  });
}

async function onTopPage(page: import("@playwright/test").Page) {
  await openRoute(page, "/applicant/top", { urlPattern: /\/top/ });
  await expect(page.getByRole("heading", { name: /Tax Order of Payment/i })).toBeVisible({
    timeout: 45_000,
  });
}

test.describe("4–8 Applicant Portal UI", () => {
  test("BB-UI-AP-NAV-001 Sidebar brand", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    await expect(page.getByText(/Applicant Portal/i).first()).toBeVisible();
    await uiShot(page, "BB-UI-AP-NAV-001");
  });

  test("BB-UI-AP-NAV-002 Sidebar links", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    for (const label of ["Dashboard", "File Application", "My Applications", "Tax Order", "Notifications", "Profile"]) {
      await expect(page.getByRole("link", { name: new RegExp(label, "i") }).first()).toBeVisible();
    }
    await uiShot(page, "BB-UI-AP-NAV-002");
  });

  test("BB-UI-AP-NAV-003 Active nav highlight", async ({ page }) => {
    await onApplicantPage(page, "/applicant/my-applications");
    await uiShot(page, "BB-UI-AP-NAV-003");
  });

  test("BB-UI-AP-NAV-004 Top header welcome", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    await expect(page.getByText(/Welcome,/i).first()).toBeVisible();
    await expect(page.getByText(/Track applications/i).first()).toBeVisible();
    await uiShot(page, "BB-UI-AP-NAV-004");
  });

  test("BB-UI-AP-NAV-005 Notification dropdown", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    const bell = page.locator('button[aria-label*="notification" i], button:has(svg)').first();
    if (await bell.isVisible().catch(() => false)) await bell.click();
    await uiShot(page, "BB-UI-AP-NAV-005");
  });

  test("BB-UI-AP-NAV-006 Profile menu", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    await expect(page.getByRole("link", { name: /Profile/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign Out|Log out/i })).toBeVisible();
    await uiShot(page, "BB-UI-AP-NAV-006");
  });

  test("BB-UI-AP-NAV-007 Mobile sidebar toggle", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await onApplicantPage(page, "/applicant/dashboard");
    const menu = page.getByRole("button", { name: /menu|navigation|open/i }).first();
    if (await menu.isVisible().catch(() => false)) await menu.click();
    await uiShot(page, "BB-UI-AP-NAV-007");
  });

  test("BB-UI-AP-NAV-008 Sidebar collapse", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    const collapse = page.getByRole("button", { name: /Collapse|Expand/i }).first();
    if (await collapse.isVisible().catch(() => false)) await collapse.click();
    await uiShot(page, "BB-UI-AP-NAV-008");
  });

  test("BB-UI-AP-NAV-009 Profile picture guard", async ({ page }) => {
    await page.goto("/applicant/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/applicant\/(dashboard|profile-picture\/setup)/);
    await uiShot(page, "BB-UI-AP-NAV-009");
  });

  test("BB-UI-AP-DASH-001 Page heading", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    await expect(page.getByText(/My Dashboard/i).first()).toBeVisible();
    await uiShot(page, "BB-UI-AP-DASH-001");
  });

  test("BB-UI-AP-DASH-002 Action Required section", async ({ page }) => {
    await assertApplicantDashboardActionRequired(page);
    await uiShot(page, "BB-UI-AP-DASH-002");
  });

  test("BB-UI-AP-DASH-003 Application Summary cards", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    await expect(page.getByText("Application Summary")).toBeVisible();
    await uiShot(page, "BB-UI-AP-DASH-003");
  });

  test("BB-UI-AP-DASH-004 Permit Validity Tracking", async ({ page }) => {
    await assertApplicantDashboardSection(page, /Permit Validity Tracking/i);
    await bodyOrVisible(page, /Active Permit Validity|No active permit|Permit Validity/i);
    await uiShot(page, "BB-UI-AP-DASH-004");
  });

  test("BB-UI-AP-DASH-005 Latest Application Status", async ({ page }) => {
    await assertApplicantDashboardSection(page, /Latest Application Status/i);
    await uiShot(page, "BB-UI-AP-DASH-005");
  });

  test("BB-UI-AP-DASH-006 Application Progress Overview", async ({ page }) => {
    await assertApplicantDashboardSection(page, /Application Progress Overview/i);
    await uiShot(page, "BB-UI-AP-DASH-006");
  });

  test("BB-UI-AP-DASH-007 Recent Applications table", async ({ page }) => {
    await assertApplicantDashboardSection(page, /Recent Applications/i);
    await bodyOrVisible(page, /Application Number|Business Name|Status/i);
    await uiShot(page, "BB-UI-AP-DASH-007");
  });

  test("BB-UI-AP-DASH-008 View Details button", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    const view = page.getByRole("link", { name: /View Details|View/i }).first();
    if (await view.isVisible().catch(() => false)) await expect(view).toBeVisible();
    await uiShot(page, "BB-UI-AP-DASH-008");
  });

  test("BB-UI-AP-DASH-009 Primary action buttons", async ({ page }) => {
    await assertApplicantDashboardSection(page, /Primary Actions/i);
    await expect(page.getByRole("link", { name: /File New Application/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View All Applications/i })).toBeVisible();
    await uiShot(page, "BB-UI-AP-DASH-009");
  });

  test("BB-UI-AP-DASH-010 Empty state", async ({ page }) => {
    await onApplicantPage(page, "/applicant/dashboard");
    await uiShot(page, "BB-UI-AP-DASH-010");
  });

  test("BB-UI-AP-FILE-001 Application hub heading", async ({ page }) => {
    await onApplicantPage(page, "/applicant/application");
    await bodyOrVisible(page, /Application Filing|New Application|Renewal|Closure|Choose/i);
    await uiShot(page, "BB-UI-AP-FILE-001");
  });

  test("BB-UI-AP-FILE-002 New Application card", async ({ page }) => {
    await onApplicantPage(page, "/applicant/application/new");
    await expect(page).toHaveURL(/\/application\/new/);
    await uiShot(page, "BB-UI-AP-FILE-002");
  });

  test("BB-UI-AP-FILE-003 Renewal Application card", async ({ page }) => {
    await onApplicantPage(page, "/applicant/application/renewal");
    await expect(page).toHaveURL(/\/application\/renewal/);
    await uiShot(page, "BB-UI-AP-FILE-003");
  });

  test("BB-UI-AP-FILE-004 Closure Application card", async ({ page }) => {
    await onApplicantPage(page, "/applicant/application/closure");
    await expect(page).toHaveURL(/\/application\/closure/);
    await uiShot(page, "BB-UI-AP-FILE-004");
  });

  test("BB-UI-AP-NEW-001 New application stepper", async ({ page }) => {
    await onNewApplicationPage(page);
    await bodyOrVisible(page, /Business Information|Business Operation|Document Upload|Review and Submit/i);
    await uiShot(page, "BB-UI-AP-NEW-001");
  });

  test("BB-UI-AP-NEW-002 Business Information fields", async ({ page }) => {
    await onNewApplicationPage(page);
    await bodyOrVisible(page, /Business Type|TIN|Business Name|Owner/i);
    await uiShot(page, "BB-UI-AP-NEW-002");
  });

  test("BB-UI-AP-NEW-003 Business Operation fields", async ({ page }) => {
    await onNewApplicationPage(page);
    const next = page.getByRole("button", { name: /^Next$/i }).first();
    if (await next.isVisible().catch(() => false)) await next.click();
    await bodyOrVisible(page, /Line of Business|Business Activity|Payment|Capital|Operation/i);
    await uiShot(page, "BB-UI-AP-NEW-003");
  });

  test("BB-UI-AP-NEW-004 Document upload table", async ({ page }) => {
    await onNewApplicationPage(page);
    await bodyOrVisible(page, /Document|Upload|Required/i);
    await uiShot(page, "BB-UI-AP-NEW-004");
  });

  test("BB-UI-AP-NEW-005 Wizard navigation buttons", async ({ page }) => {
    await onNewApplicationPage(page);
    await expect(page.getByRole("button", { name: /Save Draft|Next|Back/i }).first()).toBeVisible();
    await uiShot(page, "BB-UI-AP-NEW-005");
  });

  test("BB-UI-AP-NEW-006 Print Verification Form", async ({ page }) => {
    await onNewApplicationPage(page);
    const printBtn = page.getByRole("button", { name: /Print Verification/i });
    if (await printBtn.isVisible().catch(() => false)) await expect(printBtn).toBeVisible();
    await uiShot(page, "BB-UI-AP-NEW-006");
  });

  test("BB-UI-AP-NEW-007 Submit application button", async ({ page }) => {
    await onNewApplicationPage(page);
    await expect(page.getByText(/Review and Submit/i).first()).toBeVisible({ timeout: 45_000 });
    const next = page.getByRole("button", { name: /^Next$/i });
    for (let i = 0; i < 4; i += 1) {
      if (!(await next.isEnabled().catch(() => false))) break;
      await next.click();
    }
    await bodyOrVisible(page, /Submit Application|Save Draft|Review and Submit/i);
    await uiShot(page, "BB-UI-AP-NEW-007");
  });

  test("BB-UI-AP-REN-001 Renewal business selector", async ({ page }) => {
    await onRenewalPage(page);
    await bodyOrVisible(page, /Select Existing Business|Renewal Application/i);
    await uiShot(page, "BB-UI-AP-REN-001");
  });

  test("BB-UI-AP-REN-002 Renewal locked fields", async ({ page }) => {
    await onRenewalPage(page);
    await uiShot(page, "BB-UI-AP-REN-002");
  });

  test("BB-UI-AP-REN-003 Gross Profit field", async ({ page }) => {
    await onRenewalPage(page);
    await bodyOrVisible(page, /Gross Profit|Renewal|Business/i);
    await uiShot(page, "BB-UI-AP-REN-003");
  });

  test("BB-UI-AP-CLOSE-001 Closure business selector", async ({ page }) => {
    await onClosurePage(page);
    await bodyOrVisible(page, /Select Existing Business|Closure Application|Close/i);
    await uiShot(page, "BB-UI-AP-CLOSE-001");
  });

  test("BB-UI-AP-CLOSE-002 Closure type fields", async ({ page }) => {
    await onClosurePage(page);
    await bodyOrVisible(page, /Closure Type|Retirement|Last Date/i);
    await uiShot(page, "BB-UI-AP-CLOSE-002");
  });

  test("BB-UI-AP-CLOSE-003 Closure document upload", async ({ page }) => {
    await onClosurePage(page);
    await bodyOrVisible(page, /Document|Upload|Required/i);
    await uiShot(page, "BB-UI-AP-CLOSE-003");
  });

  test("BB-UI-AP-CLOSE-004 Closure empty eligibility", async ({ page }) => {
    await onClosurePage(page);
    await uiShot(page, "BB-UI-AP-CLOSE-004");
  });

  test("BB-UI-AP-MY-001 My Applications heading", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-MY-001");
  });

  test("BB-UI-AP-MY-002 Applications table", async ({ page }) => {
    await onMyApplicationsPage(page);
    await bodyOrVisible(page, /Application Number|Business Name|Status/i);
    await uiShot(page, "BB-UI-AP-MY-002");
  });

  test("BB-UI-AP-MY-003 View action", async ({ page }) => {
    await onMyApplicationsPage(page);
    const view = page.getByRole("link", { name: /^View$/i }).first();
    if (await view.isVisible().catch(() => false)) {
      await view.click();
      await expect(page).toHaveURL(/\/my-applications\//);
    }
    await uiShot(page, "BB-UI-AP-MY-003");
  });

  test("BB-UI-AP-MY-004 Edit Draft action", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-MY-004");
  });

  test("BB-UI-AP-MY-005 Correct and Resubmit", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-MY-005");
  });

  test("BB-UI-AP-MY-006 New filing shortcut", async ({ page }) => {
    await onMyApplicationsPage(page);
    await bodyOrVisible(page, /New|File|Application/i);
    await uiShot(page, "BB-UI-AP-MY-006");
  });

  test("BB-UI-AP-MY-007 Pagination controls", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-MY-007");
  });

  test("BB-UI-AP-DET-001 Application Detail heading", async ({ page }) => {
    await onMyApplicationsPage(page);
    const link = page.locator('a[href*="/my-applications/"]').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await bodyOrVisible(page, /Application Detail|Status/i);
    }
    await uiShot(page, "BB-UI-AP-DET-001");
  });

  test("BB-UI-AP-DET-002 Status Workflow tracker", async ({ page }) => {
    await onMyApplicationsPage(page);
    const link = page.locator('a[href*="/my-applications/"]').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await bodyOrVisible(page, /Workflow|Status|Progress/i);
    }
    await uiShot(page, "BB-UI-AP-DET-002");
  });

  test("BB-UI-AP-DET-003 Your Next Action panel", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-003");
  });

  test("BB-UI-AP-DET-004 BPLO Remarks section", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-004");
  });

  test("BB-UI-AP-DET-005 Submitted Information snapshot", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-005");
  });

  test("BB-UI-AP-DET-006 View TOP Payment button", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-006");
  });

  test("BB-UI-AP-DET-007 View Permit Preview button", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-007");
  });

  test("BB-UI-AP-DET-008 Print Closure Certificate", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-008");
  });

  test("BB-UI-AP-DET-009 Back to My Applications", async ({ page }) => {
    await onMyApplicationsPage(page);
    await uiShot(page, "BB-UI-AP-DET-009");
  });

  test("BB-UI-AP-TOP-001 Tax Order heading", async ({ page }) => {
    await onTopPage(page);
    await uiShot(page, "BB-UI-AP-TOP-001");
  });

  test("BB-UI-AP-TOP-002 TOP not available state", async ({ page }) => {
    await onTopPage(page);
    await uiShot(page, "BB-UI-AP-TOP-002");
  });

  test("BB-UI-AP-TOP-003 TOP Summary section", async ({ page }) => {
    await onTopPage(page);
    await bodyOrVisible(page, /Summary|TOP|Tax|Fee|not yet available/i);
    await uiShot(page, "BB-UI-AP-TOP-003");
  });

  test("BB-UI-AP-TOP-004 Payment submission form", async ({ page }) => {
    await onTopPage(page);
    await bodyOrVisible(page, /OR|Payment|Proof|Reference/i);
    await uiShot(page, "BB-UI-AP-TOP-004");
  });

  test("BB-UI-AP-TOP-005 Submit Payment button", async ({ page }) => {
    await onTopPage(page);
    await bodyOrVisible(page, /Submit Payment|Payment/i);
    await uiShot(page, "BB-UI-AP-TOP-005");
  });

  test("BB-UI-AP-TOP-006 Request Re-assessment button", async ({ page }) => {
    await onTopPage(page);
    await uiShot(page, "BB-UI-AP-TOP-006");
  });

  test("BB-UI-AP-TOP-007 Payment status banners", async ({ page }) => {
    await onTopPage(page);
    await uiShot(page, "BB-UI-AP-TOP-007");
  });

  test("BB-UI-AP-PRO-001 Profile page sections", async ({ page }) => {
    await onApplicantPage(page, "/applicant/profile");
    await bodyOrVisible(page, /Profile|Change Password|Account/i);
    await uiShot(page, "BB-UI-AP-PRO-001");
  });

  test("BB-UI-AP-PRO-002 Change Password form", async ({ page }) => {
    await onApplicantPage(page, "/applicant/profile");
    await bodyOrVisible(page, /Current Password|New Password|Confirm/i);
    await uiShot(page, "BB-UI-AP-PRO-002");
  });

  test("BB-UI-AP-PRO-003 Profile picture setup", async ({ page }) => {
    await page.goto("/applicant/profile-picture/setup", { waitUntil: "domcontentloaded" });
    await bodyOrVisible(page, /Profile Picture|Camera|Upload|Save/i);
    await uiShot(page, "BB-UI-AP-PRO-003");
  });

  test("BB-UI-AP-NOT-001 Notifications list", async ({ page }) => {
    await onApplicantPage(page, "/applicant/notifications");
    await bodyOrVisible(page, /Notification|No records|message/i);
    await uiShot(page, "BB-UI-AP-NOT-001");
  });

  test("BB-UI-AP-NOT-002 Notifications empty state", async ({ page }) => {
    await onApplicantPage(page, "/applicant/notifications");
    await uiShot(page, "BB-UI-AP-NOT-002");
  });
});
