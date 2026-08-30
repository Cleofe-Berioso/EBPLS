-- CreateEnum
CREATE TYPE "JitNoPermitTicketStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable (nullable first for backfill)
ALTER TABLE "JitNoPermitRecord" ADD COLUMN "ticketNumber" TEXT,
ADD COLUMN "ticketStatus" "JitNoPermitTicketStatus",
ADD COLUMN "findings" TEXT,
ADD COLUMN "requiredAction" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "inspectingOffice" TEXT,
ADD COLUMN "notifiedAt" TIMESTAMP(3),
ADD COLUMN "notificationStatus" TEXT,
ADD COLUMN "notificationChannel" TEXT;

-- Backfill existing rows
WITH numbered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn,
    EXTRACT(YEAR FROM "createdAt")::INT AS record_year
  FROM "JitNoPermitRecord"
)
UPDATE "JitNoPermitRecord" AS r
SET
  "ticketNumber" = 'NP-' || n.record_year::TEXT || '-' || LPAD(n.rn::TEXT, 6, '0'),
  "ticketStatus" = 'OPEN',
  "findings" = COALESCE(r."remarks", 'No valid business permit record found during JIT inspection.'),
  "requiredAction" = 'Apply for a business permit at the Business Permit and Licensing Office (BPLO). Present this notice reference number during follow-up and comply with municipal business permit requirements.',
  "inspectingOffice" = 'Joint Inspection Team (JIT) — Business Permit and Licensing Office, Municipality of Enrique B. Magalona'
FROM numbered AS n
WHERE r."id" = n."id";

-- Enforce required columns
ALTER TABLE "JitNoPermitRecord" ALTER COLUMN "ticketNumber" SET NOT NULL;
ALTER TABLE "JitNoPermitRecord" ALTER COLUMN "ticketStatus" SET NOT NULL;
ALTER TABLE "JitNoPermitRecord" ALTER COLUMN "findings" SET NOT NULL;
ALTER TABLE "JitNoPermitRecord" ALTER COLUMN "requiredAction" SET NOT NULL;
ALTER TABLE "JitNoPermitRecord" ALTER COLUMN "ticketStatus" SET DEFAULT 'OPEN';

-- CreateIndex
CREATE UNIQUE INDEX "JitNoPermitRecord_ticketNumber_key" ON "JitNoPermitRecord"("ticketNumber");
CREATE INDEX "JitNoPermitRecord_ticketStatus_businessName_idx" ON "JitNoPermitRecord"("ticketStatus", "businessName");
CREATE INDEX "JitNoPermitRecord_ticketStatus_latitude_longitude_idx" ON "JitNoPermitRecord"("ticketStatus", "latitude", "longitude");
