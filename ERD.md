# eBPLS ERD and Data Semantics

## Database
- Provider: sqlite
- ORM schema source: prisma/schema.prisma

## Core Models and Key Constraints

### User
- Primary key: id
- Unique: email
- Role enum: APPLICANT, BPLO, SUPER_ADMIN

### BusinessRecord
- Primary key: id
- Unique: registrationNumber
- Foreign key: applicantId to User.id
- Key business fields include businessType, registrationNumber, tin, ownerName, tradeName, nationality, and optional sex
- Status enum: ACTIVE, CLOSED
- Soft-close tracking fields: closedAt, closureApplicationId

### BusinessApplication
- Primary key: id
- Unique: applicationNumber
- Foreign keys: applicantId to User.id, optional businessRecordId to BusinessRecord.id
- Enums: applicationType and status
- formData JSON stores application form payload used by workflow logic

### ApplicationDocument
- Primary key: id
- Foreign key: applicationId to BusinessApplication.id
- Stores required supporting documents per resolved document rules

### ApplicationHistory
- Primary key: id
- Foreign keys: applicationId to BusinessApplication.id, optional actorId to User.id
- Captures fromStatus, toStatus, remarks, actor role, and timestamps

### FeeAssessment
- Primary key: id
- Unique: applicationId and assessmentNumber
- Foreign keys: applicationId to BusinessApplication.id, optional computedById to User.id
- Stores assessment state, fee totals, payment settlement fields, and closure fields
- Closure-specific columns include closurePaymentDues and closureCertificateFee

### PaymentReference
- Primary key: id
- Unique: transactionNumber
- Foreign keys: applicationId to BusinessApplication.id, optional reviewedById to User.id
- Status enum: PENDING, VERIFIED, REJECTED
- Stores payment reference number and uploaded proof metadata

### PermitIssuance
- Primary key: id
- Unique: applicationId and documentNumber
- Foreign keys: applicationId to BusinessApplication.id, preparedById to User.id, optional releasedById to User.id
- Document type enum supports business permit and closure certificate issuance

### BusinessLocation
- Primary key: id
- Unique: businessRecordId
- Foreign keys: businessRecordId to BusinessRecord.id, submittedById to User.id, optional verifiedById to User.id
- Status enum: PENDING, VERIFIED, NEEDS_CORRECTION

## Logic-Aligned Data Notes

### Registration Number Semantics
- registrationNumber meaning is businessType-dependent:
  - Sole Proprietorship: DTI registration number
  - Partnership: SEC registration number
  - Corporation: SEC registration number
  - Cooperative: CDA registration number

### Nationality and Sex Semantics
- nationality is normalized to Filipino for non-corporation form payloads.
- optional sex is supported in business/application data and retained through renewal edits.

### Renewal Lock Semantics
- Renewal flow locks these business info fields from source record:
  - businessName
  - businessType
  - registrationNumber
  - tin
  - ownerName
  - tradeName
  - nationality
- sex is intentionally not in renewal locked fields.

### Dynamic Document Semantics
- Required documents are resolved by applicationType plus businessType, property ownership, and market or agriculture conditions.
- Only relevant document names are presented and validated in submit checks.

### BPLO Queue Semantics
- BPLO review queue reads only SUBMITTED, UNDER_REVIEW, and RETURNED_FOR_CORRECTION statuses.
- Assessed, payment, releasing, released, and rejected stages are excluded from review queue.

### Assessment and TOP Visibility Semantics
- FeeAssessment supports draft and generated states.
- Applicant TOP view is available only after generated assessment and approved-for-payment transition.
- Draft assessment values remain BPLO-internal.

### Payment Verification Semantics
- PaymentReference requires transactionNumber and proof metadata.
- OR number uniqueness is enforced by unique transactionNumber.
- Application becomes PAID only after BPLO verification.

### Closure Assessment Semantics
- closureCertificateFee is fixed to 100 for closure flows.
- closurePaymentDues is BPLO-entered and included in closure total computation.
- Closure path is separated from New and Renewal mayor's permit fee path.

### Business Map Semantics
- BPLO business map rows are filtered to active business records and NEW or RENEWAL application scope.
- Map business category is classification-derived.
- Closure is excluded from BPLO map category and application filter logic.
- Location status remains a business location data field but is removed from BPLO map filter UI scope.

## Enums in Use
- ApplicationType: NEW, RENEWAL, CLOSURE
- ApplicationStatus: DRAFT, SUBMITTED, UNDER_REVIEW, ASSESSED, APPROVED_FOR_PAYMENT, PAID, FOR_RELEASE, RELEASED, RETURNED_FOR_CORRECTION, REJECTED
- BusinessRecordStatus: ACTIVE, CLOSED
- BusinessLocationStatus: PENDING, VERIFIED, NEEDS_CORRECTION
- FeeAssessmentStatus: DRAFT, GENERATED
- PaymentReferenceStatus: PENDING, VERIFIED, REJECTED
- PaymentSettlementStatus: UNPAID, PARTIALLY_PAID, PAID
- PermitDocumentType: BUSINESS_PERMIT, CLOSURE_CERTIFICATE
- PermitIssuanceStatus: PREPARED, FOR_RELEASE, RELEASED
