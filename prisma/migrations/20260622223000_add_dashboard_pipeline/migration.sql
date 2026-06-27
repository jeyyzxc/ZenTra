-- Admin Dashboard centralized data pipeline support.

CREATE TYPE "DashboardTaskPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "DashboardTaskStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE'
);

CREATE TYPE "DashboardTaskSource" AS ENUM (
  'MANUAL',
  'SYSTEM',
  'N8N_WORKFLOW',
  'BOOKING',
  'PAYMENT',
  'CONTRACT',
  'INQUIRY',
  'CALENDAR'
);

CREATE TYPE "NotificationType" AS ENUM (
  'BOOKING',
  'PAYMENT',
  'CONTRACT',
  'INQUIRY',
  'EMAIL',
  'WORKFLOW',
  'SYSTEM',
  'CALENDAR',
  'TASK'
);

CREATE TYPE "NotificationPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "N8nWorkflowStatus" AS ENUM (
  'QUEUED',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'RETRYING',
  'CANCELLED'
);

CREATE TABLE "dashboard_tasks" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "task_date" TIMESTAMP(3) NOT NULL,
  "task_time" TEXT,
  "priority" "DashboardTaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "DashboardTaskStatus" NOT NULL DEFAULT 'PENDING',
  "assigned_to" TEXT,
  "related_module" TEXT,
  "related_record_id" TEXT,
  "source" "DashboardTaskSource" NOT NULL DEFAULT 'MANUAL',
  "reminder_option" TEXT,
  "created_by" TEXT,
  "completed_by" TEXT,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dashboard_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
  "related_module" TEXT,
  "related_record_id" TEXT,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_for" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "n8n_workflow_logs" (
  "id" TEXT NOT NULL,
  "workflow_name" TEXT NOT NULL,
  "workflow_execution_id" TEXT,
  "related_module" TEXT,
  "related_record_id" TEXT,
  "trigger_source" TEXT,
  "request_payload" JSONB,
  "response_payload" JSONB,
  "status" "N8nWorkflowStatus" NOT NULL DEFAULT 'PROCESSING',
  "error_message" TEXT,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "n8n_workflow_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dashboard_tasks_task_date_idx" ON "dashboard_tasks"("task_date");
CREATE INDEX "dashboard_tasks_status_idx" ON "dashboard_tasks"("status");
CREATE INDEX "dashboard_tasks_priority_idx" ON "dashboard_tasks"("priority");
CREATE INDEX "dashboard_tasks_assigned_to_idx" ON "dashboard_tasks"("assigned_to");
CREATE INDEX "dashboard_tasks_related_module_related_record_id_idx" ON "dashboard_tasks"("related_module", "related_record_id");
CREATE INDEX "dashboard_tasks_task_date_status_idx" ON "dashboard_tasks"("task_date", "status");

CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");
CREATE INDEX "notifications_created_for_idx" ON "notifications"("created_for");
CREATE INDEX "notifications_related_module_related_record_id_idx" ON "notifications"("related_module", "related_record_id");

CREATE INDEX "n8n_workflow_logs_created_at_idx" ON "n8n_workflow_logs"("created_at");
CREATE INDEX "n8n_workflow_logs_status_idx" ON "n8n_workflow_logs"("status");
CREATE INDEX "n8n_workflow_logs_workflow_name_idx" ON "n8n_workflow_logs"("workflow_name");
CREATE INDEX "n8n_workflow_logs_workflow_execution_id_idx" ON "n8n_workflow_logs"("workflow_execution_id");
CREATE INDEX "n8n_workflow_logs_related_module_related_record_id_idx" ON "n8n_workflow_logs"("related_module", "related_record_id");
CREATE INDEX "n8n_workflow_logs_created_at_status_idx" ON "n8n_workflow_logs"("created_at", "status");
