# EBPLS — Electronic Business Permit & Licensing System
## Complete System Overview

> Generated: 2026-04-24 | Next.js 15.5 | React 19.2 | TypeScript 5.9 | Prisma 6.19 | PostgreSQL

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [API Routes](#5-api-routes)
6. [Application Pages](#6-application-pages)
7. [Library Utilities](#7-library-utilities)
8. [Components](#8-components)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Rate Limiting](#10-rate-limiting)
11. [Environment Variables](#11-environment-variables)
12. [Validation Schemas](#12-validation-schemas)
13. [Infrastructure & Services](#13-infrastructure--services)
14. [Compliance & Security](#14-compliance--security)
15. [Scripts & Tooling](#15-scripts--tooling)

---

## 1. Project Overview

**Package name:** `online-business-permit-system` v1.0.0

EBPLS is a full-stack web application for Philippine Local Government Units (LGUs) that digitizes the business permit application, renewal, and closure lifecycle. It covers the complete workflow from applicant registration through document submission, multi-office clearance, payment processing, and permit issuance — replacing manual counter-based systems.

**Regulatory Basis:**
- RA 11032 — Ease of Doing Business and Efficient Government Service Delivery Act
- RA 10173 — Data Privacy Act of 2012

**User Roles:**
| Role | Description |
|------|-------------|
| `APPLICANT` | Business owners applying for permits |
| `BPLO_OFFICE` | Business Permits & Licensing Office staff (reviewers, issuers) |
| `MTO` | Municipal Treasurer's Office staff (payment validation) |

---

## 2. Tech Stack

### Core Framework
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.5.15 |
| UI Library | React | ^19.2.0 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4.2 |
| ORM | Prisma | ^6.19.2 |

### Backend Services
| Service | Technology | Version |
|---------|-----------|---------|
| Database | PostgreSQL | 16 (required) |
| Cache / Queue broker | Redis | 7 (optional, in-memory fallback) |
| File storage | MinIO / S3 | — (local filesystem fallback) |
| Job queues | BullMQ | ^5.8.0 |
| Email | Nodemailer (SMTP) | ^7.0.7 |
| SMS | Semaphore API / Globe Labs | — |
| PDF generation | Puppeteer | ^23.0.0 |
| Database driver | pg (PgBouncer-compatible) | ^8.12.0 |

### Auth & Security
| Concern | Technology |
|---------|-----------|
| Authentication | NextAuth.js v5 beta (^5.0.0-beta.31) |
| Authorization | CASL.js (^6.7.1) + @casl/prisma |
| Password hashing | bcryptjs |
| 2FA (TOTP) | otplib |
| Session strategy | JWT, 30-min maxAge |

### Frontend
| Concern | Technology |
|---------|-----------|
| Server state | @tanstack/react-query ^5.51.0 |
| Client state | Zustand ^5.0.3 |
| Forms | React Hook Form ^7.52.0 |
| Validation | Zod ^3.23.8 |
| UI components | shadcn/ui (class-variance-authority) |
| Icons | lucide-react |
| Toasts | sonner |
| Maps | Leaflet + react-leaflet 5.0 |
| i18n | next-intl (English + Filipino) |
| Themes | next-themes (dark/light) |
| Real-time | Server-Sent Events (SSE) |

### Payments
| Gateway | Methods |
|---------|---------|
| PayMongo | GCash, Maya |
| PayMaya (direct) | Maya |
| OTC / Cash | Over the counter |
| Bank Transfer | Manual |

### Observability
| Tool | Purpose |
|------|---------|
| Sentry | Error tracking |
| Prometheus | Metrics endpoint (`/api/metrics`) |
| Structured logging | `src/lib/logger.ts` |
| Audit trail | `ActivityLog` model |

### Testing
| Tool | Scope |
|------|-------|
| Vitest | Unit tests (jsdom) |
| @testing-library/react | Component tests |
| Playwright | E2E + visual regression + a11y |
| @axe-core/playwright | Accessibility checks (WCAG 2.1 AA) |

---

## 3. Directory Structure

```
c:/Users/yowwo/Desktop/test ebpls/EBPLS/web/
│
├── .env                            # Live credentials (security risk — gitignore!)
├── .env.backup
├── .dockerignore
├── Dockerfile                      # Standalone Docker build
├── next.config.js                  # Security headers, CSP, standalone output
├── next-sitemap.config.js          # SEO sitemap
├── prisma.config.ts
├── postcss.config.js               # Tailwind CSS v4 PostCSS
├── eslint.config.mjs               # ESLint 9 flat config
├── tsconfig.json                   # Strict TypeScript
├── tsconfig.typecheck.json
├── vitest.config.ts
├── playwright.config.ts            # E2E (Chromium)
├── check-db.js
│
├── prisma/
│   └── schema.prisma               # 16 models, 12 enums
│
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── robots.txt
│   ├── sw.js                       # Service worker
│   ├── offline.html
│   └── icons/
│
├── e2e/
│   ├── visual-regression.spec.ts
│   └── snapshots/
│
├── scripts/                        # DB seeding, utility scripts
│
└── src/
    ├── middleware.ts               # Rate limiting + auth + RBAC (Edge Runtime)
    ├── instrumentation.ts.bak
    │
    ├── app/
    │   ├── layout.tsx              # Root layout (providers, fonts)
    │   ├── (public)/               # Public marketing/info pages
    │   ├── (auth)/                 # Login, register, OTP, forgot-password
    │   ├── (dashboard)/            # Authenticated app shell
    │   └── api/                    # All API routes (~18 groups, ~60 endpoints)
    │
    ├── components/
    │   ├── ui/                     # Base shadcn/ui components (14)
    │   ├── dashboard/              # Dashboard-specific components (26)
    │   ├── providers/              # React Query provider
    │   ├── public/                 # Public nav + footer
    │   ├── privacy/                # Cookie consent
    │   ├── seo/                    # JSON-LD structured data
    │   └── pwa/                    # Service worker registration
    │
    ├── hooks/
    │   └── use-sse.ts              # SSE hook with auto-reconnect
    │
    ├── lib/                        # 28 utility/service modules
    │
    ├── messages/                   # i18n translation files (EN + FIL)
    │
    ├── types/
    │   └── lucide-react.d.ts
    │
    └── __tests__/
        ├── setup.ts
        ├── api/
        ├── components/
        └── lib/
```

---

## 4. Database Schema

### Enums (12)

| Enum | Values |
|------|--------|
| `Role` | `APPLICANT`, `BPLO_OFFICE`, `MTO` |
| `AccountStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION` |
| `ApplicationType` | `NEW`, `RENEWAL`, `CLOSURE` |
| `ApplicationStatus` | `DRAFT`, `SUBMITTED`, `ENDORSED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `ClosureReason` | `RETIREMENT`, `RELOCATION`, `SOLD_TRANSFERRED`, `LIQUIDATION`, `CALAMITY`, `OTHER` |
| `DocumentType` | `PROOF_OF_REGISTRATION`, `PROOF_OF_OWNERSHIP`, `LOCATION_PLAN`, `FSIC`, `AFFIDAVIT`, `BARANGAY_CLEARANCE`, `OTHER` |
| `DocumentStatus` | `UPLOADED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED` |
| `PermitStatus` | `ACTIVE`, `EXPIRED`, `REVOKED`, `RENEWED`, `CLOSED` |
| `IssuanceStatus` | `PREPARED`, `ISSUED`, `RELEASED`, `COMPLETED` |
| `PaymentStatus` | `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `REFUNDED`, `CANCELLED` |
| `PaymentMethod` | `GCASH`, `MAYA`, `BANK_TRANSFER`, `OTC`, `CASH` |
| `ClearanceStatus` | `PENDING`, `CLEARED`, `WITH_DEFICIENCY`, `FOR_INSPECTION`, `RETURNED` |

### Models (16)

#### `User`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| email | String | unique |
| password | String | bcrypt hashed |
| firstName, lastName, middleName | String | |
| phone | String? | |
| role | Role | APPLICANT \| BPLO_OFFICE \| MTO |
| status | AccountStatus | |
| avatar | String? | |
| twoFactorEnabled | Boolean | |
| twoFactorSecret | String? | encrypted |
| lastLoginAt | DateTime? | |
| failedLoginAttempts | Int | default 0 |
| lockedUntil | DateTime? | lockout expiry |
| renewalEligible | Boolean | |
| createdAt, updatedAt | DateTime | |
**Relations:** applications, documents, activityLogs, otpTokens, sessions, reviewActions, issuanceActions, payments

#### `Session`
| Field | Type |
|-------|------|
| id | String (uuid) |
| sessionToken | String (unique) |
| userId | String (FK → User) |
| expires | DateTime |

#### `OtpToken`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| token | String | |
| type | String | email_verify / login / password_reset |
| userId | String (FK → User) | |
| expiresAt | DateTime | |
| used | Boolean | |
| createdAt | DateTime | |

#### `ActivityLog`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| userId | String (FK → User) | |
| action | String | |
| entity | String | |
| entityId | String? | |
| details | Json? | |
| ipAddress | String? | |
| userAgent | String? | |
| createdAt | DateTime | |

#### `Application`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| applicationNumber | String | unique, auto-generated |
| type | ApplicationType | NEW / RENEWAL / CLOSURE |
| status | ApplicationStatus | |
| applicantId | String (FK → User) | |
| businessName | String | |
| businessType | String | |
| businessAddress | String | |
| businessPhone | String? | |
| businessEmail | String? | |
| dtiNumber | String? | |
| birTin | String? | |
| secNumber | String? | |
| capitalInvestment | Decimal? | |
| ownerName | String | |
| ownerPhone | String? | |
| ownerEmail | String? | |
| documentVerified | Boolean | |
| applicationApproved | Boolean | |
| paymentConfirmed | Boolean | |
| rejectionReason | String? | |
| previousPermitId | String? | FK for renewals |
| createdAt, updatedAt | DateTime | |
**Relations:** applicant, documents, history, reviewActions, permit, payments, clearances, businessLocation

#### `BusinessLocation`
GPS coordinates for map visualization.
| Field | Type |
|-------|------|
| id | String (uuid) |
| applicationId | String (FK → Application) |
| latitude, longitude | Float |
| label | String? |
| businessType | String? |
| markerColor | String? |

#### `ApplicationHistory`
Immutable status change log.
| Field | Type |
|-------|------|
| id | String (uuid) |
| applicationId | String (FK) |
| previousStatus | ApplicationStatus |
| newStatus | ApplicationStatus |
| comment | String? |
| changedBy | String |
| createdAt | DateTime |

#### `ReviewAction`
BPLO reviewer decisions on applications.
| Field | Type |
|-------|------|
| id | String (uuid) |
| applicationId | String (FK) |
| reviewerId | String (FK → User) |
| action | String |
| comment | String? |
| createdAt | DateTime |

#### `Document`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| applicationId | String (FK) | |
| uploadedBy | String (FK → User) | |
| fileName | String | stored name |
| originalName | String | user's filename |
| mimeType | String | |
| fileSize | Int | bytes |
| filePath | String | S3 key or local path |
| documentType | DocumentType | |
| status | DocumentStatus | |
| version | Int | for re-uploads |
| verifiedBy | String? | |
| verifiedAt | DateTime? | |
| rejectionReason | String? | |

#### `Permit`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| permitNumber | String | unique |
| applicationId | String (FK) | |
| businessName | String | |
| businessAddress | String | |
| ownerName | String | |
| issueDate | DateTime | |
| expiryDate | DateTime | |
| status | PermitStatus | |
| permitData | Json | metadata for PDF |

#### `PermitIssuance`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| permitId | String (FK → Permit) | |
| issuedById | String (FK → User) | BPLO staff |
| status | IssuanceStatus | |
| issuedAt, releasedAt, completedAt | DateTime? | |
| staffNotes | String? | |
| mayorSigningStatus | String? | |
| mayorSignedAt | DateTime? | |
| mayorSignedBy | String? | |
| mayorSigningRemarks | String? | |

#### `SystemSetting`
Key-value config store.
| Field | Type |
|-------|------|
| id | String (uuid) |
| key | String (unique) |
| value | String |
| type | String |

#### `Payment`
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| applicationId | String (FK) | |
| payerId | String (FK → User) | |
| amount | Decimal (12,2) | |
| method | PaymentMethod | |
| status | PaymentStatus | |
| transactionId | String? | PayMongo tx ID |
| receiptNumber | String? | |
| referenceNumber | String? | |
| checkoutUrl | String? | PayMongo redirect |
| paidAt, failedAt, refundedAt | DateTime? | |
| notes | String? | |
| metadata | Json | extra data |

#### `WebhookLog`
Idempotency log for PayMongo webhooks.
| Field | Type |
|-------|------|
| id | String (uuid) |
| paymongoWebhookId | String (unique) |
| eventType | String |
| status | String |
| result | Json |
| errorMessage | String? |
| retryCount | Int |

#### `ClearanceOffice`
Reference table of endorsing offices.
| Field | Type |
|-------|------|
| id | String (uuid) |
| code | String (unique) |
| name | String |
| description | String? |
| applicationTypes | String[] |
| isActive | Boolean |

#### `Clearance`
Per-office clearance status per application.
| Field | Type |
|-------|------|
| id | String (uuid) |
| applicationId | String (FK) |
| officeId | String (FK → ClearanceOffice) |
| officeCode, officeName | String |
| status | ClearanceStatus |
| remarks | String? |
| dateCleared | DateTime? |

---

## 5. API Routes

All routes under `src/app/api/`. Protected by `src/middleware.ts` unless noted as public.

### Authentication — `/api/auth/`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | Credential login |
| POST | `/api/auth/logout` | Session logout |
| POST | `/api/auth/verify-otp` | OTP code verification |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/forgot-password` | Initiate password reset |
| GET/POST | `/api/auth/2fa/setup` | TOTP 2FA setup & QR code |
| POST | `/api/auth/2fa/verify` | Verify TOTP token |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js catch-all handler |

### Applications — `/api/applications/`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/applications` | List applications (role-filtered) | All |
| POST | `/api/applications` | Create new application | APPLICANT |
| GET | `/api/applications/[id]` | Application details | Owner / BPLO |
| PUT | `/api/applications/[id]` | Update application | Owner / BPLO |
| POST | `/api/applications/renewal` | Create renewal application | APPLICANT |
| POST | `/api/applications/closure` | Create closure application | APPLICANT |
| POST | `/api/applications/[id]/review` | Submit review decision | BPLO_OFFICE |
| GET | `/api/applications/[id]/clearances` | Get clearances for application | BPLO |
| POST | `/api/applications/verify-registration` | Verify DTI/BIR/SEC number | BPLO |

### Documents — `/api/documents/`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents/upload` | Upload document (10MB limit) |
| POST | `/api/documents/[id]/verify` | Verify or reject a document (BPLO) |
| GET | `/api/documents/[id]/download` | Download document (presigned URL) |

### Permits — `/api/permits/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/permits` | List permits |
| GET | `/api/permits/[id]` | Permit details |
| GET | `/api/permits/[id]/pdf` | Generate PDF permit |
| GET | `/api/permits/[id]/print` | Print-ready permit view |
| GET | `/api/permits/[id]/prefill` | Prefill renewal from existing permit |
| GET | `/api/permits/renewal-eligible` | Check renewal eligibility window |
| GET | `/api/permits/closure-eligible` | Check closure eligibility |

### Issuance — `/api/issuance/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/issuance/[id]` | Issuance record details |
| PUT | `/api/issuance/[id]` | Update issuance status (BPLO) |

### Payments — `/api/payments/`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments` | Create PayMongo checkout (GCash/Maya) |
| POST | `/api/payments/webhook` | PayMongo webhook (public, HMAC-verified) |

### Renewals — `/api/renewals/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/renewals/history` | Renewal history for applicant |
| GET | `/api/renewals/documents` | Required renewal documents |
| GET | `/api/renewals/claim-schedule` | Claim appointment slots |

### Admin — `/api/admin/`
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/admin/users` | List / create users | BPLO_OFFICE |
| GET/PUT/DELETE | `/api/admin/users/[id]` | User CRUD | BPLO_OFFICE |
| GET/POST | `/api/admin/locations` | Manage map locations | BPLO_OFFICE |
| GET/PUT/DELETE | `/api/admin/locations/[id]` | Location CRUD | BPLO_OFFICE |
| GET | `/api/admin/reports/analytics` | Analytics data | BPLO_OFFICE |
| POST | `/api/admin/reports/export` | Export CSV/Excel | BPLO_OFFICE |
| GET/PUT | `/api/admin/settings` | System settings | BPLO_OFFICE |

### Public (no auth) — `/api/public/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/track` | Track application by number |
| GET | `/api/public/verify-permit` | Verify permit by number |

### Utility Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | SSE real-time stream |
| GET | `/api/analytics` | Dashboard analytics |
| GET | `/api/profile` | Current user profile |
| GET | `/api/health` | Health check (DB, Redis, S3) |
| GET | `/api/metrics` | Prometheus metrics (token-protected) |
| GET | `/api/files/[...key]` | File serving (path traversal protected) |

### Cron Jobs
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cron/expire-permits` | Mark expired permits |
| POST | `/api/cron/expire-holds` | Release payment holds |

### Privacy
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/privacy/data` | Export personal data (RA 10173 / GDPR-style) |

---

## 6. Application Pages

All dashboard pages under `src/app/(dashboard)/dashboard/` unless noted.

### Public Pages — `src/app/(public)/`
| Route | Page |
|-------|------|
| `/` | Landing page |
| `/contact` | Contact form |
| `/data-privacy` | Data privacy notice (RA 10173) |
| `/faqs` | Frequently asked questions |
| `/how-to-apply` | Step-by-step application guide |
| `/privacy` | Privacy policy |
| `/requirements` | Document requirements checklist |
| `/terms` | Terms of service |
| `/track` | Public application status tracker |
| `/verify-permit` | Public permit verification |

### Auth Pages — `src/app/(auth)/`
| Route | Page |
|-------|------|
| `/login` | Login form |
| `/register` | Registration form |
| `/verify-otp` | OTP entry |
| `/forgot-password` | Password reset request |

### Dashboard Shell
| File | Purpose |
|------|---------|
| `layout.tsx` | Shell with sidebar + header |
| `page.tsx` | Main dashboard (role-aware widgets) |
| `loading.tsx` | Loading skeleton |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 |

### Applications
| Route | Page |
|-------|------|
| `/dashboard/applications` | Application list |
| `/dashboard/applications/new` | New application form |
| `/dashboard/applications/[id]` | Application detail + timeline |
| `/dashboard/applications/closure` | Closure application form |

### Renewal Workflow (own layout)
| Route | Page |
|-------|------|
| `/dashboard/renew` | Renewal overview |
| `/dashboard/renew/permit` | Select permit to renew |
| `/dashboard/renew/profile` | Update owner information |
| `/dashboard/renew/documents` | Upload renewal documents |
| `/dashboard/renew/history` | Renewal history |
| `/dashboard/renew/notifications` | Renewal notifications |
| `/dashboard/renew/claim-schedule` | Book claim appointment |

### BPLO Staff Pages
| Route | Page | Role |
|-------|------|------|
| `/dashboard/verify-documents` | Document verification queue | BPLO_OFFICE |
| `/dashboard/review` | Application review queue | BPLO_OFFICE |
| `/dashboard/review/[id]` | Review single application | BPLO_OFFICE |
| `/dashboard/issuance` | Permit issuance list | BPLO_OFFICE |
| `/dashboard/issuance/[id]` | Issuance detail + signing | BPLO_OFFICE |
| `/dashboard/approved-applications` | Approved applications list | BPLO_OFFICE |

### MTO (Payments) Pages
| Route | Page | Role |
|-------|------|------|
| `/dashboard/payments` | Payment list | MTO |
| `/dashboard/validate-payments` | Payment validation | MTO |
| `/dashboard/payment-queue` | Payment processing queue | MTO |
| `/dashboard/paid-applications` | Paid applications | MTO |
| `/dashboard/payment-reports` | Payment reports | MTO |
| `/dashboard/receipts` | Receipt management | MTO |

### Admin Pages
| Route | Page | Role |
|-------|------|------|
| `/dashboard/admin/users` | User management | BPLO_OFFICE |
| `/dashboard/admin/settings` | System settings | BPLO_OFFICE |
| `/dashboard/admin/reports` | Reports & analytics | BPLO_OFFICE |
| `/dashboard/admin/audit-logs` | Audit trail | BPLO_OFFICE |
| `/dashboard/admin/locations` | Map locations | BPLO_OFFICE |

### User Pages
| Route | Page |
|-------|------|
| `/dashboard/profile` | Profile + 2FA setup |
| `/dashboard/documents` | Document management |
| `/dashboard/tracking` | Real-time application tracking (SSE) |
| `/dashboard/permits` | Permit list |

---

## 7. Library Utilities

All under `src/lib/` (28 files):

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth Credentials provider, account lockout, login logging |
| `auth.config.ts` | Edge-safe auth config (no Node.js imports), JWT/session callbacks |
| `prisma.ts` | Prisma Client singleton with `@prisma/adapter-pg` (PgBouncer-safe) |
| `permissions.ts` | CASL.js ability definitions for all 3 roles |
| `validations.ts` | All Zod schemas (register, login, application, documents, etc.) |
| `validations/schedules.ts` | Claim schedule Zod schemas |
| `api-error.ts` | Custom `ApiError` class + HTTP status helpers |
| `application-helpers.ts` | Shared business logic (status transitions, number generation) |
| `cache.ts` | Redis + in-memory fallback caching layer |
| `email.ts` | Nodemailer SMTP — OTP emails, approval/rejection notifications |
| `government-api.ts` | DTI/BIR/SEC number verification (`GOV_API_MOCK` for dev) |
| `i18n.ts` | next-intl setup, locale detection |
| `locations.ts` | Philippine province/city/municipality reference data |
| `logger.ts` | Structured logging (JSON format for production) |
| `monitoring.ts` | Sentry initialization + Prometheus counter/histogram helpers |
| `payments.ts` | PayMongo REST API integration (create link, verify webhook HMAC) |
| `pdf.ts` | Puppeteer-based permit PDF generation with QR code embed |
| `queue.ts` | BullMQ queue + worker setup (email jobs, SMS jobs) |
| `rate-limit.ts` | Sliding window rate limiter (Redis or in-memory) |
| `renewal.ts` | Renewal eligibility checks, renewal workflow helpers |
| `sanitize.ts` | Strip sensitive fields before API responses |
| `serialization.ts` | JSON-safe serializer for Prisma Decimal + Date types |
| `sms.ts` | Semaphore SMS API client (send OTP, notifications) |
| `sse.ts` | SSE broadcaster — push events to connected clients |
| `storage.ts` | AWS S3 / MinIO client with local filesystem fallback |
| `stores.ts` | Zustand stores (UI state, notification state) |
| `two-factor.ts` | TOTP setup/verify with otplib, QR code generation |
| `utils.ts` | `cn()`, date formatters, string utilities |

---

## 8. Components

### UI Components — `src/components/ui/` (14)
| Component | Purpose |
|-----------|---------|
| `alert.tsx` | Alert / notification box |
| `badge.tsx` | Status badge with color variants |
| `button.tsx` | Button (default, outline, ghost, destructive) |
| `card.tsx` | Card container |
| `data-table.tsx` | Data table with sorting, filtering, pagination |
| `empty-state.tsx` | Empty state with icon + message |
| `file-upload.tsx` | Drag-and-drop file upload |
| `input.tsx` | Text input |
| `language-switcher.tsx` | EN / Filipino switcher |
| `loading.tsx` | Loading spinner |
| `modal.tsx` | Modal dialog (Radix-based) |
| `select.tsx` | Select dropdown |
| `skeleton.tsx` | Content loading skeleton |
| `textarea.tsx` | Textarea input |

### Dashboard Components — `src/components/dashboard/` (26)
| Component | Purpose |
|-----------|---------|
| `shell.tsx` | Dashboard layout shell |
| `sidebar.tsx` | Role-aware navigation sidebar |
| `header.tsx` | Top header with user menu |
| `notification-bell.tsx` | Notifications dropdown |
| `pay-now-button.tsx` | PayMongo checkout trigger |
| `business-map.tsx` / `business-map-content.tsx` | Leaflet map for business location |
| `tracking-client.tsx` | Real-time application tracking (SSE consumer) |
| `admin-users-client.tsx` | User management table + modals |
| `admin-settings-client.tsx` | System settings form |
| `admin-locations-client.tsx` | Location CRUD on map |
| `verify-document-actions.tsx` | Verify / reject document actions |
| `dashboard-error.tsx` | Error boundary |
| `renewal-shell.tsx` | Renewal section layout |
| `renewal-sidebar.tsx` | Renewal step navigation |
| `renewal-profile-content.tsx` | Owner info update form |
| `renewal-documents-content.tsx` | Document upload for renewal |
| `renewal-history-content.tsx` | Renewal history view |
| `renewal-notifications-content.tsx` | Renewal notifications |
| `renewal-claim-schedule-content.tsx` | Claim appointment booking |
| `reschedule-button.tsx` | Reschedule slot action |

### Other Components
| Component | Purpose |
|-----------|---------|
| `providers/query-provider.tsx` | React Query provider wrapper |
| `public/public-nav.tsx` | Public site navigation |
| `public/public-footer.tsx` | Public site footer |
| `privacy/cookie-consent.tsx` | Cookie consent banner (RA 10173) |
| `seo/json-ld.tsx` | JSON-LD structured data for SEO |
| `pwa/service-worker.tsx` | PWA service worker registration |

---

## 9. Authentication & Authorization

### Authentication Flow

```
1. POST /api/auth/register  →  create User (PENDING_VERIFICATION)
                            →  send OTP via email/SMS
2. POST /api/auth/verify-otp →  set status ACTIVE
3. POST /api/auth/login     →  validate email+password (bcryptjs)
                            →  check AccountStatus === ACTIVE
                            →  check lockedUntil (5 fails → 15 min lock)
                            →  if 2FA enabled → require TOTP token
                            →  issue JWT (30 min)
4. src/middleware.ts        →  validate JWT on every request
                            →  enforce RBAC routing rules
```

### JWT Payload
```typescript
{
  id: string
  email: string
  role: 'APPLICANT' | 'BPLO_OFFICE' | 'MTO'
  status: AccountStatus
  firstName: string
  lastName: string
  image?: string
}
```

### Account Lockout
- 5 consecutive failed logins → account locked for 15 minutes
- Tracked via `failedLoginAttempts` and `lockedUntil` on `User`

### RBAC Routing (enforced in `/src/middleware.ts`)
| Path pattern | Allowed roles |
|-------------|---------------|
| `/dashboard/admin/**` | `BPLO_OFFICE` only |
| `/dashboard/review/**` | `BPLO_OFFICE` only |
| `/dashboard/verify-documents` | `BPLO_OFFICE` only |
| `/dashboard/issuance/**` | `BPLO_OFFICE` only |
| `/dashboard/validate-payments/**` | `MTO` only |
| `/dashboard/receipts/**` | `MTO` only |
| `/dashboard/analytics/**` | `BPLO_OFFICE`, `MTO` |
| All others | Any authenticated user |

### CASL Permissions (`src/lib/permissions.ts`)
- `APPLICANT`: manage own applications/documents, read own permits/payments
- `BPLO_OFFICE`: manage all applications, documents, permits, issuance, users, settings
- `MTO`: manage payments, read applications/permits

### 2FA Setup
1. `GET /api/auth/2fa/setup` → generate TOTP secret + QR code
2. User scans QR in Google Authenticator
3. `POST /api/auth/2fa/verify` → validate first TOTP token, enable 2FA
4. On subsequent logins → prompt for 6-digit token

---

## 10. Rate Limiting

Implemented in `src/middleware.ts` using sliding window (Redis or in-memory).

| Endpoint group | Limit | Window |
|---------------|-------|--------|
| `/api/auth/**` | 10 requests | 60 seconds |
| `/api/**` (general) | 100 requests | 60 seconds |
| `/api/auth/verify-otp`, `/api/auth/resend-otp` | 5 requests | 900 seconds (15 min) |
| `/api/documents/upload` | 20 requests | 60 seconds |
| `/api/payments` | 5 requests | 60 seconds |

> **Security note:** Rate limit key uses IP from `X-Forwarded-For` which can be spoofed. Should use a verified IP source in production.

---

## 11. Environment Variables

### Database
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL pooler URL (PgBouncer) |
| `DIRECT_URL` | PostgreSQL direct URL (for migrations) |

### NextAuth
| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | JWT signing/encryption secret |
| `AUTH_TRUST_HOST` | Trust proxy `X-Forwarded-Host` |
| `NEXTAUTH_URL` | Canonical application URL |

### Application
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Frontend base URL |
| `NEXT_PUBLIC_APP_NAME` | Displayed application name |
| `NEXT_PUBLIC_APP_VERSION` | Version string |
| `NODE_ENV` | `development` \| `production` |

### LGU Information
| Variable | Purpose |
|----------|---------|
| `LGU_NAME`, `LGU_PROVINCE`, `LGU_REGION` | LGU identity |
| `LGU_ADDRESS`, `LGU_PHONE`, `LGU_EMAIL`, `LGU_WEBSITE` | Contact info |
| `LGU_MAYOR_NAME`, `LGU_BPLO_HEAD` | Officials for PDF permits |

### Email (SMTP)
| Variable | Purpose |
|----------|---------|
| `SMTP_HOST`, `SMTP_PORT` | SMTP server |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials |
| `SMTP_FROM` | Sender address |

### SMS
| Variable | Purpose |
|----------|---------|
| `SMS_PROVIDER` | `semaphore` or `globe-labs` |
| `SEMAPHORE_API_KEY`, `SEMAPHORE_SENDER_NAME` | Semaphore credentials |
| `GLOBE_LABS_APP_ID`, `GLOBE_LABS_APP_SECRET`, `GLOBE_LABS_SHORT_CODE` | Globe Labs credentials |

### File Storage (S3 / MinIO)
| Variable | Purpose |
|----------|---------|
| `S3_ENDPOINT` | MinIO/S3 endpoint |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | S3 credentials |
| `S3_BUCKET`, `S3_REGION` | Bucket config |

### Security
| Variable | Purpose |
|----------|---------|
| `CLAMAV_HOST`, `CLAMAV_PORT` | ClamAV virus scanning |

### Redis
| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Redis connection string |

### Payment Gateways
| Variable | Purpose |
|----------|---------|
| `PAYMONGO_SECRET_KEY`, `PAYMONGO_PUBLIC_KEY` | PayMongo API keys |
| `PAYMONGO_WEBHOOK_SECRET` | Webhook HMAC secret |
| `PAYMAYA_SECRET_KEY`, `PAYMAYA_PUBLIC_KEY` | PayMaya keys |
| `PAYMAYA_WEBHOOK_SECRET`, `PAYMAYA_API_URL` | PayMaya config |

### Government APIs
| Variable | Purpose |
|----------|---------|
| `DTI_API_URL`, `DTI_API_KEY` | DTI business name verification |
| `BIR_API_URL`, `BIR_API_KEY` | BIR TIN verification |
| `SEC_API_URL`, `SEC_API_KEY` | SEC corporation verification |
| `GOV_API_MOCK` | `true` to use mock responses in dev |

### 2FA & PWA
| Variable | Purpose |
|----------|---------|
| `TOTP_ISSUER` | Issuer name in Google Authenticator |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push server keys |

### Monitoring
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project DSN |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Sentry source map upload |
| `METRICS_TOKEN` | Bearer token for `/api/metrics` |

---

## 12. Validation Schemas

All Zod schemas in `src/lib/validations.ts`.

### Auth Schemas
```typescript
registerSchema: {
  email: string (email format)
  password: string (min 8, must contain: uppercase, lowercase, number, special char)
  firstName: string
  lastName: string
  phone: string (Philippine mobile format)
}

loginSchema: {
  email: string
  password: string
}

otpVerificationSchema: {
  token: string (6 digits)
}
```

### Application Schemas
```typescript
applicationSchema: {
  businessName: string
  businessType: string
  businessAddress: string
  businessPhone?: string
  businessEmail?: string
  dtiNumber?: string
  birTin?: string
  secNumber?: string
  capitalInvestment?: number
  ownerName: string
  ownerPhone?: string
  ownerEmail?: string
}
```

### Enums validated by Zod
- `ClosureReasonEnum`: matches `ClosureReason` prisma enum
- `DocumentTypeEnum`: matches `DocumentType` prisma enum

---

## 13. Infrastructure & Services

### Application Architecture
```
Internet
   │
   ▼
[Reverse Proxy / Load Balancer]
   │
   ▼
[Next.js App — Standalone Docker]
   ├── Edge Runtime:  middleware.ts (rate limiting, auth, RBAC)
   ├── Server:        API routes, Server Actions, SSR
   └── Client:        React 19, Zustand, React Query
   │
   ├── PostgreSQL 16 (via PgBouncer → pg driver)
   ├── Redis 7 (BullMQ queues + rate limiting + cache)
   └── MinIO / S3 (document storage)
```

### Job Queues (BullMQ)
- Email notification jobs (OTP, approval, rejection)
- SMS notification jobs
- Document virus scan jobs
- Permit expiry jobs

### Cron Jobs
| Endpoint | Schedule (recommended) | Purpose |
|----------|----------------------|---------|
| `POST /api/cron/expire-permits` | Daily at midnight | Expire permits past `expiryDate` |
| `POST /api/cron/expire-holds` | Every hour | Release payment holds after timeout |

### PWA Features
- Service worker at `public/sw.js`
- Offline fallback page (`public/offline.html`)
- Web manifest (`public/manifest.json`)
- Push notifications via VAPID

### i18n
- Languages: English (en), Filipino (fil)
- Messages in `src/messages/`
- Locale detection via next-intl middleware

---

## 14. Compliance & Security

### Regulatory Compliance
| Law | Implementation |
|-----|---------------|
| RA 10173 — Data Privacy Act | Cookie consent, `/api/privacy/data` export, privacy policy page |
| RA 11032 — Ease of Doing Business | Online applications, public tracking, SLA monitoring |
| WCAG 2.1 AA | Playwright + axe-core accessibility tests |

### Security Headers (`next.config.js`)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self)
Content-Security-Policy: (see below)
```

### CSP Policy
```
script-src 'self' 'unsafe-inline' ('unsafe-eval' in dev only)
style-src  'self' 'unsafe-inline'
img-src    'self' data: blob: https:
connect-src 'self' [Semaphore API] [PayMongo API] [PayMaya API]
```
> **Known issue:** `unsafe-inline` in script-src weakens XSS protection. Nonces should be used instead.

### Identified Security Issues (Audit 2026-04-23)
| # | Issue | Severity |
|---|-------|---------|
| 1 | `.env` with live credentials committed to repo | Critical |
| 2 | `users` and `pass.md` with plaintext demo credentials in repo | Critical |
| 3 | CSP uses `unsafe-inline` + `unsafe-eval` | High |
| 4 | OTP/backup codes use `Math.random()` not `crypto.getRandomValues()` | High |
| 5 | Public `/api/public/track` allows application number enumeration | Medium |
| 6 | `X-Forwarded-For` spoofable for rate limit bypass | Medium |
| 7 | Default S3 fallback credentials hardcoded in `storage.ts` | Medium |

---

## 15. Scripts & Tooling

### NPM Scripts
| Script | Command |
|--------|---------|
| `dev` | Next.js dev server |
| `build` | Production build |
| `start` | Start production server |
| `prod` | Build + start |
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `test` | Vitest |
| `test:watch` | Vitest watch mode |
| `test:coverage` | Vitest coverage |
| `test:e2e` | Playwright headless |
| `test:e2e:ui` | Playwright UI mode |
| `test:e2e:debug` | Playwright debug mode |
| `test:a11y` | Accessibility tests via Playwright |
| `db:push` | `prisma db push` (dev) |
| `db:migrate` | `prisma migrate deploy` |
| `db:migrate:dev` | `prisma migrate dev` |
| `db:seed` | Run seed script |
| `db:studio` | Prisma Studio GUI |
| `db:generate` | `prisma generate` |
| `prisma:validate` | Validate schema |
| `sitemap` | Generate sitemap |
| `postbuild` | Run sitemap after build |

### Docker
- `Dockerfile` — multi-stage, standalone output, Node.js base
- `.dockerignore` — excludes `node_modules`, `.env`, `.next`

### Key Config Files
| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript strict mode |
| `vitest.config.ts` | Unit test setup (jsdom environment) |
| `playwright.config.ts` | E2E test (Chromium, baseURL from env) |
| `eslint.config.mjs` | ESLint 9 flat config |
| `postcss.config.js` | Tailwind CSS v4 via PostCSS |
| `next-sitemap.config.js` | Sitemap for public pages |
| `prisma.config.ts` | Prisma adapter config |

---

*Updated 2026-04-24 (Next.js 15.5.15 / React 19.2 / TypeScript 5.9 / Prisma 6.19 / NextAuth beta.31). Generated from EBPLS codebase at `c:/Users/yowwo/Desktop/test ebpls/EBPLS/web/`*
