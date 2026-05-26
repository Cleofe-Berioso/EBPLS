-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "revocationSettledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "revocationSettlementRemarks" TEXT;

-- AlterTable  
ALTER TABLE "Inspection" ADD COLUMN "revocationSettledById" TEXT;

-- CreateIndex
CREATE INDEX "Inspection_revocationSettledAt_createdAt_idx" ON "Inspection"("revocationSettledAt", "createdAt");
