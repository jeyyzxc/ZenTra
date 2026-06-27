-- Email Logs Module
-- Mutable delivery-status log for automated email tracking.

CREATE TYPE "EmailType" AS ENUM (
  'EMAIL_VERIFICATION',
  'BOOKING_CONFIRMATION',
  'BOOKING_UPDATE',
  'PAYMENT_REMINDER',
  'CONTRACT_LINK',
  'CONTRACT_DELIVERED',
  'INQUIRY_REPLY',
  'CANCELLATION_NOTICE',
  'RESCHEDULE_NOTICE',
  'ADMIN_NOTIFICATION',
  'GENERAL'
);

CREATE TYPE "EmailStatus" AS ENUM (
  'QUEUED',
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'RETRIED'
);

CREATE TYPE "TriggerSource" AS ENUM (
  'SYSTEM',
  'AI_ORCHESTRATION',
  'N8N_WORKFLOW',
  'MANUAL_RESEND'
);

CREATE TYPE "RelatedModule" AS ENUM (
  'BOOKING',
  'CONTRACT',
  'PAYMENT',
  'INQUIRY',
  'USER',
  'ADMIN_NOTIFICATION'
);

CREATE TABLE "email_logs" (
  "id" TEXT NOT NULL,
  "recipient_email" TEXT NOT NULL,
  "recipient_name" TEXT,
  "email_type" "EmailType" NOT NULL,
  "related_module" "RelatedModule",
  "related_record_id" TEXT,
  "subject" TEXT NOT NULL,
  "trigger_source" "TriggerSource" NOT NULL,
  "workflow_name" TEXT,
  "workflow_execution_id" TEXT,
  "provider_message_id" TEXT,
  "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "last_attempt_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "error_message" TEXT,
  "failure_reason" TEXT,
  "email_preview" TEXT,
  "payload_summary" JSONB,
  "resent_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");
CREATE INDEX "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");
CREATE INDEX "email_logs_email_type_idx" ON "email_logs"("email_type");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX "email_logs_trigger_source_idx" ON "email_logs"("trigger_source");
CREATE INDEX "email_logs_related_module_related_record_id_idx" ON "email_logs"("related_module", "related_record_id");
CREATE INDEX "email_logs_created_at_status_idx" ON "email_logs"("created_at", "status");
