/*
  Warnings:

  - The `metadata` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `annualAssessedAmount` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `releasePaymentAmount` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `amountPaid` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `remainingBalance` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `mayorsPermitFee` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `regulatoryFees` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `additionalCharges` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `penalties` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `surcharge` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `interest` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `closureCertificateFee` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `arrears` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `otherCharges` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `totalAmount` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `closurePaymentDues` on the `FeeAssessment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `FeeAssessmentLineItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `FeeConfigurationItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `amountPaid` on the `PaymentReference` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `powerDistributionFixedFee` on the `SystemFeeSetting` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `privatePortFixedFee` on the `SystemFeeSetting` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `renewalComplianceMinorPenalty` on the `SystemFeeSetting` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `renewalComplianceMajorPenalty` on the `SystemFeeSetting` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `renewalComplianceSeverePenalty` on the `SystemFeeSetting` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "ApplicationDocument" ADD COLUMN     "bucket" TEXT,
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "originalName" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "BusinessLocation" ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FeeAssessment" ADD COLUMN     "reassessmentRequestedAt" TIMESTAMP(3),
ADD COLUMN     "reassessmentRequestedById" TEXT,
ALTER COLUMN "annualAssessedAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "releasePaymentAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "remainingBalance" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "mayorsPermitFee" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "regulatoryFees" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "additionalCharges" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "penalties" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "surcharge" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "interest" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "closureCertificateFee" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "arrears" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "otherCharges" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "closurePaymentDues" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "FeeAssessmentLineItem" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "FeeConfigurationItem" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "evidenceBucket" TEXT;

-- AlterTable
ALTER TABLE "PaymentReference" ADD COLUMN     "proofBucket" TEXT,
ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SystemFeeSetting" ALTER COLUMN "renewalSurchargePercent" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "monthlyInterestPercent" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "liquorTobaccoAddOnPercent" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "powerDistributionFixedFee" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "privatePortFixedFee" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "renewalComplianceMinorPenalty" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "renewalComplianceMajorPenalty" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "renewalComplianceSeverePenalty" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "FeeAssessment_reassessmentRequestedAt_idx" ON "FeeAssessment"("reassessmentRequestedAt");

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_revocationSettledById_fkey" FOREIGN KEY ("revocationSettledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAssessment" ADD CONSTRAINT "FeeAssessment_reassessmentRequestedById_fkey" FOREIGN KEY ("reassessmentRequestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
