ALTER TABLE "inquiries"
  ADD COLUMN "requested_event_date" TIMESTAMP(3);

CREATE INDEX "inquiries_requested_event_date_idx" ON "inquiries"("requested_event_date");
