# EBPLS Revised Implementation Plan
Date: May 9, 2026
Version: 3.0
Status: Updated to reflect completed implementation batches

## 1. Purpose
This plan now serves as an implementation status baseline, not a future-only UI proposal. It reflects completed logic and workflow updates already integrated in the codebase.

## 2. Batch Completion Summary

### Batch 1 to Batch 4 Foundations
- Core application workflow and status transitions established.
- Role access boundaries and review flows implemented.
- Dynamic document upload process and server validation integrated.

### Batch 5A Payment Verification
- Applicant payment submission uses OR Number or Official Receipt Number input and payment proof upload.
- Required payment fields are enforced server-side.
- BPLO verifies payment before application transitions to PAID.

### Batch 6 Closure Assessment
- Closure Certificate Fee set to fixed 100.
- BPLO manually inputs closure payment dues or pending fee.
- Closure totals and TOP output include fixed closure fee and pending dues.
- Closure assessment path is isolated from New and Renewal mayor's permit fee computation path.

### Batch 7 Business Map Cleanup
- BPLO map application scope limited to NEW and RENEWAL.
- Business Category is classification-based.
- Closure removed from BPLO map category and filter logic.
- Location Status removed from BPLO map filter controls and related BPLO map UI paths.
- Marker rendering remains functional with updated filters.

### Batch 8 Documentation Alignment
- System logic, DFD, and ERD documentation updated to match implemented behavior.
- Outdated or conflicting descriptions from previous planning text removed.

## 3. Implemented Logic Reference

### Registration Number Logic
- Sole Proprietorship maps to DTI registration number.
- Partnership maps to SEC registration number.
- Corporation maps to SEC registration number.
- Cooperative maps to CDA registration number.

### Nationality Logic
- Corporation keeps nationality selectable.
- Non-corporation normalizes nationality to Filipino.

### Sex Field and Renewal Locks
- Optional sex is included in business and application data.
- sex stays editable during renewal.
- Renewal locked fields are:
  - businessName
  - businessType
  - registrationNumber
  - tin
  - ownerName
  - tradeName
  - nationality

### Dynamic Document Logic
- NEW requirements use business type and ownership conditions plus market and agriculture flags.
- RENEWAL requirements use renewal-specific set plus market and agriculture conditions.
- Only resolved relevant documents are shown and validated.

### BPLO Queue Scope
- Queue includes only SUBMITTED, UNDER_REVIEW, RETURNED_FOR_CORRECTION.
- Queue excludes assessed, payment, release, and rejected stages.

### Assessment and TOP Visibility
- BPLO encodes fee line items with required description and amount.
- Draft assessment remains BPLO-only.
- Applicant TOP appears only after generated assessment and approved-for-payment transition.

### Payment Verification State Rule
- PAID is set only after BPLO approval of submitted payment reference.

### Closure Assessment Rule
- Closure certificate fee is fixed at 100.
- BPLO entered pending dues are included in closure total.

### BPLO Business Map Rule
- Business Application filter values are NEW and RENEWAL.
- Business Category is classification-derived and separated from application type.
- Closure and location status filter logic are removed from BPLO map cleanup scope.

## 4. Outdated Plan Items Removed
- Prior planning-only language was removed.
- Purely speculative UI phase text that no longer represented current implementation state was removed.
- Conflicting older statements were replaced with implementation-aligned behavior notes.

## 5. Ongoing Documentation Maintenance
- Any future logic change should update SYSTEM_LOGIC.md, ERD.md, and DFD_LEVEL_0_TO_4.md in the same change set.
- Documentation should describe implemented behavior only and avoid forward-looking assumptions unless explicitly marked as pending.
