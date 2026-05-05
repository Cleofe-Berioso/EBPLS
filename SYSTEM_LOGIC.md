# eBPLS System Logic

## 1. User Roles and Permissions
- Applicant: submit applications/documents/location/payment proof; view own TOP/status/history only.
- BPLO: review/return/reject, assess fees, generate TOP, verify payments, prepare/release permits, verify locations, view business map/reports.
- Superadmin: dashboard/reports/activities, users, settings (fees/penalties/extensions), applications read-only.

## 2. Application Types
- NEW
- RENEWAL
- CLOSURE

## 3. Applicant Eligibility Rules
- NEW: no prior business record required.
- RENEWAL/CLOSURE: must reference applicant-owned business record and pass eligibility checks.

## 4. Dynamic Document Upload Rules
- Required document list is resolved from `required-documents.ts`.
- Requirements are application-type aware and conditionally augmented by form context.
- Applicant forms render upload slots from resolved required docs.
- Applicant can upload/replace/delete while application is editable.
- BPLO can download uploaded application documents during review.

## 5. BPLO Review Rules
- Valid flow: Submitted -> Under Review -> Assessed.
- BPLO can return for correction or reject from review states.
- Status transitions are server validated.

## 6. Return/Reject Rules
- Return and reject require BPLO remarks.
- Returned applications are editable by applicant and can be resubmitted.

## 7. Fee Computation Rules
- Backend computes annual assessed fee from category, asset bracket, worker bracket, and configured fee tables.
- Higher-fee classification between asset-based and worker-based paths is selected.
- Fixed categories and configured overrides are supported.

## 8. Size Classification Rules
- Asset and worker counts are bucketed to explicit fee tiers.
- If resulting tiers differ, the higher corresponding fee wins.

## 9. Payment Frequency Rules
- Annual assessed amount is always stored as full annual value.
- Release payment amount:
  - ANNUAL: annualAssessedAmount
  - BI_ANNUAL: annualAssessedAmount / 2
  - QUARTERLY: annualAssessedAmount / 4

## 10. Required Release Payment Rules
- Payment verification approval requires submitted amount >= releasePaymentAmount.
- Approval updates fee tracking (`amountPaid`, `remainingBalance`, `paymentStatus`) and application to Paid.
- Permit preparation requires verified payment and required release payment completed.

## 11. Payment Proof Upload Rules
- Applicant payment submission requires:
  - OR/reference number
  - amount paid
  - payment date
  - payment proof file
- Proof is persisted and downloadable by BPLO.

## 12. OR/Reference Uniqueness Rule
- `PaymentReference.transactionNumber` is globally unique at DB level.
- API checks duplicates before create.
- Duplicate response message:
  - This OR number/payment reference has already been submitted. Please check your payment details.

## 13. Permit Preparation and Release Rules
- Prepare: only from Paid, with verified payment and required release payment met.
- Release: only from For Release with issuance record.

## 14. Business Location Rules
- Applicant submits coordinates for eligible released business records.
- BPLO verifies or returns with correction remarks.

## 15. Business Map Category/Color/Filter Rules
- Map list excludes draft/rejected/returned/incomplete operational records by using valid statuses only.
- Category/color is derived from business line/category source and used consistently by markers and legend.
- Filters: owner/operator, category, and business-name search.
- Map also excludes any business record with `businessStatus = CLOSED` (closed businesses are hidden from the active official map).

## 16. Closure Soft-Close Rules
- Closure is a **soft-close operation**. Business records are never deleted from the database.
- When a CLOSURE application reaches final BPLO release (_For Release → Released_):
  - The related `BusinessRecord.businessStatus` is set to `CLOSED`.
  - `BusinessRecord.closedAt` is stamped with the release timestamp.
  - `BusinessRecord.closureApplicationId` is set to the ID of the closure application.
- All historical records are preserved: applications, documents, payments, permits, activity history.
- Closed businesses are **hidden** from:
  - The applicant's business selector for renewal or new closure applications (`/api/applicant/business-records` returns ACTIVE only).
  - The applicant's released business location list (cannot submit location for a closed business).
  - The BPLO official business map (only ACTIVE businesses appear on the map).
- Closed businesses remain **visible** in:
  - Superadmin reports and read-only application views (all records are queryable).
  - Applicant's own application history (`/applicant/my-applications` still shows closure application entries).
  - Applicant profile (all business records including CLOSED are listed with status badge).
- **Reopening requires a new formal application process.** There is no simple UI toggle to reactivate a closed business. The system does not support unsupervised reopening.
- Server-side eligibility check (`assertEligibleBusinessRecord`) rejects submission against a CLOSED business with HTTP 403.

## 16. Superadmin Limitations
- Superadmin cannot execute BPLO processing actions (approve/reject/assess/verify payment/release).
- Superadmin remains configuration + monitoring role.

## 17. Government-ready Data Validation Rules
- TIN: validated numeric format.
- Contact number: Philippine mobile format validation.
- Email: validated format.
- Asset value: non-negative numeric.
- Employee count: non-negative integer.
- Coordinates: numeric range validation.
- Application type and payment frequency: enum constrained.

## 18. Status Lifecycle
Main lifecycle:
- Draft -> Submitted -> Under Review -> Assessed -> Approved for Payment -> Paid -> For Release -> Released

Alternative states:
- Returned for Correction
- Rejected
- Payment Rejected (payment reference state)
- Location Returned (Needs Correction)
- Location Verified
