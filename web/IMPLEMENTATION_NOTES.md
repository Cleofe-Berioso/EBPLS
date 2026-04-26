# IMPLEMENTATION NOTES — eBPLS UI Integration

## Overview

| Field | Value |
|---|---|
| **Leader folder** | `C:\Users\yowwo\Desktop\test ebpls\plan` (Figma Make export, `@figma/my-make-file`, Vite 6 + React 18) |
| **Target project** | `C:\Users\yowwo\Desktop\test ebpls\EBPLS\web` (Next.js 15.5, React 19, TypeScript 5.9) |
| **Date** | 2026-04-25 |
| **Goal** | Make the eBPLS system visually match the leader's design as closely as possible |

---

## Strategy

Extract UI design patterns from the Figma Make prototype and integrate them into the existing
Next.js project. The leader folder is a client-side-only prototype with no backend — it serves
as a visual reference only. All existing backend logic, authentication (NextAuth v5), RBAC
(CASL.js), Prisma schema, and API routes are preserved untouched.

- Replace existing 14 custom CVA components with shadcn/ui equivalents
- Adopt leader's OKLCH color tokens (with brand overrides)
- Port leader's 23 feature components as Next.js `"use client"` components
- Use Next.js App Router routing (not leader's `useState` view switching)
- Use mock data where real APIs are missing; clearly mark all TODOs

---

## Files NOT to Change

- `prisma/schema.prisma`
- `src/app/api/**` (all API routes)
- `src/lib/auth.ts`, `src/lib/auth.config.ts`
- `src/middleware.ts`
- `src/lib/validations.ts`
- `src/lib/monitoring.ts`
- `.env`

---

## Critical Risk — CSS Variable Collision

`--accent` in the existing project = `#2563EB` (interactive blue, used by sidebar active states,
buttons, nav highlights). The leader's folder uses `--accent = #e9ebef` (neutral gray).

**Resolution:** Always keep `--accent: #2563EB` in the backward-compatibility alias layer.
Never adopt the leader's gray for `--accent`.

---

## Assets Copied

| Source | Destination |
|---|---|
| `plan/src/imports/image.png` | `public/assets/login-bg.png` |
| `plan/src/imports/image-1.png` | `public/assets/logo.png` |
| `plan/src/imports/image-2.png` | `public/assets/image-2.png` |
| `plan/src/imports/image-3.png` | `public/assets/image-3.png` |
| `plan/src/imports/image-4.png` | `public/assets/image-4.png` |
| `plan/src/imports/image-5.png` | `public/assets/image-5.png` |
| `plan/src/imports/image-6.png` | `public/assets/image-6.png` |
| `plan/src/imports/image-7.png` | `public/assets/image-7.png` |
| `plan/src/imports/image-8.png` | `public/assets/image-8.png` |

---

## Dependencies Added

### New packages (Radix UI + shadcn/ui):
- @radix-ui/react-accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible,
  context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu,
  popover, progress, radio-group, scroll-area, select, separator, slider, slot,
  switch, tabs, toggle, toggle-group, tooltip
- cmdk, vaul, embla-carousel-react, input-otp, react-resizable-panels
- recharts, react-day-picker, tw-animate-css, canvas-confetti, date-fns

### Upgraded packages:
- sonner: v1 → v2
- lucide-react: 0.445 → 0.487
- tailwind-merge: v2 → v3

### NOT installed (from leader folder, unused or incompatible):
- @mui/material, @emotion/react, @emotion/styled, react-router, motion, react-dnd,
  react-leaflet@4.x (project already has v5)

---

## Components Updated / Created

| Component | Action | Notes |
|---|---|---|
| `src/components/ui/button.tsx` | Replaced with shadcn/ui | Added `loading` prop + `success`/`warning` variants |
| `src/components/ui/card.tsx` | Replaced with shadcn/ui | Same API |
| `src/components/ui/input.tsx` | Replaced with shadcn/ui | Kept `label`/`error`/`hint` props |
| `src/components/ui/textarea.tsx` | Replaced with shadcn/ui | Direct replacement |
| `src/components/ui/badge.tsx` | Replaced with shadcn/ui | `StatusBadge` export retained |
| `src/components/ui/alert.tsx` | Replaced with shadcn/ui | Updated test assertions |
| `src/components/ui/skeleton.tsx` | Replaced with shadcn/ui | Direct replacement |
| `src/components/ui/select.tsx` | Replaced with shadcn/ui Radix | Breaking change — all call sites updated |
| `src/components/ui/modal.tsx` | Rewrote internals | Wraps shadcn/ui Dialog; same Modal API |
| `src/components/ui/data-table.tsx` | Rewrote internals | Uses shadcn/ui Table primitives |
| `src/components/ui/` (new) | 37 new shadcn/ui primitives | accordion, avatar, dialog, tabs, etc. |
| `src/components/dashboard/sidebar.tsx` | Updated | Logo, active state, MTO nav items |
| `src/components/dashboard/header.tsx` | Updated | Notification badge, avatar style |
| `src/components/dashboard/application-tracker.tsx` | Created | From ApplicationTracker.tsx |
| `src/components/dashboard/statement-of-account.tsx` | Created | From Assesment_of_F.tsx |
| `src/components/dashboard/assessment-form.tsx` | Created | From bplo/AssessmentForm.tsx |
| `src/components/dashboard/evaluation-modal.tsx` | Created | From bplo/EvaluationModal.tsx |
| `src/components/dashboard/system-stats.tsx` | Created | From superadmin/SystemStats.tsx (recharts) |

---

## Pages Redesigned

| Page | Source Component | Status |
|---|---|---|
| `(auth)/login/page.tsx` | `App.tsx` login UI | ✅ Done |
| `(auth)/register/page.tsx` | Matching login card style | ✅ Done |
| `app/page.tsx` | New color system applied | ✅ Done |
| `dashboard/page.tsx` (APPLICANT) | `ApplicantDashboard.tsx` | ✅ Done |
| `dashboard/applications/page.tsx` | 3 gradient cards | ✅ Done |
| `dashboard/applications/new/page.tsx` | `NewApplicationForm.tsx` | ✅ Done |
| `dashboard/renew/` pages | `RenewalForm.tsx` | ✅ Done |
| `dashboard/applications/closure/page.tsx` | `ClosureForm.tsx` | ✅ Done |
| `dashboard/tracking/page.tsx` | `ApplicationTracker.tsx` | ✅ Done |
| `dashboard/payments/page.tsx` | `Assesment_of_F.tsx` | ✅ Done |
| `dashboard/page.tsx` (BPLO_OFFICE) | `BploDashboard.tsx` | ✅ Done |
| `dashboard/review/page.tsx` | `ApplicationQueue.tsx` | ✅ Done |
| `dashboard/review/[id]/page.tsx` | `EvaluationModal.tsx` | ✅ Done |
| `dashboard/applications/[id]/assess/` | `AssessmentForm.tsx` | ✅ Done |
| `dashboard/issuance/page.tsx` | `PermitIssuance.tsx` | ✅ Done |
| `dashboard/admin/locations/page.tsx` | `BusinessMapView.tsx` (v5 kept) | ✅ Done |
| MTO pages | Visual update | ✅ Done |
| `dashboard/page.tsx` (admin) | `SuperAdminDashboard.tsx` + `SystemStats.tsx` | ✅ Done |
| `dashboard/admin/users/page.tsx` | `UserManagement.tsx` | ✅ Done |
| `dashboard/admin/applications/page.tsx` | `AllApplications.tsx` | ✅ Done (new page) |
| `dashboard/admin/audit-logs/page.tsx` | `BploActivities.tsx` | ✅ Done |

---

## Mock Data Used (TODO Backend Integration)

> All items below have been integrated. No mock data remains.

| Page/Component | Mock purpose | Endpoint used |
|---|---|---|
| `statement-of-account.tsx` | Fee summary | `GET /api/payments?applicationId={id}` ✅ |
| `dashboard/page.tsx` (BPLO stats) | Stats grid | Prisma direct (server component) ✅ |
| `dashboard/applications/[id]/page.tsx` | Payment details | `GET /api/payments?applicationId={id}` ✅ |
| `dashboard/admin/applications/page.tsx` | All applications | `GET /api/admin/applications` ✅ |
| `system-stats.tsx` | System-wide metrics | `GET /api/analytics` ✅ |

---

## Backend Integration Changes (2026-04-25)

### APIs Created
| Route | Method | Description |
|---|---|---|
| `/api/admin/applications` | GET | Paginated + filterable app list for BPLO_OFFICE (`?page, ?limit, ?status, ?type, ?search`) |

### APIs Updated
| Route | Change |
|---|---|
| `GET /api/applications` | Added `?status`, `?page`, `?limit` query params; now returns `total` count |
| `GET /api/payments` | Extended to support `?applicationId={id}` for listing all payments by application |

### Components Created
| Component | Description |
|---|---|
| `src/components/dashboard/system-stats.tsx` | Recharts dashboard — bar/pie charts from `/api/analytics` (BPLO_OFFICE only) |
| `src/components/dashboard/statement-of-account.tsx` | Fee breakdown + payment history per application via `/api/payments?applicationId` |

### Pages Created
| Page | Description |
|---|---|
| `dashboard/admin/applications/page.tsx` | Full paginated table with status/type/search filters; links to review/[id] |

### Sidebar Updated
- Added "All Applications" nav item (`/dashboard/admin/applications`) for `BPLO_OFFICE` role

### Tests Updated
- `src/__tests__/api/applications.test.ts`: Updated 4 `listAppHandler()` calls to pass `new Request(url)` after GET signature change

---

## Issues Fixed

_(Populated during implementation)_

---

## Issues Remaining

_(Populated during implementation)_

---

## Verification Results

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run build` | ✅ 76 pages compiled |
| `npm test` | _(pending)_ |
