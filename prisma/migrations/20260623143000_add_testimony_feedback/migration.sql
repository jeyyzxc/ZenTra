ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TESTIMONY';

CREATE TYPE "TestimonyStatus" AS ENUM (
  'pending_review',
  'approved',
  'hidden',
  'flagged',
  'deleted'
);

CREATE TABLE "testimonies" (
  "id" TEXT NOT NULL,
  "client_name" VARCHAR(160) NOT NULL,
  "nickname" VARCHAR(120),
  "email" VARCHAR(255),
  "event_type" VARCHAR(160) NOT NULL,
  "event_date" TIMESTAMP(3) NOT NULL,
  "package_name" VARCHAR(255),
  "booking_reference" VARCHAR(120),
  "booking_id" TEXT,
  "overall_rating" INTEGER NOT NULL,
  "approach_rating" INTEGER NOT NULL,
  "food_rating" INTEGER NOT NULL,
  "service_rating" INTEGER NOT NULL,
  "venue_rating" INTEGER,
  "communication_rating" INTEGER,
  "comment" TEXT NOT NULL,
  "photo_url" TEXT,
  "photo_path" TEXT,
  "status" "TestimonyStatus" NOT NULL DEFAULT 'pending_review',
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "is_featured" BOOLEAN NOT NULL DEFAULT false,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "hidden_by" TEXT,
  "hidden_at" TIMESTAMP(3),
  "deleted_by" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "testimonies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "testimonies_rating_range_check" CHECK (
    "overall_rating" BETWEEN 1 AND 5
    AND "approach_rating" BETWEEN 1 AND 5
    AND "food_rating" BETWEEN 1 AND 5
    AND "service_rating" BETWEEN 1 AND 5
    AND ("venue_rating" IS NULL OR "venue_rating" BETWEEN 1 AND 5)
    AND ("communication_rating" IS NULL OR "communication_rating" BETWEEN 1 AND 5)
  )
);

CREATE INDEX "testimonies_status_idx" ON "testimonies"("status");
CREATE INDEX "testimonies_is_public_idx" ON "testimonies"("is_public");
CREATE INDEX "testimonies_is_featured_idx" ON "testimonies"("is_featured");
CREATE INDEX "testimonies_submitted_at_idx" ON "testimonies"("submitted_at");
CREATE INDEX "testimonies_event_date_idx" ON "testimonies"("event_date");
CREATE INDEX "testimonies_event_type_idx" ON "testimonies"("event_type");
CREATE INDEX "testimonies_overall_rating_idx" ON "testimonies"("overall_rating");
CREATE INDEX "testimonies_booking_reference_idx" ON "testimonies"("booking_reference");
CREATE INDEX "testimonies_booking_id_idx" ON "testimonies"("booking_id");
CREATE INDEX "testimonies_status_is_public_submitted_at_idx" ON "testimonies"("status", "is_public", "submitted_at");

ALTER TABLE "testimonies"
  ADD CONSTRAINT "testimonies_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
