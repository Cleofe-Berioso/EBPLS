-- Phase 11: Department Head revocation decision fields for Inspection
-- Non-destructive: additive columns and index only.

ALTER TABLE "Inspection" ADD COLUMN "revocationDecision" TEXT;
ALTER TABLE "Inspection" ADD COLUMN "revocationRemarks" TEXT;
ALTER TABLE "Inspection" ADD COLUMN "decidedById" TEXT;
ALTER TABLE "Inspection" ADD COLUMN "decidedAt" DATETIME;

CREATE INDEX "Inspection_decidedById_createdAt_idx" ON "Inspection"("decidedById", "createdAt");
