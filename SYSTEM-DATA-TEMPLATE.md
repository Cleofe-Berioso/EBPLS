# Reference Data Template
## System User Roles and Sidebar Modules

Version 1.0 | Online Business Permit System (OBPS)

---

## User Roles Overview

This system operates with exactly **3 user roles** only:
1. **Applicant** - Business owners applying for permits
2. **BPLO Office** - Municipal Business Permit Licensing Office staff
3. **MTO** - Municipal Treasurer's Office staff

---

# Role Definitions

## 1. Applicant

**Purpose**
Submit business permit applications, track application progress, make payments, and access renewal portal (if eligible).

**Sidebar Modules**
```
- Dashboard
- My Applications
- My Documents
- Track Status
- Payments
- My Permit
- Profile
```

**Main Functions**
- View personal dashboard with application overview
- Submit and track own applications
- Upload and manage required documents
- Track application status in real-time
- Make payments for permits
- View issued permits
- Manage account profile and settings
- Access payment history
- Access renewal portal (after BPLO eligibility marking)

**Access Limitations**
- Cannot access other applicants' records
- Cannot view New Application, Renew Permit, or Closure Application from sidebar
- Cannot see BPLO internal notes or processing comments
- Cannot view MTO processing details beyond receipt
- Cannot manually mark self as renewal-eligible
- Cannot initiate renewal without BPLO eligibility marking
- Cannot issue or approve permits
- Cannot process payments or validate receipts
- Read-only access to own applications and documents only

---

## 2. BPLO Office

**Purpose**
Process all business permit applications (new and renewal), verify documents, review applications, approve/revise submissions, issue permits, manage business location data, and generate operational reports.

**Sidebar Modules**
```
- Dashboard
- Applications
- Document Verification
- Review Queue
- Approved Applications
- Permit Issuance
- Business Locations
- Reports
- Activity Logs
- Profile
```

**Main Functions**
- Process incoming applications (new and renewal)
- Verify completeness and authenticity of submitted documents
- Review applications against permit requirements
- Request document revisions or additional information
- Approve applications after verification
- Mark applicants as renewal-eligible
- Issue business permits (only after MTO payment confirmation)
- Manage business location master data
- Generate statistical and operational reports
- View system activity audit logs
- Manage applicant eligibility status for renewal
- Track application workflow and approval status

**Access Limitations**
- Cannot process or validate payments (MTO function only)
- Cannot issue permits without complete document verification
- Cannot issue permits without MTO payment confirmation
- Cannot access applicant personal data unrelated to permit
- Cannot view MTO payment validation details
- Cannot modify payment records
- Cannot manually process payments
- Cannot issue receipts
- Read-only access to payment status reference only

---

## 3. MTO (Municipal Treasurer's Office)

**Purpose**
Validate all permit-related payments, confirm payment status, manage payment records, generate payment reports, and provide payment confirmation to BPLO for permit issuance.

**Sidebar Modules**
```
- Dashboard
- Payment Queue
- Payment Validation
- Receipts
- Paid Applications
- Payment Reports
- Profile
```

**Main Functions**
- View payment queue for pending applications
- Validate received payments against application requirements
- Mark payments as confirmed in the system
- Generate and issue payment receipts
- View all applications with confirmed payments
- Generate payment reconciliation reports
- Generate revenue reports
- Send payment confirmation status to BPLO
- Manage payment records
- View account profile and settings

**Access Limitations**
- Cannot view application details beyond ID and applicant name
- Cannot access submitted documents
- Cannot view BPLO processing notes or approval status
- Cannot approve or reject applications
- Cannot issue permits
- Cannot verify documents
- Cannot access applicant personal data beyond payment reference
- Cannot modify payment records (validate only)
- Cannot process non-payment functions
- Cannot view detailed application content

---

# Separate Functions for New and Renewal

## A. New Application Functions

**Process Flow**
1. Applicant submits new business permit application
2. Application receives unique reference number
3. Applicant uploads all required documents
4. BPLO receives application in queue
5. BPLO performs document verification
6. BPLO conducts application review
7. BPLO either approves or requests revision
8. Upon approval, applicant receives payment notice
9. Applicant submits payment to MTO
10. MTO validates and confirms payment
11. BPLO receives payment confirmation from MTO
12. BPLO issues permit to applicant
13. Applicant receives permit and can now operate business

**Functions Included**
- Applicant: Submit new application, upload documents, make payment, track status, retrieve permit
- BPLO: Receive application, verify documents, review application, approve/revise, view payment status, issue permit
- MTO: Receive payment, validate payment, confirm payment status

**Database Model**: Use `Application` model with `type: 'NEW'` field
**Sidebar Availability**: Not in Applicant sidebar; accessed via separate entry point or dedicated new application page

---

## B. Renewal Functions

**Portal Access**
Renewal functionality is implemented as a **COMPLETELY SEPARATE PORTAL** or **CONTROLLED INTERFACE**.
- NOT displayed in standard Applicant sidebar
- NOT accessible from main navigation
- Requires explicit backend eligibility check on every access

**Renewal Eligibility Requirements**
- Applicant must have at least one previously issued permit
- BPLO must explicitly mark applicant as renewal-eligible
- Eligibility status stored in database and verified server-side
- Applicant cannot manually enable or request eligibility
- Eligibility marking can only be done by BPLO administrative action
- New applicants (no prior permits) MUST NOT see renewal portal

**Renewal Process Flow**
1. BPLO marks applicant as renewal-eligible (after previous permit issuance)
2. Applicant receives notification of renewal eligibility
3. Applicant accesses renewal portal via separate dedicated interface only
4. Applicant submits renewal application (may require fewer documents than new)
5. BPLO receives renewal application in separate renewal queue
6. BPLO performs document verification for renewal
7. BPLO conducts renewal application review
8. BPLO either approves or requests revision
9. Upon approval, applicant receives renewal payment notice
10. Applicant submits renewal payment to MTO
11. MTO validates and confirms renewal payment
12. BPLO receives payment confirmation from MTO
13. BPLO issues renewed permit to applicant
14. Applicant receives renewed permit

**Functions Included**
- Applicant: Access renewal portal (if eligible), submit renewal application, upload documents, make renewal payment, track renewal status, retrieve renewed permit
- BPLO: Mark applicants as renewal-eligible, receive renewal application, verify renewal documents, review renewal application, approve/revise renewal, view renewal payment status, issue renewed permit
- MTO: Receive renewal payment, validate renewal payment, confirm renewal payment status

**Database Model**: Use `Application` model with `type: 'RENEWAL'` field OR separate `RenewalApplication` model (architect's choice)

**Critical Visibility Rules**
- Renewal portal link MUST NOT appear in Applicant sidebar
- Renewal portal MUST NOT be accessible from standard navigation
- Backend MUST verify eligibility on every renewal portal access attempt
- New applicants attempting direct URL access to renewal portal must receive error: "You are not eligible for renewal at this time"
- Renewal functions MUST be completely hidden from new applicants
- Only applicants with BPLO eligibility flag can see renewal interface

---

# Functional Reference Per User

## Applicant Functional Scope

| Function | Access Level | Notes |
|----------|--------------|-------|
| Dashboard | Read | Overview of applications and payment status |
| Submit New Application | Available via separate entry point | NOT in sidebar |
| View All My Applications | Read | All own applications (new and renewal) |
| Track Application Status | Read | Real-time status updates |
| Upload Documents | Write | For own applications only |
| View My Documents | Read | Own documents only |
| View Document Status | Read | Verification status from BPLO |
| Make Payment | Write | Submit payment request to MTO |
| View My Permits | Read | All issued permits for own applications |
| Access Renewal Portal | Conditional | Only if BPLO marked as eligible |
| Submit Renewal Application | Conditional | Only through renewal portal if eligible |
| Track Renewal Status | Conditional | Only if renewal initiated |
| View Payment History | Read | Own payments only |
| View Payment Receipt | Read | Own receipts only |
| Manage Profile | Write | Own profile and settings |
| Download Permit | Read | Access issued permits |
| Request Support | Write | Submit inquiries only |

---

## BPLO Office Functional Scope

| Function | Access Level | Notes |
|----------|--------------|-------|
| Dashboard | Read | Queue status, statistics, pending applications |
| View All Applications | Read | Both new and renewal applications |
| Receive New Applications | Read | Applications in new application queue |
| Receive Renewal Applications | Read | Applications in renewal queue (separate) |
| Document Verification | Write | Approve or reject document submissions |
| Request Document Revision | Write | Request additional/corrected documents |
| Review Application | Write | Assessment and internal notes |
| Approve Application | Write | Mark as approved and ready for payment |
| Mark For Revision | Write | Send back to applicant with required changes |
| View Payment Status | Read | Reference only; cannot modify |
| Confirm Ready to Issue | Write | Trigger permit issuance after payment confirmation |
| Issue Permit | Write | Generate and deliver permit (after MTO confirmation) |
| Mark as Renewal-Eligible | Write | Grant renewal eligibility to applicant |
| View Renewal Eligibility Status | Read | Current eligibility status of all applicants |
| Manage Business Locations | Write | Add, edit, delete location master data |
| Generate Reports | Read | Operational, statistical, and workflow reports |
| View Activity Logs | Read | All system activities and audit trail |
| Manage Applications | Write | All application workflow functions |
| Manage Profile | Write | Own profile and settings |
| Export Application Data | Read | Generate application reports |

---

## MTO Functional Scope

| Function | Access Level | Notes |
|----------|--------------|-------|
| Dashboard | Read | Payment overview, pending queue |
| View Payment Queue | Read | Applications awaiting payment |
| View Application Reference | Read | Application ID and applicant name only |
| Validate Payment Received | Write | Mark payment as received and validated |
| Confirm Payment | Write | Send confirmation status to BPLO |
| Generate Receipt | Write | Create and issue payment receipt |
| View Paid Applications | Read | Applications with confirmed payments |
| Reprint Receipt | Write | Issue duplicate receipt |
| View Payment Amount | Read | Payment amount for each application |
| Generate Payment Reports | Read | Revenue and reconciliation reports |
| View Payment Reconciliation | Read | Payment record verification and matching |
| Manage Profile | Write | Own profile and settings |
| View Payment History | Read | All payments processed by MTO |
| Payment Status Confirmation | Write | Critical: Notify BPLO of payment confirmation |

---

# Access Control Rules

## Applicant Access Rules
- Access only own records (applications, documents, payments, permits)
- Cannot view any other applicant's information
- Cannot view BPLO internal processing notes or comments
- Cannot view detailed payment records beyond own receipts
- Cannot see business location data (BPLO-only)
- Cannot see reports
- Cannot see activity logs
- Cannot manually mark self as eligible for renewal
- Cannot access renewal portal without BPLO eligibility flag
- Cannot access new application interface from sidebar (separate entry)
- Cannot perform any administrative functions
- Can only perform functions listed in Applicant Functional Scope table

## BPLO Office Access Rules
- Read access to all applications submitted by any applicant
- Write access to application workflow (review, approve, revise)
- Full access to document verification functions
- Full access to applicant eligibility management
- Full access to business location master data
- Full access to reporting functions
- Read-only access to payment queue status (cannot modify)
- Can issue permits only after two conditions are simultaneously true:
  1. All documents verified and application approved
  2. Payment confirmed by MTO
- Cannot validate or modify payments (MTO function only)
- Cannot issue receipts
- Cannot access applicant personal data unrelated to permit
- Cannot view MTO internal processing details
- Can mark applicants as renewal-eligible
- Cannot force applicants to renew
- Can only perform functions listed in BPLO Office Functional Scope table

## MTO Access Rules
- Read-only access to application ID and applicant name
- Read/Write access to payment validation and confirmation
- Read/Write access to payment records related to permits
- Cannot view application content or details
- Cannot view submitted documents
- Cannot view BPLO processing notes or approval status
- Cannot access applicant personal data (address, phone, etc.)
- Cannot modify application records
- Cannot approve or reject applications
- Cannot verify documents
- Cannot issue permits
- Payment confirmation ONLY - no other approvals
- Cannot access reports (except payment/revenue reports)
- Cannot view activity logs (except own payment actions)
- Must send payment confirmation to BPLO after validation
- Can only perform functions listed in MTO Functional Scope table

---

# Suggested Sidebar Mapping Summary

## Applicant Sidebar

```
├── Dashboard
├── My Applications
├── My Documents
├── Track Status
├── Payments
├── My Permit
└── Profile
```

**EXCLUDED FROM SIDEBAR**:
- ❌ New Application
- ❌ Renew Permit
- ❌ Closure Application

**New Application Entry**: Separate dedicated page or prominent button outside sidebar navigation
**Renewal Access**: Completely separate controlled interface (NOT in sidebar)

---

## BPLO Office Sidebar

```
├── Dashboard
├── Applications
├── Document Verification
├── Review Queue
├── Approved Applications
├── Permit Issuance
├── Business Locations
├── Reports
├── Activity Logs
└── Profile
```

---

## MTO Sidebar

```
├── Dashboard
├── Payment Queue
├── Payment Validation
├── Receipts
├── Paid Applications
├── Payment Reports
└── Profile
```

---

# Notes for System Implementation

## Frontend Implementation
1. **Remove from Applicant Sidebar**
   - Delete sidebar entries for "New Application", "Renew Permit", "Closure Application"
   - Remove navigation links to these features from standard sidebar component

2. **New Application Entry Point**
   - Create separate dedicated page route: `/apply` or `/new-application`
   - Display prominent button on homepage/dashboard: "Apply for New Permit"
   - Do NOT include in sidebar navigation
   - New applicants must explicitly navigate to this entry point

3. **Renewal Portal Isolation**
   - Create completely separate URL: `/renew` or `/renewal-portal`
   - Do NOT link from standard sidebar
   - Implement client-side eligibility check: redirect to eligibility message if not eligible
   - Display message: "You are not currently eligible for renewal"

4. **Role-Based Sidebar Generation**
   - Implement CASL.js permission checks for sidebar visibility
   - Generate sidebar items based on user role
   - Use conditional rendering to show/hide modules
   - No hardcoding of roles in components

5. **Navigation Guard**
   - Prevent direct URL access to features user cannot access
   - Redirect to dashboard with error message for unauthorized access

---

## Backend Implementation
1. **Access Control Middleware**
   - All API routes must verify user role before returning data
   - Implement CASL.js in middleware to check subject permissions
   - Return 401 Unauthorized for role mismatches
   - Do NOT rely on frontend access control

2. **Renewal Eligibility Gate**
   - Add `renewalEligible: boolean` field to User model in Prisma
   - On every `/renew` route access, verify server-side: `user.renewalEligible === true`
   - Return 403 Forbidden if applicant not eligible
   - Log eligibility check attempts in Activity Logs

3. **Applicant Type Validation**
   - When applicant accesses renewal, verify they have at least one `Application` with `status: 'ISSUED'`
   - If no issued permits exist, deny renewal portal access
   - Display error message: "You must have an issued permit before renewal"

4. **New vs Renewal Separation**
   - Field in Application model: `type: enum('NEW' | 'RENEWAL')`
   - OR create separate `RenewalApplication` model (architect decision)
   - Use type to route to different processing queues
   - BPLO receives separate review queues for new vs renewal

5. **Permit Issuance Gate**
   - Before issuing permit, verify two conditions:
     ```
     if (!application.documentVerified) return error("Documents not verified");
     if (!application.paymentConfirmed) return error("Payment not confirmed");
     if (!application.applicationApproved) return error("Application not approved");
     // Only then: issue permit
     ```
   - All three conditions must be true simultaneously
   - Log each permit issuance with timestamp and approver info

6. **Payment Confirmation Flow**
   - MTO sends confirmation via API: `POST /api/payments/[id]/confirm`
   - This sets `application.paymentConfirmed = true`
   - BPLO API checks `paymentConfirmed` flag before enabling permit issuance button
   - Cannot issue permit without this flag set by MTO

7. **Data Isolation**
   - Applicant API queries: `WHERE userId = currentUser.id`
   - BPLO API queries: All applications (no filter by user)
   - MTO API queries: `SELECT applicationId, amount, status FROM payments WHERE ...` (minimal fields)
   - Each role's API responses filtered to return only relevant fields

8. **Eligibility Marking**
   - BPLO-only endpoint: `POST /api/applicants/[userId]/mark-renewal-eligible`
   - Requires BPLO role verification
   - Trigger automatically after first permit issuance (optional automation)
   - Log all eligibility changes in Activity Logs with timestamp and BPLO staff name

---

## Database Implementation
1. **New Fields**
   - Add to User model: `renewalEligible: Boolean @default(false)`
   - Add to Application model: `type: ApplicationType` (NEW | RENEWAL)
   - Add to Application model: `documentVerified: Boolean @default(false)`
   - Add to Application model: `paymentConfirmed: Boolean @default(false)`
   - Add to Application model: `applicationApproved: Boolean @default(false)`

2. **New Models** (if architecturally deciding for separate renewal)
   - Create `RenewalApplication` model with same fields as Application
   - Establish one-to-many relationship from User to RenewalApplication
   - Separate table for renewal history and records

3. **Indexes**
   - Index on User.renewalEligible for eligibility queries
   - Index on Application.type for queue filtering
   - Index on Application.status for workflow queues

4. **Constraints**
   - `Application.type` not nullable
   - `Application.createdBy` (userId) not nullable
   - Enforce referential integrity between Application and User

---

## Permission Configuration
Configure CASL.js abilities.ts with these exact rules:

**Applicant Abilities**
```
can('read', 'Application', { userId });
can('create', 'Application', { type: 'NEW' });
can('read', 'RenewalApplication', { userId }, { conditions: { renewalEligible: true } });
can('create', 'RenewalApplication', { renewalEligible: true });
can('read', 'Document', { applicationId.userId });
can('upload', 'Document', { applicationId.userId });
can('read', 'Permit', { userId });
can('read', 'Payment', { userId });
```

**BPLO Abilities**
```
can('read', 'Application');
can('read', 'RenewalApplication');
can('update', 'Application', 'documentVerified');
can('update', 'Application', 'applicationApproved');
can('update', 'Application', 'status');
can('update', 'User', 'renewalEligible');
can('create', 'Permit');
cannot('update', 'Payment');
```

**MTO Abilities**
```
can('read', 'Payment');
can('update', 'Payment', 'status');
can('update', 'Application', 'paymentConfirmed');
can('create', 'Receipt');
cannot('read', 'Document');
cannot('update', 'Application', 'status');
```

---

## Testing Requirements
1. Test that new applicants cannot access renewal portal
2. Test that BPLO can mark applicants as renewal-eligible
3. Test that marked applicants CAN access renewal portal
4. Test that renewal portal is hidden from sidebar
5. Test that permit cannot be issued without all three conditions (verified, approved, paymentConfirmed)
6. Test that role-based sidebar shows correct items for each role
7. Test that each role can only perform functions in their Functional Scope table

---

## Rollout Strategy
1. Update database schema with new fields
2. Update CASL.js permissions configuration
3. Remove sidebar items from Applicant component
4. Create new application entry point
5. Create renewal portal as separate interface
6. Implement eligibility check middleware
7. Add permit issuance gate conditions
8. Test all role-based access patterns
9. Deploy to staging
10. Verify all three roles in testing environment
11. Deploy to production

---

**Last Updated**: 2026-04-18
**Status**: System Template - Implementation Ready
