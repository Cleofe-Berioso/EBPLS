-- Add settlementRemarks to Inspection for Phase 3 settlement tracking

ALTER TABLE "Inspection"
ADD COLUMN IF NOT EXISTS "settlementRemarks" text NULL;

-- no other schema changes required for this phase
