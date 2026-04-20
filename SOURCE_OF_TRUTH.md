# 📖 SOURCE OF TRUTH - Online Business Permit System

**Project Name:** Online Business Permit System (OBPS)
**Type:** Full-Stack Web Application
**Last Updated:** April 18, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

## 🎯 I. SYSTEM OVERVIEW

### Purpose
A comprehensive web-based Business Permit Application & Management System designed for Philippine Local Government Units (LGUs). The system digitizes the entire business permit lifecycle from application to issuance, including real-time tracking, document management, and permit claim scheduling.

### Problem Solved
- **Before:** Manual, paper-based permit applications (slow, error-prone, not transparent)
- **After:** Digital end-to-end workflow with real-time tracking, document management, and automatic notifications

### Key Objectives
1. ✅ Digitize permit application process
2. ✅ Enable real-time application tracking
3. ✅ Automate document verification workflows
4. ✅ Provide transparent status updates via email/SMS
5. ✅ Generate digital permits with QR codes
6. ✅ Support multiple payment methods (GCash, Maya, bank transfer)
7. ✅ Maintain comprehensive audit logs (RA 10173 compliance)

---

## 🏗️ II. ARCHITECTURE & TECHNOLOGY STACK

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                   │
│         Next.js 15 + React 19 + Tailwind CSS v4            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS (REST + SSE)
┌────────────────────────▼────────────────────────────────────┐
│              Application Layer (Edge + Server)              │
│                  Next.js 15 (App Router)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Middleware (Edge) - Auth, Rate Limit, RBAC          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes (18 groups) + Server Actions + SSE        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Core Libraries (auth, validations, payments, etc.)   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬─────────────────┐
        │                │                │                 │
┌───────▼────────┐ ┌────▼──────────┐ ┌──▼────────────┐ ┌──▼──────────┐
│  PostgreSQL    │ │    Redis      │ │   MinIO/S3    │ │   External  │
│  (Supabase)    │ │   (Caching,   │ │   (File Docs) │ │   Services  │
│                │ │   Queues)     │ │               │ │ (Email/SMS) │
└────────────────┘ └───────────────┘ └───────────────┘ └─────────────┘
```

### Core Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 15.1 | App router, server components, SSR |
| | React | 19 | UI framework |
| | TypeScript | 5.9 | Type safety |
| | Tailwind CSS | v4 | Styling + CVA for components |
| | React Hook Form | 7 | Form handling |
| | Zod | 4 | Schema validation |
| | TanStack Query | 5 | Data fetching & caching |
| | Zustand | 5 | Client state management |
| **Backend** | Node.js | 18+ | Runtime |
| | NextAuth.js (Auth.js) | 5 | Authentication & authorization |
| | Prisma | 7 | ORM + database management |
| | @prisma/adapter-pg | Latest | PostgreSQL adapter |
| **Database** | PostgreSQL | 16 | Relational database (Supabase) |
| | Prisma Migrations | - | Schema versioning |
| **Caching/Queues** | Redis | 7 | Caching, job queues, rate limiting |
| | ioredis | Latest | Redis client |
| | BullMQ | Latest | Job queue management |
| **File Storage** | MinIO / AWS S3 | - | Document & file storage |
| **Real-Time** | Server-Sent Events (SSE) | - | Live status updates |
| **Payments** | PayMongo | - | GCash, Maya, bank transfer |
| **Email** | Nodemailer | Latest | Email notifications (SMTP/Resend/SES) |
| **SMS** | Semaphore / Globe Labs | - | SMS notifications |
| **PDF Generation** | Puppeteer | 23+ | PDF generation with QR codes |
| **2FA** | otplib | 12/13 | TOTP authentication |
| **Testing** | Vitest | Latest | Unit tests |
| | Playwright | Latest | E2E tests |
| | Testing Library | Latest | Component testing |
| **Permissions** | CASL.js | Latest | Role-based access control |
| **Build** | Docker | Latest | Containerization |

### Environment Setup

```
Development Environment:
├── Node.js v24.14.1
├── npm 11.11.0
├── PostgreSQL (Supabase Cloud)
├── Redis (optional, with in-memory fallback)
├── MinIO (optional, with local filesystem fallback)
└── Dev Server (http://localhost:3001)

Production Environment:
├── Docker Container (standalone build)
├── PostgreSQL 16+ (cloud or managed)
├── Redis (production instance)
├── MinIO / AWS S3 (production storage)
├── HTTPS + Security Headers
├── Rate limiting + DDoS protection
└── Monitoring + Error tracking
```

---

## 💾 III. DATABASE SCHEMA

### Models Overview (16 Total)

#### 1. **User Management** (Module 1)
```
User
├── id: String (UUID, PK)
├── email: String (unique)
├── firstName: String
├── lastName: String
├── password: String (bcrypt hashed)
├── phone: String
├── address: String
├── role: Role (APPLICANT | STAFF | REVIEWER | ADMINISTRATOR)
├── accountStatus: AccountStatus (ACTIVE | INACTIVE | SUSPENDED | PENDING)
├── lastLoginAt: DateTime
├── createdAt: DateTime
├── twoFactorEnabled: Boolean
├── twoFactorSecret: String (encrypted)
└── Relations: Session[], OtpToken[], ActivityLog[], Application[], Permit[]

Session
├── id: String (UUID, PK)
├── userId: String (FK)
├── expiresAt: DateTime
└── Relations: User

OtpToken
├── id: String (UUID, PK)
├── userId: String (FK)
├── code: String (6 digits)
├── type: OTP_TYPE (LOGIN | EMAIL_VERIFICATION | PASSWORD_RESET)
├── expiresAt: DateTime
└── Relations: User

ActivityLog
├── id: String (UUID, PK)
├── userId: String (FK)
├── action: String (LOGIN | CREATE | UPDATE | DELETE | APPROVE | REJECT)
├── entityType: String (APPLICATION | DOCUMENT | PERMIT)
├── entityId: String
├── details: JSON
├── ipAddress: String
├── userAgent: String
├── timestamp: DateTime
└── Relations: User
```

#### 2. **Permit Applications** (Module 2)
```
Application
├── id: String (UUID, PK)
├── referenceNumber: String (unique, AUTO-GENERATED)
├── userId: String (FK)
├── type: ApplicationType (NEW | RENEWAL | CLOSURE)
├── status: ApplicationStatus (DRAFT | SUBMITTED | UNDER_REVIEW | NEEDS_REVISION | APPROVED | REJECTED | EXPIRED)
├── businessName: String
├── businessAddress: String
├── businessType: String
├── estimatedCapital: Decimal(15,2)
├── operatingHours: String
├── numberOfEmployees: Int
├── documents: Document[] (Relations)
├── reviewActions: ReviewAction[] (Relations)
├── submittedAt: DateTime
├── reviewStartedAt: DateTime
├── completedAt: DateTime
├── createdAt: DateTime
└── Relations: User, Document[], ApplicationHistory[], ReviewAction[], Permit

ApplicationHistory
├── id: String (UUID, PK)
├── applicationId: String (FK)
├── previousStatus: ApplicationStatus
├── newStatus: ApplicationStatus
├── changedBy: String (userId)
├── remarks: String
├── changedAt: DateTime
└── Relations: Application

ReviewAction
├── id: String (UUID, PK)
├── applicationId: String (FK)
├── reviewerId: String (FK)
├── action: REVIEW_ACTION (APPROVE | REJECT | REQUEST_REVISION)
├── remarks: String
├── createdAt: DateTime
└── Relations: Application
```

#### 3. **Document Management** (Module 3)
```
Document
├── id: String (UUID, PK)
├── applicationId: String (FK)
├── fileName: String
├── mimeType: String
├── fileSize: Int
├── s3Path: String (S3/MinIO path)
├── status: DocumentStatus (PENDING | VERIFIED | REJECTED | FLAGGED)
├── documentType: String (BUSINESS_REGISTRATION | DTI_CER | BIR_CER | etc.)
├── uploadedAt: DateTime
├── verifiedAt: DateTime
├── verifiedBy: String (userId)
├── rejectionReason: String
├── version: Int (for versioning)
└── Relations: Application
```

#### 4. **Claim Scheduling** (Module 5)
```
ClaimSchedule
├── id: String (UUID, PK)
├── startDate: DateTime
├── endDate: DateTime
├── maxSlotsPerDay: Int
├── createdBy: String (FK, adminId)
├── createdAt: DateTime
└── Relations: TimeSlot[]

TimeSlot
├── id: String (UUID, PK)
├── scheduleId: String (FK)
├── slotDate: DateTime
├── startTime: String (HH:MM)
├── endTime: String (HH:MM)
├── maxCapacity: Int
├── availableSlots: Int
├── createdAt: DateTime
└── Relations: ClaimSchedule, SlotReservation[]

SlotReservation
├── id: String (UUID, PK)
├── slotId: String (FK)
├── applicationId: String (FK)
├── userId: String (FK)
├── reservationStatus: ReservationStatus (PENDING | CONFIRMED | COMPLETED | CANCELLED)
├── reservedAt: DateTime
├── claimedAt: DateTime
└── Relations: TimeSlot, Application, User
```

#### 5. **Permit Issuance** (Module 6-7)
```
ClaimReference
├── id: String (UUID, PK)
├── referenceNumber: String (unique, AUTO-GENERATED)
├── applicationId: String (FK)
├── qrCode: String (encoded QR data)
├── status: ClaimReferenceStatus (PENDING | ACTIVE | CLAIMED | EXPIRED)
├── createdAt: DateTime
├── expiresAt: DateTime
└── Relations: Application

Permit
├── id: String (UUID, PK)
├── applicationId: String (FK)
├── permitNumber: String (unique, AUTO-GENERATED)
├── permitType: String (BUSINESS | SPECIAL_PERMIT)
├── status: PermitStatus (ISSUED | VALID | EXPIRED | REVOKED)
├── issuedAt: DateTime
├── validFrom: DateTime
├── validUntil: DateTime
├── mayorSignature: String (boolean/path)
└── Relations: Application, PermitIssuance

PermitIssuance
├── id: String (UUID, PK)
├── permitId: String (FK)
├── issuanceStatus: IssuanceStatus (PENDING | ISSUED | PRINTED | CLAIMED)
├── issuedBy: String (FK, staffId)
├── printedAt: DateTime
├── claimedAt: DateTime
└── Relations: Permit
```

#### 6. **Payment Tracking**
```
Payment
├── id: String (UUID, PK)
├── referenceNumber: String (unique)
├── applicationId: String (FK)
├── userId: String (FK)
├── amount: Decimal(12,2)
├── paymentMethod: PaymentMethod (GCASH | MAYA | BANK_TRANSFER | OTC | CASH)
├── status: PaymentStatus (PENDING | COMPLETED | FAILED | REFUNDED)
├── paymentGatewayId: String (from PayMongo)
├── receipt: String (file path)
├── createdAt: DateTime
├── completedAt: DateTime
└── Relations: Application, User
```

#### 7. **System Configuration**
```
SystemSetting
├── id: String (UUID, PK)
├── key: String (unique)
├── value: JSON
├── category: String (APPLICATION | PAYMENT | NOTIFICATION | SYSTEM)
├── updatedAt: DateTime
└── No Relations
```

### Enums (11 Total)

```typescript
enum Role {
  APPLICANT        // Business owners
  STAFF            // BPLO clerks
  REVIEWER         // Officers reviewing apps
  ADMINISTRATOR    // Full system access
}

enum AccountStatus {
  ACTIVE           // Normal user
  INACTIVE         // Account deactivated
  SUSPENDED        // Temporarily blocked
  PENDING          // Awaiting email verification
}

enum ApplicationType {
  NEW              // New business permit
  RENEWAL          // Renewing existing permit
  CLOSURE          // Closing business
}

enum ApplicationStatus {
  DRAFT            // Not submitted yet
  SUBMITTED        // Awaiting review
  UNDER_REVIEW     // Being reviewed
  NEEDS_REVISION   // Applicant must fix docs
  APPROVED         // Approved by reviewer
  REJECTED         // Rejected by reviewer
  EXPIRED          // Application timed out
}

enum DocumentStatus {
  PENDING          // Waiting for verification
  VERIFIED         // Passed verification
  REJECTED         // Failed verification
  FLAGGED          // Suspicious/needs review
}

enum ReservationStatus {
  PENDING          // Slot reserved
  CONFIRMED        // Payment confirmed
  COMPLETED        // Permit claimed
  CANCELLED        // Reservation cancelled
}

enum ClaimReferenceStatus {
  PENDING          // Not yet used
  ACTIVE           // Available for claim
  CLAIMED          // Already claimed
  EXPIRED          // Claim date passed
}

enum PermitStatus {
  ISSUED           // Newly issued
  VALID            // Active and valid
  EXPIRED          // Renewal needed
  REVOKED          // Manually cancelled
}

enum IssuanceStatus {
  PENDING          // Awaiting final issuance
  ISSUED           // Generated for printing
  PRINTED          // Physically printed
  CLAIMED          // Picked up by applicant
}

enum PaymentStatus {
  PENDING          // Awaiting payment
  COMPLETED        // Payment received
  FAILED           // Payment declined
  REFUNDED         // Refund processed
}

enum PaymentMethod {
  GCASH            // GCash payment
  MAYA             // Maya payment
  BANK_TRANSFER    // Direct bank transfer
  OTC              // Over-the-counter payment
  CASH             // Cash payment at office
}
```

### Key Relationships

```
User (1) ──→ (Many) Application
User (1) ──→ (Many) Session
User (1) ──→ (Many) OtpToken
User (1) ──→ (Many) ActivityLog

Application (1) ──→ (Many) Document
Application (1) ──→ (Many) ApplicationHistory
Application (1) ──→ (Many) ReviewAction
Application (1) ──→ (1) Permit
Application (1) ──→ (Many) SlotReservation
Application (1) ──→ (1) ClaimReference

ClaimSchedule (1) ──→ (Many) TimeSlot
TimeSlot (1) ──→ (Many) SlotReservation
```

---

## 👥 IV. USER ROLES & PERMISSIONS

### Role Matrix (4 Roles)

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **APPLICANT** | Business owner applying for permits | Create app, upload docs, track status, pay, claim permit, cancel/reschedule claim |
| **STAFF** | BPLO clerks (frontline staff) | Verify docs, process claims, generate permits, view reports |
| **REVIEWER** | BPLO officers (supervisory) | Review apps, approve/reject, request revisions, view analytics |
| **ADMINISTRATOR** | System admin (full access) | Manage users, system settings, schedules, view all data, export reports, audit logs |

### Permission Matrix

```
┌──────────────────────┬───────────┬──────────┬──────────┬──────────────────┐
│ Resource            │ Applicant │  Staff   │ Reviewer │  Administrator   │
├──────────────────────┼───────────┼──────────┼──────────┼──────────────────┤
│ Create Application   │ CREATE    │ —        │ —        │ READ/CREATE      │
│ View Own Application │ READ      │ READ(all)│ READ(all)│ READ(all)        │
│ Upload Documents     │ CREATE    │ —        │ —        │ CREATE           │
│ Verify Documents     │ —         │ UPDATE   │ —        │ UPDATE           │
│ Review Application   │ —         │ —        │ UPDATE   │ UPDATE           │
│ Approve/Reject       │ —         │ —        │ UPDATE   │ UPDATE           │
│ Issue Permit         │ —         │ UPDATE   │ —        │ UPDATE           │
│ Manage Users         │ —         │ —        │ —        │ CREATE/UPDATE    │
│ View Reports         │ OWN ONLY  │ OWN DATA │ ALL DATA │ ALL DATA         │
│ Manage Schedules     │ —         │ VIEW     │ —        │ CREATE/UPDATE    │
│ Audit Logs           │ —         │ —        │ —        │ READ             │
└──────────────────────┴───────────┴──────────┴──────────┴──────────────────┘
```

### Authentication Flow

```
1. LOGIN (Email + Password)
   ↓
2. CREDENTIALS VALIDATION (bcrypt)
   ↓
3. ACCOUNT STATUS CHECK (must be ACTIVE)
   ↓
4. GENERATE JWT TOKEN (include: userId, role, firstName, lastName)
   ↓
5. CREATE SESSION (30-min maxAge)
   ↓
6. UPDATE lastLoginAt + LOG ACTIVITY
   ↓
7. REDIRECT TO DASHBOARD
```

---

## 🔄 V. CORE WORKFLOWS

### Workflow 1: New Permit Application (APPLICANT → STAFF → REVIEWER)

```
1. APPLICANT - Create Application
   └─ POST /api/applications
   └─ Status: DRAFT
   └─ Store in database with basic info

2. APPLICANT - Upload Documents
   └─ POST /api/documents
   └─ Documents uploaded to S3/MinIO
   └─ Magic bytes validation
   └─ Virus scan initiated (ClamAV)
   └─ Status: PENDING

3. APPLICANT - Submit Application
   └─ PUT /api/applications/{id}/submit
   └─ Status: SUBMITTED
   └─ Email notification sent
   └─ Activity log created

4. STAFF - Verify Documents
   └─ GET /api/documents?status=PENDING
   └─ Review uploaded documents
   └─ PUT /api/documents/{id}/verify
   └─ Document Status: VERIFIED or REJECTED
   └─ Email notification to applicant

5. APPLICANT - Fix Documents (if REJECTED)
   └─ Upload replacement documents
   └─ Repeat document verification

6. REVIEWER - Review Application
   └─ GET /api/applications?status=UNDER_REVIEW
   └─ View all documents + history
   └─ POST /api/applications/{id}/review
   └─ Decision: APPROVE or REJECT or REQUEST_REVISION

7. APPLICANT - Receive Notification
   └─ Email with decision
   └─ If APPROVED, show payment instructions

8. APPLICANT - Make Payment
   └─ POST /api/payments
   └─ PayMongo integration (GCash, Maya, or bank transfer)
   └─ Payment Status: PENDING → COMPLETED

9. STAFF - Process Claim Schedule
   └─ Note: Claim slot booked
   └─ Generate Claim Reference with QR code

10. APPLICANT - Claim Permit
    └─ Visit office on reserved date/time
    └─ Present QR code at counter
    └─ STAFF marks as CLAIMED
    └─ Generate PDF permit with QR code

11. COMPLETED
    └─ Permit Status: ISSUED/VALID
    └─ Email confirmation sent
```

**Duration:** 5-10 business days
**Key Milestones:** Submission → Document Verification → Review → Payment → Claim

---

### Workflow 2: Permit Renewal

```
1. SYSTEM - Auto-trigger Renewal Notification
   └─ Cron job checks permits 30 days before expiry
   └─ Email: "Your permit expires in 30 days"

2. APPLICANT - Submit Renewal Application
   └─ POST /api/applications (type: RENEWAL)
   └─ Reference old permit
   └─ Upload updated documents
   └─ Submit

3. REVIEWER - Fast-track Review
   └─ Similar process to NEW
   └─ But may skip some docs if unchanged
   └─ Status: APPROVED

4. APPLICANT - Payment + Claim
   └─ Same as new permit workflow
   └─ Receive new permit with extended validity

**Duration:** 3-5 business days (faster than new)
```

---

### Workflow 3: Real-Time Status Tracking (SSE)

```
CLIENT SIDE:
1. useSSE hook connects to /api/events
2. Browser opens persistent connection
3. Listens for event types: updated, verified, issued, etc.

SERVER SIDE:
1. Application status changes
2. Server broadcasts event:
   {
     type: "application_status_changed",
     applicationId: "xxx",
     newStatus: "APPROVED",
     timestamp: "2026-04-18T10:30:00Z"
   }
3. All connected clients (applicants) receive update immediately
4. UI updates in real-time without page refresh

EVENT TYPES:
- application_status_changed
- document_verified
- payment_received
- claim_scheduled
- permit_issued
- notification (generic)
- heartbeat (keep-alive)
```

---

### Workflow 4: Payment Processing (PayMongo Webhook)

```
1. APPLICANT - Initiate Payment
   └─ POST /api/payments
   └─ Response: PayMongo checkout URL

2. APPLICANT - Complete Payment (external)
   └─ Redirected to PayMongo
   └─ Choose method: GCash, Maya, Bank Transfer
   └─ Enter payment details

3. PAYMONGO - Process Payment
   └─ Validate card/wallet
   └─ Deduct amount
   └─ Generate webhook event

4. SERVER - Webhook Handler
   └─ POST /api/payments/webhook
   └─ Verify signature (PayMongo secret)
   └─ Update Payment Status: COMPLETED
   └─ Trigger email notification
   └─ Emit SSE event: payment_received

5. APPLICANT - See Updated Status
   └─ Real-time SSE update
   └─ Payment marked COMPLETED
   └─ Can now schedule claim

KEY FIELDS:
- Amount: Decimal(12,2) [NEVER use Float]
- Status: PENDING | COMPLETED | FAILED | REFUNDED
- Method: GCASH | MAYA | BANK_TRANSFER | OTC | CASH
- gatewayId: PayMongo payment ID
```

---

## 🔌 VI. API ROUTES (18 Groups)

### API Structure Overview

```
/api/
├── /auth/              # Authentication (login, register, logout, OTP, 2FA)
├── /applications/      # Permit applications (CRUD, submit, review)
├── /documents/         # Document management (upload, verify, download)
├── /schedules/         # Claim schedules (CRUD, reserve, reschedule)
├── /claims/            # Claim processing (list, today, verify)
├── /permits/           # Permit details (view, PDF export)
├── /issuance/          # Permit issuance (record issuance, update status)
├── /payments/          # Payment processing (create, webhook)
├── /events/            # Server-Sent Events (real-time updates)
├── /analytics/         # Dashboard analytics (admin)
├── /metrics/           # Prometheus metrics
├── /health/            # Health check endpoint
├── /profile/           # User profile (get, update)
├── /privacy/           # Data privacy (RA 10173)
├── /admin/             # Admin panel (users, settings, reports)
├── /public/            # Public endpoints (track, verify-permit)
├── /files/             # Static file serving
└── /cron/              # Scheduled jobs (expire holds, permits)
```

### Key API Endpoints

#### Authentication
```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user { id, role, firstName } }

POST /api/auth/register
  Body: { email, password, firstName, lastName, phone }
  Response: { user, otp_required }

POST /api/auth/otp/verify
  Body: { email, otpCode }
  Response: { token, user }

POST /api/auth/logout
  Response: { success: true }

POST /api/auth/2fa/enable
  Body: { password }
  Response: { secret, qrCode }

POST /api/auth/2fa/verify
  Body: { token }
  Response: { success: true }
```

#### Applications
```
GET /api/applications
  Query: { status?, userId?, page?, limit? }
  Response: { applications[], total, page }

POST /api/applications
  Body: { type, businessName, businessAddress, ... }
  Response: { application { id, referenceNumber, status } }

GET /api/applications/{id}
  Response: { application, documents[], history[], reviews[] }

PUT /api/applications/{id}
  Body: Partial update data
  Response: { application }

POST /api/applications/{id}/submit
  Response: { application { status: "SUBMITTED" } }

POST /api/applications/{id}/review
  Body: { action: "APPROVE|REJECT", remarks }
  Response: { application { status: "APPROVED|REJECTED" } }
```

#### Documents
```
POST /api/documents
  Body: FormData { file, applicationId, documentType }
  Response: { document { id, status: "PENDING", s3Path } }

GET /api/documents/{id}
  Response: FileStream (serve document to browser)

PUT /api/documents/{id}/verify
  Body: { status: "VERIFIED|REJECTED", rejectionReason? }
  Response: { document { status } }
```

#### Payments
```
POST /api/payments
  Body: { applicationId, amount, method: "GCASH|MAYA|BANK_TRANSFER" }
  Response: { payment { id, status: "PENDING", checkoutUrl } }

GET /api/payments/{id}
  Response: { payment { status, receipt } }

POST /api/payments/webhook
  Body: PayMongo webhook payload
  Response: { success: true }
```

#### Schedules & Claims
```
GET /api/schedules
  Response: { schedules[] { id, availableSlots, dates[] } }

POST /api/schedules/{id}/reserve
  Body: { applicationId, slotId, userId }
  Response: { reservation { id, status: "CONFIRMED", claimDate } }

POST /api/schedules/{id}/reschedule
  Body: { reservationId, newSlotId }
  Response: { reservation { claimDate } }

GET /api/claims/today
  Response: { claims[] { referenceNumber, applicantName, status } }

PUT /api/claims/{referenceNumber}/mark-claimed
  Body: { permitNumber }
  Response: { claim { status: "CLAIMED" } }
```

#### Permits
```
GET /api/permits/{applicationId}
  Response: { permit { permitNumber, permitType, validUntil, qrCode } }

GET /api/permits/{applicationId}/pdf
  Response: PDF file (permit certificate)
```

#### Real-Time Events (Server-Sent Events)
```
GET /api/events
  Response: Server-Sent Events stream
  Events:
    - application_status_changed
    - document_verified
    - payment_received
    - claim_scheduled
    - permit_issued
    - notification
    - heartbeat (every 30s)
```

---

## 📁 VII. FILE STRUCTURE & ORGANIZATION

### Root Level
```
ONLINE-BUSINESS-PERMIT/
├── web/                          # ← Main application (Next.js)
├── .claude/                      # Claude Code configuration
├── .git/                         # Version control
├── .github/                      # GitHub Actions workflows
├── docker-compose.yml            # Service definitions
├── package.json                  # Root scripts (proxy to web/)
│
└── 📚 DOCUMENTATION (always kept up-to-date)
    ├── README.md                 # Quick start guide
    ├── START_HERE.md             # Detailed setup walkthrough
    ├── PROJECT-PLAN.md           # Full architecture docs
    ├── CODEBASE-STRUCTURE.md     # File-by-file breakdown
    ├── CLAUDE.md                 # Agentic workflow guide
    ├── SOURCE_OF_TRUTH.md        # ← This file (system overview)
    └── ... (12+ analysis docs)
```

### Web Application (Next.js)
```
web/
├── 📦 Configuration
│   ├── package.json              # Dependencies & npm scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.js            # Next.js config (security, CSP, standalone)
│   ├── postcss.config.js         # Tailwind CSS + PostCSS
│   ├── vitest.config.ts          # Unit test configuration
│   ├── playwright.config.ts      # E2E test configuration
│   ├── eslint.config.mjs         # ESLint rules (flat config)
│   └── .env                      # Environment variables (created from .env.backup)
│
├── 🗄️ prisma/
│   ├── schema.prisma             # Database schema (16 models, 11 enums)
│   └── seed.js                   # Test data seeding script
│
├── 📄 public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker (offline support)
│   ├── offline.html              # Offline fallback page
│   ├── robots.txt                # SEO robots rules
│   ├── sitemap-0.xml             # Sitemap for SEO
│   └── icons/                    # PWA icons (72px → 512px)
│
├── 🧪 Test Files
│   ├── e2e/                      # Playwright end-to-end tests
│   │   ├── app.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── accessibility.spec.ts
│   │   └── visual-regression.spec.ts
│   │
│   ├── tests/
│   │   ├── performance/          # k6 load testing
│   │   └── security/             # OWASP ZAP security scanning
│   │
│   └── src/__tests__/            # Vitest unit tests
│       ├── api/                  # API route tests
│       ├── components/           # Component tests
│       ├── lib/                  # Library function tests
│       └── e2e/                  # E2E test helpers
│
└── 📦 src/
    ├── middleware.ts             # Edge runtime: auth, rate limiting, RBAC
    ├── instrumentation.ts        # Sentry/Prometheus setup
    │
    ├── 📚 lib/ (22 modules - business logic)
    │   ├── auth.ts               # NextAuth v5 config
    │   ├── auth.config.ts        # Edge-safe auth config
    │   ├── prisma.ts             # PrismaClient singleton
    │   ├── validations.ts        # Zod validation schemas
    │   ├── permissions.ts        # CASL.js RBAC
    │   ├── application-helpers.ts # Business logic
    │   ├── payments.ts           # PayMongo integration
    │   ├── sms.ts                # Semaphore/Globe Labs
    │   ├── email.ts              # Nodemailer
    │   ├── storage.ts            # S3/MinIO + local fallback
    │   ├── pdf.ts                # PDF generation
    │   ├── two-factor.ts         # TOTP 2FA
    │   ├── rate-limit.ts         # Sliding window rate limiter
    │   ├── queue.ts              # BullMQ job queues
    │   ├── government-api.ts     # DTI/BIR/SEC APIs (mock)
    │   ├── sse.ts                # Server-Sent Events
    │   ├── i18n.ts               # Internationalization
    │   ├── stores.ts             # Zustand stores
    │   ├── cache.ts              # Redis + in-memory cache
    │   ├── sanitize.ts           # Data sanitization
    │   ├── logger.ts             # Structured logging
    │   ├── monitoring.ts         # Sentry + Prometheus
    │   └── utils.ts              # Helper functions
    │
    ├── 🎨 components/
    │   ├── ui/                   # 14 reusable UI components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── dialog.tsx
    │   │   ├── dropdown.tsx
    │   │   ├── form.tsx
    │   │   ├── select.tsx
    │   │   ├── table.tsx
    │   │   ├── tabs.tsx
    │   │   ├── toast.tsx
    │   │   ├── badge.tsx
    │   │   ├── alert.tsx
    │   │   ├── skeleton.tsx
    │   │   └── loading.tsx
    │   │
    │   ├── dashboard/           # Dashboard components
    │   │   ├── layout.tsx       # Main layout (sidebar + header)
    │   │   ├── sidebar.tsx      # Navigation sidebar
    │   │   ├── header.tsx       # Top header
    │   │   ├── notification-bell.tsx
    │   │   └── user-menu.tsx
    │   │
    │   ├── public/              # Public page components
    │   │   ├── nav.tsx
    │   │   └── footer.tsx
    │   │
    │   ├── privacy/             # RA 10173 compliance
    │   │   └── cookie-consent.tsx
    │   │
    │   ├── seo/                 # SEO components
    │   │   └── structured-data.tsx
    │   │
    │   ├── pwa/                 # PWA components
    │   │   └── service-worker-register.tsx
    │   │
    │   ├── providers/           # Context providers
    │   │   ├── query-provider.tsx
    │   │   ├── theme-provider.tsx
    │   │   └── auth-provider.tsx
    │   │
    │   └── ... (page-specific components)
    │
    ├── 🌐 app/                 # Next.js App Router
    │   ├── layout.tsx          # Root layout (providers, SEO)
    │   ├── page.tsx            # Landing page
    │   │
    │   ├── (public)/           # 9 public pages (no auth)
    │   │   ├── contact/
    │   │   ├── data-privacy/
    │   │   ├── faqs/
    │   │   ├── how-to-apply/
    │   │   ├── privacy/
    │   │   ├── requirements/
    │   │   ├── terms/
    │   │   ├── track/
    │   │   └── verify-permit/
    │   │
    │   ├── (auth)/             # 4 auth pages
    │   │   ├── login/
    │   │   ├── register/
    │   │   ├── forgot-password/
    │   │   └── verify-otp/
    │   │
    │   ├── (dashboard)/        # Protected routes
    │   │   ├── layout.tsx
    │   │   └── dashboard/
    │   │       ├── page.tsx    # Main dashboard
    │   │       ├── applications/    # Application list + create
    │   │       ├── documents/       # Document management
    │   │       ├── tracking/        # Real-time tracking
    │   │       ├── review/          # Reviewer queue (REVIEWER only)
    │   │       ├── verify-documents/ # Staff doc verification
    │   │       ├── schedule/        # Schedule management
    │   │       ├── claims/          # Claim processing
    │   │       ├── claim-reference/ # Reference numbers
    │   │       ├── issuance/        # Permit issuance
    │   │       ├── profile/         # User profile + 2FA
    │   │       └── admin/           # Admin panel
    │   │           ├── users/       # User management
    │   │           ├── settings/    # System settings
    │   │           ├── schedules/   # Schedule management
    │   │           ├── reports/     # Analytics & reports
    │   │           └── audit-logs/  # Activity audit logs
    │   │
    │   └── api/                # 18 API route groups (50+ endpoints)
    │       ├── auth/
    │       ├── applications/
    │       ├── documents/
    │       ├── schedules/
    │       ├── claims/
    │       ├── permits/
    │       ├── issuance/
    │       ├── payments/
    │       ├── events/
    │       ├── analytics/
    │       ├── metrics/
    │       ├── health/
    │       ├── profile/
    │       ├── privacy/
    │       ├── admin/
    │       ├── public/
    │       ├── files/
    │       └── cron/
    │
    ├── 🗂️ types/              # TypeScript type definitions
    │   ├── index.ts
    │   ├── user.ts
    │   ├── application.ts
    │   ├── document.ts
    │   └── ...
    │
    ├── 💬 messages/           # i18n translations
    │   ├── en.json            # English
    │   └── fil.json           # Filipino
    │
    └── 🎨 styles/            # Global styles
        └── globals.css        # Tailwind directives + custom styles
```

---

## 🛠️ VIII. DEVELOPMENT GUIDELINES

### Code Quality Standards

#### TypeScript
- **Mode:** Strict (`strict: true`)
- **Target:** `npm run typecheck` must pass with 0 errors
- **Pattern:** No `as any` in API/lib files
- **Pattern:** Always use optional chaining: `user?.id` instead of `user.id`

#### Validation
- **All API inputs:** Validated with Zod schemas from `src/lib/validations.ts`
- **Form inputs:** React Hook Form + Zod
- **Pattern:** `safeParse()` with error handling in try/catch blocks

#### Authentication
- **Provider:** NextAuth v5 (Auth.js) Credentials
- **Strategy:** JWT tokens
- **Session:** 30-minute maxAge
- **Pattern:** Always check `session?.user` before accessing user data

#### Error Handling
- **Pattern:** Try/catch on all async handlers
- **Pattern:** Return proper HTTP status codes
- **Pattern:** Log errors with `console.error()` or logger
- **Pattern:** Never return sensitive data in error messages

#### Data Sanitization
- **Pattern:** Use `sanitizeUser()` from `src/lib/sanitize.ts` before sending user data
- **Pattern:** Strip passwords, secrets, sensitive fields from responses

#### Financial Amounts
- **NEVER:** Use Float or Int for money
- **ALWAYS:** Use `Decimal` type in Prisma (e.g., `Decimal(12,2)`)
- **Pattern:** All calculations use Decimal arithmetic

#### Environment Variables
- **Pattern:** All config from `.env`, never hardcode
- **Pattern:** Use `process.env.` with fallbacks and validation
- **Pattern:** Consider `NEXT_PUBLIC_` prefix for client-side vars (e.g., `NEXT_PUBLIC_APP_URL`)

#### API Routes
- **Pattern:** Middleware validates auth first
- **Pattern:** Permission checks via CASL.js
- **Pattern:** Input validation with Zod
- **Pattern:** Try/catch all handlers
- **Pattern:** Return JSON responses only
- **Pattern:** No `console.log()` in production code

#### Frontend Components
- **Pattern:** Keep components < 500 lines
- **Pattern:** Extract logic to hooks or lib functions
- **Pattern:** Always provide `key` prop on `.map()` renders
- **Pattern:** Use loading states and error boundaries
- **Pattern:** Clean up SSE listeners in `useEffect` cleanup

#### Real-Time (SSE)
- **Pattern:** Use `useSSE()` hook with auto-reconnect
- **Pattern:** Always cleanup on unmount to prevent memory leaks
- **Pattern:** Emit heartbeat every 30 seconds
- **Pattern:** Validate event types before processing

#### Testing
- **Unit Tests:** Vitest for lib functions and utilities
- **E2E Tests:** Playwright for user workflows
- **Coverage Target:** > 80% for critical paths
- **Pattern:** Test user flows, not implementation details

### npm Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000/3001)
npm run build           # Production build
npm run start           # Start production server
npm run typecheck       # TypeScript validation (0 errors required)
npm run lint            # ESLint

# Database
npm run db:push         # Sync schema to database
npm run db:migrate:dev  # Create & run migration
npm run db:seed         # Seed test data
npm run db:studio       # Prisma GUI (port 5555)

# Testing
npm test                # Unit tests (Vitest)
npm run test:watch      # Watch mode
npm run test:e2e        # E2E tests (Playwright)
npm run test:coverage   # Coverage report

# Code Quality
npm run lint:fix        # Auto-fix linting issues
npm audit               # Check vulnerabilities
```

### Git Workflow

```
Feature branches: feature/feature-name
Bugfix branches:  fix/bug-name
Release branches: release/v1.0.0

Commit message format:
  feat: Add new feature
  fix: Fix bug #123
  docs: Update documentation
  refactor: Restructure component
  test: Add test coverage
  style: Format code
  chore: Update dependencies

Must pass before merge:
  ✅ npm run typecheck (0 errors)
  ✅ npm run lint
  ✅ npm test (if applicable)
  ✅ npm run build (successful)
```

---

## 🚀 IX. DEPLOYMENT & INFRASTRUCTURE

### Production Build

```bash
# From web/ directory
npm run build      # Creates .next/standalone output
npm run start      # Serves on PORT 3000 (or via Docker)
```

### Docker Deployment

```dockerfile
# Dockerfile uses multi-stage build:
# Stage 1: Build (npm install, next build)
# Stage 2: Runtime (alpine base, standalone output, minimal size)

Build command:
  docker build -t obps:latest .

Run command:
  docker run -p 3000:3000 \
    -e DATABASE_URL="..." \
    -e AUTH_SECRET="..." \
    obps:latest
```

### Environment Configuration (Production)

```env
# Critical (must change from defaults)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
AUTH_SECRET=(min 32 chars, openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Email Notifications
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...

# File Storage (production: AWS S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=permits-documents
S3_REGION=ap-southeast-1

# Payments (PayMongo)
PAYMONGO_SECRET_KEY=...
PAYMONGO_PUBLIC_KEY=...
PAYMONGO_WEBHOOK_SECRET=...

# Government APIs (if not using mocks)
DTI_API_KEY=...
BIR_API_KEY=...
SEC_API_KEY=...
GOV_API_MOCK=false

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
METRICS_TOKEN=...
```

### Infrastructure Requirements

| Service | Min Spec | Notes |
|---------|----------|-------|
| **App Server** | 2 vCPU, 4GB RAM | Can scale horizontally |
| **PostgreSQL** | 2 vCPU, 8GB RAM | Managed service recommended (Supabase, AWS RDS) |
| **Redis** | 1 vCPU, 2GB RAM | For caching, queues, rate limiting |
| **MinIO / S3** | Storage | Production: AWS S3 or equivalent |
| **Bandwidth** | As needed | SSL/TLS required for all traffic |

### Scaling Considerations

- **Horizontal Scaling:** Multiple app instances behind load balancer
- **Database:** Use connection pooling (PgBouncer in Supabase)
- **Caching:** Distributed Redis cluster
- **CDN:** CloudFlare or AWS CloudFront for static assets
- **Monitoring:** Sentry for error tracking, Prometheus for metrics

---

## 🔐 X. SECURITY & COMPLIANCE

### Philippine Regulations

| Regulation | Implementation |
|-----------|-----------------|
| **RA 11032** (Ease of Doing Business) | Online application, real-time tracking |
| **RA 10173** (Data Privacy Act) | Cookie consent, data privacy page, user data export |
| **DICT Standards** | Government cloud compatible, WCAG 2.1 AA |
| **NBCP** | Fire safety document requirements |

### Security Features

- ✅ Password hashing (bcryptjs)
- ✅ JWT token-based auth (30-min sessions)
- ✅ Rate limiting (auth: 10/min, API: 100/min, OTP: 5/15min)
- ✅ CSRF protection (NextAuth)
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Input validation (Zod on all forms)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ File upload validation (magic bytes, virus scanning stub)
- ✅ Data sanitization (strip sensitive fields)
- ✅ HTTPS/TLS enforced
- ✅ Audit logging (all user actions)
- ✅ 2FA/TOTP support
- ✅ Account lockout on failed attempts

### Known Vulnerabilities (from npm audit)

```
17 total vulnerabilities:
- 7 moderate
- 9 high
- 1 critical

Actionable items:
1. Upgrade Next.js to patched version (CVE-2025-66478)
2. Upgrade Puppeteer >= 24.15.0
3. Update otplib to v13

Status: Non-blocking for development, must fix before production
```

---

## 📊 XI. MONITORING & ANALYTICS

### Metrics Collected

- **Application Metrics**
  - Request count, latency, error rate
  - API endpoint performance
  - Database query performance

- **Business Metrics**
  - Applications received (NEW, RENEWAL, CLOSURE)
  - Application status distribution
  - Average processing time
  - Payment success rate
  - Document verification rate

- **System Metrics**
  - Server CPU, memory, disk usage
  - Database connection pool
  - Redis memory usage
  - Error rate and exceptions

### Monitoring Tools

- **Error Tracking:** Sentry (optional, configurable via `NEXT_PUBLIC_SENTRY_DSN`)
- **Metrics:** Prometheus endpoint at `/api/metrics`
- **Logs:** Structured logging via `logger.ts`
- **Health Check:** `GET /api/health` returns system status

---

## 🧪 XII. TESTING STRATEGY

### Test Coverage Goals

| Category | Target |
|----------|--------|
| Authentication flows | 100% |
| Business logic | > 90% |
| API endpoints | > 85% |
| Components | > 80% |
| Overall | > 85% |

### Test Types

1. **Unit Tests (Vitest)**
   - Library functions
   - Validation schemas
   - Utility functions

2. **Component Tests (Testing Library)**
   - Form components
   - Dashboard widgets
   - UI interactions

3. **E2E Tests (Playwright)**
   - User workflows (login → apply → claim)
   - Document upload
   - Payment flow
   - Admin functions

4. **Performance Tests (k6)**
   - Load testing (concurrent users)
   - API response times
   - Database performance

5. **Security Tests (OWASP ZAP)**
   - SQL injection attempts
   - XSS vulnerabilities
   - CSRF protection
   - Authentication bypass attempts

### Running Tests

```bash
npm test                 # Unit tests
npm run test:watch      # Watch mode (TDD)
npm run test:e2e        # E2E tests
npm run test:coverage   # Coverage report
```

---

## 📞 XIII. SUPPORT & REFERENCES

### Key Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Quick start & setup |
| `START_HERE.md` | Detailed walkthrough |
| `PROJECT-PLAN.md` | Full architecture |
| `CODEBASE-STRUCTURE.md` | File-by-file breakdown |
| `CLAUDE.md` | Tech stack & patterns |
| `SOURCE_OF_TRUTH.md` | ← This file |
| `.claude/AVAILABLE_SKILLS.md` | AI agent skills catalog |

### Troubleshooting

**Port Already in Use**
```bash
# Try different port
npm run dev -- -p 3001

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

**Database Connection Error**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Check Supabase status
psql $DATABASE_URL -c "SELECT 1"
```

**Dependencies Conflict**
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or update package.json
npm update
npm audit fix --force
```

**TypeScript Errors**
```bash
npm run typecheck     # See all errors
npm run lint:fix      # Auto-fix linting issues
```

---

## ✅ XIII. CHECKLISTS

### Pre-Deployment Checklist

- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] All tests passing (`npm test`, `npm run test:e2e`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security headers set in `next.config.js`
- [ ] Rate limiting configured
- [ ] Email/SMS providers configured
- [ ] Payment gateway keys added
- [ ] Sentry/monitoring setup (optional)
- [ ] SSL/TLS certificate ready
- [ ] Database backups configured
- [ ] Monitoring alerts set

### Post-Launch Checklist

- [ ] Health check endpoint verified (`/api/health`)
- [ ] Error tracking enabled (Sentry)
- [ ] Monitor rate limits and performance
- [ ] Check audit logs for anomalies
- [ ] Test payment webhook
- [ ] Verify email/SMS notifications
- [ ] Test permit PDF generation
- [ ] Load test with expected users
- [ ] Set up automated backups
- [ ] Configure CDN/caching headers

---

## 📝 FINAL NOTES

This document serves as the **Single Source of Truth** for the Online Business Permit System. It should be:

- ✅ **Updated** whenever architecture changes occur
- ✅ **Consulted** before major decisions
- ✅ **Referenced** for onboarding new developers
- ✅ **Maintained** to reflect current state

**Last Updated:** April 18, 2026
**Status:** ✅ Complete & Accurate
**Next Review:** When major features are added or architecture changes

---

**For questions or clarifications, refer to the detailed documentation files or contact the development team.**
