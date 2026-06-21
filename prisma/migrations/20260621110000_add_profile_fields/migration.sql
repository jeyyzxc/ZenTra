ALTER TABLE "User" RENAME TO "users";

ALTER TABLE "users"
ADD COLUMN "full_name" VARCHAR(255),
ADD COLUMN "contact_number" VARCHAR(20);
