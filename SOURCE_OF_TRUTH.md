# SOURCE OF TRUTH — EBPLS

Last updated: 2026-04-25

## Purpose

This file is the canonical map of the EBPLS codebase.

Use it to answer:

- What this system currently is
- Which files are authoritative for each concern
- Which docs are implementation-aligned vs. likely to drift

If documentation conflicts with code, follow this order of precedence:

1. `web/prisma/schema.prisma`, `web/src/app/**`, `web/src/lib/**`, and `web/src/middleware.ts`
2. This file
3. `EBPLS-SYSTEM-OVERVIEW.md`
4. `README.md`
5. Planning/reference docs under `DFD's and data template/` and `web/IMPLEMENTATION_NOTES.md`

## System Identity

EBPLS is an Electronic Business Permit and Licensing System for LGUs. The active implementation lives in:

- `web/` — production application code

Core stack currently implemented:

- Next.js 15.5
- React 19
- TypeScript 5.9
- Prisma 6 + PostgreSQL
- NextAuth v5 beta
- Tailwind CSS 4
- Playwright + Vitest

## Current Runtime Truth

These are true in the current codebase:

- Root route `/` redirects to `/login`
- The implemented auth roles in code are `APPLICANT`, `BPLO_OFFICE`, and `ADMIN`
- The database source of truth is Prisma, not the older markdown diagrams
- Public informational pages still exist, but there is no standalone homepage anymore

Primary files:

- Root routing: `web/src/app/page.tsx`
- App shell and metadata: `web/src/app/layout.tsx`
- Auth config: `web/src/lib/auth.config.ts`
- Middleware and route protection: `web/src/middleware.ts`
- Permissions model: `web/src/lib/permissions.ts`

## What Is Authoritative By Concern

### 1. Database and domain model

Authoritative file:

- `web/prisma/schema.prisma`

This is the source of truth for:

- Roles
- Enums
- Models
- Relations
- Field names
- Defaults

If a markdown file lists a role, status, or model that does not exist in `schema.prisma`, the schema wins.

### 2. Routes and pages

Authoritative files:

- `web/src/app/**`

Use this directory to determine:

- Which pages exist
- Which route groups exist
- Which pages are public, auth-only, or dashboard-only
- Which error/loading/not-found experiences are implemented

Current route groups:

- `web/src/app/(public)/`
- `web/src/app/(auth)/`
- `web/src/app/(dashboard)/dashboard/`
- `web/src/app/api/`

### 3. Authentication and access control

Authoritative files:

- `web/src/lib/auth.ts`
- `web/src/lib/auth.config.ts`
- `web/src/middleware.ts`
- `web/src/lib/permissions.ts`

These files define:

- Session behavior
- Login redirects
- Role checks
- Route protection
- Ability-based permissions used by the UI

### 4. API behavior

Authoritative files:

- `web/src/app/api/**/route.ts`

These files are the source of truth for:

- Endpoint existence
- Supported methods
- Request/response shape
- Auth requirements
- Runtime side effects

### 5. Validation rules

Authoritative files:

- `web/src/lib/validations.ts`
- `web/src/lib/validations/schedules.ts`

These files define the real accepted payloads and validation constraints.

### 6. UI components and dashboard behavior

Authoritative files:

- `web/src/components/ui/**`
- `web/src/components/dashboard/**`
- `web/src/components/public/**`

Use these for component behavior and actual UI composition.

### 7. Integrations and infrastructure behavior

Authoritative files:

- `web/src/lib/payments.ts`
- `web/src/lib/storage.ts`
- `web/src/lib/email.ts`
- `web/src/lib/sms.ts`
- `web/src/lib/pdf.ts`
- `web/src/lib/sse.ts`
- `web/src/lib/rate-limit.ts`
- `web/docker-compose.yml` if present, otherwise repo root `docker-compose.yml`
- `web/package.json`

## Current Functional Scope

At a high level, the implemented system supports:

- User registration, OTP verification, login, and optional 2FA
- Business permit applications for `NEW`, `RENEWAL`, and `CLOSURE`
- Document upload and verification
- Application review and approval flow
- Payment creation and webhook handling
- Permit generation, issuance, release, and verification
- Public application tracking and permit verification
- Admin/BPLO user, settings, reports, and location management

## Current Domain Snapshot

From `web/prisma/schema.prisma`, the key active enums are:

- `Role`: `APPLICANT`, `BPLO_OFFICE`, `ADMIN`
- `ApplicationType`: `NEW`, `RENEWAL`, `CLOSURE`
- `ApplicationStatus`: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `RETURNED_FOR_CORRECTION`, `RESUBMITTED`, `ASSESSED`, `PAYMENT_PENDING`, `PAID`, `PERMIT_PREPARED`, `READY_FOR_RELEASE`, `RELEASED`, `COMPLETED`, `REJECTED`, `CANCELLED`
- `DocumentStatus`: `UPLOADED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`
- `PermitStatus`: `ACTIVE`, `EXPIRED`, `REVOKED`, `RENEWED`, `CLOSED`
- `IssuanceStatus`: `PREPARED`, `ISSUED`, `RELEASED`, `COMPLETED`
- `PaymentStatus`: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `REFUNDED`, `CANCELLED`

Key persisted models include:

- `User`
- `Session`
- `OtpToken`
- `ActivityLog`
- `Application`
- `BusinessLocation`
- `ApplicationHistory`
- `ReviewAction`
- `Document`
- `Permit`
- `PermitIssuance`
- `SystemSetting`
- `Payment`
- `WebhookLog`
- `Clearance`

## Important Current Route Truth

These routes are currently implemented and should be treated as live:

Public:

- `/requirements`
- `/how-to-apply`
- `/faqs`
- `/contact`
- `/privacy`
- `/terms`
- `/data-privacy`
- `/track`
- `/verify-permit`

Auth:

- `/login`
- `/register`
- `/verify-otp`
- `/forgot-password`

Dashboard:

- `/dashboard`
- `/dashboard/applications`
- `/dashboard/applications/new`
- `/dashboard/applications/[id]`
- `/dashboard/applications/closure`
- `/dashboard/renew/**`
- `/dashboard/documents`
- `/dashboard/tracking`
- `/dashboard/payments`
- `/dashboard/permits`
- `/dashboard/profile`
- `/dashboard/verify-documents`
- `/dashboard/review/**`
- `/dashboard/issuance/**`
- `/dashboard/payment-queue`
- `/dashboard/validate-payments`
- `/dashboard/paid-applications`
- `/dashboard/payment-reports`
- `/dashboard/receipts`
- `/dashboard/admin/**`

## Docs That Can Drift

These files are still useful, but should be treated as secondary references:

- `README.md`
- `EBPLS-SYSTEM-OVERVIEW.md`
- `web/IMPLEMENTATION_NOTES.md`
- `DFD's and data template/*`

Known examples of drift already present:

- Older docs may mention a public homepage at `/`; the current app redirects `/` to `/login`
- Older docs may mention an `MTO` role or treasury users; the current system supports `APPLICANT`, `BPLO_OFFICE`, and `ADMIN` only
- Older docs may describe `ClearanceOffice` as a persisted office-user workflow; the active model is BPLO-managed requirement tracking through `Clearance`

## When To Update This File

Update this file whenever any of the following changes:

- Prisma enums or models
- Route structure under `web/src/app`
- Role names or access rules
- Major workflow stages
- Core integrations such as payments, storage, auth, or notifications

## Recommended Maintenance Rule

When making a major change:

1. Change the code first
2. Update `SOURCE_OF_TRUTH.md`
3. Update any supporting docs that still matter

That keeps this file as a reliable entry point instead of another stale summary.
