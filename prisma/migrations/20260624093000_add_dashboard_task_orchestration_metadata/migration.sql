ALTER TABLE "dashboard_tasks"
  ADD COLUMN "assigned_to_role" TEXT,
  ADD COLUMN "booking_reference" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "workflow_name" TEXT,
  ADD COLUMN "workflow_execution_id" TEXT;

CREATE INDEX "dashboard_tasks_assigned_to_role_idx" ON "dashboard_tasks"("assigned_to_role");
CREATE INDEX "dashboard_tasks_booking_reference_idx" ON "dashboard_tasks"("booking_reference");
CREATE INDEX "dashboard_tasks_category_idx" ON "dashboard_tasks"("category");
CREATE INDEX "dashboard_tasks_workflow_execution_id_idx" ON "dashboard_tasks"("workflow_execution_id");
CREATE INDEX "dashboard_tasks_related_record_id_workflow_execution_id_idx" ON "dashboard_tasks"("related_record_id", "workflow_execution_id");
CREATE UNIQUE INDEX "dashboard_tasks_related_record_id_workflow_execution_id_title_key" ON "dashboard_tasks"("related_record_id", "workflow_execution_id", "title");
