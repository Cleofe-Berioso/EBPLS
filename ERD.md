# eBPLS ERD (Aligned to prisma/schema.prisma)

## Database
- Provider: `sqlite`
- ORM schema source: `prisma/schema.prisma`

## Models, Keys, and Constraints

### Core Identity
- `User`
  - PK: `id`
  - Unique: `email`
  - Enums: `role` (`Role`)

### Business Domain
- `BusinessRecord`
  - PK: `id`
  - Unique: `registrationNumber`
  - FK: `applicantId -> User.id` (`onDelete: Cascade`)
  - Enum: `businessStatus` (`BusinessRecordStatus`)
  - Soft-close fields: `closedAt`, `closureApplicationId`
  - Index: `[applicantId]`

- `BusinessLocation`
  - PK: `id`
  - Unique: `businessRecordId`
  - FK: `businessRecordId -> BusinessRecord.id` (`onDelete: Cascade`)
  - FK: `submittedById -> User.id` (`onDelete: Restrict`)
  - FK: `verifiedById -> User.id` (`onDelete: SetNull`)
  - Enum: `status` (`BusinessLocationStatus`)
  - Indexes: `[status]`, `[submittedById]`, `[verifiedById]`

- `BusinessApplication`
  - PK: `id`
  - Unique: `applicationNumber`
  - FK: `applicantId -> User.id` (`onDelete: Cascade`)
  - FK: `businessRecordId -> BusinessRecord.id` (`onDelete: SetNull`, optional)
  - Enums: `applicationType` (`ApplicationType`), `status` (`ApplicationStatus`)
  - JSON: `formData`
  - Indexes: `[applicantId, createdAt]`, `[applicantId, status]`

### Documents and History
- `ApplicationDocument`
  - PK: `id`
  - FK: `applicationId -> BusinessApplication.id` (`onDelete: Cascade`)
  - Index: `[applicationId]`

- `ApplicationHistory`
  - PK: `id`
  - FK: `applicationId -> BusinessApplication.id` (`onDelete: Cascade`)
  - FK: `actorId -> User.id` (`onDelete: SetNull`, optional)
  - Enums: `actorRole` (`Role`), `fromStatus`/`toStatus` (`ApplicationStatus`)
  - Index: `[applicationId, createdAt]`

### Assessment, Payment, and Permit
- `FeeAssessment`
  - PK: `id`
  - Unique: `applicationId`, `assessmentNumber`
  - FK: `applicationId -> BusinessApplication.id` (`onDelete: Cascade`)
  - FK: `computedById -> User.id` (`onDelete: SetNull`, optional)
  - Enums: `status` (`FeeAssessmentStatus`), `paymentFrequency` (`PaymentFrequency`), `paymentStatus` (`PaymentSettlementStatus`)
  - Monetary fields use `Decimal`
  - Index: `[applicationId]`

- `PaymentReference`
  - PK: `id`
  - Unique: `transactionNumber`
  - FK: `applicationId -> BusinessApplication.id` (`onDelete: Cascade`)
  - FK: `reviewedById -> User.id` (`onDelete: SetNull`, optional)
  - Enum: `status` (`PaymentReferenceStatus`)
  - Indexes: `[applicationId, submittedAt]`, `[status, submittedAt]`

- `PermitIssuance`
  - PK: `id`
  - Unique: `applicationId`, `documentNumber`
  - FK: `applicationId -> BusinessApplication.id` (`onDelete: Cascade`)
  - FK: `preparedById -> User.id` (`onDelete: Restrict`)
  - FK: `releasedById -> User.id` (`onDelete: SetNull`, optional)
  - Enums: `documentType` (`PermitDocumentType`), `status` (`PermitIssuanceStatus`)
  - Indexes: `[status]`, `[applicationId, status]`

### Configuration
- `FeeConfigurationItem`
  - PK: `id`
  - Unique composite: `[category, classification]`
  - FK: `updatedById -> User.id` (`onDelete: SetNull`, optional)
  - Index: `[category, isActive]`

- `SystemFeeSetting`
  - PK: `id`
  - FK: `updatedById -> User.id` (`onDelete: SetNull`, optional)

- `RenewalExtension`
  - PK: `id`
  - FK: `updatedById -> User.id` (`onDelete: SetNull`, optional)
  - Index: `[isActive, startDate, endDate]`

## Enums
- `Role`: `APPLICANT`, `BPLO`, `SUPER_ADMIN`
- `ApplicationType`: `NEW`, `RENEWAL`, `CLOSURE`
- `ApplicationStatus`: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `ASSESSED`, `APPROVED_FOR_PAYMENT`, `PAID`, `FOR_RELEASE`, `RELEASED`, `RETURNED_FOR_CORRECTION`, `REJECTED`
- `BusinessRecordStatus`: `ACTIVE`, `CLOSED`
- `BusinessLocationStatus`: `PENDING`, `VERIFIED`, `NEEDS_CORRECTION`
- `FeeAssessmentStatus`: `DRAFT`, `GENERATED`
- `PaymentFrequency`: `ANNUAL`, `BI_ANNUAL`, `QUARTERLY`
- `PaymentReferenceStatus`: `PENDING`, `VERIFIED`, `REJECTED`
- `PaymentSettlementStatus`: `UNPAID`, `PARTIALLY_PAID`, `PAID`
- `PermitDocumentType`: `BUSINESS_PERMIT`, `CLOSURE_CERTIFICATE`
- `PermitIssuanceStatus`: `PREPARED`, `FOR_RELEASE`, `RELEASED`

## Important Database Semantics

### Soft Closure (Business Lifecycle)
Closure is a status change on `BusinessRecord`, not a delete.

When a closure application is released:
1. `BusinessRecord.businessStatus` -> `CLOSED`
2. `BusinessRecord.closedAt` -> release timestamp
3. `BusinessRecord.closureApplicationId` -> releasing closure application id

This preserves historical data for audit/reporting.

### Monetary Storage
- `FeeAssessment` monetary columns are `Decimal`
- `PaymentReference.amountPaid` is `Decimal`
- `SystemFeeSetting.powerDistributionFixedFee` and `privatePortFixedFee` are `Decimal`

## Mermaid ERD
```mermaid
erDiagram
  User ||--o{ BusinessApplication : applicant
  User ||--o{ BusinessRecord : owns
  User ||--o{ BusinessLocation : submittedBy
  User ||--o{ BusinessLocation : verifiedBy
  User ||--o{ ApplicationHistory : actor
  User ||--o{ FeeAssessment : computedBy
  User ||--o{ PaymentReference : reviewedBy
  User ||--o{ PermitIssuance : preparedBy
  User ||--o{ PermitIssuance : releasedBy
  User ||--o{ FeeConfigurationItem : updatedBy
  User ||--o{ SystemFeeSetting : updatedBy
  User ||--o{ RenewalExtension : updatedBy

  BusinessRecord ||--o{ BusinessApplication : referencedBy
  BusinessRecord ||--o| BusinessLocation : hasOne

  BusinessApplication ||--o{ ApplicationDocument : has
  BusinessApplication ||--o{ ApplicationHistory : has
  BusinessApplication ||--o{ PaymentReference : has
  BusinessApplication ||--o| FeeAssessment : hasOne
  BusinessApplication ||--o| PermitIssuance : hasOne

  User {
    string id PK
    string email UK
    string role
    boolean isActive
  }

  BusinessRecord {
    string id PK
    string applicantId FK
    string registrationNumber UK
    string businessName
    string businessStatus
    datetime closedAt
    string closureApplicationId
  }

  BusinessLocation {
    string id PK
    string businessRecordId FK_UK
    float latitude
    float longitude
    string status
    string submittedById FK
    string verifiedById FK
  }

  BusinessApplication {
    string id PK
    string applicationNumber UK
    string applicantId FK
    string businessRecordId FK
    string applicationType
    string status
    json formData
  }

  ApplicationDocument {
    string id PK
    string applicationId FK
    string documentName
    string storagePath
    string mimeType
    int sizeBytes
  }

  ApplicationHistory {
    string id PK
    string applicationId FK
    string actorId FK
    string actorRole
    string fromStatus
    string toStatus
    string remarks
  }

  FeeAssessment {
    string id PK
    string applicationId FK_UK
    string assessmentNumber UK
    string status
    string paymentFrequency
    decimal annualAssessedAmount
    decimal releasePaymentAmount
    decimal amountPaid
    decimal remainingBalance
    string paymentStatus
    decimal totalAmount
  }

  PaymentReference {
    string id PK
    string applicationId FK
    string transactionNumber UK
    decimal amountPaid
    datetime paymentDate
    string proofStoragePath
    string status
  }

  PermitIssuance {
    string id PK
    string applicationId FK_UK
    string documentNumber UK
    string documentType
    string status
    string preparedById FK
    string releasedById FK
  }

  FeeConfigurationItem {
    string id PK
    string category
    string classification
    decimal amount
    boolean isActive
    string updatedById FK
  }

  SystemFeeSetting {
    string id PK
    float renewalSurchargePercent
    float monthlyInterestPercent
    float liquorTobaccoAddOnPercent
    decimal powerDistributionFixedFee
    decimal privatePortFixedFee
    string updatedById FK
  }

  RenewalExtension {
    string id PK
    string title
    datetime startDate
    datetime endDate
    boolean isActive
    boolean waiveSurcharge
    boolean waiveInterest
    string updatedById FK
  }
```
