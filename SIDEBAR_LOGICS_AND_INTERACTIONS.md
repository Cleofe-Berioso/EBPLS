# EBPLS Sidebar Logics And Interactions

## Purpose

This file lists the current sidebar-driven flows in the EBPLS system so the team can review what exists today and decide what to revise next.

It is based on the implemented code, not on proposals or old workflow assumptions.

## Main Sources Reviewed

- `SOURCE_OF_TRUTH.md`
- `web/src/components/dashboard/sidebar.tsx`
- `web/src/components/dashboard/shell.tsx`
- `web/src/components/dashboard/header.tsx`
- `web/src/components/dashboard/renewal-sidebar.tsx`
- `web/src/components/dashboard/renewal-shell.tsx`
- `web/src/app/(dashboard)/dashboard/**`
- `web/src/components/dashboard/**`
- `web/src/lib/permissions.ts`
- `web/src/middleware.ts`
- selected API routes in `web/src/app/api/**`

## Global Logic

### Roles

Only these roles are implemented:

- `APPLICANT`
- `BPLO_OFFICE`
- `ADMIN`

There are no active MTO, Treasury, or Clearance Office dashboard roles in the current system.

### Shared Dashboard Structure

- `DashboardShell` wraps the main dashboard pages with:
  - `DashboardSidebar`
  - `DashboardHeader`
  - page content area
- `RenewalShell` wraps the renewal portal pages with:
  - `RenewalSidebar`
  - `DashboardHeader`
  - page content area

### Shared Header Interactions

The dashboard header is common across dashboard views and provides:

- notification bell UI
- profile dropdown entry
- logout action through `POST /api/auth/logout`

### Access Control Layers

Access is enforced in multiple places:

- sidebar rendering in `web/src/components/dashboard/sidebar.tsx`
- nav permission mapping in `web/src/lib/permissions.ts`
- route protection in `web/src/middleware.ts`
- page-level checks inside many route files

Revision note:
The sidebar items, `NAV_PERMISSIONS`, and middleware rules must stay aligned manually. If one changes without the others, links may appear for users who cannot actually enter the page.

## Main Dashboard Sidebar

## Applicant Sidebar

### 1. Dashboard

- Route: `/dashboard`
- Main logic:
  - role-based landing page
  - applicant quick actions link to:
    - new application
    - renewal
    - closure
    - tracking
- Main interactions:
  - mostly navigation entry point
- Revision note:
  - this page is a dashboard and launchpad, not the full application workflow itself

### 2. My Applications

- Route: `/dashboard/applications`
- Main logic:
  - acts as both:
    - an application list
    - a workflow hub
  - shows action cards for:
    - new application
    - renewal
    - closure
  - applicants see their own applications
  - staff users can see broader results because the page logic branches by role
- Main interactions:
  - navigate to `/dashboard/applications/new`
  - navigate to `/dashboard/renew`
  - navigate to `/dashboard/applications/closure`
  - navigate to `/dashboard/applications/[id]`

### 3. My Documents

- Route: `/dashboard/documents`
- Main logic:
  - shows the current applicant's document records
  - reads document metadata from the database
  - does not act as the main upload page
- Main interactions:
  - view existing uploaded records
  - empty state points users to `/dashboard/applications/new`
- Revision note:
  - this page is more of a document library view than a full document-management workspace

### 4. Track Status

- Route: `/dashboard/tracking`
- Main logic:
  - shows current applications and recent activity
  - uses server-sent events for live status updates
- Main interactions:
  - listens for `application_status_changed`
  - links users to `/dashboard/applications/[id]`
- Main data sources:
  - applicant applications with history
  - SSE stream through the tracking client

### 5. Payments

- Route: `/dashboard/payments`
- Main logic:
  - applicant-only payment history view
  - shows stored payment records
- Main interactions:
  - read-only summary page from the sidebar
- Related payment action outside the page:
  - payment initiation is triggered elsewhere through `POST /api/payments`

### 6. My Permit

- Route: `/dashboard/permits`
- Main logic:
  - applicant-only permit listing
  - shows renewal prompt when applicable
- Main interactions:
  - links to `/dashboard/renew`

### 7. Profile

- Route: `/dashboard/profile`
- Main logic:
  - fetches `GET /api/profile`
  - updates profile with `PUT /api/profile`
- Main interactions:
  - edit first name, last name, phone
- Revision notes:
  - password and 2FA controls are visible in the profile UI but are not wired here to a real flow
  - this page mixes live profile editing with some placeholder security/account actions

## Applicant Workflow Paths Linked From Sidebar

### New Application

- Route: `/dashboard/applications/new`
- Main logic:
  - applicant fills business and owner details
  - submit through `POST /api/applications`
  - redirects back to `/dashboard/applications`
- Related logic:
  - document requirements are shown during the form flow

### Application Detail

- Route: `/dashboard/applications/[id]`
- Main logic:
  - loads application details through `GET /api/applications/[id]`
  - shows business info, owner info, status, documents, and payment details
- Main interactions:
  - references `/dashboard/documents`
  - payment-related actions depend on application state

### Closure Application

- Route: `/dashboard/applications/closure`
- Main logic:
  - fetches eligible permits through `GET /api/permits/closure-eligible`
  - submits closure through `POST /api/applications/closure`
  - redirects to the new application detail page
- Revision note:
  - copy mentions possible RPT clearance in the "What Happens Next" section, so this text should be reviewed carefully against the current simplified BPLO-managed model

## BPLO Sidebar

### 1. Dashboard

- Route: `/dashboard`
- Main logic:
  - BPLO quick actions point to:
    - verify documents
    - review queue
    - issuance
    - payment queue

### 2. Applications

- Route: `/dashboard/applications`
- Main logic:
  - shared route with applicants
  - for staff use, this becomes a broader application list instead of a purely personal one
- Revision note:
  - because the same route serves multiple roles, revisions here should check both applicant and BPLO behaviors together

### 3. Verify Documents

- Route: `/dashboard/verify-documents`
- Main logic:
  - BPLO-only queue for document verification
  - shows documents with statuses such as `UPLOADED` and `PENDING_VERIFICATION`
- Main interactions:
  - verify document through `POST /api/documents/[id]/verify` with `VERIFIED`
  - reject document through the same endpoint with `REJECTED`
- Revision note:
  - the action component refreshes the page after success and does not currently surface rich error handling

### 4. Review

- Route: `/dashboard/review`
- Main logic:
  - BPLO-only review queue
  - focuses on `SUBMITTED`, `RESUBMITTED`, and `UNDER_REVIEW`
  - includes search and filtering
- Main interactions:
  - links to `/dashboard/review/[id]`

### 5. Approved Applications

- Route: `/dashboard/approved-applications`
- Main logic:
  - lists paid or otherwise issuance-ready applications without generated permits
- Main interactions:
  - issue action links to `/dashboard/issuance?appId={id}`

### 6. Issuance

- Route: `/dashboard/issuance`
- Main logic:
  - BPLO-only permit preparation and issuance queue
  - lists pending issuance applications and recent permits
- Main interactions:
  - prepare permit through `POST /api/permits`
  - successful response redirects to `/dashboard/issuance/[id]`

### 7. Profile

- Route: `/dashboard/profile`
- Main logic:
  - shared profile page behavior

## BPLO Payment Sidebar

This second BPLO navigation group handles payment-side operations.

### 1. Payment Queue

- Route: `/dashboard/payment-queue`
- Main logic:
  - lists pending and processing payments
- Main interactions:
  - links to `/dashboard/validate-payments`

### 2. Validate Payments

- Route: `/dashboard/validate-payments`
- Main logic:
  - BPLO-only payment validation page
  - loads pending payments
  - shows a list and a detail panel for the first payment in the queue
- Main interactions:
  - confirm payment through `PATCH /api/payments` with action `VERIFY`
  - reject payment through `PATCH /api/payments` with action `REJECT`
  - uses browser `prompt()` for receipt number or rejection reason
- Revision notes:
  - current UX validates only the first queued payment in the detail panel
  - the page visually lists many payments, but the detail view is not a full record-selection workflow yet
  - use of browser prompts is functional but not ideal for production UX

### 3. Receipts

- Route: `/dashboard/receipts`
- Main logic:
  - BPLO-only list of `PAID` payments
  - acts as a receipt register and revenue summary
- Main interactions:
  - read-only from the sidebar view
- Revision note:
  - generated receipt identifiers are partly derived from stored reference values and fall back to a local ID pattern

### 4. Paid Applications

- Route: `/dashboard/paid-applications`
- Main logic:
  - BPLO-only summary of applications that already have confirmed payments
  - aggregates total revenue and average payment
- Main interactions:
  - read-only summary page from the sidebar

### 5. Payment Reports

- Route: `/dashboard/payment-reports`
- Main logic:
  - BPLO-only reporting page for payment metrics
- Revision note:
  - if payment reporting logic changes, this page should be reviewed together with receipts and paid-applications because they summarize overlapping payment data

## BPLO Review Workflow Details

### Review Detail

- Route: `/dashboard/review/[id]`
- Main logic:
  - loads application detail through `GET /api/applications/[id]`
  - loads BPLO-managed checklist through `GET /api/applications/[id]/clearances`
  - submits review actions through `POST /api/applications/[id]/review`
- Main interactions:
  - assess requirements
  - approve or return applications based on BPLO review flow
- Important alignment note:
  - clearance here is implemented as BPLO-managed requirement tracking, not as a separate office-user workflow

### Issuance Detail

- Route: `/dashboard/issuance/[id]`
- Main logic:
  - loads issuance detail through `GET /api/issuance/[id]`
  - updates issuance state through `POST /api/issuance/[id]`
- Main interactions:
  - supports permit preparation progression such as:
    - mayor signing
    - issue
    - release
    - completion

## Admin Sidebar

### 1. Dashboard

- Route: `/dashboard`
- Main logic:
  - admin quick actions lead to:
    - manage users
    - reports
    - settings

### 2. Applications

- Route: `/dashboard/admin/applications`
- Main logic:
  - system-wide application list with:
    - pagination
    - search
    - status filtering
    - type filtering
  - shows latest payment summary and document verification count
- Main interactions:
  - "View" currently links to `/dashboard/review/[id]`
- Revision note:
  - this creates a cross-role dependency on the BPLO review route and should be reviewed if admin should have a distinct application-detail experience

### 3. Users

- Route: `/dashboard/admin/users`
- Main logic:
  - manage users through:
    - `GET /api/admin/users`
    - `POST /api/admin/users`
    - `PUT /api/admin/users/[id]`
- Main interactions:
  - create users
  - update role
  - update status
  - reset password
- Important alignment note:
  - the user-management UI supports only the three implemented roles

### 4. Reports

- Route: `/dashboard/admin/reports`
- Main logic:
  - system-wide reporting dashboard
  - export endpoints such as `/api/admin/reports/export?type=...`
  - analytics/chart components also call `/api/analytics`

### 5. Audit Logs

- Route: `/dashboard/admin/audit-logs`
- Main logic:
  - shows last 200 activity events
  - supports CSV export through `/api/admin/reports/export?type=audit`
- Main interactions:
  - read-only audit trail browsing

### 6. Locations

- Route: `/dashboard/admin/locations`
- Main logic:
  - manage location records through:
    - `GET /api/admin/locations`
    - `POST /api/admin/locations`
    - `DELETE /api/admin/locations/[id]`
- Revision note:
  - the UI explicitly notes that manual Application ID entry is temporary and should later become a searchable selector or dropdown

### 7. Settings

- Route: `/dashboard/admin/settings`
- Main logic:
  - update system settings through `PUT /api/admin/settings`

### 8. Profile

- Route: `/dashboard/profile`
- Main logic:
  - shared profile page behavior

## Renewal Sidebar

The renewal portal is wrapped by `web/src/app/(dashboard)/dashboard/renew/layout.tsx`.

Current access rules for the renewal portal:

- user must be logged in
- user must be `ACTIVE`
- user must be `APPLICANT`
- user must already have an `ACTIVE` or `EXPIRED` permit

### 1. Renewal Dashboard

- Route: `/dashboard/renew`
- Main logic:
  - fetches renewal-eligible permits through `GET /api/permits/renewal-eligible`
  - user chooses which permit to renew
- Main interactions:
  - navigates to `/dashboard/renew/permit?permitId=...`

### 2. Renew Permit

- Route: `/dashboard/renew/permit`
- Main logic:
  - loads selected permit through `GET /api/permits/[permitId]`
  - creates renewal application through `POST /api/applications/renewal`
- Main interactions:
  - redirects to `/dashboard/applications/[newApplicationId]`

### 3. Renewal History

- Route: `/dashboard/renew/history`
- Main logic:
  - client component fetches `GET /api/renewals/history`
  - displays status, dates, rejection reasons, and related permit data
- Main interactions:
  - links to `/dashboard/applications/[id]`
  - for release-ready statuses, links to `/dashboard/renew/claim-schedule`
- Revision note:
  - this page still assumes claim scheduling exists

### 4. Claim Schedule

- Sidebar route: `/dashboard/renew/claim-schedule`
- Intended logic from component/API:
  - UI component exists in `web/src/components/dashboard/renewal-claim-schedule-content.tsx`
  - API exists at `GET /api/renewals/claim-schedule`
- Actual current state:
  - the API route is marked deprecated
  - it returns an empty response because claim scheduling was removed in the 3-role refactor
  - no page file was found for `/dashboard/renew/claim-schedule`
- Revision note:
  - this is the biggest renewal-sidebar mismatch in the current system
  - the sidebar link and history-page link still point to a disabled flow

### 5. Documents

- Route: `/dashboard/renew/documents`
- Main logic:
  - client component fetches `GET /api/renewals/documents`
  - shows renewal-related document records and statuses
- Main interactions:
  - allows document download by linking directly to `document.filePath`
  - shows "Upload Replacement" button for rejected documents
- Revision note:
  - the replacement-upload button appears presentational in the current component and should be reviewed before treating it as a complete upload flow

### 6. Notifications

- Route: `/dashboard/renew/notifications`
- Main logic:
  - displays renewal notification preferences and recent messages
- Actual current state:
  - notification data is hard-coded placeholder data inside the component
  - "Save Preferences" is present in the UI but not backed by a fetched or saved settings model here
- Revision note:
  - this section is currently prototype-level UI, not a real data-backed notification center

### 7. Profile

- Route: `/dashboard/renew/profile`
- Main logic:
  - fetches `GET /api/profile`
  - updates profile through `PUT /api/profile`
- Revision notes:
  - like the main profile page, several security/account buttons are visible but not connected to real workflows here
  - support details are hard-coded in the component

## Storage And Document Interaction Notes

Current document handling follows these patterns:

- document rows store metadata in the database
- file blobs are not stored in database rows
- document pages and renewal document pages work with file metadata and file paths
- renewal document download links use `document.filePath`
- storage buckets in the implemented system are:
  - `ebpls-pdfs`
  - `ebpls-images`

Revision note:
Any sidebar or page revision that proposes database blob storage or different bucket assumptions should be checked against the current storage design first.

## Seed And Demo Readiness Notes

Pages that deserve extra review against demo/seed data:

- admin users
- admin applications
- BPLO review queue
- BPLO payment queue
- issuance
- renewal history
- renewal notifications

Why:

- these pages rely on varied statuses
- some pages assume verified documents or paid payments exist
- some pages show best when seed data covers the full application lifecycle
- the renewal notifications page is currently placeholder-based rather than seed-driven

## Highest Priority Revision Hotspots

### 1. Renewal claim scheduling is partially removed but still linked

- renewal sidebar still contains `/dashboard/renew/claim-schedule`
- renewal history still links users there
- API route says the feature is deprecated and disabled
- no matching page file was found for that route

### 2. Profile pages mix real and placeholder actions

- profile fetch and save are real
- password, 2FA, data export, deactivation, and logout-all-devices actions are not implemented in these reviewed components

### 3. Renewal notifications are placeholder UI

- hard-coded notifications
- no live fetch
- no persisted preference-save flow in the reviewed component

### 4. Renewal documents page may suggest more upload capability than currently implemented

- download is real
- replacement upload needs review before treating it as complete

### 5. BPLO payment validation UX is still basic

- queue list exists
- detail panel defaults to the first record
- verification and rejection use browser prompts

### 6. Admin applications currently send users into BPLO review details

- admin "View" action points to `/dashboard/review/[id]`
- this should be revisited if admin needs a different detail page or a read-only route

### 7. Shared routes need careful cross-role testing

- `/dashboard`
- `/dashboard/applications`
- `/dashboard/profile`

Because:

- these routes serve different roles with different expectations
- revisions can accidentally improve one role flow while breaking another

## Suggested Revision Checklist

Before revising the sidebar flows, check these in order:

1. confirm whether renewal claim scheduling should be removed completely or reactivated properly
2. decide which profile actions are real features versus placeholder UI
3. decide whether BPLO payment validation needs a richer record-selection and form flow
4. decide whether admin should continue reusing BPLO application review details
5. confirm whether renewal notifications should stay mock-only or become data-backed
6. check document pages so visible buttons match real storage and upload behavior
7. keep sidebar links, permissions, middleware, and actual pages in sync

## Quick Summary

The main dashboard sidebar is mostly aligned with implemented routes and role logic.

The renewal sidebar is the area with the most obvious revision risk because it still exposes claim-schedule behavior that has already been deprecated in the API and appears to be missing a live page route.
