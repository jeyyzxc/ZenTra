-- Support Center source-of-truth for Client FAQ and Smart Assistant knowledge.

CREATE TYPE "SupportFaqStatus" AS ENUM (
  'draft',
  'published',
  'hidden',
  'archived',
  'needs_review'
);

CREATE TYPE "SupportCategoryStatus" AS ENUM (
  'active',
  'hidden',
  'archived'
);

CREATE TYPE "SupportRelatedModule" AS ENUM (
  'booking',
  'packages',
  'payments',
  'contracts',
  'calendar',
  'venue',
  'inquiries',
  'testimonies',
  'general'
);

CREATE TYPE "AssistantQuestionStatus" AS ENUM (
  'new',
  'reviewed',
  'answered',
  'converted_to_faq',
  'ignored',
  'archived'
);

CREATE TABLE "support_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "status" "SupportCategoryStatus" NOT NULL DEFAULT 'active',
  "client_visible" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_faq_entries" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category_id" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "related_module" "SupportRelatedModule" NOT NULL DEFAULT 'general',
  "status" "SupportFaqStatus" NOT NULL DEFAULT 'draft',
  "client_visible" BOOLEAN NOT NULL DEFAULT false,
  "assistant_enabled" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "last_used_by_assistant_at" TIMESTAMP(3),
  "internal_notes" TEXT,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_faq_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_faq_versions" (
  "id" TEXT NOT NULL,
  "faq_entry_id" TEXT NOT NULL,
  "old_question" TEXT,
  "old_answer" TEXT,
  "new_question" TEXT,
  "new_answer" TEXT,
  "change_summary" TEXT,
  "changed_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_faq_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_unanswered_questions" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "source_page" TEXT DEFAULT 'smart_assistant',
  "suggested_category" TEXT,
  "match_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "AssistantQuestionStatus" NOT NULL DEFAULT 'new',
  "converted_faq_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assistant_unanswered_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_test_logs" (
  "id" TEXT NOT NULL,
  "test_question" TEXT NOT NULL,
  "matched_faq_id" TEXT,
  "response_preview" TEXT NOT NULL,
  "match_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tested_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_test_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_categories_slug_key" ON "support_categories"("slug");
CREATE INDEX "support_categories_status_idx" ON "support_categories"("status");
CREATE INDEX "support_categories_client_visible_idx" ON "support_categories"("client_visible");
CREATE INDEX "support_categories_display_order_idx" ON "support_categories"("display_order");
CREATE INDEX "support_categories_status_client_visible_idx" ON "support_categories"("status", "client_visible");

CREATE INDEX "support_faq_entries_category_id_idx" ON "support_faq_entries"("category_id");
CREATE INDEX "support_faq_entries_status_idx" ON "support_faq_entries"("status");
CREATE INDEX "support_faq_entries_client_visible_idx" ON "support_faq_entries"("client_visible");
CREATE INDEX "support_faq_entries_assistant_enabled_idx" ON "support_faq_entries"("assistant_enabled");
CREATE INDEX "support_faq_entries_related_module_idx" ON "support_faq_entries"("related_module");
CREATE INDEX "support_faq_entries_priority_idx" ON "support_faq_entries"("priority");
CREATE INDEX "support_faq_entries_updated_at_idx" ON "support_faq_entries"("updated_at");
CREATE INDEX "support_faq_entries_status_client_visible_idx" ON "support_faq_entries"("status", "client_visible");
CREATE INDEX "support_faq_entries_status_assistant_enabled_idx" ON "support_faq_entries"("status", "assistant_enabled");

CREATE INDEX "support_faq_versions_faq_entry_id_idx" ON "support_faq_versions"("faq_entry_id");
CREATE INDEX "support_faq_versions_created_at_idx" ON "support_faq_versions"("created_at");

CREATE INDEX "assistant_unanswered_questions_status_idx" ON "assistant_unanswered_questions"("status");
CREATE INDEX "assistant_unanswered_questions_source_page_idx" ON "assistant_unanswered_questions"("source_page");
CREATE INDEX "assistant_unanswered_questions_match_confidence_idx" ON "assistant_unanswered_questions"("match_confidence");
CREATE INDEX "assistant_unanswered_questions_created_at_idx" ON "assistant_unanswered_questions"("created_at");

CREATE INDEX "assistant_test_logs_matched_faq_id_idx" ON "assistant_test_logs"("matched_faq_id");
CREATE INDEX "assistant_test_logs_match_confidence_idx" ON "assistant_test_logs"("match_confidence");
CREATE INDEX "assistant_test_logs_created_at_idx" ON "assistant_test_logs"("created_at");

ALTER TABLE "support_faq_entries"
  ADD CONSTRAINT "support_faq_entries_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "support_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_faq_versions"
  ADD CONSTRAINT "support_faq_versions_faq_entry_id_fkey"
  FOREIGN KEY ("faq_entry_id") REFERENCES "support_faq_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assistant_unanswered_questions"
  ADD CONSTRAINT "assistant_unanswered_questions_converted_faq_id_fkey"
  FOREIGN KEY ("converted_faq_id") REFERENCES "support_faq_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assistant_test_logs"
  ADD CONSTRAINT "assistant_test_logs_matched_faq_id_fkey"
  FOREIGN KEY ("matched_faq_id") REFERENCES "support_faq_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "support_categories" (
  "id", "name", "slug", "description", "display_order", "status", "client_visible", "created_by", "updated_by", "created_at", "updated_at"
) VALUES
  ('support-cat-booking-process', 'Booking Process', 'booking-process', 'Reservation steps, date checks, and booking guidance.', 10, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-event-packages', 'Event Packages', 'event-packages', 'Package customization, inclusions, and event offer guidance.', 20, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-payment-down-payment', 'Payment and Down Payment', 'payment-and-down-payment', 'Payment reminders, down payment guidance, and balance questions.', 30, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-contract-signing', 'Contract and Signing', 'contract-and-signing', 'Contract review, signing, and booking agreement support.', 40, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-venue-rules', 'Venue Rules', 'venue-rules', 'Venue use, suppliers, parking, ceremonies, and house rules.', 50, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-schedule-availability', 'Schedule and Availability', 'schedule-and-availability', 'Event schedules, exclusivity, and availability guidance.', 60, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-ocular-visit', 'Ocular Visit', 'ocular-visit', 'Viewing appointments and venue visit reminders.', 70, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-client-requirements', 'Client Requirements', 'client-requirements', 'Information clients should prepare before booking.', 80, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-food-catering', 'Food and Catering', 'food-and-catering', 'Catering, food service, and supplier-related answers.', 90, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-rooms-amenities', 'Rooms and Amenities', 'rooms-and-amenities', 'Rooms, amenities, comfort, and venue facilities.', 100, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-cat-contact-inquiry', 'Contact and Inquiry', 'contact-and-inquiry', 'Contact details, inquiry form, and directions support.', 110, 'active', true, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "support_faq_entries" (
  "id", "question", "answer", "category_id", "tags", "related_module", "status", "client_visible", "assistant_enabled", "priority", "view_count", "created_by", "updated_by", "created_at", "updated_at"
) VALUES
  ('support-faq-book-date', 'How do I book a date?', 'You can book a date by clicking the Book Now button and completing the step-by-step reservation process. You may select your preferred date, theme, and package, then the Zion Events Place team will review the request before confirmation.', 'support-cat-booking-process', ARRAY['book', 'reserve', 'schedule', 'date'], 'booking', 'published', true, true, 100, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-capacity', 'What is the maximum guest capacity of Zion Events Place?', 'Zion Events Place can accommodate large celebrations and intimate gatherings. For the best guidance on exact capacity for your event setup, share your expected guest count with the team so they can recommend the right arrangement.', 'support-cat-venue-rules', ARRAY['capacity', 'guests', 'pax', 'attendees'], 'venue', 'published', true, true, 95, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-catering', 'Do you offer catering services?', 'Zion Events Place offers event packages that may include catering options depending on the selected package. Please review the current package details or send an inquiry so the team can confirm the latest inclusions for your event.', 'support-cat-food-catering', ARRAY['catering', 'food', 'menu'], 'packages', 'published', true, true, 90, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-suppliers', 'Can we bring our own suppliers?', 'Supplier arrangements depend on the venue rules, package, and confirmed event agreement. Please coordinate your preferred suppliers with the Zion Events Place team so they can confirm what is allowed and whether any supplier fees apply.', 'support-cat-venue-rules', ARRAY['supplier', 'vendor', 'corkage', 'open vendor'], 'venue', 'published', true, true, 88, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-parking', 'Do you provide parking for guests?', 'Parking guidance may vary based on the event size and final arrangement. Please include your expected number of vehicles when you inquire so the team can advise on parking availability for your schedule.', 'support-cat-venue-rules', ARRAY['parking', 'cars', 'vehicles'], 'venue', 'published', true, true, 86, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-aircon', 'Is the venue fully air-conditioned?', 'Indoor venue areas are arranged for guest comfort. If air-conditioning or a specific room setup is important for your event, please confirm the room and package details with Zion Events Place before finalizing.', 'support-cat-rooms-amenities', ARRAY['aircon', 'air-conditioned', 'comfort'], 'venue', 'published', true, true, 84, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-generator', 'Do you provide a generator in case of power outages?', 'Power backup arrangements should be confirmed with the Zion Events Place team for your event date and package. Please raise this during inquiry or booking review so the team can provide the approved details.', 'support-cat-venue-rules', ARRAY['generator', 'power', 'outage', 'electricity'], 'venue', 'published', true, true, 82, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-room', 'Is there a dedicated room for the celebrant or bride?', 'Room access depends on the selected venue space, package, and event arrangement. Please ask the team about preparation rooms or suites when reviewing your booking details.', 'support-cat-rooms-amenities', ARRAY['room', 'bride', 'celebrant', 'dressing'], 'venue', 'published', true, true, 80, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-ceremony', 'Can we hold a Christian ceremony or a Christening on-site?', 'Zion Events Place can support different celebration formats depending on the event setup and schedule. Please share the ceremony type during inquiry so the team can confirm whether the venue arrangement is suitable.', 'support-cat-venue-rules', ARRAY['christian', 'christening', 'ceremony', 'wedding ceremony'], 'venue', 'published', true, true, 78, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-location', 'Where are you located?', 'Zion Events Place is located at Father Masi Street, Holiday Hills, Barangay San Antonio, San Pedro, Philippines, 4023. You can also check the Contact Us page for the map and directions.', 'support-cat-contact-inquiry', ARRAY['location', 'address', 'directions', 'map'], 'general', 'published', true, true, 76, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-one-event', 'Do you hold only one event per day?', 'Event exclusivity and scheduling depend on the date, venue space, and booking arrangement. Please ask the Zion Events Place team to confirm availability and schedule rules for your preferred date.', 'support-cat-schedule-availability', ARRAY['one event', 'exclusive', 'schedule', 'availability'], 'calendar', 'published', true, true, 74, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-custom-packages', 'Are your wedding packages customizable?', 'Package customization may be available depending on the selected package, event needs, and approval from the Zion Events Place team. Share your preferred changes during inquiry so the team can review them properly.', 'support-cat-event-packages', ARRAY['customize', 'customizable', 'wedding package', 'package'], 'packages', 'published', true, true, 72, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-ocular-visit', 'Can we do an ocular visit without a prior appointment?', 'Ocular visits are best scheduled in advance so the team can prepare and give you proper assistance. Please contact Zion Events Place before visiting to confirm an available appointment time.', 'support-cat-ocular-visit', ARRAY['ocular', 'visit', 'appointment', 'tour', 'walk-in'], 'inquiries', 'published', true, true, 70, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('support-faq-payment-guidance', 'How should we confirm payment or down payment details?', 'Payment and down payment details must follow the confirmed quotation, package, and contract issued by Zion Events Place. Please contact the team directly before sending payments or relying on any amount not shown in your official booking records.', 'support-cat-payment-down-payment', ARRAY['payment', 'down payment', 'balance', 'quotation'], 'payments', 'published', true, true, 68, 0, 'system', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
