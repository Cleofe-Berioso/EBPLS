-- CreateEnum
CREATE TYPE "NonComplianceType" AS ENUM ('GOVERNMENT_AGENCY_RELATED', 'RENEWAL_RELATED');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('MINOR', 'MAJOR', 'SEVERE');

-- CreateEnum
CREATE TYPE "ComplianceCaseStatus" AS ENUM ('NONE', 'FLAGGED_UNSETTLED', 'SETTLED', 'EXPIRED_UNSETTLED', 'FORCED_CLOSURE_PENDING', 'CLOSED_NON_COMPLIANT');

-- CreateEnum
CREATE TYPE "ClosureType" AS ENUM ('RETIREMENT', 'NON_COMPLIANT_RELATED', 'OTHERS');

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "nonComplianceType" "NonComplianceType";

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "violationSeverity" "ViolationSeverity";

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "isSettled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "settledAt" DATETIME;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "settledById" TEXT;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "deadlineAt" DATETIME;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "autoClosed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "forcedClosure" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "forcedClosureAt" DATETIME;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "forcedClosureById" TEXT;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "complianceCaseStatus" "ComplianceCaseStatus" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "Inspection_complianceCaseStatus_createdAt_idx" ON "Inspection"("complianceCaseStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Inspection_settledAt_createdAt_idx" ON "Inspection"("settledAt", "createdAt");

-- CreateIndex
CREATE INDEX "Inspection_forcedClosureAt_createdAt_idx" ON "Inspection"("forcedClosureAt", "createdAt");

-- AlterTable
ALTER TABLE "SystemFeeSetting" ADD COLUMN "jitPortalEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "BusinessApplication" ADD COLUMN "closureType" "ClosureType";

-- AlterTable
ALTER TABLE "BusinessApplication" ADD COLUMN "closureTypeOtherReason" TEXT;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_forcedClosureById_fkey" FOREIGN KEY ("forcedClosureById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
