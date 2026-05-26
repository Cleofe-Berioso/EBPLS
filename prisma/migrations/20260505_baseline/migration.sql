-- CreateEnum
CREATE TYPE "Role" AS ENUM ('APPLICANT', 'BPLO', 'SUPER_ADMIN', 'DEPARTMENT_HEAD', 'JIT');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('NEW', 'RENEWAL', 'CLOSURE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'DEPARTMENT_HEAD_REVIEW',
    'DEPARTMENT_HEAD_APPROVED',
    'ASSESSED',
    'APPROVED_FOR_PAYMENT',
    'PAID',
    'FOR_RELEASE',
    'RELEASED',
    'REVOCATION_REVIEW',
    'REVOKED',
    'RETURNED_FOR_CORRECTION',
    'REJECTED'
);

-- CreateEnum
CREATE TYPE "BusinessLocationStatus" AS ENUM ('PENDING', 'VERIFIED', 'NEEDS_CORRECTION');

-- CreateEnum
CREATE TYPE "PermitDocumentType" AS ENUM ('BUSINESS_PERMIT', 'CLOSURE_CERTIFICATE');

-- CreateEnum
CREATE TYPE "PermitIssuanceStatus" AS ENUM ('PREPARED', 'FOR_RELEASE', 'RELEASED');

-- CreateEnum
CREATE TYPE "FeeAssessmentStatus" AS ENUM ('DRAFT', 'GENERATED');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('ANNUAL', 'BI_ANNUAL', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "PaymentSettlementStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentReferenceStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APPLICANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicantId" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "tin" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mainOfficeAddress" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "sameAsMainOffice" BOOLEAN NOT NULL DEFAULT true,
    "businessArea" TEXT,
    "totalFloorArea" TEXT,
    "totalEmployees" TEXT,
    "maleEmployees" TEXT,
    "femaleEmployees" TEXT,
    "employeesWithinMunicipality" TEXT,
    "deliveryVehicles" TEXT,
    "propertyOwnership" TEXT,
    "taxDeclarationNumber" TEXT,
    "propertyIdentificationNumber" TEXT,
    "taxIncentives" TEXT,
    "businessActivity" TEXT,
    "lineOfBusiness" TEXT,
    "assetSize" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessRecord_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessRecordId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "address" TEXT,
    "barangay" TEXT,
    "status" "BusinessLocationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessLocation_businessRecordId_fkey" FOREIGN KEY ("businessRecordId") REFERENCES "BusinessRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessLocation_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BusinessLocation_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationNumber" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "businessRecordId" TEXT,
    "applicationType" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "formData" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessApplication_businessRecordId_fkey" FOREIGN KEY ("businessRecordId") REFERENCES "BusinessRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermitIssuance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" "PermitDocumentType" NOT NULL,
    "status" "PermitIssuanceStatus" NOT NULL DEFAULT 'PREPARED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "preparedById" TEXT NOT NULL,
    "releasedById" TEXT,
    "documentPath" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PermitIssuance_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PermitIssuance_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PermitIssuance_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "Role",
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "assessmentNumber" TEXT NOT NULL,
    "status" "FeeAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'ANNUAL',
    "annualAssessedAmount" DECIMAL NOT NULL DEFAULT 0,
    "releasePaymentAmount" DECIMAL NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentSettlementStatus" NOT NULL DEFAULT 'UNPAID',
    "mayorsPermitFee" DECIMAL NOT NULL DEFAULT 0,
    "regulatoryFees" DECIMAL NOT NULL DEFAULT 0,
    "additionalCharges" DECIMAL NOT NULL DEFAULT 0,
    "penalties" DECIMAL NOT NULL DEFAULT 0,
    "surcharge" DECIMAL NOT NULL DEFAULT 0,
    "interest" DECIMAL NOT NULL DEFAULT 0,
    "closureCertificateFee" DECIMAL NOT NULL DEFAULT 0,
    "arrears" DECIMAL NOT NULL DEFAULT 0,
    "otherCharges" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "computedById" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeeAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeeAssessment_computedById_fkey" FOREIGN KEY ("computedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "proofFileName" TEXT NOT NULL,
    "proofStoragePath" TEXT NOT NULL,
    "proofMimeType" TEXT NOT NULL,
    "proofSizeBytes" INTEGER NOT NULL,
    "status" "PaymentReferenceStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerRemarks" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentReference_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentReference_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeConfigurationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeeConfigurationItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemFeeSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "renewalSurchargePercent" REAL NOT NULL DEFAULT 25,
    "monthlyInterestPercent" REAL NOT NULL DEFAULT 2,
    "liquorTobaccoAddOnPercent" REAL NOT NULL DEFAULT 25,
    "powerDistributionFixedFee" DECIMAL NOT NULL DEFAULT 10000,
    "privatePortFixedFee" DECIMAL NOT NULL DEFAULT 50000,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemFeeSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenewalExtension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "waiveSurcharge" BOOLEAN NOT NULL DEFAULT true,
    "waiveInterest" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RenewalExtension_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRecord_registrationNumber_key" ON "BusinessRecord"("registrationNumber");

-- CreateIndex
CREATE INDEX "BusinessRecord_applicantId_idx" ON "BusinessRecord"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessLocation_businessRecordId_key" ON "BusinessLocation"("businessRecordId");

-- CreateIndex
CREATE INDEX "BusinessLocation_status_idx" ON "BusinessLocation"("status");

-- CreateIndex
CREATE INDEX "BusinessLocation_submittedById_idx" ON "BusinessLocation"("submittedById");

-- CreateIndex
CREATE INDEX "BusinessLocation_verifiedById_idx" ON "BusinessLocation"("verifiedById");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessApplication_applicationNumber_key" ON "BusinessApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "BusinessApplication_applicantId_createdAt_idx" ON "BusinessApplication"("applicantId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessApplication_applicantId_status_idx" ON "BusinessApplication"("applicantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PermitIssuance_applicationId_key" ON "PermitIssuance"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "PermitIssuance_documentNumber_key" ON "PermitIssuance"("documentNumber");

-- CreateIndex
CREATE INDEX "PermitIssuance_status_idx" ON "PermitIssuance"("status");

-- CreateIndex
CREATE INDEX "PermitIssuance_applicationId_status_idx" ON "PermitIssuance"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationHistory_applicationId_createdAt_idx" ON "ApplicationHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAssessment_applicationId_key" ON "FeeAssessment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAssessment_assessmentNumber_key" ON "FeeAssessment"("assessmentNumber");

-- CreateIndex
CREATE INDEX "FeeAssessment_applicationId_idx" ON "FeeAssessment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReference_transactionNumber_key" ON "PaymentReference"("transactionNumber");

-- CreateIndex
CREATE INDEX "PaymentReference_applicationId_submittedAt_idx" ON "PaymentReference"("applicationId", "submittedAt");

-- CreateIndex
CREATE INDEX "PaymentReference_status_submittedAt_idx" ON "PaymentReference"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "FeeConfigurationItem_category_isActive_idx" ON "FeeConfigurationItem"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeeConfigurationItem_category_classification_key" ON "FeeConfigurationItem"("category", "classification");

-- CreateIndex
CREATE INDEX "RenewalExtension_isActive_startDate_endDate_idx" ON "RenewalExtension"("isActive", "startDate", "endDate");

