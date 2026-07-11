ALTER TABLE "users"
ADD COLUMN "address_line" VARCHAR(255),
ADD COLUMN "address_region" VARCHAR(120),
ADD COLUMN "address_province" VARCHAR(120),
ADD COLUMN "address_city" VARCHAR(120),
ADD COLUMN "address_barangay" VARCHAR(120);
