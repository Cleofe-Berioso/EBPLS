# eBPLS Codebase Structure
**Project:** Online Business Permit and Licensing System
**Last Updated:** April 18, 2026
**Type:** Next.js 15 Full-Stack Application

---

## 📁 Root Directory Structure

```
ONLINE-BUSINESS-PERMIT/
├── web/                           # Next.js application (main codebase)
├── DFD's and data template/       # Business requirements (DFD & data specs)
├── .claude/                       # Claude Code configuration & skills
├── .git/                          # Git repository
├── .github/                       # GitHub workflows
│
├── 📋 DOCUMENTATION (Root)
│   ├── CLAUDE.md                  # Tech stack, architecture, patterns
│   ├── START_HERE.md              # Setup & deployment guide
│   ├── PROJECT-PLAN.md            # Complete project roadmap
│   ├── FRONTEND-UI-ALIGNMENT-AUDIT.md     # Frontend audit report (2000+ lines)
│   ├── FRONTEND-GAPS-IMPLEMENTATION-SUMMARY.md  # Implementation summary
│   ├── DFD-IMPLEMENTATION-GAP-ANALYSIS.md      # DFD compliance analysis
│   ├── CODE-REVIEW-ANALYSIS.md    # Code quality audit
│   ├── MISSING_REQUIREMENTS.md    # Configuration checklist
│   └── ... (12+ other analysis docs)
│
└── docker-compose.yml            # PostgreSQL 16, Redis 7, MinIO, App
```

---

## 🚀 Web Application Structure (Next.js 16)

```
web/
├── 📦 Configuration Files
│   ├── package.json              # Dependencies & scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.js            # Next.js config (security headers, CSP)
│   ├── postcss.config.js         # PostCSS + Tailwind CSS v4
│   ├── vitest.config.ts          # Unit test config
│   ├── playwright.config.ts      # E2E test config
│   └── eslint.config.mjs         # ESLint 9 flat config
│
├── 🗄️ Database
│   └── prisma/
│       ├── schema.prisma         # Prisma schema (16 models, 11 enums)
│       └── seed.js               # Test data seeder
│
├── 📄 Public Assets
│   └── public/
│       ├── manifest.json         # PWA manifest
│       ├── sw.js                 # Service worker (offline support)
│       ├── offline.html          # Offline fallback
│       ├── robots.txt            # SEO robots
│       └── icons/                # PWA icons (72px → 512px)
│
├── 🧪 Tests
│   ├── e2e/                      # Playwright E2E tests
│   │   ├── app.spec.ts
│   │   ├── accessibility.spec.ts
│   │   └── visual-regression.spec.ts
│   ├── tests/
│   │   ├── performance/          # k6 load tests
│   │   └── security/             # OWASP ZAP scan scripts
│   └── src/__tests__/            # Vitest unit tests
│       ├── api/                  # API route tests
│       ├── components/           # Component tests
│       └── lib/                  # Library function tests
│
├── 🔧 Source Code (src/)
│   │
│   ├── middleware.ts             # Edge runtime: auth, rate limiting, RBAC
│   ├── instrumentation.ts        # Server instrumentation
│   │
│   ├── 📚 lib/ (22 files - Business Logic & Utilities)
│   │   ├── auth.ts               # NextAuth v5 config (Credentials provider)
│   │   ├── auth.config.ts        # Edge-safe auth config
│   │   ├── prisma.ts             # PrismaClient singleton (PrismaPg adapter)
│   │   ├── validations.ts        # Zod schemas for all forms
│   │   ├── validations/          # Organized validation schemas
│   │   ├── permissions.ts        # CASL.js RBAC (4 roles × 10 actions)
│   │   ├── application-helpers.ts # Core business logic (renewal, closure validation)
│   │   ├── payments.ts           # PayMongo integration (GCash, Maya)
│   │   ├── sms.ts                # Semaphore + Globe Labs SMS
│   │   ├── email.ts              # Nodemailer (SMTP/Resend/SES)
│   │   ├── storage.ts            # S3/MinIO with local filesystem fallback
│   │   ├── pdf.ts                # Permit PDF generation with QR codes
│   │   ├── two-factor.ts         # TOTP 2FA (otplib)
│   │   ├── rate-limit.ts         # Sliding window rate limiter
│   │   ├── queue.ts              # BullMQ job queues
│   │   ├── government-api.ts     # DTI/BIR/SEC verification (mock mode)
│   │   ├── sse.ts                # Server-Sent Events broadcaster
│   │   ├── i18n.ts               # Filipino/English i18n
│   │   ├── stores.ts             # Zustand stores (UI state)
│   │   ├── cache.ts              # Redis + in-memory cache fallback
│   │   ├── sanitize.ts           # Data sanitization
│   │   ├── logger.ts             # Structured logging
│   │   ├── locations.ts          # ✅ Geo Map utilities (EB Magalona bounds, color map)
│   │   └── utils.ts              # Utility functions (cn, formatDate, etc.)
│   │
│   ├── 🪝 hooks/
│   │   └── use-sse.ts            # SSE client hook with auto-reconnect
│   │
│   ├── 🌍 messages/
│   │   ├── en.json               # English translations
│   │   └── fil.json              # Filipino translations
│   │
│   ├── 🎨 components/
│   │   ├── ui/                   # 14 reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── select.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ... (4 more UI components)
│   │   │
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   ├── shell.tsx         # Main dashboard shell (sidebar + header)
│   │   │   ├── sidebar.tsx       # Navigation sidebar (role-based)
│   │   │   ├── header.tsx        # Top header bar
│   │   │   ├── renewal-shell.tsx # Renewal-specific layout
│   │   │   ├── renewal-sidebar.tsx
│   │   │   ├── tracking-client.tsx # Real-time tracking (SSE)
│   │   │   ├── verify-document-actions.tsx
│   │   │   ├── business-map.tsx  # ✅ Geo Map wrapper (dynamic import, ssr: false)
│   │   │   ├── business-map-content.tsx # ✅ Geo Map Leaflet container
│   │   │   ├── admin-locations-client.tsx # ✅ Geo Map admin form & table
│   │   │   └── ... (other dashboard components)
│   │   │
│   │   ├── privacy/              # Cookie consent (RA 10173 compliance)
│   │   ├── providers/            # Context providers (Query, Theme)
│   │   ├── public/               # Public nav, footer
│   │   ├── pwa/                  # Service worker registration
│   │   └── seo/                  # JSON-LD structured data
│   │
│   ├── 📱 app/ (Next.js 16 App Router)
│   │   │
│   │   ├── layout.tsx            # Root layout (providers, SEO, PWA, Toaster)
│   │   ├── page.tsx              # Landing page
│   │   │
│   │   ├── (public)/             # 9 public pages (no auth required)
│   │   │   ├── contact/
│   │   │   ├── data-privacy/
│   │   │   ├── faqs/
│   │   │   ├── how-to-apply/
│   │   │   ├── privacy/
│   │   │   ├── requirements/
│   │   │   ├── terms/
│   │   │   ├── track/            # Public permit tracker
│   │   │   └── verify-permit/
│   │   │
│   │   ├── (auth)/               # 4 auth pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── verify-otp/
│   │   │
│   │   ├── (dashboard)/dashboard/ # Protected dashboard pages
│   │   │   ├── layout.tsx        # Dashboard shell layout
│   │   │   ├── page.tsx          # Dashboard home (stats, quick actions)
│   │   │   │
│   │   │   ├── applications/     # Application management
│   │   │   │   ├── page.tsx      # List applications
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # ✅ Detail view (IMPLEMENTED)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # NEW application form
│   │   │   │   ├── closure/
│   │   │   │   │   └── page.tsx  # CLOSURE form (TBD bug FIXED)
│   │   │   │   └── renewal/
│   │   │   │
│   │   │   ├── renew/            # Renewal portal
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx      # Renewal permit selection
│   │   │   │   └── permit/
│   │   │   │       └── page.tsx  # ✅ Renewal form (IMPLEMENTED)
│   │   │   │
│   │   │   ├── documents/        # Document management
│   │   │   ├── tracking/         # Application tracking
│   │   │   ├── review/           # Reviewer queue
│   │   │   │   ├── page.tsx      # Review list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # ✅ Review detail (IMPLEMENTED)
│   │   │   │
│   │   │   ├── issuance/         # Permit issuance
│   │   │   │   ├── page.tsx      # Issuance list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # ✅ Issuance detail + Mayor signing (ENHANCED)
│   │   │   │
│   │   │   ├── profile/          # User profile + 2FA
│   │   │   └── admin/            # Admin pages
│   │   │       ├── users/
│   │   │       ├── settings/
│   │   │       ├── reports/
│   │   │       ├── audit-logs/
│   │   │       └── locations/     # ✅ Geo Map - Business location management
│   │   │
│   │   └── api/ (16 API route groups)
│   │       ├── auth/             # Login, register, OTP, 2FA
│   │       ├── applications/     # CRUD, renewal, closure, review
│   │       ├── documents/        # Upload, verify, download
│   │       ├── permits/          # Permit details, PDF, renewal-eligible
│   │       ├── issuance/         # Issuance actions (ISSUE, RELEASE, MAYOR_*)
│   │       ├── payments/         # PayMongo integration
│   │       ├── events/           # SSE real-time stream
│   │       ├── analytics/        # Dashboard analytics
│   │       ├── metrics/          # Prometheus metrics
│   │       ├── health/           # Health checks
│   │       ├── profile/          # User profile CRUD
│   │       ├── privacy/          # Data privacy (RA 10173)
│   │       ├── admin/            # Admin operations
│   │       │   └── locations/    # ✅ Geo Map API (GET, POST, DELETE)
│   │       ├── public/           # Public track, verify-permit
│   │       ├── files/            # File serving
│   │       └── cron/             # Scheduled tasks
│   │
│   └── 🧪 __tests__/
│       ├── api/
│       ├── components/
│       └── lib/
```

---

## 📊 Database Schema (Prisma)

### 13 Models
| Model | Purpose |
|-------|---------|
| `User` | Accounts (4 roles: APPLICANT, STAFF, REVIEWER, ADMINISTRATOR) |
| `Session` | Active user sessions |
| `OtpToken` | OTP codes (email/login/password reset) |
| `ActivityLog` | Audit trail of all actions |
| `Application` | Business permit applications (NEW/RENEWAL/CLOSURE) |
| `ApplicationHistory` | Status change history |
| `ReviewAction` | Reviewer decisions (APPROVE/REJECT/REQUEST_REVISION) |
| `Document` | Uploaded files with verification status |
| `Permit` | Issued permits with validity periods |
| `PermitIssuance` | Issuance records + **Mayor signing fields** |
| `SystemSetting` | System configuration parameters |
| `Payment` | Payment records (GCash, Maya, bank, OTC, cash) |
| `BusinessLocation` | ✅ **Geo Map** - Business location pins (lat/lon, multicolored markers) |

### 9 Enums
- `Role`, `AccountStatus`, `ApplicationType`, `ApplicationStatus`, `DocumentStatus`
- `PermitStatus`, `IssuanceStatus`, `PaymentStatus`, `PaymentMethod`

---

## 🔑 Key Implementation Files (Recently Updated)

### ✅ Major Changes (April 18, 2026)

| Change | Impact | Status |
|--------|--------|--------|
| **Claim Processing Feature Removed** | Simplified workflow (App → Review → Permit) | ✅ COMPLETE |
| **Database: 4 models removed** | ClaimSchedule, TimeSlot, SlotReservation, ClaimReference | ✅ COMPLETE |
| **Dashboard pages removed** | /schedule, /claims, /claim-reference, /admin/schedules | ✅ COMPLETE |
| **API routes removed** | /api/schedules, /api/claims, /api/cron/expire-holds | ✅ COMPLETE |
| **Leaflet Map Center Updated** | Default: [10.877893290764273, 122.97788094358054], Zoom: 15 | ✅ COMPLETE |
| **Geo Map Bounds Updated** | Lat 10.834893–10.920893, Lon 122.935881–123.019881 | ✅ COMPLETE |

### ✅ Critical Gaps Fixed (Phase 13 + Geo Map v1)

| File | Change | Status |
|------|--------|--------|
| `/dashboard/applications/[id]/page.tsx` | Application detail view (180 lines) | ✅ NEW |
| `/dashboard/renew/permit/page.tsx` | Renewal form with Gross Sales (150 lines) | ✅ NEW |
| `/dashboard/issuance/[id]/page.tsx` | Mayor signing workflow UI | ✅ ENHANCED |
| `/dashboard/applications/closure/page.tsx` | Fixed TBD hardcoding | ✅ FIXED |
| `/dashboard/renew/page.tsx` | Updated flow to use form page | ✅ UPDATED |
| `lib/locations.ts` | ✅ **Geo Map** - DEFAULT_MAP_CENTER, EB Magalona bounds, colors | ✅ UPDATED |
| `lib/validations.ts` | ✅ **Geo Map** & Claim Removal - Updated bounds validation | ✅ UPDATED |
| `components/dashboard/business-map.tsx` | ✅ **Geo Map** - Map wrapper (dynamic import) | ✅ NEW |
| `components/dashboard/business-map-content.tsx` | ✅ **Geo Map** - Leaflet map container | ✅ NEW |
| `components/dashboard/admin-locations-client.tsx` | ✅ **Geo Map** - Admin form, table, delete modal, DEFAULT_MAP_CENTER | ✅ NEW |
| `api/admin/locations/route.ts` | ✅ **Geo Map** - GET/POST endpoints | ✅ NEW |
| `api/admin/locations/[id]/route.ts` | ✅ **Geo Map** - DELETE endpoint (NextAuth 15 params) | ✅ NEW |
| `prisma/schema.prisma` | ✅ **Claim Removal** - 13 models (removed 4), 9 enums (removed 2) | ✅ UPDATED |
| `src/components/dashboard/sidebar.tsx` | ✅ **Claim Removal** - Removed schedule/claim/claim-ref links | ✅ UPDATED |
| `src/lib/permissions.ts` | ✅ **Claim Removal** - Updated RBAC subjects | ✅ UPDATED |
| `src/lib/sse.ts` | ✅ **Claim Removal** - Removed claim/schedule events | ✅ UPDATED |
| `src/hooks/use-sse.ts` | ✅ **Claim Removal** - Removed claim/schedule event types | ✅ UPDATED |
| `src/app/api/applications/[id]/review/route.ts` | ✅ **Claim Removal** - Removed claimReference creation | ✅ UPDATED |
| `src/app/api/applications/[id]/route.ts` | ✅ **Claim Removal** - Removed claimReference/Schedule includes | ✅ UPDATED |
| `src/app/api/admin/reports/analytics/route.ts` | ✅ **Claim Removal** - Removed claim statistics | ✅ UPDATED |
| `src/app/api/admin/reports/export/route.ts` | ✅ **Claim Removal** - Removed claims export report | ✅ UPDATED |
| `src/app/api/privacy/data/route.ts` | ✅ **Claim Removal** - Removed claimReferences from export | ✅ UPDATED |
| `src/app/api/public/verify-permit/route.ts` | ✅ **Claim Removal** - Updated to verify by permit number | ✅ UPDATED |

### Core Business Logic

| File | Purpose | Lines |
|------|---------|-------|
| `lib/application-helpers.ts` | Renewal/closure validation, clearance routing | 900+ |
| `lib/validations.ts` | Zod schemas for all forms | 300+ |
| `lib/payments.ts` | PayMongo integration | 200+ |
| `lib/auth.ts` | NextAuth v5 configuration | 150+ |
| `lib/permissions.ts` | CASL.js RBAC rules | 200+ |

---

## 📚 Documentation Files (Root)

### Primary Guides
- **`START_HERE.md`** — Complete setup & deployment guide
- **`CLAUDE.md`** — Tech stack, architecture, 7 modules, development commands
- **`PROJECT-PLAN.md`** — Full project roadmap with phases

### Audit & Analysis
- **`FRONTEND-UI-ALIGNMENT-AUDIT.md`** (2000+ lines) — Comprehensive frontend audit
- **`FRONTEND-GAPS-IMPLEMENTATION-SUMMARY.md`** — Implementation summary
- **`DFD-IMPLEMENTATION-GAP-ANALYSIS.md`** — DFD compliance analysis
- **`CODE-REVIEW-ANALYSIS.md`** — Code quality audit

### Status & Tracking
- **`tasks.md`** — Comprehensive task tracker
- **`MISSING_REQUIREMENTS.md`** — Configuration checklist

---

## 🔧 Available Development Commands

```bash
# Development
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run typecheck     # TypeScript validation (0 errors)
npm run lint          # ESLint check

# Database
npm run db:push       # Push schema to DB (dev)
npm run db:migrate    # Create migrations (production)
npm run db:seed       # Seed test data
npm run db:studio     # Prisma Studio (port 5555)

# Testing
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E
npm run test:a11y     # WCAG 2.1 AA accessibility
npm run test:coverage # Coverage report

# Docker (from root)
docker compose up -d              # All services
docker compose up -d postgres     # PostgreSQL only
```

---

## 📈 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files (excluding node_modules)** | 500+ |
| **TypeScript Components** | 82+ |
| **API Routes** | 16 groups (50+ endpoints) |
| **Database Models** | 13 |
| **Enums** | 9 |
| **Zod Schemas** | 25+ |
| **Tests** | 35+ E2E, 45+ unit tests |
| **Documentation Pages** | 32+ markdown files |
| **Lines of Code** | 9,800+ (excluding tests/docs) |

---

## 🗺️ Geo Map Feature (v1 - Admin-Only MVP)

### ✅ Implementation Status: Complete & Production-Ready

**Purpose:** Admin-managed business location mapping with multicolored markers based on business type.

**Core Features Implemented:**
- Leaflet + OpenStreetMap map rendering (client-only with `ssr: false`)
- EB Magalona coordinate bounds validation (lat 10.834893–10.920893, lon 122.935881–123.019881)
- **Default Map Center:** `[10.877893290764273, 122.97788094358054]` (exported as `DEFAULT_MAP_CENTER` constant)
- **Default Zoom Level:** 15 (for clear visibility on load)
- Multicolored markers by business type (Retail, Service, Manufacturing, Food, Construction)
- Admin form: coordinate input with bounds validation, label, business type selector
- Save locations to PostgreSQL via Prisma `BusinessLocation` model
- Delete locations with confirmation modal
- Real-time map marker updates
- Form pre-fills with `DEFAULT_MAP_CENTER` for new locations

**Admin-Only Access:**
- Role enforcement: `ADMINISTRATOR` only
- Route: `/dashboard/admin/locations`
- Sidebar link: "Business Locations" with MapPin icon

**API Endpoints (Admin-Protected):**
- `GET /api/admin/locations` — List locations (paginated)
- `POST /api/admin/locations` — Create new location
- `DELETE /api/admin/locations/[id]` — Delete location

**Known Limitations (v1, intentional):**
- Application ID is text field (v2: dropdown selector with autocomplete)
- No edit functionality (v2: add PUT endpoint + edit modal)
- No public map API yet (v2: separate public read-only map page)
- No click-to-pin (v2: optional enhancement)

**Technology Stack:**
- `leaflet@^1.9.4` + `react-leaflet@^4.2.1` (with legacy peer deps)
- OpenStreetMap tiles (free, no API key required)
- Prisma `BusinessLocation` model with `Application` relation
- Next.js dynamic import with `ssr: false` for SSR compatibility

---

## 🎯 Project Status

| Aspect | Status |
|--------|--------|
| **Build** | ✅ SUCCESS (0 TypeScript errors) |
| **Claim Processing Feature** | ✅ REMOVED (Simplified workflow) |
| **Geo Map Feature** | ✅ COMPLETE (Default center & bounds configured) |
| **Frontend Alignment** | ✅ A- (90%+) — Critical gaps fixed |
| **Staging Readiness** | ✅ APPROVED |
| **Production Ready** | ✅ Pending staging validation |
| **Critical Path Coverage** | ✅ 100% implemented |

---

## 🚀 Next Phase

**Claim Processing Removed** → Streamlined application-to-permit workflow

**Geo Map Complete** → Authenticated browser testing → Public map API (v2) → Click-to-pin (v2)

**Staging Deployment** → Execute critical path tests → Production deployment

For detailed setup, see **START_HERE.md**
For tech stack details, see **CLAUDE.md**
For the latest updates, see **SOURCE_OF_TRUTH.md**
