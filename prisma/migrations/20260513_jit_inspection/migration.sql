-- Phase 10: JIT inspection records
-- Non-destructive: additive table only.

-- CreateEnum
CREATE TYPE "InspectionComplianceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM (
  'COMPLIANT',
  'NON_COMPLIANT',
  'DH_VERIFICATION_PENDING',
  'VERIFIED_COMPLIANT',
  'VERIFIED_NON_COMPLIANT',
  'REVOCATION_REVIEW',
  'REVOCATION_DENIED',
  'REVOKED'
);

CREATE TABLE "Inspection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessRecordId" TEXT NOT NULL,
  "applicationId" TEXT,
  "inspectorId" TEXT NOT NULL,
  "complianceStatus" "InspectionComplianceStatus" NOT NULL,
  "status" "InspectionStatus" NOT NULL,
  "comment" TEXT,
  "evidenceFileName" TEXT,
  "evidenceStoragePath" TEXT,
  "evidenceMimeType" TEXT,
  "evidenceSizeBytes" INTEGER,
  "revocationDecision" "RevocationDecision",
  "revocationRemarks" TEXT,
  "decidedById" TEXT,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Inspection_businessRecordId_fkey"
    FOREIGN KEY ("businessRecordId") REFERENCES "BusinessRecord" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Inspection_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Inspection_inspectorId_fkey"
    FOREIGN KEY ("inspectorId") REFERENCES "User" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Inspection_businessRecordId_createdAt_idx" ON "Inspection"("businessRecordId", "createdAt");
CREATE INDEX "Inspection_applicationId_createdAt_idx" ON "Inspection"("applicationId", "createdAt");
CREATE INDEX "Inspection_inspectorId_createdAt_idx" ON "Inspection"("inspectorId", "createdAt");
CREATE INDEX "Inspection_decidedById_createdAt_idx" ON "Inspection"("decidedById", "createdAt");
CREATE INDEX "Inspection_status_createdAt_idx" ON "Inspection"("status", "createdAt");
