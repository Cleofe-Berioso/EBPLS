-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'APPLICANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "applicationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "formData" JSONB NOT NULL,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessApplication_businessRecordId_fkey" FOREIGN KEY ("businessRecordId") REFERENCES "BusinessRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermitIssuance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" DATETIME,
    "preparedById" TEXT NOT NULL,
    "releasedById" TEXT,
    "documentPath" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "assessmentNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentFrequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "annualAssessedAmount" DECIMAL NOT NULL DEFAULT 0,
    "releasePaymentAmount" DECIMAL NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
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
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeeAssessment_computedById_fkey" FOREIGN KEY ("computedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "paymentDate" DATETIME NOT NULL,
    "proofFileName" TEXT NOT NULL,
    "proofStoragePath" TEXT NOT NULL,
    "proofMimeType" TEXT NOT NULL,
    "proofSizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerRemarks" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemFeeSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenewalExtension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "waiveSurcharge" BOOLEAN NOT NULL DEFAULT true,
    "waiveInterest" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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

