ALTER TABLE "bookings"
  ADD COLUMN "email_status" TEXT DEFAULT 'pending',
  ADD COLUMN "email_type" TEXT,
  ADD COLUMN "last_email_sent_at" TIMESTAMP(3);

CREATE INDEX "bookings_email_status_idx" ON "bookings"("email_status");
CREATE INDEX "bookings_email_type_idx" ON "bookings"("email_type");
CREATE INDEX "bookings_last_email_sent_at_idx" ON "bookings"("last_email_sent_at");
