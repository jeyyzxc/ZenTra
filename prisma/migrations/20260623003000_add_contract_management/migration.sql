-- Contract Management module support.

CREATE TYPE "ContractStatus" AS ENUM (
  'DRAFT',
  'GENERATED',
  'READY_TO_SEND',
  'SENT',
  'DELIVERY_FAILED',
  'VIEWED',
  'SIGNED',
  'SUPERSEDED',
  'CANCELLED',
  'ARCHIVED'
);

CREATE TYPE "ContractWorkflowStatus" AS ENUM (
  'NOT_STARTED',
  'TRIGGERED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRYING',
  'MANUAL_FALLBACK'
);

CREATE TYPE "ContractSignatureStatus" AS ENUM (
  'NOT_SENT',
  'PENDING',
  'VIEWED',
  'SIGNED',
  'DECLINED',
  'EXPIRED'
);

CREATE TYPE "ContractTemplateType" AS ENUM (
  'EVENT_CONTRACT'
);

CREATE TABLE "contract_templates" (
  "id" TEXT NOT NULL,
  "template_name" TEXT NOT NULL,
  "template_type" "ContractTemplateType" NOT NULL DEFAULT 'EVENT_CONTRACT',
  "template_version" INTEGER NOT NULL DEFAULT 1,
  "event_type" TEXT,
  "html_template" TEXT NOT NULL,
  "static_terms_content" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "locked_sections" JSONB,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contracts" (
  "id" TEXT NOT NULL,
  "contract_number" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "booking_reference" TEXT NOT NULL,
  "client_name" TEXT NOT NULL,
  "client_email" TEXT,
  "event_type" TEXT NOT NULL,
  "event_date" TIMESTAMP(3) NOT NULL,
  "package_name" TEXT,
  "template_id" TEXT,
  "template_version" INTEGER NOT NULL DEFAULT 1,
  "contract_status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
  "email_status" "EmailStatus",
  "workflow_status" "ContractWorkflowStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "signature_status" "ContractSignatureStatus" NOT NULL DEFAULT 'NOT_SENT',
  "contract_amount" DOUBLE PRECISION,
  "total_paid" DOUBLE PRECISION,
  "remaining_balance" DOUBLE PRECISION,
  "pdf_url" TEXT,
  "html_preview" TEXT,
  "snapshot_data" JSONB,
  "resend_attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_sent_at" TIMESTAMP(3),
  "last_resend_at" TIMESTAMP(3),
  "signed_at" TIMESTAMP(3),
  "viewed_at" TIMESTAMP(3),
  "generated_by" TEXT,
  "sent_by" TEXT,
  "internal_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_versions" (
  "id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "template_version" INTEGER NOT NULL,
  "snapshot_data" JSONB NOT NULL,
  "pdf_url" TEXT,
  "html_preview" TEXT,
  "change_summary" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_timeline" (
  "id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "performed_by" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contract_timeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_send_attempts" (
  "id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "email_log_id" TEXT,
  "workflow_log_id" TEXT,
  "recipient_email" TEXT NOT NULL,
  "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
  "attempt_number" INTEGER NOT NULL,
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contract_send_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");
CREATE INDEX "contracts_booking_id_idx" ON "contracts"("booking_id");
CREATE INDEX "contracts_booking_reference_idx" ON "contracts"("booking_reference");
CREATE INDEX "contracts_client_email_idx" ON "contracts"("client_email");
CREATE INDEX "contracts_contract_status_idx" ON "contracts"("contract_status");
CREATE INDEX "contracts_email_status_idx" ON "contracts"("email_status");
CREATE INDEX "contracts_workflow_status_idx" ON "contracts"("workflow_status");
CREATE INDEX "contracts_signature_status_idx" ON "contracts"("signature_status");
CREATE INDEX "contracts_event_date_idx" ON "contracts"("event_date");
CREATE INDEX "contracts_created_at_idx" ON "contracts"("created_at");

CREATE UNIQUE INDEX "contract_versions_contract_id_version_number_key" ON "contract_versions"("contract_id", "version_number");
CREATE INDEX "contract_versions_contract_id_idx" ON "contract_versions"("contract_id");
CREATE INDEX "contract_versions_created_at_idx" ON "contract_versions"("created_at");

CREATE INDEX "contract_templates_template_type_idx" ON "contract_templates"("template_type");
CREATE INDEX "contract_templates_template_version_idx" ON "contract_templates"("template_version");
CREATE INDEX "contract_templates_event_type_idx" ON "contract_templates"("event_type");
CREATE INDEX "contract_templates_is_active_idx" ON "contract_templates"("is_active");

CREATE INDEX "contract_timeline_contract_id_idx" ON "contract_timeline"("contract_id");
CREATE INDEX "contract_timeline_created_at_idx" ON "contract_timeline"("created_at");

CREATE INDEX "contract_send_attempts_contract_id_idx" ON "contract_send_attempts"("contract_id");
CREATE INDEX "contract_send_attempts_email_log_id_idx" ON "contract_send_attempts"("email_log_id");
CREATE INDEX "contract_send_attempts_workflow_log_id_idx" ON "contract_send_attempts"("workflow_log_id");
CREATE INDEX "contract_send_attempts_status_idx" ON "contract_send_attempts"("status");
CREATE INDEX "contract_send_attempts_created_at_idx" ON "contract_send_attempts"("created_at");

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contract_versions"
  ADD CONSTRAINT "contract_versions_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_timeline"
  ADD CONSTRAINT "contract_timeline_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_send_attempts"
  ADD CONSTRAINT "contract_send_attempts_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
