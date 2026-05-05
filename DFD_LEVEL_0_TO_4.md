# eBPLS DFD Level 0 to Level 4

## Scope
External entities are limited to:
- Applicant
- BPLO
- Superadmin

## Level 0 (Context)
Process: eBPLS System

Inputs
- Applicant: registration/login data, application data, required documents, payment reference + proof, business location
- BPLO: review actions, assessment values, TOP generation, payment verification, permit preparation/release, location verification
- Superadmin: user management and settings/configuration updates

Outputs
- Applicant: status updates, TOP details, payment verification result, permit/closure release result, correction remarks
- BPLO: application queues, document access, payment queue, business map records
- Superadmin: dashboard, reports, activities, read-only application views

## Level 1 (Main Processes)
1. Account and Role Access
2. Application Submission
3. Dynamic Document Upload
4. BPLO Review and Assessment
5. Payment Submission and Verification
6. Permit Issuance and Release
7. Business Location Mapping
8. Superadmin Configuration and Monitoring

## Level 2 to Level 4

### 1. Account and Role Access
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Register/Login | Applicant | name, email, contact, password | email format, PH mobile format, password checks | User create/read | session token |
| Route protection | System | route + session role | middleware + role map | none | allow/redirect |
| Superadmin user admin | Superadmin | create/disable/reactivate/reset | role limits enforced | User update | user management result |

### 2. Application Submission
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| New application save/submit | Applicant | NEW + formData | required fields, TIN, phone, asset, employee count | BusinessApplication create/update | Draft/Submitted status |
| Renewal/closure submission | Applicant | RENEWAL/CLOSURE + businessRecordId | eligible business check | BusinessApplication create/update | Draft/Submitted status |
| Status tracking | Applicant | applicationId | ownership check | ApplicationHistory read | timeline/status |

### 3. Dynamic Document Upload
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Resolve required docs | System | applicationType + formData | application-type and conditional checks | none | required document list |
| Upload/replace/delete | Applicant | documentName + file | MIME + size + editable status | ApplicationDocument create/update/delete | upload state |
| Download docs | Applicant/BPLO | documentId | ownership/role access | ApplicationDocument read | file stream |

### 4. BPLO Review and Assessment
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Review actions | BPLO | under-review/return/reject/approve-for-assessment | status transition rules | BusinessApplication + ApplicationHistory update | status change |
| Fee computation | System/BPLO | category, assets, workers, settings | backend recomputation | FeeAssessment upsert | assessment draft |
| TOP generation | BPLO | final assessment values + frequency | ASSESSED only | FeeAssessment GENERATED + application APPROVED_FOR_PAYMENT | TOP number/details |

### 5. Payment Submission and Verification
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Payment submission | Applicant | OR/reference, amount, payment date, proof file | required fields, positive amount, unique OR/ref | PaymentReference create | pending payment reference |
| Payment verification | BPLO | approve/reject + remarks | pending only, amount >= required release payment | PaymentReference + FeeAssessment + ApplicationHistory update | PAID or rejection |
| Duplicate protection | System | transactionNumber | unique constraint + API check | PaymentReference unique index | duplicate blocked |

### 6. Permit Issuance and Release
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Prepare permit | BPLO | applicationId | PAID only, verified payment reference, required release payment completed | PermitIssuance upsert + app FOR_RELEASE | for-release permit |
| Release permit | BPLO | applicationId | FOR_RELEASE + issuance exists | PermitIssuance + BusinessApplication + BusinessRecord + history | RELEASED |
| **Soft-close on closure release** | **System (on release)** | **applicationType === CLOSURE + businessRecordId** | **FOR_RELEASE + CLOSURE type** | **BusinessRecord.businessStatus → CLOSED, closedAt set, closureApplicationId set (no deletion)** | **Business marked CLOSED; hidden from active lists/map; preserved for audit/history** |

### 7. Business Location Mapping
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Submit location | Applicant | lat/lng + address/barangay | coordinate range + released business ownership | BusinessLocation upsert | pending location |
| Verify/return location | BPLO | verdict + remarks | remarks required on return | BusinessLocation update | VERIFIED/NEEDS_CORRECTION |
| Map listing/filtering | BPLO | type/status/owner/category/search | map status filters | BusinessLocation + BusinessApplication read | filtered business map rows |

### 8. Superadmin Configuration and Monitoring
| Process | Responsible Role | Input | Validation | Database Action | Output |
|---|---|---|---|---|---|
| Fee table config | Superadmin | category/classification/amount | controlled category+classification + numeric checks | FeeConfigurationItem upsert | updated fee table |
| Penalty/extension config | Superadmin | percentages/date windows | non-negative + date range checks | SystemFeeSetting/RenewalExtension update | updated settings |
| Monitoring | Superadmin | dashboard/report requests | role check | read-only queries | dashboard/reports/activity |
