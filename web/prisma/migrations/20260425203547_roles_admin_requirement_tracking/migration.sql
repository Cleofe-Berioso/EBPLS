DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'ADMIN'
      AND enumtypid = '"Role"'::regtype
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'ADMIN';
  END IF;
END $$;

ALTER TABLE "clearances"
  ADD COLUMN IF NOT EXISTS "requirementCode" TEXT,
  ADD COLUMN IF NOT EXISTS "requirementName" TEXT;

UPDATE "clearances"
SET
  "requirementCode" = COALESCE("requirementCode", "officeCode", 'LEGACY_REQUIREMENT'),
  "requirementName" = COALESCE("requirementName", "officeName", 'Legacy Requirement');

ALTER TABLE "clearances"
  ALTER COLUMN "requirementCode" SET NOT NULL,
  ALTER COLUMN "requirementName" SET NOT NULL;

ALTER TABLE "clearances"
  DROP CONSTRAINT IF EXISTS "clearances_officeId_fkey";

ALTER TABLE "clearances"
  DROP CONSTRAINT IF EXISTS "clearances_applicationId_officeId_key";

DROP INDEX IF EXISTS "clearances_officeId_idx";
DROP INDEX IF EXISTS "clearance_offices_code_key";
DROP INDEX IF EXISTS "clearance_offices_code_idx";
DROP INDEX IF EXISTS "clearance_offices_isActive_idx";

ALTER TABLE "clearances"
  DROP COLUMN IF EXISTS "officeId",
  DROP COLUMN IF EXISTS "officeCode",
  DROP COLUMN IF EXISTS "officeName";

DROP TABLE IF EXISTS "clearance_offices";

CREATE INDEX IF NOT EXISTS "clearances_requirementCode_idx"
  ON "clearances"("requirementCode");

CREATE UNIQUE INDEX IF NOT EXISTS "clearances_applicationId_requirementCode_key"
  ON "clearances"("applicationId", "requirementCode");
