CREATE TABLE "booking_orchestration_contexts" (
  "id" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "booking_reference" TEXT NOT NULL,
  "event_category" TEXT NOT NULL,
  "event_category_key" TEXT NOT NULL,
  "package_category" TEXT NOT NULL,
  "package_tier" TEXT NOT NULL,
  "task_template_key" TEXT NOT NULL,
  "risk_level" TEXT NOT NULL,
  "has_schedule_conflict" BOOLEAN NOT NULL DEFAULT false,
  "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
  "suggested_admin_role" TEXT NOT NULL DEFAULT 'ADMIN',
  "tags" JSONB,
  "reason_codes" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "booking_orchestration_contexts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_orchestration_contexts_booking_id_key" ON "booking_orchestration_contexts"("booking_id");
CREATE INDEX "booking_orchestration_contexts_booking_reference_idx" ON "booking_orchestration_contexts"("booking_reference");
CREATE INDEX "booking_orchestration_contexts_event_category_key_idx" ON "booking_orchestration_contexts"("event_category_key");
CREATE INDEX "booking_orchestration_contexts_task_template_key_idx" ON "booking_orchestration_contexts"("task_template_key");
CREATE INDEX "booking_orchestration_contexts_risk_level_idx" ON "booking_orchestration_contexts"("risk_level");

ALTER TABLE "booking_orchestration_contexts"
  ADD CONSTRAINT "booking_orchestration_contexts_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dashboard_tasks"
  ADD COLUMN "order_index" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "task_template_key" TEXT,
  ADD COLUMN "activation_status" TEXT DEFAULT 'active',
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "is_editable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "started_at" TIMESTAMP(3);

CREATE INDEX "dashboard_tasks_task_template_key_idx" ON "dashboard_tasks"("task_template_key");
CREATE INDEX "dashboard_tasks_activation_status_idx" ON "dashboard_tasks"("activation_status");
CREATE INDEX "dashboard_tasks_is_active_idx" ON "dashboard_tasks"("is_active");
CREATE INDEX "dashboard_tasks_related_record_id_order_index_idx" ON "dashboard_tasks"("related_record_id", "order_index");
