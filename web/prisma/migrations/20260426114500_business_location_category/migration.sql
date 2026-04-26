CREATE TYPE "BusinessCategory" AS ENUM (
  'FOOD',
  'RETAIL',
  'SERVICES',
  'MANUFACTURING',
  'AGRICULTURE',
  'FINANCE',
  'OTHER'
);

ALTER TABLE "business_locations"
ADD COLUMN "businessCategory" "BusinessCategory" NOT NULL DEFAULT 'OTHER';

ALTER TABLE "business_locations"
ALTER COLUMN "businessCategory" DROP DEFAULT;
