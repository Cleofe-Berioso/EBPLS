# eBPLS DFD Level 0 to Level 4

## Implementation Status
This DFD is updated to match the current implemented workflow and constraints, including registration logic, nationality normalization, renewal lock behavior, dynamic documents, BPLO queue scope, fee assessment and TOP visibility, payment verification requirements, closure assessment, and BPLO business map cleanup.

## Level 0 Context

### External Entities
- Applicant
- BPLO
- Superadmin

### Core Inputs
- Applicant: account data, application form payload, required documents, payment reference with official receipt proof, and business location coordinates.
- BPLO: review decisions, fee assessment line items, TOP generation action, payment verification action, permit issuance actions, and location verification actions.
- Superadmin: user and configuration management inputs for monitoring and system settings.

### Core Outputs
- Applicant: application status updates, generated TOP, payment verification outcomes, permit or closure release outputs, correction remarks, notifications.
- BPLO: review-stage queue, application details with documents, assessment workspace, payment verification queue, issuance queue, business map rows and markers.
- Superadmin: dashboards, reports, read-only application insights, user monitoring views.

## Level 1 Main Processes
1. Account and role access
2. Application creation and submission
3. Dynamic document resolution and upload
4. BPLO review queue and transition actions
5. Fee assessment and TOP generation
6. Payment submission and BPLO verification
7. Permit preparation and release
8. Business location and BPLO map
9. Superadmin monitoring and configuration

## Level 2 to Level 4 Decomposition

### 1. Account and Role Access
- Route and role protections remain enforced by role-based middleware.
- Applicant role scopes to own records.
- BPLO role executes workflow operations.
- Superadmin role is monitoring and configuration, not BPLO processing.

### 2. Application Submission

#### 2.1 Application Types
- NEW
- RENEWAL
- CLOSURE

#### 2.2 Registration and Nationality Logic
- Registration label and expected registration number source depend on businessType:
  - Sole Proprietorship maps to DTI registration number.
  - Partnership maps to SEC registration number.
  - Corporation maps to SEC registration number.
  - Cooperative maps to CDA registration number.
- Nationality behavior:
  - Corporation uses selectable nationality.
  - Non-corporation normalizes nationality to Filipino.

#### 2.3 Sex Field and Renewal Lock Logic
- Optional sex is included in business and application payload.
- Renewal locked fields are:
  - businessName
  - businessType
  - registrationNumber
  - tin
  - ownerName
  - tradeName
  - nationality
- sex remains editable in renewal and is not part of the locked field set.

#### 2.4 BPLO Review Queue Scope
- BPLO review queue contains only:
  - SUBMITTED
  - UNDER_REVIEW
  - RETURNED_FOR_CORRECTION
- Queue excludes:
  - ASSESSED
  - APPROVED_FOR_PAYMENT
  - PAID
  - FOR_RELEASE
  - RELEASED
  - REJECTED

### 3. Dynamic Documents

#### 3.1 NEW Requirements
- Uses base NEW requirements plus conditional rules:
  - businessType-based documents
  - property ownership documents
  - market clearance when isMarket is true
  - agriculture clearance when isAgriculture is true

#### 3.2 RENEWAL Requirements
- Uses renewal-specific base requirements plus market and agriculture conditional documents.

#### 3.3 CLOSURE Requirements
- Uses closure-specific required documents.

#### 3.4 Upload and Validation Behavior
- Only relevant resolved documents appear in UI.
- Missing required resolved documents block submission.

### 4. Fee Assessment and TOP

#### 4.1 Assessment Encoding
- BPLO prepares assessment using line items.
- Line item description and amount are required.

#### 4.2 TOP Visibility and Generation
- Draft assessment is BPLO-only.
- Applicant does not see draft assessment.
- TOP becomes available to applicant only after generated assessment and approved-for-payment transition.

### 5. Payment Submission and Verification

#### 5.1 Applicant Payment Input
- Applicant provides OR Number or Official Receipt Number and official receipt or payment proof upload.
- Required payment fields are validated server-side before creating payment reference.

#### 5.2 BPLO Verification
- BPLO verifies or rejects pending payment reference.
- Application transitions to PAID only after BPLO verification approval.

### 6. Permit and Closure Release
- Payment-verified applications proceed to permit preparation and release.
- Closure release performs soft-close updates on business record lifecycle fields.

### 7. Closure Assessment
- Closure certificate fee is fixed at 100.
- BPLO manually enters closure payment dues or pending fee.
- Closure total includes fixed fee plus pending dues.
- Closure assessment path does not use New or Renewal mayor's permit fee logic.

### 8. Business Location and BPLO Business Map

#### 8.1 Location Lifecycle
- Location statuses remain:
  - PENDING
  - VERIFIED
  - NEEDS_CORRECTION

#### 8.2 BPLO Map Cleanup Behavior
- BPLO map Business Application filter scope is NEW and RENEWAL only.
- Business Category is classification-derived.
- Closure is removed from map category and application filter logic.
- Location Status is removed from BPLO map filters and related BPLO map UI controls.
- Marker rendering remains active with cleaned filters.

## Data Stores Referenced
- User
- BusinessRecord
- BusinessApplication
- ApplicationDocument
- ApplicationHistory
- FeeAssessment
- PaymentReference
- PermitIssuance
- BusinessLocation
- FeeConfigurationItem
- SystemFeeSetting
- RenewalExtension
