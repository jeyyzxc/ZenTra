ALTER TABLE "Inquiry" RENAME TO "inquiries";
ALTER TABLE "inquiries" RENAME COLUMN "name" TO "full_name";
ALTER TABLE "inquiries" RENAME COLUMN "phone" TO "phone_number";
ALTER TABLE "inquiries" RENAME COLUMN "createdAt" TO "created_at";

CREATE TYPE "InquiryStatus_new" AS ENUM (
  'new',
  'pending_response',
  'answered',
  'follow_up',
  'converted_to_booking',
  'closed',
  'spam'
);

ALTER TABLE "inquiries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "inquiries"
  ALTER COLUMN "status" TYPE "InquiryStatus_new"
  USING (
    CASE "status"::text
      WHEN 'UNREAD' THEN 'new'
      WHEN 'READ' THEN 'pending_response'
      WHEN 'REPLIED' THEN 'answered'
      ELSE 'new'
    END
  )::"InquiryStatus_new";
DROP TYPE "InquiryStatus";
ALTER TYPE "InquiryStatus_new" RENAME TO "InquiryStatus";

CREATE TYPE "InquiryPriority" AS ENUM ('low', 'normal', 'high');

ALTER TABLE "inquiries"
  ADD COLUMN "inquiry_reference" VARCHAR(80),
  ADD COLUMN "preferred_contact_time" VARCHAR(100),
  ADD COLUMN "event_interest" VARCHAR(180),
  ADD COLUMN "package_interest" VARCHAR(255),
  ADD COLUMN "source_page" VARCHAR(80) NOT NULL DEFAULT 'contact_us',
  ADD COLUMN "priority" "InquiryPriority" NOT NULL DEFAULT 'normal',
  ADD COLUMN "assigned_to" VARCHAR(180),
  ADD COLUMN "related_booking_id" TEXT,
  ADD COLUMN "submitted_at" TIMESTAMP(3),
  ADD COLUMN "answered_at" TIMESTAMP(3),
  ADD COLUMN "closed_at" TIMESTAMP(3),
  ADD COLUMN "updated_at" TIMESTAMP(3);

UPDATE "inquiries"
SET
  "inquiry_reference" = CONCAT('INQ-LEGACY-', UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 12))),
  "submitted_at" = "created_at",
  "updated_at" = "created_at";

ALTER TABLE "inquiries"
  ALTER COLUMN "inquiry_reference" SET NOT NULL,
  ALTER COLUMN "submitted_at" SET NOT NULL,
  ALTER COLUMN "submitted_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'new';

CREATE UNIQUE INDEX "inquiries_inquiry_reference_key" ON "inquiries"("inquiry_reference");
CREATE INDEX "inquiries_submitted_at_idx" ON "inquiries"("submitted_at");
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");
CREATE INDEX "inquiries_priority_idx" ON "inquiries"("priority");
CREATE INDEX "inquiries_assigned_to_idx" ON "inquiries"("assigned_to");
CREATE INDEX "inquiries_event_interest_idx" ON "inquiries"("event_interest");
CREATE INDEX "inquiries_preferred_contact_time_idx" ON "inquiries"("preferred_contact_time");
CREATE INDEX "inquiries_related_booking_id_idx" ON "inquiries"("related_booking_id");
CREATE INDEX "inquiries_status_priority_submitted_at_idx" ON "inquiries"("status", "priority", "submitted_at");

ALTER TABLE "inquiries"
  ADD CONSTRAINT "inquiries_related_booking_id_fkey"
  FOREIGN KEY ("related_booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "inquiry_notes" (
  "id" TEXT NOT NULL,
  "inquiry_id" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "created_by" VARCHAR(180) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inquiry_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inquiry_notes_inquiry_id_idx" ON "inquiry_notes"("inquiry_id");
CREATE INDEX "inquiry_notes_created_at_idx" ON "inquiry_notes"("created_at");

ALTER TABLE "inquiry_notes"
  ADD CONSTRAINT "inquiry_notes_inquiry_id_fkey"
  FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "inquiry_activity" (
  "id" TEXT NOT NULL,
  "inquiry_id" TEXT NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "performed_by" VARCHAR(180) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inquiry_activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inquiry_activity_inquiry_id_idx" ON "inquiry_activity"("inquiry_id");
CREATE INDEX "inquiry_activity_created_at_idx" ON "inquiry_activity"("created_at");

ALTER TABLE "inquiry_activity"
  ADD CONSTRAINT "inquiry_activity_inquiry_id_fkey"
  FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
