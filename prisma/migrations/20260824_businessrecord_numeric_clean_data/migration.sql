-- Apply clean_data.md BusinessRecord numeric types.
-- tin: BIGINT NOT NULL (never NULL). Dirty hyphenated values normalized in place by stripping non-digits.
-- Nullable numerics: blank or non-numeric text → NULL, then cast.

-- 1) Normalize tin: strip non-digits when remainder is a non-empty digit string
UPDATE "BusinessRecord"
SET tin = regexp_replace(tin, '[^0-9]', '', 'g')
WHERE tin !~ '^[0-9]+$'
  AND regexp_replace(tin, '[^0-9]', '', 'g') ~ '^[0-9]+$'
  AND length(regexp_replace(tin, '[^0-9]', '', 'g')) > 0;

-- 2) Abort if any tin still cannot cast (blank / non-digit / empty after strip)
DO $$
DECLARE
  dirty_count integer;
  dirty_sample text;
BEGIN
  SELECT COUNT(*)::integer,
         string_agg(id || ' | ' || "businessName" || ' | tin=' || coalesce(tin, '<NULL>'), E'\n')
  INTO dirty_count, dirty_sample
  FROM "BusinessRecord"
  WHERE trim(tin) = '' OR tin !~ '^[0-9]+$';

  IF dirty_count > 0 THEN
    RAISE EXCEPTION
      'Cannot alter BusinessRecord.tin to BIGINT NOT NULL: % dirty row(s) remain (no NULL placeholders).% %',
      dirty_count,
      E'\n',
      coalesce(dirty_sample, '');
  END IF;
END $$;

-- 3) Cast tin → BIGINT, keep NOT NULL
ALTER TABLE "BusinessRecord"
  ALTER COLUMN tin TYPE BIGINT
  USING (tin::bigint);

-- 4) Nullable string fields: blank / non-numeric → NULL, then cast

-- businessArea / totalFloorArea → DECIMAL(10,2)
UPDATE "BusinessRecord"
SET "businessArea" = NULL
WHERE "businessArea" IS NOT NULL
  AND (
    trim("businessArea") = ''
    OR replace(replace(trim("businessArea"), ',', ''), ' ', '') !~ '^[0-9]+(\.[0-9]+)?$'
  );

UPDATE "BusinessRecord"
SET "totalFloorArea" = NULL
WHERE "totalFloorArea" IS NOT NULL
  AND (
    trim("totalFloorArea") = ''
    OR replace(replace(trim("totalFloorArea"), ',', ''), ' ', '') !~ '^[0-9]+(\.[0-9]+)?$'
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "businessArea" TYPE DECIMAL(10, 2)
  USING (
    CASE
      WHEN "businessArea" IS NULL THEN NULL
      ELSE replace(replace(trim("businessArea"), ',', ''), ' ', '')::decimal(10, 2)
    END
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "totalFloorArea" TYPE DECIMAL(10, 2)
  USING (
    CASE
      WHEN "totalFloorArea" IS NULL THEN NULL
      ELSE replace(replace(trim("totalFloorArea"), ',', ''), ' ', '')::decimal(10, 2)
    END
  );

-- employee counts → INTEGER
UPDATE "BusinessRecord"
SET "totalEmployees" = NULL
WHERE "totalEmployees" IS NOT NULL
  AND (
    trim("totalEmployees") = ''
    OR replace(replace(trim("totalEmployees"), ',', ''), ' ', '') !~ '^[0-9]+$'
  );

UPDATE "BusinessRecord"
SET "maleEmployees" = NULL
WHERE "maleEmployees" IS NOT NULL
  AND (
    trim("maleEmployees") = ''
    OR replace(replace(trim("maleEmployees"), ',', ''), ' ', '') !~ '^[0-9]+$'
  );

UPDATE "BusinessRecord"
SET "femaleEmployees" = NULL
WHERE "femaleEmployees" IS NOT NULL
  AND (
    trim("femaleEmployees") = ''
    OR replace(replace(trim("femaleEmployees"), ',', ''), ' ', '') !~ '^[0-9]+$'
  );

UPDATE "BusinessRecord"
SET "employeesWithinMunicipality" = NULL
WHERE "employeesWithinMunicipality" IS NOT NULL
  AND (
    trim("employeesWithinMunicipality") = ''
    OR replace(replace(trim("employeesWithinMunicipality"), ',', ''), ' ', '') !~ '^[0-9]+$'
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "totalEmployees" TYPE INTEGER
  USING (
    CASE
      WHEN "totalEmployees" IS NULL THEN NULL
      ELSE replace(replace(trim("totalEmployees"), ',', ''), ' ', '')::integer
    END
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "maleEmployees" TYPE INTEGER
  USING (
    CASE
      WHEN "maleEmployees" IS NULL THEN NULL
      ELSE replace(replace(trim("maleEmployees"), ',', ''), ' ', '')::integer
    END
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "femaleEmployees" TYPE INTEGER
  USING (
    CASE
      WHEN "femaleEmployees" IS NULL THEN NULL
      ELSE replace(replace(trim("femaleEmployees"), ',', ''), ' ', '')::integer
    END
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "employeesWithinMunicipality" TYPE INTEGER
  USING (
    CASE
      WHEN "employeesWithinMunicipality" IS NULL THEN NULL
      ELSE replace(replace(trim("employeesWithinMunicipality"), ',', ''), ' ', '')::integer
    END
  );

-- assetSize → DECIMAL(10,3)  (max absolute value < 10^7)
UPDATE "BusinessRecord"
SET "assetSize" = NULL
WHERE "assetSize" IS NOT NULL
  AND (
    trim("assetSize") = ''
    OR replace(replace(trim("assetSize"), ',', ''), ' ', '') !~ '^[0-9]+(\.[0-9]+)?$'
    OR replace(replace(trim("assetSize"), ',', ''), ' ', '')::numeric >= 10000000
  );

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "assetSize" TYPE DECIMAL(10, 3)
  USING (
    CASE
      WHEN "assetSize" IS NULL THEN NULL
      ELSE replace(replace(trim("assetSize"), ',', ''), ' ', '')::decimal(10, 3)
    END
  );

-- deliveryVehicles: extract numeric count from free text, else NULL, then INTEGER
UPDATE "BusinessRecord"
SET "deliveryVehicles" = NULL
WHERE "deliveryVehicles" IS NOT NULL AND trim("deliveryVehicles") = '';

UPDATE "BusinessRecord"
SET "deliveryVehicles" = CASE
  WHEN "deliveryVehicles" IS NULL THEN NULL
  WHEN trim("deliveryVehicles") ~ '^[0-9]+$' THEN trim("deliveryVehicles")
  WHEN "deliveryVehicles" ~* 'van\s*/?\s*truck' OR "deliveryVehicles" ~* 'motorcycle' THEN
    NULLIF(
      COALESCE((regexp_match("deliveryVehicles", 'Van\s*/?\s*Truck:\s*([0-9]+)', 'i'))[1]::integer, 0)
      + COALESCE((regexp_match("deliveryVehicles", 'Motorcycle:\s*([0-9]+)', 'i'))[1]::integer, 0),
      0
    )::text
  ELSE (regexp_match("deliveryVehicles", '([0-9]+)'))[1]
END
WHERE "deliveryVehicles" IS NOT NULL;

UPDATE "BusinessRecord"
SET "deliveryVehicles" = NULL
WHERE "deliveryVehicles" IS NOT NULL
  AND trim("deliveryVehicles") !~ '^[0-9]+$';

ALTER TABLE "BusinessRecord"
  ALTER COLUMN "deliveryVehicles" TYPE INTEGER
  USING (
    CASE
      WHEN "deliveryVehicles" IS NULL THEN NULL
      ELSE trim("deliveryVehicles")::integer
    END
  );
