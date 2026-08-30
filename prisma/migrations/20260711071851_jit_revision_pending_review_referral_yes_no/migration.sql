-- AlterEnum
ALTER TYPE "InspectionComplianceStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JitChecklistResponse" ADD VALUE 'YES';
ALTER TYPE "JitChecklistResponse" ADD VALUE 'NO';

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "bploComplianceRemarks" TEXT,
ADD COLUMN     "bploComplianceReviewedAt" TIMESTAMP(3),
ADD COLUMN     "bploComplianceReviewedById" TEXT,
ADD COLUMN     "referToBplo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralReason" TEXT,
ADD COLUMN     "referralRemarks" TEXT;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_bploComplianceReviewedById_fkey" FOREIGN KEY ("bploComplianceReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
