-- BusinessRecord closure parity migration
-- Purpose: align migration chain with current schema/runtime soft-close fields.
-- Non-destructive: additive columns only; no table drops/rebuilds.

ALTER TABLE "BusinessRecord"
ADD COLUMN "businessStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "BusinessRecord"
ADD COLUMN "closedAt" DATETIME;

ALTER TABLE "BusinessRecord"
ADD COLUMN "closureApplicationId" TEXT;

-- Backfill safeguard for any pre-existing rows where status may be null.
UPDATE "BusinessRecord"
SET "businessStatus" = 'ACTIVE'
WHERE "businessStatus" IS NULL;
