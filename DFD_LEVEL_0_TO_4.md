# eBPLS DFD Level 0 to Level 4

## Scope
External entities are limited to:
- Applicant
- BPLO
- Superadmin

---

## Level 0 (Context Diagram)
Process: eBPLS System

### Inputs
| External Entity | Inputs |
|---|---|
| Applicant | Registration / login credentials; application form data (NEW, RENEWAL, CLOSURE); required document files; payment reference + proof of payment; business geolocation |
| BPLO | Review action decisions (under-review, return, reject, approve-assessment); fee assessment values + payment frequency; TOP generation trigger; payment verification decisions; permit preparation + release trigger; business location verification decisions |
| Superadmin | User disable / reactivate / password-reset commands; fee configuration overrides (category + classification amounts); system penalty settings (surcharge %, interest %, liquor add-on %); renewal extension windows (date range, waiver flags) |

### Outputs
| External Entity | Outputs |
|---|---|
| Applicant | Application status updates; application number; TOP details (assessment number, amount, payment frequency); payment verification result; permit / closure certificate document number + release confirmation; Release Notification Details (SMS); correction remarks; business location verification result; notifications |
| BPLO | Application queues filtered by status; full application detail + uploaded documents; auto-computed fee suggestions; payment verification queue (pending / verified / rejected buckets); permit issuance queue (paid / for-release / released / blocked buckets); business map with location pins + category/status filters |
| Superadmin | Dashboard summary (status counts, revenue estimates); application list + full detail (view-only); activity / history log; reports (status distribution, type counts, revenue, permit counts, BPLO activity); user directory with role + active status |

---

## Level 1 (Main Processes)
1. Account and Role Access
2. Application Submission
3. Dynamic Document Upload
4. BPLO Review and Assessment
5. Payment Submission and Verification
6. Permit Issuance, Release, and SMS Notification
7. Business Location Mapping
8. Superadmin Configuration and Monitoring

---

## Level 2 to Level 4

### 1. Account and Role Access

#### 1.1 Roles

| Role | Route Prefix | Assignable By |
|---|---|---|
| `APPLICANT` | `/applicant/*` | Self-registration; auto-assigned on Google OAuth sign-in |
| `BPLO` | `/bplo/*` | Superadmin (creates BPLO accounts) |
| `SUPER_ADMIN` | `/superadmin/*` | Existing Superadmin (existing account required to create another) |

#### 1.2 Route Protection (Middleware)

| Condition | Outcome |
|---|---|
| Authenticated user hits `/login` | Redirect to role home (`/applicant/dashboard`, `/bplo/dashboard`, `/superadmin/dashboard`) |
| Unauthenticated user hits `/applicant/*`, `/bplo/*`, or `/superadmin/*` | Redirect to `/login?callbackUrl=…` |
| Authenticated user hits a route belonging to a different role | Redirect to own role home |
| Any other request | Pass through |

Public routes (no auth required): `/login`, `/register`, `/api/auth/*`, static assets.

#### 1.3 Authentication Providers

| Provider | Flow | Inactive User |
|---|---|---|
| Credentials (email + password) | Lookup by email → bcrypt compare → return user or null | Rejected (null returned) |
| Google OAuth | Auto-creates `APPLICANT` account with random password hash on first sign-in | Rejected on subsequent sign-ins |

Session strategy: **JWT**. `jwt` callback embeds `user.id` and `user.role` from DB on first sign-in; re-queries DB by email if fields are missing on token refresh.

#### 1.4 RBAC — Workflow Action Permissions

| WorkflowAction | BPLO | SUPER_ADMIN |
|---|---|---|
| `VIEW_APPLICATIONS` | ✓ | ✓ |
| `VIEW_BUSINESS_RECORDS` | ✓ | ✓ |
| `VIEW_MAP` | ✓ | ✓ |
| `VIEW_REPORTS_DASHBOARD` | ✓ | ✓ |
| `MANAGE_CONFIGURATION` | ✗ | ✓ |
| `APPROVE_APPLICATION` | ✓ | ✗ |
| `REJECT_APPLICATION` | ✓ | ✗ |
| `ASSESS_FEES` | ✓ | ✗ |
| `VERIFY_PAYMENTS` | ✓ | ✗ |

`APPLICANT` holds no `WorkflowAction` permissions — access is scoped entirely to own data.

#### 1.5 Superadmin User Management

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Create BPLO account | name, email, password | email format, password ≥ 8 chars, email unique | `User` create with role `BPLO` | New BPLO account |
| Disable user | userId | Cannot self-disable; cannot disable last active Superadmin | `User.isActive = false` | Account deactivated |
| Reactivate user | userId | — | `User.isActive = true` | Account reactivated |
| Reset password | userId, newPassword | Password ≥ 8 chars; blocked for `SUPER_ADMIN` targets | `User.passwordHash` updated (bcrypt) | Password changed |

---

### 2. Application Submission

#### 2.1 Application Numbering
Format: `EBPLS-{year}-{NNNN}` (zero-padded 4 digits, sequential count of applications created within the calendar year).

#### 2.2 Application Statuses and Transitions

| Status | Description |
|---|---|
| `DRAFT` | Saved but not submitted; applicant can still edit |
| `SUBMITTED` | Submitted for BPLO review; applicant can no longer edit |
| `UNDER_REVIEW` | BPLO has started reviewing |
| `ASSESSED` | BPLO approved for fee assessment |
| `APPROVED_FOR_PAYMENT` | TOP generated; applicant must submit payment |
| `PAID` | Payment verified; ready for permit preparation |
| `FOR_RELEASE` | Permit prepared; ready to be released |
| `RELEASED` | Permit / closure certificate released |
| `RETURNED_FOR_CORRECTION` | Returned by BPLO; applicant may amend and re-submit |
| `REJECTED` | Rejected by BPLO; terminal state |

#### 2.3 Valid Transitions

| From Status | Action | To Status | Actor | Remarks Required |
|---|---|---|---|---|
| `DRAFT` | Save draft | `DRAFT` | APPLICANT | No |
| `DRAFT` | Submit | `SUBMITTED` | APPLICANT | No |
| `RETURNED_FOR_CORRECTION` | Re-submit | `SUBMITTED` | APPLICANT | No |
| `SUBMITTED` | Mark under review | `UNDER_REVIEW` | BPLO | No |
| `SUBMITTED` | Return | `RETURNED_FOR_CORRECTION` | BPLO | Yes |
| `SUBMITTED` | Reject | `REJECTED` | BPLO | Yes |
| `UNDER_REVIEW` | Approve for assessment | `ASSESSED` | BPLO | No |
| `UNDER_REVIEW` | Return | `RETURNED_FOR_CORRECTION` | BPLO | Yes |
| `UNDER_REVIEW` | Reject | `REJECTED` | BPLO | Yes |
| `ASSESSED` | Generate TOP | `APPROVED_FOR_PAYMENT` | BPLO | No |
| `APPROVED_FOR_PAYMENT` | Submit payment ref | (stays) `APPROVED_FOR_PAYMENT` | APPLICANT | No |
| `APPROVED_FOR_PAYMENT` | Verify payment | `PAID` | BPLO | No |
| `PAID` | Prepare permit | `FOR_RELEASE` | BPLO | No |
| `FOR_RELEASE` | Release permit | `RELEASED` | BPLO | No |

BPLO queue shows all applications with status ≠ `DRAFT`.

#### 2.4 Application Types and Eligibility

| Type | Who Can Submit | Prerequisite Check |
|---|---|---|
| `NEW` | Any authenticated Applicant | None |
| `RENEWAL` | Applicant who owns an eligible `BusinessRecord` | `businessStatus ≠ CLOSED`; business has at least one `PAID / FOR_RELEASE / RELEASED` application or a `VERIFIED` location |
| `CLOSURE` | Applicant who owns an eligible `BusinessRecord` | Same eligibility check as RENEWAL |

Applicants may only edit applications in `DRAFT` or `RETURNED_FOR_CORRECTION`.

---

### 3. Dynamic Document Upload

#### 3.1 Required Documents by Application Type

| Application Type | Base Required Documents |
|---|---|
| `NEW` | Barangay Clearance, Community Tax Certificate, Valid ID, Location Sketch/Plan, Affidavit of No Structural Changes, Zoning Clearance, Sanitary Clearance, Environment Clearance, Engineering Clearance, Fire Safety Clearance, RPT Clearance, Water Bill Clearance, Assessor's Clearance |
| `RENEWAL` | Audited/Unaudited Financial Statement, Gross Receipts Declaration, Income Tax Return, Location Sketch/Plan, Affidavit of No Structural Changes, Sanitary Clearance, Environment Clearance, Engineering Clearance, Fire Safety Clearance, RPT Clearance, Water Bill Clearance, Assessor's Clearance |
| `CLOSURE` | Closure Letter, Barangay Certification, Proof of Ceased Operation |

#### 3.2 Conditional Document Rules (NEW applications)

| Condition | Additional Document(s) |
|---|---|
| `businessType = SOLE_PROPRIETORSHIP` | DTI Certificate |
| `businessType = ONE_PERSON_CORP / PARTNERSHIP / CORPORATION` | SEC Registration |
| `businessType = COOPERATIVE` | CDA Certificate |
| `propertyOwnership = OWNED` | Tax Declaration, PIN Proof |
| `propertyOwnership = NOT_OWNED` | Lease Contract, Memorandum of Agreement, Owner Consent |

#### 3.3 Conditional Document Rules (RENEWAL applications)

| Condition | Additional Document(s) |
|---|---|
| `lineOfBusiness` contains "market", "stall", or "wet market" | Market Clearance |
| `lineOfBusiness` contains "agri" or "farm" | Agriculture Clearance |

#### 3.4 File Upload Rules

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Upload document | documentName + file | MIME: PDF/JPEG/PNG/WebP only; max 10 MB; application must be editable (DRAFT or RETURNED_FOR_CORRECTION) | `ApplicationDocument` create; file saved to `.uploads/applicant-documents/` with `{timestamp}-{UUID}{ext}` filename | Upload state |
| Replace document | documentName + file | Same as upload | Existing `ApplicationDocument` updated; old file replaced on disk | Upload state |
| Delete document | documentId | Application must be editable | `ApplicationDocument` delete; file removed from disk | Removed |
| Download document | documentId | Applicant: own application only; BPLO: application status ∈ BPLO visible statuses | `ApplicationDocument` read → file stream | File blob |

---

### 4. BPLO Review and Assessment

#### 4.1 Review Actions

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Mark under review | applicationId | Status must be `SUBMITTED` | `BusinessApplication.status = UNDER_REVIEW`; `ApplicationHistory` entry | Status updated |
| Approve for assessment | applicationId | Status must be `UNDER_REVIEW` | `BusinessApplication.status = ASSESSED`; `ApplicationHistory` entry | Status updated |
| Return for correction | applicationId + remarks | Status ∈ {`SUBMITTED`, `UNDER_REVIEW`}; remarks required | `BusinessApplication.status = RETURNED_FOR_CORRECTION`; history | Status + remarks sent to applicant |
| Reject | applicationId + remarks | Status ∈ {`SUBMITTED`, `UNDER_REVIEW`}; remarks required | `BusinessApplication.status = REJECTED`; history | Terminal rejection |

#### 4.2 Fee Computation Logic

**Inputs:** `applicationType`, `lineOfBusiness`, `assetSize`, `totalEmployees`, `isLateRenewal`, `lateMonths`

**Determination order (first match wins):**

| Priority | Condition | Fee |
|---|---|---|
| 1 | Private Port / Wharf | Fixed ₱50,000 (system setting) |
| 2 | Power Company / Hydropower | Fixed ₱10,000 (system setting) |
| 3 | Power Generation / Distribution | Fixed ₱10,000 |
| 4 | Bank – Rural/Thrift/Savings/Cooperative | ₱4,000 |
| 4 | Bank – Commercial/Development | ₱6,000 |
| 4 | Bank – Universal | ₱8,000 |
| 5 | Standard category (19 categories detected by keyword) | Higher of: fee by 7-bracket asset size OR fee by 7-bracket worker count |
| 6 | Liquor/Tobacco modifier | Wholesalers/Retailers base × 1.25 (system setting) |

**Asset size brackets:** < ₱100K → `BELOW_100K`; ₱100K–₱300K → `FROM_100K_TO_300K`; … up to > ₱20M → `OVER_20M`  
**Worker count brackets:** 0 → `NONE`; 1–4 → `FROM_1_TO_4`; 5–9; 10–19; 20–49; 50–199; 200+ → `FROM_200_OR_MORE`

**Fee override:** If an active `FeeConfigurationItem` exists for the resolved `(category, classification)` pair, it replaces the hardcoded table fee.

**Penalty components (RENEWAL only):**

| Component | Rate | Waivable Via |
|---|---|---|
| Renewal surcharge | 25% of Mayor's Permit Fee (`renewalSurchargePercent`) | `RenewalExtension.waiveSurcharge = true` |
| Monthly interest | 2% per late month × `lateMonths` (`monthlyInterestPercent`) | `RenewalExtension.waiveInterest = true` |

**Regulatory fees (flat by type):** NEW = ₱500; RENEWAL = ₱300; CLOSURE = ₱200  
**Closure certificate fee:** ₱100 flat (CLOSURE applications only)

**Total formula:**
```
totalAmount = mayorsPermitFee + regulatoryFees + additionalCharges + penalties
            + surcharge + interest + closureCertificateFee + arrears + otherCharges
```
The server always recomputes the total from components — the client-submitted total is never trusted.

#### 4.3 FeeAssessment Statuses

| Status | Description |
|---|---|
| `DRAFT` | Saved by BPLO; values can still be amended |
| `GENERATED` | TOP issued; locked; cannot revert to DRAFT |

#### 4.4 TOP Generation Flow

| Step | Process | Validation | Database Action | Output |
|---|---|---|---|---|
| 1 | BPLO opens assessment workspace | Application must be `ASSESSED` | `FeeAssessment` read (or auto-suggest computed) | Fee suggestion + current draft |
| 2 | BPLO saves draft (optional) | Application must be `ASSESSED`; BPLO role required | `FeeAssessment` upsert with status `DRAFT` | Draft saved |
| 3 | BPLO generates TOP | Application must be `ASSESSED`; fee components required | DB transaction: `FeeAssessment.status = GENERATED`; assessment number `TOP-{year}-{seq}` assigned; `BusinessApplication.status = APPROVED_FOR_PAYMENT`; `ApplicationHistory` entry | TOP number + locked fee breakdown |

**Payment frequency splits `releasePaymentAmount`:**

| Frequency | Release Amount |
|---|---|
| `ANNUAL` | 100% of `annualAssessedAmount` |
| `BI_ANNUAL` | 50% of `annualAssessedAmount` |
| `QUARTERLY` | 25% of `annualAssessedAmount` |

#### 4.5 Renewal Extension Logic

`RenewalExtension` records define a date range (`startDate`, `endDate`) with `waiveSurcharge` (default `true`) and `waiveInterest` (default `false`) flags. The system uses the **first active extension** where the current date falls within the range. If found, the corresponding fee components are set to zero before computing the total.

---

### 5. Payment Submission and Verification

#### 5.1 PaymentReference Statuses

| Status | Description |
|---|---|
| `PENDING` | Submitted by applicant; awaiting BPLO action |
| `VERIFIED` | Approved by BPLO; application transitions to `PAID` |
| `REJECTED` | Rejected by BPLO (remarks required); applicant may resubmit |

#### 5.2 FeeAssessment Payment Settlement Statuses

| Status | Condition |
|---|---|
| `UNPAID` | `amountPaid = 0` |
| `PARTIALLY_PAID` | `0 < amountPaid < annualAssessedAmount` |
| `PAID` | `remainingBalance ≤ 0` |

#### 5.3 Processes

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Submit payment reference | applicationId, transactionNumber, amountPaid, paymentDate, proofFile (multipart) | Application must be `APPROVED_FOR_PAYMENT`; no existing `PENDING` or `VERIFIED` ref; `transactionNumber` globally unique; positive amount | `PaymentReference` create; proof file saved to `.uploads/` | `PENDING` payment reference created |
| Approve payment | paymentRefId | Ref must be `PENDING`; application must be `APPROVED_FOR_PAYMENT`; `amountPaid ≥ releasePaymentAmount` | `PaymentReference.status = VERIFIED`; `FeeAssessment.amountPaid`, `remainingBalance`, `paymentStatus` updated; `BusinessApplication.status = PAID`; history | Application transitions to `PAID` |
| Reject payment | paymentRefId + remarks | Ref must be `PENDING`; remarks required | `PaymentReference.status = REJECTED`; application stays `APPROVED_FOR_PAYMENT` | Rejection with remarks; applicant may resubmit |
| Duplicate protection | transactionNumber | Unique DB index constraint | — | Duplicate blocked at DB level |

---

### 6. Permit Issuance and Release

#### 6.1 PermitIssuance Statuses

| Status | Description |
|---|---|
| `FOR_RELEASE` | Permit prepared; ready to be physically claimed |
| `RELEASED` | Permit officially released to applicant |

#### 6.2 Document Numbering

| Application Type | Document Type | Number Format |
|---|---|---|
| `NEW` / `RENEWAL` | `BUSINESS_PERMIT` | `BP-{year}-{00001}` (sequential per year) |
| `CLOSURE` | `CLOSURE_CERTIFICATE` | `CC-{year}-{00001}` (sequential per year) |

Business permit validity: **December 31 of the issuance year**. Closure certificates have no validity period.

#### 6.3 Processes

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Prepare permit | applicationId | Application must be `PAID`; at least one `VERIFIED` payment ref must exist; `amountPaid ≥ releasePaymentAmount` | `PermitIssuance` create with status `FOR_RELEASE` and sequential document number; `BusinessApplication.status = FOR_RELEASE`; history | Permit document number assigned; for-release status |
| Release permit | applicationId | Application must be `FOR_RELEASE`; `PermitIssuance` record must exist | `PermitIssuance.status = RELEASED`, `releasedAt` set; `BusinessApplication.status = RELEASED`; `upsertBusinessRecordOnRelease()` called; history | Permit / certificate released |

#### 6.3.1 Release SMS Notification (applies to NEW, RENEWAL, CLOSURE)

| Process | Trigger | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Generate Release SMS | `BusinessApplication.status` changes to `FOR_RELEASE` or `RELEASED` | applicationId | Application type must be `NEW`, `RENEWAL`, or `CLOSURE`; applicant mobile number available | Build Release Notification Details payload (reference number, business name, release status, claim/release instructions) | Release Notification Details |
| Send Release SMS to Applicant | After Generate Release SMS | Release Notification Details | SMS payload must include required fields | Persist SMS Delivery Log with delivery result (queued/sent/failed) and timestamp | Applicant receives release-stage SMS; BPLO can view SMS Delivery Log |

#### 6.4 `upsertBusinessRecordOnRelease` — Side Effects on Release

| Application Type | Business Record Action |
|---|---|
| `NEW` | Create `BusinessRecord` from `formData`; link `BusinessApplication.businessRecordId` back |
| `RENEWAL` | Update existing `BusinessRecord` fields from `formData` |
| `CLOSURE` | Set `BusinessRecord.businessStatus = CLOSED`; record `closedAt = now()`; record `closureApplicationId`; all history, documents, assessments, and permits preserved (no hard-delete) |

A `CLOSED` business record cannot be submitted for renewal or closure again.

#### 6.5 DFD Level 2 Decomposition - Permit/Certificate Release Subprocess

Subprocess decomposition under Process 6:
- 6.1 Prepare permit/certificate (`PAID` -> `FOR_RELEASE`)
- 6.2 Release permit/certificate (`FOR_RELEASE` -> `RELEASED`)
- 6.3 Generate Release SMS
- 6.4 Send Release SMS to Applicant
- 6.5 Write SMS Delivery Log

`Generate Release SMS` and `Send Release SMS to Applicant` are internal eBPLS processes and do not introduce a new external actor.

#### 6.6 DFD Level 3 Trigger Points - Status-Based SMS Events

| Trigger Event | Status Transition | Internal Process | Output to Applicant |
|---|---|---|---|
| BPLO marks application For Release | `PAID` -> `FOR_RELEASE` | Generate Release SMS -> Send Release SMS to Applicant | SMS with release status `FOR_RELEASE` and claim instructions |
| BPLO marks application Released | `FOR_RELEASE` -> `RELEASED` | Generate Release SMS -> Send Release SMS to Applicant | SMS final confirmation with release status `RELEASED` |

The trigger executes every time the application is marked `FOR_RELEASE` or `RELEASED`.

#### 6.7 DFD Level 4 Detailed Data Flow - Release SMS

| Step | Process | Data In | Data Store Interaction | Data Out |
|---|---|---|---|---|
| 1 | Detect release-stage status change | applicationId, new status (`FOR_RELEASE` or `RELEASED`) | Read `BusinessApplication`, `BusinessRecord`, `User` (applicant contact) | Release event context |
| 2 | Generate Release SMS | Release event context | Read document metadata (`PermitIssuance` document number/type); compose Release Notification Details | Release Notification Details |
| 3 | Send Release SMS to Applicant | Release Notification Details | Write SMS Delivery Log entry (applicationId, status, message body, recipient, sentAt, provider response) | SMS dispatch result |
| 4 | Expose delivery trace | SMS dispatch result | Read SMS Delivery Log for BPLO/system audit | SMS Delivery Log view |

Release Notification Details contains:
- Application reference number
- Business name
- Release status (`FOR_RELEASE` or `RELEASED`)
- Claim/release instructions

Coverage of release-stage SMS is mandatory for:
- New Business Permit release
- Renewal Business Permit release
- Closure Certificate release

---

### 7. Business Location Mapping

#### 7.1 BusinessLocation Statuses

| Status | Description |
|---|---|
| `PENDING` | Newly submitted by applicant; awaiting BPLO verification |
| `VERIFIED` | Approved by BPLO; applicant can no longer edit |
| `NEEDS_CORRECTION` | Returned by BPLO with remarks; applicant may re-edit and resubmit |

#### 7.2 Eligibility for Location Submission

An applicant can submit / update a business location only when the associated `BusinessRecord` has:
- At least one application with status ∈ {`PAID`, `FOR_RELEASE`, `RELEASED`}, **OR**
- An existing `VERIFIED` location

Location is **not** editable once `VERIFIED`.

Map visibility: only locations for applications in {`APPROVED_FOR_PAYMENT`, `PAID`, `FOR_RELEASE`, `RELEASED`} appear on the BPLO map.

Map bounds: EB Magalona municipality (center: lat 10.878586, lng 122.978876; SW 10.82,122.97 → NE 10.95,123.11).

#### 7.3 Processes

| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Submit / update location | Applicant | lat, lng, address (optional), barangay (optional) | Coordinates within municipality bounds; business record eligibility check | `BusinessLocation` upsert | `PENDING` location record |
| Verify location | BPLO | applicationId | Location must not already be `VERIFIED` | `BusinessLocation.status = VERIFIED` | Location confirmed; hidden from correction queue |
| Return for correction | BPLO | applicationId + remarks | Remarks required | `BusinessLocation.status = NEEDS_CORRECTION` | Correction remarks sent to applicant |
| Map listing / filtering | BPLO | type, status, owner, category, search | Role check | `BusinessLocation` + `BusinessApplication` join read | Filtered map rows with pin data |

---

### 8. Superadmin Configuration and Monitoring

#### 8.1 Fee Configuration

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Upsert fee item | category, classification, amount, isActive | Numeric amount; controlled category + classification values | `FeeConfigurationItem` upsert (unique on `category + classification`) | Updated fee override table |
| Toggle fee item | itemId, isActive | — | `FeeConfigurationItem.isActive` update | Item activated/deactivated |

Active `FeeConfigurationItem` overrides replace the hardcoded bracket fee during `computeMayorsPermitFee()`.

#### 8.2 System Penalty Settings

| Setting Key | Default | Description |
|---|---|---|
| `renewalSurchargePercent` | 25% | Surcharge applied to late renewals (% of Mayor's Permit Fee) |
| `monthlyInterestPercent` | 2% | Interest per late month |
| `liquorTobaccoAddOnPercent` | 25% | Add-on multiplier for Liquor/Tobacco category |
| `powerDistributionFixedFee` | ₱10,000 | Fixed Mayor's Permit Fee for power distribution businesses |
| `privatePortFixedFee` | ₱50,000 | Fixed Mayor's Permit Fee for private port/wharf |

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Update penalty settings | surchargePercent, interestPercent, liquorAddOnPercent | Non-negative values | `SystemFeeSetting` update | Updated settings |

#### 8.3 Renewal Extension Windows

| Process | Input | Validation | Database Action | Output |
|---|---|---|---|---|
| Create extension | title, startDate, endDate, isActive, waiveSurcharge, waiveInterest, remarks | Date range checks | `RenewalExtension` create | New extension window |
| Update extension | extensionId + fields | Date range checks | `RenewalExtension` update | Updated window |
| Toggle extension | extensionId, isActive | — | `RenewalExtension.isActive` update | Activated / deactivated |
| Delete extension | extensionId | — | `RenewalExtension` delete | Removed |

Only the **first active extension** whose date range contains the current date is applied during fee computation.

#### 8.4 Monitoring and Reports

| Process | Input | Database Action (read-only) | Output |
|---|---|---|---|
| Dashboard | — | Count applications by status; count released permits; total assessed amounts | Dashboard summary card data |
| Applications list | search (appNum / email) | `BusinessApplication` list read (all statuses) | Paginated application rows |
| Application detail | applicationId | Full application + documents + history + assessment read | View-only detail panel |
| Activity log | filters: actorRole, transition, date, appNum | `ApplicationHistory` read | Filtered history log |
| Reports | — | Aggregate: status distribution, type counts, total revenue, released permit count, BPLO activity count | Report tables and summaries |
| User directory | filters: search, role, status | `User` list read | User rows with summary counts |
