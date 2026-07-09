ALTER TABLE "users"
DROP COLUMN IF EXISTS "address_line",
ADD COLUMN IF NOT EXISTS "address_region_code" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "address_province_code" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "address_city_code" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "address_barangay_code" VARCHAR(20);
