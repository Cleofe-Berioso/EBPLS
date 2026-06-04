Table 1
User Login

Use Case 1
User Login

Use Case Goal
To allow a user to sign in to the EBPLS system and access the correct role-based area.

Scenario 1
Successful user sign-in.

Actor
User

Pre-condition
The user already has a valid account and is not blocked from signing in.

Main Flow
Step 1: The user opens the sign-in page.
Step 2: The system displays the email and password form and the Google sign-in option.
Step 3: The user enters the account email and password or chooses Google sign-in.
Step 4: The system validates the credentials and creates the session.
Step 5: The system redirects the user to the appropriate role-based page.

User Action
The user enters sign-in details and submits the form.

System Response
The system authenticates the user and opens the correct portal area.

Supporting Files
src/app/login/page.tsx
src/components/auth/login-form.tsx
src/app/login/actions.ts
src/lib/auth.ts

Table 2
Applicant Dashboard Viewing

Use Case 2
Applicant Dashboard Viewing

Use Case Goal
To allow an applicant to view personal application progress, permit validity, and the latest workflow status.

Scenario 1
Successful viewing of the applicant dashboard.

Actor
Applicant

Pre-condition
The applicant is signed in.

Main Flow
Step 1: The applicant opens the dashboard page.
Step 2: The system loads the applicant's summary data and latest application details.
Step 3: The system displays application counts, permit validity, and recent records.
Step 4: The applicant reviews the current workflow status and next action.
Step 5: The system keeps the page in read-only mode without changing any records.

User Action
The applicant reviews the dashboard information.

System Response
The system displays read-only tracking information for the applicant's records.

Supporting Files
src/app/applicant/dashboard/page.tsx
src/lib/applicant-dashboard.ts
src/lib/applicant-api.ts

Table 3
New Business Application Submission

Use Case 3
New Business Application Submission

Use Case Goal
To allow an applicant to submit a new business permit application with the required details and documents.

Scenario 1
Successful submission of a new application.

Actor
Applicant

Pre-condition
The applicant is signed in and has access to the new application form.

Main Flow
Step 1: The applicant opens the new application page.
Step 2: The system displays the multi-step application form.
Step 3: The applicant enters business information, owner information, address, and required documents.
Step 4: The applicant submits the application.
Step 5: The system validates and saves the application, then places it in the review workflow.

User Action
The applicant completes and submits the new application form.

System Response
The system stores the application and marks it for BPLO review.

Supporting Files
src/app/applicant/application/new/page.tsx
src/components/applicant/new-application-form.tsx
src/app/api/applicant/applications/route.ts
src/lib/applications.ts

Table 4
Renewal Application Submission

Use Case 4
Renewal Application Submission

Use Case Goal
To allow an applicant to submit a renewal application for an eligible existing business.

Scenario 1
Successful submission of a renewal application.

Actor
Applicant

Pre-condition
The applicant is signed in and has an eligible business record for renewal.

Main Flow
Step 1: The applicant opens the renewal application page.
Step 2: The system displays the renewal form and the eligible business record.
Step 3: The applicant reviews the previous details and completes the required renewal fields.
Step 4: The applicant uploads the required documents and submits the application.
Step 5: The system validates and saves the renewal application, then places it in the review workflow.

User Action
The applicant completes and submits the renewal form.

System Response
The system stores the renewal application and sends it for BPLO review.

Supporting Files
src/app/applicant/application/renewal/page.tsx
src/components/applicant/renewal-application-form.tsx
src/app/api/applicant/applications/route.ts
src/lib/applications.ts

Table 5
Closure Application Submission

Use Case 5
Closure Application Submission

Use Case Goal
To allow an applicant to submit a closure request for an existing business.

Scenario 1
Successful submission of a closure application.

Actor
Applicant

Pre-condition
The applicant is signed in and has an existing business that can be filed for closure.

Main Flow
Step 1: The applicant opens the closure application page.
Step 2: The system displays the closure form and the eligible business record.
Step 3: The applicant enters the closure details and uploads the required documents.
Step 4: The applicant submits the closure request.
Step 5: The system validates and saves the closure application, then places it in the review workflow.

User Action
The applicant completes and submits the closure request.

System Response
The system stores the closure application and sends it for BPLO review.

Supporting Files
src/app/applicant/application/closure/page.tsx
src/components/applicant/closure-application-form.tsx
src/app/api/applicant/applications/route.ts
src/lib/applications.ts

Table 6
Applicant Tax Order of Payment Viewing

Use Case 6
Applicant Tax Order of Payment Viewing

Use Case Goal
To allow an applicant to view the Tax Order of Payment and the related payment status.

Scenario 1
Successful viewing of TOP details.

Actor
Applicant

Pre-condition
The applicant has a submitted application with an available TOP or payment summary.

Main Flow
Step 1: The applicant opens the Tax Order of Payment page.
Step 2: The system loads the applicant's TOP summary and payment records.
Step 3: The system displays the TOP number, total amount, payment status, and related application details.
Step 4: The applicant reviews the amount due and the current payment state.
Step 5: The system keeps the page as a read-only record view.

User Action
The applicant reviews the TOP information.

System Response
The system displays the TOP summary and payment details without changing the record.

Supporting Files
src/app/applicant/top/page.tsx
src/app/api/applicant/top/route.ts
src/lib/applications.ts

Table 7
Applicant Official Receipt Number Submission

Use Case 7
Applicant Official Receipt Number Submission

Use Case Goal
To allow an applicant to submit the Official Receipt Number and payment proof after payment.

Scenario 1
Successful submission of payment reference.

Actor
Applicant

Pre-condition
The applicant has an available TOP and has already paid the required amount.

Main Flow
Step 1: The applicant opens the Tax Order of Payment page.
Step 2: The system displays the form for the Official Receipt Number and payment proof.
Step 3: The applicant enters the Official Receipt Number and uploads the proof file.
Step 4: The applicant submits the payment reference.
Step 5: The system stores the proof and marks the payment reference as pending verification.

User Action
The applicant submits the Official Receipt Number and payment proof.

System Response
The system records the payment reference and forwards it to BPLO for verification.

Supporting Files
src/app/applicant/top/page.tsx
src/app/api/applicant/top/route.ts
src/lib/applications.ts
src/lib/document-storage.ts

Table 8
Applicant Permit Viewing

Use Case 8
Applicant Permit Viewing

Use Case Goal
To allow an applicant to view a released business permit preview.

Scenario 1
Successful viewing of a permit preview.

Actor
Applicant

Pre-condition
The application has already been released and the applicant has access to the permit record.

Main Flow
Step 1: The applicant opens the permit viewing page.
Step 2: The system checks whether the applicant is allowed to view the permit.
Step 3: The system loads the permit preview data.
Step 4: The applicant reviews the permit details on screen.
Step 5: The system shows the permit as a preview only and does not change the record.

User Action
The applicant opens and reviews the permit preview.

System Response
The system displays the permit preview and keeps printing and release control under BPLO.

Supporting Files
src/app/applicant/permits/[applicationId]/page.tsx
src/components/print/business-permit-template.tsx
src/lib/printable-documents.ts

Table 9
BPLO Application Review

Use Case 9
BPLO Application Review

Use Case Goal
To allow BPLO Staff to review submitted applications and approve them for the next stage of processing.

Scenario 1
Successful BPLO approval for assessment.

Actor
BPLO Staff

Pre-condition
The application is in the BPLO review queue.

Main Flow
Step 1: BPLO Staff opens the applications queue.
Step 2: The system displays the submitted and review-stage applications.
Step 3: BPLO Staff opens one application and reviews the details and documents.
Step 4: BPLO Staff approves the application for the next workflow stage.
Step 5: The system updates the application status and routes it forward in the review flow.

User Action
BPLO Staff reviews the application and approves it for the next stage.

System Response
The system records the BPLO decision and moves the application forward.

Supporting Files
src/app/bplo/applications/page.tsx
src/app/api/bplo/applications/route.ts
src/app/api/bplo/applications/[applicationId]/approve-assessment/route.ts
src/lib/bplo-applications.ts

Table 10
BPLO Returning or Rejecting an Application

Use Case 10
BPLO Returning or Rejecting an Application

Use Case Goal
To allow BPLO Staff to return an application for correction or reject it when the review does not pass.

Scenario 1
Successful return or rejection of a reviewed application.

Actor
BPLO Staff

Pre-condition
The application is in the BPLO review queue and BPLO Staff has opened it for decision.

Main Flow
Step 1: BPLO Staff opens the reviewed application.
Step 2: The system displays the application details and the available decision actions.
Step 3: BPLO Staff enters remarks and chooses to return the application for correction or reject it.
Step 4: The system validates the remarks when required and records the decision.
Step 5: The system updates the application status to returned for correction or rejected.

User Action
BPLO Staff enters the review remarks and chooses the decision.

System Response
The system updates the application record based on the BPLO decision.

Supporting Files
src/app/bplo/applications/page.tsx
src/app/api/bplo/applications/[applicationId]/return/route.ts
src/app/api/bplo/applications/[applicationId]/reject/route.ts
src/lib/bplo-applications.ts

Table 11
BPLO Fee Assessment

Use Case 11
BPLO Fee Assessment

Use Case Goal
To allow BPLO Staff to compute and save the fee assessment for an approved application.

Scenario 1
Successful saving of an assessment draft.

Actor
BPLO Staff

Pre-condition
The application has reached the assessment stage and is available in the fee assessment queue.

Main Flow
Step 1: BPLO Staff opens the assessment and fees page.
Step 2: The system displays the applications ready for assessment.
Step 3: BPLO Staff opens one application and reviews the suggested fee items.
Step 4: BPLO Staff edits or confirms the assessment line items and saves the draft.
Step 5: The system stores the assessment draft and keeps the application in the assessment workflow.

User Action
BPLO Staff enters or adjusts the fee assessment and saves it.

System Response
The system stores the assessment draft and keeps it ready for TOP generation.

Supporting Files
src/app/bplo/assessment-fees/page.tsx
src/app/bplo/assessment-fees/[applicationId]/page.tsx
src/components/bplo/assessment-fee-form.tsx
src/app/api/bplo/assessment-fees/[applicationId]/draft/route.ts
src/lib/bplo-assessment.ts

Table 12
BPLO Tax Order of Payment Generation

Use Case 12
BPLO Tax Order of Payment Generation

Use Case Goal
To allow BPLO Staff to finalize the assessment and generate the Tax Order of Payment.

Scenario 1
Successful TOP generation.

Actor
BPLO Staff

Pre-condition
The assessment has been prepared and the application is ready for TOP generation.

Main Flow
Step 1: BPLO Staff opens the assessment detail page.
Step 2: The system displays the prepared fee line items and the current assessment state.
Step 3: BPLO Staff confirms the fee computation and selects the generate TOP action.
Step 4: The system creates the TOP number and locks the assessment record.
Step 5: The system updates the application status to the payment stage.

User Action
BPLO Staff finalizes the assessment and generates the TOP.

System Response
The system creates the TOP and moves the application to the next payment step.

Supporting Files
src/app/bplo/assessment-fees/[applicationId]/page.tsx
src/components/bplo/assessment-fee-form.tsx
src/app/api/bplo/assessment-fees/[applicationId]/generate-top/route.ts
src/lib/bplo-assessment.ts

Table 13
BPLO Payment Verification

Use Case 13
BPLO Payment Verification

Use Case Goal
To allow BPLO Staff to verify or reject the Official Receipt Number and payment proof submitted by the applicant.

Scenario 1
Successful payment verification.

Actor
BPLO Staff

Pre-condition
The applicant has submitted a payment reference and it is waiting for review.

Main Flow
Step 1: BPLO Staff opens the payment verification page.
Step 2: The system displays the pending, verified, and rejected payment references.
Step 3: BPLO Staff opens one payment record and reviews the payment details and proof file.
Step 4: BPLO Staff approves or rejects the payment reference and enters remarks when needed.
Step 5: The system updates the payment record and changes the payment verification status.

User Action
BPLO Staff reviews the payment proof and decides on the payment reference.

System Response
The system marks the payment as verified or rejected and updates the application flow.

Supporting Files
src/app/bplo/payment-verification/page.tsx
src/app/api/bplo/payment-verification/route.ts
src/app/api/bplo/payment-verification/[paymentReferenceId]/approve/route.ts
src/app/api/bplo/payment-verification/[paymentReferenceId]/reject/route.ts
src/lib/bplo-payment-verification.ts

Table 14
Permit Issuance and Release

Use Case 14
Permit Issuance and Release

Use Case Goal
To allow BPLO Staff to prepare and release the permit or closure certificate after the payment requirements are met.

Scenario 1
Successful issuance and release of a permit or closure certificate.

Actor
BPLO Staff

Pre-condition
The application is paid and eligible for permit preparation or release.

Main Flow
Step 1: BPLO Staff opens the permit issuance page.
Step 2: The system displays the paid, for release, and released applications.
Step 3: BPLO Staff opens the issuance detail page and reviews the current state.
Step 4: BPLO Staff prepares the permit or marks it as released.
Step 5: The system stores the issuance record and updates the application to released.

User Action
BPLO Staff prepares and releases the issuance record.

System Response
The system creates or updates the issuance record and marks the application as released.

Supporting Files
src/app/bplo/permit-issuance/page.tsx
src/app/bplo/permit-issuance/[applicationId]/page.tsx
src/app/api/bplo/permit-issuance/[applicationId]/prepare/route.ts
src/app/api/bplo/permit-issuance/[applicationId]/release/route.ts
src/lib/bplo-permit-issuance.ts

Table 15
Department Head Application Approval

Use Case 15
Department Head Application Approval

Use Case Goal
To allow the Department Head to approve BPLO-reviewed applications before fee processing continues.

Scenario 1
Successful approval of a BPLO-reviewed application.

Actor
Department Head

Pre-condition
The application has already passed BPLO review and is waiting for Department Head decision.

Main Flow
Step 1: The Department Head opens the application approval page.
Step 2: The system displays the applications pending Department Head decision.
Step 3: The Department Head reviews the application details, history, and documents.
Step 4: The Department Head approves the application.
Step 5: The system updates the application status and moves it to the next processing stage.

User Action
The Department Head reviews and approves the application.

System Response
The system records the approval and advances the application workflow.

Supporting Files
src/app/department-head/application-approval/page.tsx
src/app/api/department-head/application-approval/route.ts
src/app/api/department-head/application-approval/[applicationId]/approve/route.ts
src/lib/department-head-api.ts

Table 16
JIT Business Map Viewing

Use Case 16
JIT Business Map Viewing

Use Case Goal
To allow a JIT Officer to view the released business map for inspection planning and monitoring.

Scenario 1
Successful viewing of the JIT business map.

Actor
JIT Officer

Pre-condition
The JIT officer is signed in and the portal is available.

Main Flow
Step 1: The JIT officer opens the business map page.
Step 2: The system loads the released business locations.
Step 3: The system displays the map and the filter options.
Step 4: The JIT officer reviews the map markers and location details.
Step 5: The system keeps the page in read-only mode.

User Action
The JIT officer reviews the map of released businesses.

System Response
The system displays the active released business locations without allowing map-side transactions.

Supporting Files
src/app/jit/business-map/page.tsx
src/components/jit/jit-business-map-client.tsx
src/app/api/jit/business-map/route.ts

Table 17
JIT Inspection Recording

Use Case 17
JIT Inspection Recording

Use Case Goal
To allow a JIT Officer to record the result of a business inspection.

Scenario 1
Successful submission of an inspection record.

Actor
JIT Officer

Pre-condition
The business is active and released, and the JIT portal is available.

Main Flow
Step 1: The JIT officer opens the inspection queue page.
Step 2: The system displays the active released businesses that can be inspected.
Step 3: The JIT officer selects one business, enters the compliance result, writes a comment, and attaches evidence.
Step 4: The JIT officer submits the inspection record.
Step 5: The system stores the inspection and forwards non-compliant findings for Department Head verification.

User Action
The JIT officer records the inspection result and uploads evidence.

System Response
The system saves the inspection record and updates the compliance workflow.

Supporting Files
src/app/jit/inspect-a-business/page.tsx
src/components/jit/jit-inspect-business-client.tsx
src/app/api/jit/inspect-a-business/route.ts
src/app/api/jit/inspect-a-business/[businessRecordId]/route.ts
src/lib/jit-inspections.ts

Table 18
JIT No-Permit Record Entry

Use Case 18
JIT No-Permit Record Entry

Use Case Goal
To allow a JIT Officer to record a business that was found without an existing permit record.

Scenario 1
Successful creation of a no-permit record.

Actor
JIT Officer

Pre-condition
The JIT officer is signed in and has identified a business without a permit record.

Main Flow
Step 1: The JIT officer opens the no permit record page.
Step 2: The system displays the record entry form and the existing no-permit records.
Step 3: The JIT officer enters the business name, person attended, line of business, location, and remarks.
Step 4: The JIT officer submits the record.
Step 5: The system stores the no-permit record and adds it to the officer's record history.

User Action
The JIT officer enters the business details and submits the record.

System Response
The system saves the no-permit record for inspection tracking and reference.

Supporting Files
src/app/jit/no-permit-record/page.tsx
src/components/jit/jit-no-permit-record-client.tsx
src/app/api/jit/no-permit-record/route.ts

Table 19
Department Head Inspection Verification

Use Case 19
Department Head Inspection Verification

Use Case Goal
To allow the Department Head to verify JIT inspection results and classify the inspection outcome.

Scenario 1
Successful verification of an inspection.

Actor
Department Head

Pre-condition
The JIT inspection has been submitted and is waiting for Department Head verification.

Main Flow
Step 1: The Department Head opens the inspection verification page.
Step 2: The system displays the pending inspection records.
Step 3: The Department Head reviews the inspection details, evidence, and remarks.
Step 4: The Department Head verifies the inspection and adds any required classification details.
Step 5: The system updates the inspection status and compliance case record.

User Action
The Department Head reviews and verifies the inspection.

System Response
The system records the verification result and updates the compliance case.

Supporting Files
src/app/department-head/inspection-verification/page.tsx
src/app/api/department-head/inspection-verification/route.ts
src/app/api/department-head/inspection-verification/[inspectionId]/verify/route.ts
src/app/api/department-head/inspection-verification/[inspectionId]/evidence/route.ts
src/lib/department-head-api.ts

Table 20
Permit Revocation Decision

Use Case 20
Permit Revocation Decision

Use Case Goal
To allow the Department Head to decide whether a flagged non-compliant case should proceed to permit revocation.

Scenario 1
Successful revocation decision review.

Actor
Department Head

Pre-condition
A flagged non-compliant case is waiting for revocation review.

Main Flow
Step 1: The Department Head opens the flagged cases page.
Step 2: The system displays the verified non-compliant cases that can be reviewed.
Step 3: The Department Head reviews the case details and available evidence.
Step 4: The Department Head approves or denies the revocation decision and enters remarks.
Step 5: The system updates the flagged case record and records the decision.

User Action
The Department Head reviews the flagged case and submits the revocation decision.

System Response
The system stores the decision and updates the case status for the next workflow step.

Supporting Files
src/app/department-head/permit-to-revoke/page.tsx
src/app/api/department-head/permit-to-revoke/route.ts
src/app/api/department-head/permit-to-revoke/[inspectionId]/approve-revocation/route.ts
src/app/api/department-head/permit-to-revoke/[inspectionId]/deny-revocation/route.ts
src/lib/department-head-api.ts

Table 21
Settlement Management

Use Case 21
Settlement Management

Use Case Goal
To allow the Department Head to settle eligible government-agency-related compliance cases.

Scenario 1
Successful settlement of a compliance case.

Actor
Department Head

Pre-condition
The case is eligible for settlement and appears in the settlement management queue.

Main Flow
Step 1: The Department Head opens the settlement management page.
Step 2: The system displays the eligible cases for settlement.
Step 3: The Department Head reviews the case details and enters settlement remarks when needed.
Step 4: The Department Head confirms the settlement.
Step 5: The system marks the case as settled.

User Action
The Department Head settles the eligible case.

System Response
The system updates the compliance case to settled.

Supporting Files
src/app/department-head/settlement-management/page.tsx
src/app/api/department-head/settlement-management/route.ts
src/app/api/department-head/settlement-management/[inspectionId]/settle/route.ts
src/lib/department-head-api.ts

Table 22
Superadmin Dashboard Viewing

Use Case 22
Superadmin Dashboard Viewing

Use Case Goal
To allow the Superadmin to view system-wide analytics, health indicators, and activity summaries.

Scenario 1
Successful viewing of the Superadmin dashboard.

Actor
Superadmin

Pre-condition
The Superadmin is signed in.

Main Flow
Step 1: The Superadmin opens the dashboard page.
Step 2: The system loads the system summary, report totals, and dashboard metrics.
Step 3: The system displays the charts, totals, and health indicators.
Step 4: The Superadmin reviews system activity and compliance trends.
Step 5: The system keeps the dashboard in read-only monitoring mode.

User Action
The Superadmin reviews the dashboard information.

System Response
The system presents read-only operational analytics and health data.

Supporting Files
src/app/superadmin/dashboard/page.tsx
src/lib/superadmin-data.ts
src/lib/superadmin-dashboard.ts

Table 23
Superadmin User Management

Use Case 23
Superadmin User Management

Use Case Goal
To allow the Superadmin to create and manage system user accounts.

Scenario 1
Successful user account management.

Actor
Superadmin

Pre-condition
The Superadmin is signed in and has access to the user management page.

Main Flow
Step 1: The Superadmin opens the user management page.
Step 2: The system displays the user list, filters, and account summary.
Step 3: The Superadmin creates a BPLO account or selects an existing user account.
Step 4: The Superadmin disables, reactivates, or resets the selected account as needed.
Step 5: The system updates the user record and refreshes the account list.

User Action
The Superadmin manages user accounts and account status.

System Response
The system saves the account changes and updates the user management view.

Supporting Files
src/app/superadmin/users/page.tsx
src/components/superadmin/superadmin-users-manager.tsx
src/app/api/superadmin/users/route.ts
src/app/api/superadmin/users/[userId]/disable/route.ts
src/app/api/superadmin/users/[userId]/reactivate/route.ts
src/app/api/superadmin/users/[userId]/reset-password/route.ts

Table 24
Superadmin Reports Viewing

Use Case 24
Superadmin Reports Viewing

Use Case Goal
To allow the Superadmin to view system reports and printable summaries.

Scenario 1
Successful viewing of reports.

Actor
Superadmin

Pre-condition
The Superadmin is signed in.

Main Flow
Step 1: The Superadmin opens the reports page.
Step 2: The system loads the report summary, charts, and printable report options.
Step 3: The system displays the totals for applications, releases, business locations, and other stored records.
Step 4: The Superadmin reviews the report cards and printable report links.
Step 5: The system keeps the reports page in view-only mode.

User Action
The Superadmin reviews the available reports.

System Response
The system displays read-only reports and printable summaries.

Supporting Files
src/app/superadmin/reports/page.tsx
src/lib/superadmin-data.ts
src/components/superadmin/superadmin-location-report.tsx

Table 25
Superadmin Settings Management

Use Case 25
Superadmin Settings Management

Use Case Goal
To allow the Superadmin to manage fee settings, penalties, and renewal extensions in the system.

Scenario 1
Successful update of system settings.

Actor
Superadmin

Pre-condition
The Superadmin is signed in and has access to the settings page.

Main Flow
Step 1: The Superadmin opens the settings page.
Step 2: The system displays the current fee configuration, penalty values, and renewal extension records.
Step 3: The Superadmin edits the required settings.
Step 4: The Superadmin saves the updated values.
Step 5: The system stores the new settings and refreshes the configuration view.

User Action
The Superadmin updates the system configuration values.

System Response
The system saves the changes and updates the settings records.

Supporting Files
src/app/superadmin/settings/page.tsx
src/components/superadmin/superadmin-fee-settings-manager.tsx
src/app/api/superadmin/settings/fees/route.ts
src/app/api/superadmin/settings/penalties/route.ts
src/app/api/superadmin/settings/extensions/route.ts

Table 26
JIT Portal Configuration

Use Case 26
JIT Portal Configuration

Use Case Goal
To allow the Superadmin to enable or disable the JIT portal in the system settings.

Scenario 1
Successful update of the JIT portal state.

Actor
Superadmin

Pre-condition
The Superadmin is signed in and has access to the JIT portal setting.

Main Flow
Step 1: The Superadmin opens the settings page.
Step 2: The system displays the current JIT portal state.
Step 3: The Superadmin changes the portal to enabled or disabled.
Step 4: The system saves the new portal setting.
Step 5: The system applies the portal state and shows the disabled page when the portal is turned off.

User Action
The Superadmin changes the JIT portal setting.

System Response
The system updates the JIT portal state and enforces the selected setting.

Supporting Files
src/app/superadmin/settings/page.tsx
src/app/api/superadmin/settings/jit-portal/route.ts
src/lib/jit-settings.ts
src/app/jit/portal-disabled/page.tsx

Note: These use case scenarios are based on the inspected pages, modules, and route handlers of the existing EBPLS system. Workflows not found in the implementation were not included.