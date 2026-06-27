CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
  'RESCHEDULED',
  'EXPIRED',
  'ON_HOLD'
);

CREATE TYPE "BookingSource" AS ENUM (
  'ONLINE_FORM',
  'ADMIN_MANUAL',
  'N8N_WORKFLOW',
  'PAYMENT_SYNC',
  'CONTRACT_SYNC'
);

CREATE TYPE "SyncStatus" AS ENUM (
  'SYNCED',
  'PENDING_SYNC',
  'FAILED_SYNC',
  'MANUAL_UPDATE',
  'CONFLICT_DETECTED'
);

CREATE TYPE "AutomationStatus" AS ENUM (
  'NOT_STARTED',
  'TRIGGERED',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "PaymentSummaryStatus" AS ENUM (
  'UNPAID',
  'RESERVATION_PAID',
  'DOWN_PAYMENT_PAID',
  'PARTIALLY_PAID',
  'FULLY_PAID',
  'OVERDUE',
  'FAILED',
  'REFUNDED'
);

CREATE TABLE "bookings" (
  "id" TEXT NOT NULL,
  "booking_reference" TEXT NOT NULL,
  "client_name" TEXT NOT NULL,
  "client_email" TEXT,
  "client_phone" VARCHAR(20),
  "client_address" TEXT,
  "event_title" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "event_date" TIMESTAMP(3) NOT NULL,
  "start_time" TEXT,
  "end_time" TEXT,
  "venue" TEXT NOT NULL,
  "guest_count" INTEGER NOT NULL DEFAULT 0,
  "package_selected" TEXT,
  "special_requests" TEXT,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "status_changed_at" TIMESTAMP(3),
  "status_changed_by" TEXT,
  "status_change_reason" TEXT,
  "assigned_coordinator" TEXT,
  "payment_record_id" TEXT,
  "payment_summary_status" "PaymentSummaryStatus" NOT NULL DEFAULT 'UNPAID',
  "payment_total_amount" DOUBLE PRECISION,
  "payment_amount_paid" DOUBLE PRECISION,
  "payment_remaining_balance" DOUBLE PRECISION,
  "payment_due_date" TIMESTAMP(3),
  "payment_last_date" TIMESTAMP(3),
  "payment_reference" TEXT,
  "contract_record_id" TEXT,
  "contract_status" TEXT,
  "booking_source" "BookingSource" NOT NULL DEFAULT 'ADMIN_MANUAL',
  "sync_status" "SyncStatus" NOT NULL DEFAULT 'MANUAL_UPDATE',
  "automation_status" "AutomationStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "last_synced_at" TIMESTAMP(3),
  "n8n_workflow_id" TEXT,
  "n8n_execution_id" TEXT,
  "last_workflow_result" TEXT,
  "email_log_reference_id" TEXT,
  "internal_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_timeline" (
  "id" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "performed_by" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_timeline_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Event" ADD COLUMN "booking_id" TEXT;

CREATE UNIQUE INDEX "bookings_booking_reference_key" ON "bookings"("booking_reference");
CREATE INDEX "bookings_booking_reference_idx" ON "bookings"("booking_reference");
CREATE INDEX "bookings_client_email_idx" ON "bookings"("client_email");
CREATE INDEX "bookings_event_date_idx" ON "bookings"("event_date");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_booking_source_idx" ON "bookings"("booking_source");
CREATE INDEX "bookings_sync_status_idx" ON "bookings"("sync_status");
CREATE INDEX "bookings_automation_status_idx" ON "bookings"("automation_status");
CREATE INDEX "bookings_payment_summary_status_idx" ON "bookings"("payment_summary_status");
CREATE INDEX "bookings_event_date_status_idx" ON "bookings"("event_date", "status");
CREATE INDEX "bookings_client_email_event_date_idx" ON "bookings"("client_email", "event_date");
CREATE INDEX "booking_timeline_booking_id_idx" ON "booking_timeline"("booking_id");
CREATE INDEX "booking_timeline_created_at_idx" ON "booking_timeline"("created_at");
CREATE UNIQUE INDEX "Event_booking_id_key" ON "Event"("booking_id");

ALTER TABLE "booking_timeline"
ADD CONSTRAINT "booking_timeline_booking_id_fkey"
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_booking_id_fkey"
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
