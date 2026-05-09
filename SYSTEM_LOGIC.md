# eBPLS System Logic

## Implementation Status
This document reflects completed implementation updates, including registration and nationality handling, renewal field locks, dynamic documents, BPLO queue scoping, assessment and TOP visibility, payment verification rules, closure assessment rules, and business map cleanup.

## 1. User Roles and Permissions
- Applicant: submit applications, required documents, business location, and payment proof; view own TOP and status history.
- BPLO: review queue actions, assess fees, generate TOP, verify payments, prepare and release permits, review map locations.
- Superadmin: monitoring and configuration only; no BPLO workflow execution actions.

## 2. Application Types
- NEW
- RENEWAL
- CLOSURE

## 3. Registration Number Logic by Business Type
- Sole Proprietorship uses DTI Registration Number.
- Partnership uses SEC Registration Number.
- Corporation uses SEC Registration Number.
- Cooperative uses CDA Registration Number.

## 4. Nationality Logic
- Corporation keeps nationality selectable.
- Non-corporation business types are normalized to Filipino.

## 5. Sex Field Logic
- Business and application data includes optional sex.
- In renewal, sex remains editable and is not part of locked renewal fields.

## 6. Renewal Locked Fields
For renewal applications, these fields are locked from prior business record data:
- businessName
- businessType
- registrationNumber
- tin
- ownerName
- tradeName
- nationality

## 7. Dynamic Document Rules
- Required documents are resolved dynamically by application type and business context.
- NEW uses base requirements plus business type rules, ownership rules, and market or agriculture conditional requirements.
- RENEWAL uses renewal-specific requirements plus market or agriculture conditional requirements.
- CLOSURE uses closure-required documents.
- Applicant forms render only relevant document upload slots from the resolved set.

## 8. BPLO Application Queue Rules
- BPLO queue includes review-stage statuses only:
  - SUBMITTED
  - UNDER_REVIEW
  - RETURNED_FOR_CORRECTION
- Queue excludes non-review stages such as ASSESSED, APPROVED_FOR_PAYMENT, PAID, FOR_RELEASE, RELEASED, and REJECTED.

## 9. Assessment and TOP Rules
- BPLO assessment supports itemized fee line items.
- Each line item requires fee description and amount.
- Draft assessment remains internal to BPLO and is not visible to applicant.
- TOP is visible to applicant only after assessment is generated and application moves to APPROVED_FOR_PAYMENT.

## 10. Payment Verification Rules
- Applicant payment submission requires:
  - OR Number or Official Receipt Number
  - Official Receipt or Payment Proof upload
- Required payment fields are validated server-side.
- Payment is BPLO-verified.
- Application status changes to PAID only after BPLO approves the payment reference.

## 11. Closure Assessment Rules
- Closure Certificate Fee is fixed at 100.
- BPLO manually encodes Payment Dues or Pending Fee for closure.
- Closure TOP reflects fixed closure certificate fee plus pending dues and total amount.
- Closure assessment path bypasses New or Renewal mayor's permit fee computation logic.

## 12. Business Location and Business Map Rules
- Applicant business location submission remains tied to eligible released business records.
- BPLO map shows active map records only.
- BPLO map application filter scope is NEW and RENEWAL.
- Business category on map is derived from business classification.
- Closure is removed from BPLO map category and application filter logic.
- Location Status was removed from BPLO map filter UI.
- Marker rendering remains active after cleanup.

## 13. Payment and Permit Lifecycle
Main lifecycle:
- DRAFT
- SUBMITTED
- UNDER_REVIEW
- ASSESSED
- APPROVED_FOR_PAYMENT
- PAID
- FOR_RELEASE
- RELEASED

Alternative states:
- RETURNED_FOR_CORRECTION
- REJECTED
- Payment reference REJECTED
- Location NEEDS_CORRECTION
- Location VERIFIED

## 14. Closure Soft-Close Rules
- Closure is a soft-close update and does not delete business records.
- On released closure applications:
  - BusinessRecord.businessStatus becomes CLOSED.
  - BusinessRecord.closedAt is set.
  - BusinessRecord.closureApplicationId is set.
- Closed businesses are excluded from active applicant selectors and active BPLO map views.
- Historical records remain available for audit and reporting.
