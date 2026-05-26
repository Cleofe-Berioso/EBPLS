-- Phase 11: Department Head revocation decision fields for Inspection
-- Non-destructive: additive columns and index only.

-- CreateEnum
CREATE TYPE "RevocationDecision" AS ENUM ('APPROVED', 'DENIED');

DO $$
BEGIN
	IF to_regclass('"Inspection"') IS NOT NULL THEN
		ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "revocationDecision" "RevocationDecision";
		ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "revocationRemarks" TEXT;
		ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "decidedById" TEXT;
		ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3);

		IF to_regclass('"Inspection_decidedById_createdAt_idx"') IS NULL THEN
			EXECUTE 'CREATE INDEX "Inspection_decidedById_createdAt_idx" ON "Inspection"("decidedById", "createdAt")';
		END IF;
	END IF;
END $$;
