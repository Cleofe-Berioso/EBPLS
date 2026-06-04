# Third-Pass Security Audit — Findings & Implementation Plan

## Audit Scope

Full re-inspection of:
- All 82 API routes (same inventory as pass 2)
- `src/lib/auth.ts` — session strategy, JWT maxAge, Google OAuth flow
- `src/lib/jit-api.ts`, `department-head-api.ts`, `bplo-api.ts`, `superadmin-api.ts` — session guards
- `src/app/api/uploads/[...path]/route.ts` — file serving authorization
- `src/app/api/auth/**` — registration, OTP, reset flows
- `src/app/api/superadmin/users/**` — user management
- `next.config.mjs` — security headers
- `src/lib/password-reset.ts` — OTP lifecycle

---

## Findings by Severity

### 🔴 CRITICAL

#### C1 — `/api/uploads/[...path]` — Disabled staff can still read ALL files

**Root Cause:**
The uploads route calls `auth()` directly (line 74) instead of a `require*Session` helper. For all staff roles (BPLO, SUPER_ADMIN, DEPARTMENT_HEAD, JIT), `isAuthorized()` returns `true` immediately without a database `isActive` check:

```typescript
// isAuthorized() in uploads/[...path]/route.ts – line 37-39:
if (STAFF_ROLES.has(role)) {
  return true;  // ← No DB check. JWT role trusted blindly.
}
```

A disabled BPLO, SuperAdmin, DepartmentHead, or JIT account retains a valid JWT for up to the default JWT lifetime (30 days). During that window, the disabled account can access **any uploaded document**, including all applicant business documents, payment proofs, and inspection evidence, simply by hitting `/api/uploads/{any-valid-path}`.

This bypasses the `isActive` fixes applied to all `require*Session` helpers in passes 1 and 2, because the uploads route never calls those helpers.

**Affected:** All documents served via `/api/uploads/`  
**File:** `src/app/api/uploads/[...path]/route.ts`

---

### 🟠 HIGH

#### H1 — `/api/auth/register` — No rate limiting; unlimited account spam

**Root Cause:** The registration endpoint has no rate limiting at any layer. An attacker can create thousands of `APPLICANT` accounts or spam the `bcrypt.hash` computation (cost 12) as a CPU exhaustion vector.

**File:** `src/app/api/auth/register/route.ts`

#### H2 — `/api/superadmin/users/bplo` — No audit log for staff account creation

**Root Cause:** When a SuperAdmin creates a new BPLO account, no `AuditLog` entry is written. This is the most sensitive user-management action (granting staff-level access) and should always be traceable. Compare: account disable and reactivate both have audit logs.

**File:** `src/app/api/superadmin/users/bplo/route.ts`

#### H3 — Settlement route leaks raw `err.message` in production

**Root Cause:** The `settle` route at line 19 returns `err?.message` verbatim — identical pattern to the extensions route fixed in pass 2 but missed here.

**File:** `src/app/api/department-head/settlement-management/[inspectionId]/settle/route.ts:19`

---

### 🟡 MEDIUM

#### M1 — JWT `maxAge` not configured — 30-day stale-session window

**Root Cause:** `auth.ts` uses `strategy: "jwt"` with no `maxAge` set. NextAuth v5 default is 30 days. While the `require*Session` DB checks mitigate most access after account disable, the uploads route gap (C1) means the 30-day window is directly exploitable for file access.

Setting `maxAge` to 8 hours (one workday) reduces the window in which a compromised or stolen token can be abused.

**File:** `src/lib/auth.ts`

#### M2 — `console.error` in auth routes leaks to server logs unconditionally

**Root Cause:** `verify-otp/route.ts:40` and `reset-password/route.ts:48` call `console.error(...)` in catch blocks unconditionally. In production this logs internal stack traces to stdout. These should be gated to `NODE_ENV !== "production"` or use a structured logger.

**Files:** `src/app/api/auth/forgot-password/verify-otp/route.ts`, `src/app/api/auth/forgot-password/reset-password/route.ts`

---

### 🟢 CONFIRMED CLEAN (Third Pass)

| Area | Status |
|------|--------|
| JIT `requireJitSession` | ✅ Full DB isActive check already present |
| All DH routes after pass 2 | ✅ DB isActive added in pass 2 |
| SuperAdmin reactivate audit log | ✅ Already present |
| OTP attempt limit (5 tries per OTP) | ✅ Present in `verifyPasswordResetOtp` |
| OTP 60-second cooldown | ✅ Present in `requestPasswordResetOtp` |
| Password reset 15-minute recency gate | ✅ Added in pass 2 |
| BPLO document download status gate | ✅ Status allowlist enforced |
| Payment proof status gate | ✅ Allowlist enforced |
| All applicant ownership DB queries | ✅ All scoped to applicantId |
| Google OAuth disabled account check | ✅ `!existingUser.isActive` returns false (line 93-95) |
| Staff account creation forces `role: "BPLO"` hardcoded | ✅ Cannot self-assign other roles |
| JIT no-permit records scoped to creator | ✅ `WHERE createdById = session.user.id` |
| Superadmin cannot reset own SUPER_ADMIN password | ✅ Blocked at route level |
| Profile picture ownership | ✅ Path-based `segments[1] === userId` |

---

## Implementation Plan

### Phase 1 — CRITICAL (Task 1)

#### Task 1: Add DB isActive check to uploads route for staff roles

The `isAuthorized` helper must verify staff accounts against the database before granting blanket access.

**File:** `src/app/api/uploads/[...path]/route.ts`

**Change:** In `isAuthorized()`, after the `STAFF_ROLES.has(role)` branch, add a DB lookup:

```typescript
// BEFORE (line 37-39):
if (STAFF_ROLES.has(role)) {
  return true;
}

// AFTER:
if (STAFF_ROLES.has(role)) {
  // Re-verify the account is still active in the DB.
  // Mirrors the pattern used by requireBploSession / requireSuperAdminSession.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, role: true },
  });
  return !!(dbUser?.isActive && dbUser.role === role);
}
```

---

### Phase 2 — HIGH (Tasks 2–3)

#### Task 2: Add audit log to BPLO account creation

**File:** `src/app/api/superadmin/users/bplo/route.ts`

After successful `prisma.user.create`, add:

```typescript
import { createAuditLog } from "@/lib/audit-log";

void createAuditLog({
  actorId: session.user.id,
  actorName: session.user.name ?? session.user.email ?? null,
  actorRole: "SUPER_ADMIN",
  action: "STAFF_ACCOUNT_CREATED",
  module: "USER_MANAGEMENT",
  entityType: "USER",
  entityId: user.id,
  description: `Super Admin created new BPLO staff account`,
  metadata: {
    newUserId: user.id,
    newUserEmail: user.email,
    newUserRole: "BPLO",
    // Password intentionally NOT logged.
  },
});
```

#### Task 3: Sanitize settlement route error message

**File:** `src/app/api/department-head/settlement-management/[inspectionId]/settle/route.ts`

```typescript
// BEFORE (line 19):
return NextResponse.json({ error: err?.message ?? "Unable to settle case" }, { status: 400 });

// AFTER:
const safeMessage =
  process.env.NODE_ENV !== "production"
    ? (err?.message ?? "Unable to settle case")
    : "Unable to settle case";
return NextResponse.json({ error: safeMessage }, { status: 400 });
```

---

### Phase 3 — MEDIUM (Tasks 4–5)

#### Task 4: Set JWT maxAge to 8 hours

**File:** `src/lib/auth.ts`

```typescript
// BEFORE:
session: {
  strategy: "jwt",
},

// AFTER:
session: {
  strategy: "jwt",
  maxAge: 8 * 60 * 60, // 8 hours — reduces stale-token window
},
```

#### Task 5: Gate console.error to non-production in auth routes

**Files:** `verify-otp/route.ts:40`, `reset-password/route.ts:48`

```typescript
// BEFORE:
console.error("Error verifying OTP:", error);

// AFTER:
if (process.env.NODE_ENV !== "production") {
  console.error("Error verifying OTP:", error);
}
```

---

## Verification Plan

### After Task 1 (Critical)
```bash
npx tsc --noEmit
```
Manual: Disable a BPLO user in DB → with their still-valid session, attempt `GET /api/uploads/{any-path}` → expect 403.

### After Task 2 (High)
Manual: Create a BPLO account as SuperAdmin → verify `AuditLog` row created with `action: "STAFF_ACCOUNT_CREATED"`.

### After Task 3 (High)
Manual: Trigger an error in the settle route in production mode → verify response is `"Unable to settle case"` not a Prisma error string.

### After Tasks 4–5 (Medium)
Review session token expiry in browser DevTools after login. Token should expire after 8 hours.

---

> [!IMPORTANT]
> Task 1 is the most urgent — it's the only remaining path for a disabled staff account to access protected data, bypassing all the session guards hardened in passes 1 and 2.

> [!NOTE]
> No Next.js middleware (`src/middleware.ts`) exists in this project. All protection is per-route. This is a valid architectural choice given the route-level guards, but it means every new route must manually add auth. Consider adding a middleware safety net in a future pass.
