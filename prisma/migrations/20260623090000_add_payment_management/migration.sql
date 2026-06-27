ALTER TYPE "PaymentSummaryStatus" ADD VALUE IF NOT EXISTS 'FOR_VERIFICATION';
ALTER TYPE "PaymentSummaryStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "PaymentSummaryStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

CREATE TYPE "PaymentType" AS ENUM (
  'DOWN_PAYMENT',
  'PARTIAL_PAYMENT',
  'FULL_PAYMENT',
  'RESERVATION_FEE',
  'ADDITIONAL_PAYMENT'
);

CREATE TYPE "PaymentVerificationStatus" AS ENUM (
  'NOT_SUBMITTED',
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

CREATE TYPE "PaymentMilestoneStatus" AS ENUM (
  'PENDING',
  'FOR_VERIFICATION',
  'PAID',
  'OVERDUE',
  'REJECTED'
);

ALTER TABLE "payment_records"
  ADD COLUMN "client_email" TEXT,
  ADD COLUMN "client_phone" VARCHAR(20),
  ADD COLUMN "event_title" TEXT,
  ADD COLUMN "event_type" TEXT,
  ADD COLUMN "event_date" TIMESTAMP(3),
  ADD COLUMN "package_name" TEXT,
  ADD COLUMN "payment_type" "PaymentType",
  ADD COLUMN "verification_status" "PaymentVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "pending_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "proof_path" TEXT,
  ADD COLUMN "proof_file_name" TEXT,
  ADD COLUMN "proof_file_type" TEXT,
  ADD COLUMN "proof_uploaded_by" TEXT,
  ADD COLUMN "proof_uploaded_at" TIMESTAMP(3),
  ADD COLUMN "verified_by" TEXT,
  ADD COLUMN "verified_at" TIMESTAMP(3),
  ADD COLUMN "created_by" TEXT,
  ADD COLUMN "updated_by" TEXT;

UPDATE "payment_records" AS payment
SET
  "client_email" = booking."client_email",
  "client_phone" = booking."client_phone",
  "event_title" = booking."event_title",
  "event_type" = booking."event_type",
  "event_date" = booking."event_date",
  "package_name" = booking."package_selected",
  "verification_status" = CASE
    WHEN payment."amount_paid" > 0 THEN 'VERIFIED'::"PaymentVerificationStatus"
    ELSE 'NOT_SUBMITTED'::"PaymentVerificationStatus"
  END
FROM "bookings" AS booking
WHERE booking."id" = payment."booking_id";

ALTER TABLE "payment_history"
  ADD COLUMN "booking_id" TEXT,
  ADD COLUMN "old_status" "PaymentSummaryStatus",
  ADD COLUMN "new_status" "PaymentSummaryStatus",
  ADD COLUMN "old_amount" DOUBLE PRECISION,
  ADD COLUMN "new_amount" DOUBLE PRECISION,
  ADD COLUMN "old_balance" DOUBLE PRECISION,
  ADD COLUMN "new_balance" DOUBLE PRECISION,
  ADD COLUMN "payment_amount" DOUBLE PRECISION,
  ADD COLUMN "payment_type" "PaymentType",
  ADD COLUMN "payment_method" TEXT,
  ADD COLUMN "proof_path" TEXT,
  ADD COLUMN "proof_file_name" TEXT,
  ADD COLUMN "proof_file_type" TEXT,
  ADD COLUMN "verification_status" "PaymentVerificationStatus",
  ADD COLUMN "notes" TEXT;

UPDATE "payment_history" AS history
SET "booking_id" = payment."booking_id"
FROM "payment_records" AS payment
WHERE payment."id" = history."payment_id";

CREATE TABLE "payment_milestones" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "milestone_name" TEXT NOT NULL,
  "amount_required" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "due_date" TIMESTAMP(3),
  "status" "PaymentMilestoneStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_milestones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_records_verification_status_idx" ON "payment_records"("verification_status");
CREATE INDEX "payment_records_payment_type_idx" ON "payment_records"("payment_type");
CREATE INDEX "payment_records_payment_date_idx" ON "payment_records"("payment_date");
CREATE INDEX "payment_history_booking_id_idx" ON "payment_history"("booking_id");
CREATE INDEX "payment_history_action_idx" ON "payment_history"("action");
CREATE INDEX "payment_milestones_payment_id_idx" ON "payment_milestones"("payment_id");
CREATE INDEX "payment_milestones_booking_id_idx" ON "payment_milestones"("booking_id");
CREATE INDEX "payment_milestones_due_date_idx" ON "payment_milestones"("due_date");
CREATE INDEX "payment_milestones_status_idx" ON "payment_milestones"("status");

ALTER TABLE "payment_milestones"
  ADD CONSTRAINT "payment_milestones_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
