-- Temporary Demo Client-to-Admin Bridge support.

ALTER TYPE "BookingSource" ADD VALUE IF NOT EXISTS 'DEMO_CLIENT_ADMIN_BRIDGE';
ALTER TYPE "AutomationStatus" ADD VALUE IF NOT EXISTS 'DEMO_MODE';
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'NOT_SENT';
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'PENDING_DEMO';
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'SENT_DEMO';
ALTER TYPE "TriggerSource" ADD VALUE IF NOT EXISTS 'DEMO_CLIENT_ADMIN_BRIDGE';
ALTER TYPE "ContractWorkflowStatus" ADD VALUE IF NOT EXISTS 'DEMO_MODE';
ALTER TYPE "ContractSignatureStatus" ADD VALUE IF NOT EXISTS 'UNSIGNED';

ALTER TABLE "Event"
  ADD COLUMN "demo_bridge_id" TEXT,
  ADD COLUMN "source" VARCHAR(80);

ALTER TABLE "bookings"
  ADD COLUMN "theme" TEXT,
  ADD COLUMN "colors" TEXT,
  ADD COLUMN "demo_bridge_id" TEXT,
  ADD COLUMN "demo_session_id" TEXT,
  ADD COLUMN "demo_idempotency_key" TEXT;

ALTER TABLE "audit_logs"
  ADD COLUMN "source" VARCHAR(80),
  ADD COLUMN "demo_bridge_id" TEXT;

ALTER TABLE "contracts"
  ADD COLUMN "source" VARCHAR(80),
  ADD COLUMN "demo_bridge_id" TEXT;

ALTER TABLE "notifications"
  ADD COLUMN "source" VARCHAR(80),
  ADD COLUMN "demo_bridge_id" TEXT;

CREATE TABLE "payment_records" (
  "id" TEXT NOT NULL,
  "payment_reference" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "booking_reference" TEXT NOT NULL,
  "client_name" TEXT NOT NULL,
  "status" "PaymentSummaryStatus" NOT NULL DEFAULT 'UNPAID',
  "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remaining_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "payment_method" TEXT,
  "payment_date" TIMESTAMP(3),
  "due_date" TIMESTAMP(3),
  "notes" TEXT,
  "source" VARCHAR(80) NOT NULL,
  "demo_bridge_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_history" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "previous_value" JSONB,
  "new_value" JSONB,
  "performed_by" TEXT NOT NULL,
  "source" VARCHAR(80) NOT NULL,
  "demo_bridge_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Event_demo_bridge_id_key" ON "Event"("demo_bridge_id");
CREATE UNIQUE INDEX "bookings_demo_bridge_id_key" ON "bookings"("demo_bridge_id");
CREATE UNIQUE INDEX "bookings_demo_idempotency_key_key" ON "bookings"("demo_idempotency_key");
CREATE INDEX "bookings_demo_session_id_idx" ON "bookings"("demo_session_id");
CREATE INDEX "audit_logs_demo_bridge_id_idx" ON "audit_logs"("demo_bridge_id");
CREATE UNIQUE INDEX "contracts_demo_bridge_id_key" ON "contracts"("demo_bridge_id");
CREATE UNIQUE INDEX "notifications_demo_bridge_id_key" ON "notifications"("demo_bridge_id");
CREATE UNIQUE INDEX "payment_records_payment_reference_key" ON "payment_records"("payment_reference");
CREATE UNIQUE INDEX "payment_records_booking_id_key" ON "payment_records"("booking_id");
CREATE UNIQUE INDEX "payment_records_demo_bridge_id_key" ON "payment_records"("demo_bridge_id");
CREATE INDEX "payment_records_status_idx" ON "payment_records"("status");
CREATE INDEX "payment_records_booking_reference_idx" ON "payment_records"("booking_reference");
CREATE INDEX "payment_records_due_date_idx" ON "payment_records"("due_date");
CREATE INDEX "payment_records_created_at_idx" ON "payment_records"("created_at");
CREATE INDEX "payment_history_payment_id_idx" ON "payment_history"("payment_id");
CREATE INDEX "payment_history_demo_bridge_id_idx" ON "payment_history"("demo_bridge_id");
CREATE INDEX "payment_history_created_at_idx" ON "payment_history"("created_at");

ALTER TABLE "payment_records"
  ADD CONSTRAINT "payment_records_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_history"
  ADD CONSTRAINT "payment_history_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
