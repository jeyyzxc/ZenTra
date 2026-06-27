-- Audit Logs Module
-- Append-only event store for ZenTra administrative and system activity.

CREATE TYPE "AuditAction" AS ENUM (
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGE',
  'PROFILE_UPDATE',
  'SETTINGS_CHANGE',
  'APPROVAL',
  'REJECTION',
  'SUBMISSION',
  'FILE_UPLOAD',
  'FILE_DELETE',
  'PERMISSION_CHANGE',
  'ROLE_ASSIGNMENT',
  'SYSTEM_CONFIG',
  'EXPORT',
  'ERROR'
);

CREATE TYPE "AuditStatus" AS ENUM (
  'SUCCESS',
  'FAILED',
  'WARNING',
  'INFO'
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_id" TEXT,
  "user_name" TEXT NOT NULL,
  "user_role" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "module" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "AuditStatus" NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "previous_values" JSONB,
  "new_values" JSONB,
  "metadata" JSONB,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");
CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");
CREATE INDEX "audit_logs_timestamp_action_idx" ON "audit_logs"("timestamp", "action");
CREATE INDEX "audit_logs_timestamp_user_id_idx" ON "audit_logs"("timestamp", "user_id");
