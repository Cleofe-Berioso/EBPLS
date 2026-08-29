import { expect, test } from "@playwright/test";
import { createRoleTest } from "./fixtures";
import { USERS, openRoute, pageHasText, SMOKE } from "./helpers";
import {
  uiShot,
  bodyMatches,
  bodyOrVisible,
  expectDisabledLoginAlert,
  openJitInspectionForm,
  openJitNoPermitForm,
  assertPermitIssuanceActions,
  assertApplicantTopPage,
} from "./ui-inspection-helpers";

const applicant = createRoleTest("applicant");
const bplo = createRoleTest("bplo");
const dhTest = createRoleTest("deptHead");
const jitTest = createRoleTest("jit");

test.describe("14 JIT disabled account", () => {
  test("BB-UI-JIT-DIS-002 Disabled account login", async ({ page }) => {
    await expectDisabledLoginAlert(page);
    await uiShot(page, "BB-UI-JIT-DIS-002");
  });
});

applicant.describe("17 End-to-End Process UI — Applicant", () => {
  applicant.setTimeout(180_000);

  applicant("BB-UI-E2E-001 NEW Applicant draft UI", async ({ page }) => {
    await openRoute(page, "/applicant/application/new", { urlPattern: /\/application\/new/ });
    await expect(page.getByRole("heading", { name: /New Application/i })).toBeVisible();
    await bodyOrVisible(page, /Business Information|Review and Submit|save draft/i);
    await uiShot(page, "BB-UI-E2E-001");
  });

  applicant("BB-UI-E2E-002 NEW Applicant submit UI", async ({ page }) => {
    await openRoute(page, "/applicant/application/new", { urlPattern: /\/application\/new/ });
    await bodyOrVisible(page, /Review and Submit|Submit|save draft/i);
    await uiShot(page, "BB-UI-E2E-002");
  });

  applicant("BB-UI-E2E-007 NEW Applicant TOP UI", async ({ page }) => {
    await assertApplicantTopPage(page);
    await uiShot(page, "BB-UI-E2E-007");
  });

  applicant("BB-UI-E2E-011 NEW Applicant permit view UI", async ({ page }) => {
    await openRoute(page, "/applicant/my-applications", { urlPattern: /\/my-applications/ });
    const hasSmoke =
      (await pageHasText(page, SMOKE.paidName)) || (await pageHasText(page, SMOKE.retailReleased));
    if (hasSmoke) await bodyMatches(page, /View|Permit|Payment|Released/i);
    await uiShot(page, "BB-UI-E2E-011");
  });

  applicant("BB-UI-E2E-012 RENEWAL filing entry UI", async ({ page }) => {
    await openRoute(page, "/applicant/application/renewal", { urlPattern: /\/renewal/ });
    await bodyOrVisible(page, /Renewal Application|Select Existing Business|Renewal/i);
    await uiShot(page, "BB-UI-E2E-012");
  });

  applicant("BB-UI-E2E-014 CLOSURE filing entry UI", async ({ page }) => {
    await openRoute(page, "/applicant/application/closure", { urlPattern: /\/closure/ });
    await bodyOrVisible(page, /Closure Application|Closure|Document Upload/i);
    await uiShot(page, "BB-UI-E2E-014");
  });

  applicant("BB-UI-E2E-016 RETURN correction UI", async ({ page }) => {
    await openRoute(page, "/applicant/my-applications", { urlPattern: /\/my-applications/ });
    await uiShot(page, "BB-UI-E2E-016");
  });
});

bplo.describe("17 E2E BPLO workflow UI", () => {
  bplo.setTimeout(180_000);

  bplo("BB-UI-E2E-003 NEW BPLO review UI", async ({ page }) => {
    await openRoute(page, "/bplo/applications", { urlPattern: /\/applications/ });
    await bodyMatches(page, /Review|Return|Reject|Under Review|Queue/i);
    await uiShot(page, "BB-UI-E2E-003");
  });

  bplo("BB-UI-E2E-004 NEW BPLO send to DH UI", async ({ page }) => {
    await openRoute(page, "/bplo/applications", { urlPattern: /\/applications/ });
    await bodyMatches(page, /Department Head|Review|Return|Reject/i);
    await uiShot(page, "BB-UI-E2E-004");
  });

  bplo("BB-UI-E2E-006 NEW BPLO assessment UI", async ({ page }) => {
    await openRoute(page, "/bplo/assessment-fees", { urlPattern: /\/assessment-fees/ });
    await bodyMatches(page, /Assessment|Generate TOP|Assess|Fee/i);
    await uiShot(page, "BB-UI-E2E-006");
  });

  bplo("BB-UI-E2E-008 NEW BPLO payment verify UI", async ({ page }) => {
    await openRoute(page, "/bplo/payment-verification", { urlPattern: /\/payment-verification/ });
    await bodyMatches(page, /Pending|Verify|Proof|Payment/i);
    await uiShot(page, "BB-UI-E2E-008");
  });

  bplo("BB-UI-E2E-009 NEW BPLO permit prepare UI", async ({ page }) => {
    await assertPermitIssuanceActions(page);
    await uiShot(page, "BB-UI-E2E-009");
  });

  bplo("BB-UI-E2E-010 NEW BPLO permit release UI", async ({ page }) => {
    await openRoute(page, "/bplo/permit-issuance", { urlPattern: /\/permit-issuance/ });
    await bodyOrVisible(page, /For Release|Mark Released|Released|Permit Issuance/i);
    await uiShot(page, "BB-UI-E2E-010");
  });

  bplo("BB-UI-E2E-013 RENEWAL payment queue UI", async ({ page }) => {
    await openRoute(page, "/bplo/payment-verification", { urlPattern: /\/payment-verification/ });
    await uiShot(page, "BB-UI-E2E-013");
  });

  bplo("BB-UI-E2E-015 CLOSURE certificate UI", async ({ page }) => {
    await openRoute(page, "/bplo/permit-issuance", { urlPattern: /\/permit-issuance/ });
    await bodyOrVisible(page, /Closure|Certificate|Prepare Certificate|Permit Issuance/i);
    await uiShot(page, "BB-UI-E2E-015");
  });

  bplo("BB-UI-E2E-022 MAP released business pin UI", async ({ page }) => {
    await openRoute(page, "/bplo/business-map", { urlPattern: /\/business-map/ });
    await bodyMatches(page, /Map|Business|Filter/i);
    await uiShot(page, "BB-UI-E2E-022");
  });
});

dhTest.describe("17 E2E DH compliance UI", () => {
  dhTest.setTimeout(180_000);

  dhTest("BB-UI-E2E-005 NEW DH approval UI", async ({ page }) => {
    await openRoute(page, "/department-head/application-approval", {
      urlPattern: /\/application-approval/,
    });
    await bodyMatches(page, /Approve|Return|Reject|Pending/i);
    await uiShot(page, "BB-UI-E2E-005");
  });

  dhTest("BB-UI-E2E-019 COMPLIANCE non-compliant UI", async ({ page }) => {
    await openRoute(page, "/department-head/inspection-verification", {
      urlPattern: /\/inspection-verification/,
    });
    await bodyMatches(page, /Compliant|Non-Compliant|Verify/i);
    await uiShot(page, "BB-UI-E2E-019");
  });

  dhTest("BB-UI-E2E-020 COMPLIANCE flagged revocation UI", async ({ page }) => {
    await openRoute(page, "/department-head/permit-to-revoke", { urlPattern: /\/permit-to-revoke/ });
    await bodyMatches(page, /Approve Revocation|Deny Revocation|Flagged/i);
    await uiShot(page, "BB-UI-E2E-020");
  });

  dhTest("BB-UI-E2E-021 COMPLIANCE settlement UI", async ({ page }) => {
    await openRoute(page, "/department-head/settlement-management", {
      urlPattern: /\/settlement-management/,
    });
    await bodyMatches(page, /Mark as Settled|Settlement|Eligible/i);
    await uiShot(page, "BB-UI-E2E-021");
  });
});

jitTest.describe("17 E2E JIT UI", () => {
  jitTest.setTimeout(180_000);

  jitTest("BB-UI-E2E-017 JIT inspection submit UI", async ({ page }) => {
    await openJitInspectionForm(page);
    await bodyOrVisible(page, /Submit Inspection|General Inspection Remarks|Inspect a Business/i);
    await uiShot(page, "BB-UI-E2E-017");
  });

  jitTest("BB-UI-E2E-018 JIT no permit ticket UI", async ({ page }) => {
    await openJitNoPermitForm(page);
    await bodyOrVisible(page, /Save Record|Print|Ticket|Business Name|Add Record/i);
    await uiShot(page, "BB-UI-E2E-018");
  });
});
