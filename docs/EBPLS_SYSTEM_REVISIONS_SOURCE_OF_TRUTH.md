# EBPLS System Revisions — Source of Truth

> **Purpose:** This file is the single source of truth for implementing the EBPLS System Revisions.  
> **Rule for AI/Cursor:** Read this file before editing. Do not guess requirements. Do not implement everything at once. Work in safe batches.

---

## 0. Project Context

The system is an **EBPLS / Business Permit and Licensing System** for a local government agency.

Main roles currently involved:

- **Applicant**
- **BPLO**
- **JIT / JMIT Inspector**
- **Department Head**
- **Super Admin**

The implementation must preserve existing:

- Routes
- Authentication
- Role-based access
- API contracts where possible
- Existing application records
- Existing document uploads
- Existing approval/review flows

---

## 1. Non-Negotiable Development Rules

1. **Do not implement all revisions in one pass.**
2. **Start with audit only** before modifying code.
3. Use small batches with clear commits or checkpoints.
4. Do not break working flows.
5. Do not remove existing fields unless confirmed duplicate or unused.
6. Prefer backward-compatible mappings if field names or payload shapes change.
7. Add database migrations safely.
8. Use safe defaults for old records.
9. Keep role-based permissions strict.
10. Run available checks after every batch:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - backend tests/migrations if applicable
11. UI must be readable at **100% browser zoom** on a common laptop screen such as **1366x768**.
12. The final design must look professional, organized, accessible, and appropriate for a government agency.

---

## 2. Master Implementation Sequence

Use this order:

1. **Audit current codebase**
2. **Application Form Revisions**
3. **Requirements Upload Table**
4. **Document Validation Status**
5. **Pagination**
6. **Returned Application Resubmission Label**
7. **JIT / JMIT Post-Audit Checklist**
8. **Renewal Email Notification**
9. **Revocation Notification**
10. **No Business Permit Printable Ticket**
11. **Government UI Modernization / Final Polish**

---

## 3. Revision 1 — Application Form Revisions

### Goal

Revise the application input fields for both:

- **New Business Application**
- **Renewal Application**

The forms must be clearer, more organized, and easier for applicants to complete.

### Required Section Order

The form must follow this exact order:

1. **Business Information**
2. **Business Operation**
3. **Document Upload**

### Business Information Should Include

- Registration type
  - Sole Proprietorship
  - One Person Corporation
  - Partnership
  - Corporation
  - Cooperative
- DTI / SEC / CDA Registration Number
- Tax Identification Number / TIN
- Business Name
- Trade Name / Franchise, if applicable
- Main Office Address
- Telephone Number
- Mobile Number
- Email Address
- Owner information for sole proprietorship
- President / Officer-in-Charge information for corporation, cooperative, or partnership
- Corporation nationality, if applicable
  - Filipino
  - Foreign

### Business Operation Should Include

- Business area / total floor area
- Number of employees
  - Male
  - Female
  - Residing within locality, if applicable
- Delivery vehicles, if applicable
  - Van / Truck
  - Motorcycle
- Same as Main Office Address option
- Business location address
- Property ownership information
- Tax Declaration Number or Property Identification Number
- Tax incentives from government entity, if applicable
- Business activity
  - Main Office
  - Branch Office
  - Admin Office Only
  - Warehouse
  - Others

### Acceptance Criteria

- New application form uses the revised section order.
- Renewal application form uses the revised section order.
- Form remains compatible with existing API payloads.
- Required fields still validate properly.
- Applicant can submit successfully.
- Returned applications can still be edited and resubmitted.

---

## 4. Revision 2 — Requirements Upload Table

### Goal

Convert the requirements upload section into a clean table layout.

### Required Table Columns

1. **Requirement / Document Name**
2. **Description / Purpose**
3. **Required / Optional**
4. **Uploaded File**
5. **Upload Action**
6. **Validation Status**
7. **Remarks / Reason**

### Required Actions

- Upload file
- Replace file
- Preview / View file
- Remove file, if current system allows it

### Empty State

If no file is uploaded:

> No file uploaded yet.

### Acceptance Criteria

- Requirements are easier to read.
- Each requirement is one table row.
- Existing upload API remains working.
- Layout is responsive.
- Status badges are visible.
- Applicant can understand which documents need correction.

---

## 5. Revision 3 — Pagination

### Goal

Add pagination to long pages to improve readability and performance.

### Apply Pagination To

Search and confirm exact pages, but likely candidates include:

- Applications list
- Applicant applications
- BPLO applications
- Payment verification
- Permit issuance
- JIT inspections
- Documents list
- Users list
- Activities / audit log
- Notifications
- Records / permits

### Requirements

- Preserve search, filters, sorting, and role-based visibility.
- Prefer server-side pagination if backend supports it.
- Keep query parameters across page changes.
- Add page size options if appropriate:
  - 10
  - 25
  - 50
- Add loading state while changing pages.
- Add empty state when no records exist.
- Pagination must be accessible.

### Acceptance Criteria

- Long lists no longer render everything at once.
- Filters still work.
- Search still works.
- Page changes do not lose current filters.
- Performance improves or remains stable.

---

## 6. Revision 4 — Resubmission Button Label

### Goal

For applications returned for correction, change the button label from:

> Submit

to one of:

> Resubmit  
> Submit Resubmission

### Rules

- Only change the label when the application status indicates:
  - returned for correction
  - correction required
  - resubmission required
- Do not change the button for first-time submissions.
- Confirmation message should mention resubmission.
- Success message should say:

> Application resubmitted successfully.

### Acceptance Criteria

- First-time application still says Submit.
- Returned application says Resubmit or Submit Resubmission.
- Toast and confirmation messages use correct wording.
- Backend behavior remains stable unless existing logic requires adjustment.

---

## 7. Revision 5 — Renewal Email Notification

### Goal

Send email notifications to business owners when renewal period is approaching, due, or overdue.

### Notification Types

1. **Upcoming Renewal**
2. **Due Renewal**
3. **Overdue Renewal**

### Email Must Include

- Business name
- Permit number, if available
- Renewal deadline or due date
- Clear instruction to renew
- Link or instruction to open the system

### Anti-Spam Rule

Do not repeatedly send the same renewal email. Track notification history or sent timestamp.

### Acceptance Criteria

- Email uses existing notification/email infrastructure if available.
- Business owner receives renewal notice.
- Duplicate email spam is prevented.
- Renewal email respects privacy and correct recipient.
- There is a safe way to test the command/service.

---

## 8. Revision 6 — JIT / JMIT Post-Audit Checklist

### Goal

Add a checklist feature for post-audit validation by the Joint Inspection Team.

The checklist verifies whether the actual establishment matches:

- Declared business information
- Approved business permit
- Approved clearances
- Actual business activity
- Actual establishment condition

### Checklist Response Fields

Each checklist item should support:

- Department
- Question
- Answer
  - Compliant
  - Non-Compliant
  - Not Applicable
- Remarks
- Optional attachment/photo evidence, if existing upload infrastructure supports it

### Required Checklist Questions

#### 1. BPLO / Business Permit Office

Does the actual business operation match the approved business permit details, and is the declared business information true and accurate?

#### 2. Zoning / Planning Department

Does the establishment have the required zoning or locational clearance, and is the actual business activity aligned with the declared approved clearance?

#### 3. Engineering / Building Office

Does the establishment comply with the approved building, occupancy, or structural clearance issued for its declared use?

#### 4. Fire Safety / BFP

Does the establishment maintain compliance with the issued fire safety clearance and approved fire safety requirements?

#### 5. Health / Sanitary Office

Does the establishment maintain compliance with the issued sanitary or health clearance and approved sanitation requirements?

#### 6. Environment / MENRO

Does the establishment comply with the environmental clearance or approved waste management requirements applicable to its operation?

#### 7. Treasurer / Assessment

Are the business taxes, fees, and financial obligations consistent with the approved permit, declared operation, and current business activity?

#### 8. Declaration Verification

Is the declared information true, accurate, and consistent with the actual establishment and approved clearances?

### JIT View Requirements

Inside the JIT inspection screen, add read-only panels for:

- View Declared Business Information
- View Business Operation Details
- View Uploaded Documents
- View Approved Clearances / validation statuses, if available

### Permission Rules

- JIT users can create/update checklist responses.
- Other roles should only access according to current permissions.
- Applicants should not edit checklist responses.
- Do not weaken role-based access.

### Acceptance Criteria

- Checklist is saved per application or inspection.
- One question per department is shown.
- Inspector can mark compliance status.
- Inspector can add remarks.
- JIT can view declared inputs and uploaded documents while validating.
- Checklist output supports post-audit review.

---

## 9. Revision 7 — Document Validation Status

### Goal

Add document validation status so each submitted document can be reviewed clearly.

### Status Values

Use these exact statuses:

1. **Pending Review**
2. **Valid**
3. **Invalid**
4. **Incomplete**
5. **Requires Resubmission**

### Rules

- New uploaded documents default to **Pending Review**.
- Existing uploaded documents should safely default to **Pending Review** unless current data already has status.
- BPLO or authorized reviewer can update validation status.
- Remarks are required when status is:
  - Invalid
  - Incomplete
  - Requires Resubmission
- Applicant can view validation status and remarks.
- Application cannot be approved if required documents are:
  - Invalid
  - Incomplete
  - Requires Resubmission

### Acceptance Criteria

- Document status is visible to BPLO and applicant.
- Invalid/incomplete documents show clear reason.
- Required invalid documents block approval.
- Status survives refresh and reload.
- Old records remain safe after migration.

---

## 10. Revision 8 — Government UI Revision

### Goal

Revise the system UI to make it:

- Attractive
- Modern
- Readable
- Professional
- Organized
- Accessible
- Suitable for a government agency
- Easy to navigate

### Design Direction

Use a clean government portal style:

- Clear page titles
- Compact but readable sections
- Proper spacing
- Professional typography
- Accessible contrast
- Consistent buttons
- Consistent badges
- Consistent tables
- Clear empty states
- Clear validation messages
- No oversized headings
- No oversized cards
- No unnecessary decorative clutter

### 100% Zoom Rule

The UI must be usable at 100% browser zoom on a common laptop screen.

Avoid:

- Very large page titles
- Tall headers
- Excessive vertical gaps
- Huge cards
- Sidebars that are too wide
- Tables that overflow unnecessarily
- Small unreadable labels

### Acceptance Criteria

- Applicant pages are readable.
- BPLO pages are readable.
- JIT pages are readable.
- Department Head pages are readable.
- Super Admin pages are readable.
- Forms, tables, modals, filters, and status badges feel consistent.
- Build and lint pass.

---

## 11. Revision 9 — Revocation Notification

### Goal

When a business permit is recommended for revocation, notify the applicant or business owner of the reason.

### Notification Must Include

- Business name
- Permit number, if available
- Reason for revocation
- Violation, finding, or basis
- Date of recommendation
- Department/officer who recommended it, if available
- Next action or instruction

### Rules

- Revocation recommendation must require a reason.
- Do not allow blank revocation reason.
- Do not instantly revoke if the existing workflow only recommends revocation.
- Respect the current approval workflow.
- Keep audit trail/history.

### Acceptance Criteria

- Applicant can see the revocation reason.
- Notification is sent or displayed through existing notification system.
- Email is sent if email system exists.
- Revocation reason is stored.
- History/audit trail is preserved.

---

## 12. Revision 10 — No Business Permit Record Printable Ticket

### Goal

If an establishment has no valid business permit record, generate a printable ticket or notice.

### Printable Notice Must Include

1. Notice title: **No Valid Business Permit Record**
2. Establishment name
3. Owner / responsible person, if available
4. Business address / location
5. Date and time recorded
6. Inspecting office / personnel, if available
7. Findings
8. Required action
9. Reference number / ticket number

### Rules

- Printable using browser print first.
- PDF export only if the project already has PDF generation.
- Add print-friendly CSS.
- Save ticket in database for tracking.
- Notify concerned business owner/responsible person if contact information is available.
- Do not create duplicate unresolved tickets for the same establishment unless workflow allows it.

### Acceptance Criteria

- Ticket can be generated.
- Ticket can be printed.
- Ticket has reference number.
- Ticket is saved.
- Notification is sent if contact info exists.
- Duplicate unresolved tickets are prevented or clearly handled.

---

## 13. AI/Cursor Working Protocol

### Always Start With This Prompt

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md` first.

You are my senior full-stack developer. Follow this source of truth exactly.

Do not edit files yet. First audit the codebase and return:
1. Files related to the target batch
2. Current data models and API routes involved
3. Existing statuses/enums
4. Frontend components/pages involved
5. Backend/database changes needed
6. Risks
7. A safe implementation plan

Do not guess. Do not implement unrelated changes.
```

---

## 14. Batch Prompts

### Batch 1 — Audit Only

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Perform an audit only. Do not edit files.

Find all current files related to:
- New application form
- Renewal form
- Requirements upload
- Document validation or review
- Application status flow
- Returned/resubmission flow
- JIT inspection
- Notifications/email
- Revocation
- Records/no-permit tickets
- Pagination/list pages

Return a file-by-file implementation map and recommended safe batch order.
```

### Batch 2 — Application Form Revision

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 1: Application Form Revisions.

Apply the section order:
1. Business Information
2. Business Operation
3. Document Upload

Apply this to both New Business Application and Renewal Application.

Do not change unrelated features.
Preserve API compatibility.
Run available checks.
Summarize changed files.
```

### Batch 3 — Requirements Upload Table

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 2: Requirements Upload Table.

Convert document upload into a table with:
- Requirement / Document Name
- Description / Purpose
- Required / Optional
- Uploaded File
- Upload Action
- Validation Status
- Remarks / Reason

Do not break upload, preview, replace, or remove behavior.
Run available checks.
Summarize changed files.
```

### Batch 4 — Document Validation Status

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 7: Document Validation Status.

Use statuses:
- Pending Review
- Valid
- Invalid
- Incomplete
- Requires Resubmission

Add reviewer update flow and applicant visibility.
Require remarks for invalid/incomplete/resubmission.
Prevent approval when required documents are invalid/incomplete/requiring resubmission.
Run migrations/checks.
Summarize changed files.
```

### Batch 5 — Pagination

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 3: Pagination.

Identify long list pages and add pagination without breaking filters/search/sorting.
Prefer server-side pagination if available.
Run checks.
Summarize updated pages.
```

### Batch 6 — Resubmission Label

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 4: Resubmission Button Label.

Returned/correction applications should show:
- Resubmit
or
- Submit Resubmission

First-time submissions should still show Submit.
Update confirmation and success messages.
Run checks.
Summarize changed files.
```

### Batch 7 — JIT/JMIT Checklist

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 6: JIT / JMIT Post-Audit Checklist.

Use one checklist question per department exactly as written in the source of truth.
Add compliant/non-compliant/not-applicable answers, remarks, and optional evidence if supported.

Also add read-only panels for:
- Declared Business Information
- Business Operation Details
- Uploaded Documents
- Approved Clearances / validation statuses if available

Protect role permissions.
Run migrations/checks.
Summarize changed files.
```

### Batch 8 — Renewal Email Notification

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 5: Renewal Email Notification.

Send upcoming/due/overdue renewal emails.
Avoid duplicate email spam.
Use existing email infrastructure if available.
Run checks.
Summarize changed files and how to test.
```

### Batch 9 — Revocation Notification

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 9: Revocation Notification.

Require a revocation reason.
Notify the applicant/business owner.
Store reason and keep audit trail.
Respect the current workflow.
Run checks.
Summarize changed files.
```

### Batch 10 — No Permit Printable Ticket

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 10: No Business Permit Record Printable Ticket.

Generate printable notice with:
- No Valid Business Permit Record
- Establishment name
- Owner/responsible person
- Address/location
- Date/time
- Inspecting office/personnel
- Findings
- Required action
- Reference number/ticket number

Use browser print first.
Save ticket record.
Notify concerned person if contact info exists.
Run checks.
Summarize changed files.
```

### Batch 11 — UI Modernization

```text
Read `EBPLS_SYSTEM_REVISIONS_SOURCE_OF_TRUTH.md`.

Implement only Revision 8: Government UI Revision.

Make the UI modern, readable, professional, accessible, and suitable for a government agency.

Do not change business logic, routes, auth, or API calls.
Focus on layout, spacing, forms, tables, status badges, empty states, loading states, and readability at 100% zoom.

Run lint/typecheck/build.
Summarize changed files.
```

---

## 15. Definition of Done

The revisions are complete only when:

- New and renewal forms follow the required section order.
- Requirements upload is table-based.
- Document validation statuses work.
- Long list pages have pagination.
- Returned applications show Resubmit/Submit Resubmission.
- Renewal email notification works without duplicate spam.
- JIT checklist exists with one question per department.
- JIT can view declared inputs and uploaded documents.
- Revocation notifications include reason.
- No-permit printable tickets can be generated.
- UI is professional and readable at 100% zoom.
- Existing auth and roles remain secure.
- Existing records are not broken.
- Build/lint/typecheck/tests pass or known pre-existing issues are documented.
