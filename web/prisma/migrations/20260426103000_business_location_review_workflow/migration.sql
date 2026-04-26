CREATE TYPE "BusinessLocationStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

ALTER TABLE "business_locations"
ADD COLUMN "status" "BusinessLocationStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "reviewNotes" TEXT;

UPDATE "business_locations" AS bl
SET
  "status" = 'APPROVED',
  "reviewedAt" = CURRENT_TIMESTAMP,
  "reviewNotes" = COALESCE("reviewNotes", 'Migrated legacy approved location')
FROM "applications" AS a
WHERE bl."applicationId" = a."id"
  AND a."status" IN ('RELEASED', 'COMPLETED');

UPDATE "business_locations" AS bl
SET
  "status" = 'REJECTED',
  "reviewedAt" = CURRENT_TIMESTAMP,
  "reviewNotes" = COALESCE("reviewNotes", 'Migrated legacy location tied to a returned or rejected application')
FROM "applications" AS a
WHERE bl."applicationId" = a."id"
  AND a."status" IN ('RETURNED_FOR_CORRECTION', 'REJECTED', 'CANCELLED');

CREATE INDEX "business_locations_status_idx" ON "business_locations"("status");
