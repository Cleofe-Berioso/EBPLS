-- BusinessRecord sex field migration
-- Purpose: add optional sex field for owner/president on BusinessRecord.
-- Non-destructive: additive nullable column only.

ALTER TABLE "BusinessRecord"
ADD COLUMN "sex" TEXT;
