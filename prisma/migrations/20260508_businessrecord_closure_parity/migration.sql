-- BusinessRecord closure parity migration
-- Purpose: align migration chain with current schema/runtime soft-close fields.
-- Non-destructive: additive columns only; no table drops/rebuilds.

-- CreateEnum
CREATE TYPE "BusinessRecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

ALTER TABLE "BusinessRecord"
ADD COLUMN "businessStatus" "BusinessRecordStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "BusinessRecord"
ADD COLUMN "closedAt" TIMESTAMP(3);

ALTER TABLE "BusinessRecord"
ADD COLUMN "closureApplicationId" TEXT;

-- Backfill safeguard for any pre-existing rows where status may be null.
UPDATE "BusinessRecord"
SET "businessStatus" = 'ACTIVE'
WHERE "businessStatus" IS NULL;
