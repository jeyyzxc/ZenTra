-- Secure team-member access pipeline.
-- Stores only password hashes and hashed, expiring, single-use account tokens.

CREATE TYPE "UserStatus" AS ENUM (
  'PENDING_SETUP',
  'ACTIVE',
  'TEMP_ACCESS',
  'PASSWORD_RESET_REQUIRED',
  'DISABLED',
  'LOCKED',
  'INVITATION_EXPIRED',
  'RESET_EXPIRED'
);

CREATE TYPE "AccountTokenType" AS ENUM (
  'INVITATION',
  'PASSWORD_RESET',
  'TEMP_LOGIN'
);

CREATE TYPE "SessionAccessScope" AS ENUM (
  'FULL_ACCESS',
  'PASSWORD_CHANGE_ONLY'
);

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEAM_MEMBER_INVITED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVITATION_RESENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_LINK_SENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEMP_ACCESS_CODE_SENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEMP_ACCESS_EXPIRED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_LOCKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROLE_CHANGED';

ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'TEAM_INVITATION';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'TEAM_PASSWORD_RESET';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'TEAM_TEMP_ACCESS';

ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash";

ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL,
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "created_by" TEXT,
  ADD COLUMN "last_password_changed_at" TIMESTAMP(3);

CREATE TABLE "account_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "token_type" "AccountTokenType" NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" VARCHAR(100),
  "user_agent" TEXT,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "locked_at" TIMESTAMP(3),

  CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "session_token_hash" TEXT NOT NULL,
  "access_scope" "SessionAccessScope" NOT NULL DEFAULT 'FULL_ACCESS',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_tokens_user_id_idx" ON "account_tokens"("user_id");
CREATE INDEX "account_tokens_token_hash_idx" ON "account_tokens"("token_hash");
CREATE INDEX "account_tokens_token_type_idx" ON "account_tokens"("token_type");
CREATE INDEX "account_tokens_expires_at_idx" ON "account_tokens"("expires_at");
CREATE INDEX "account_tokens_used_at_idx" ON "account_tokens"("used_at");

CREATE UNIQUE INDEX "sessions_session_token_hash_key" ON "sessions"("session_token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_access_scope_idx" ON "sessions"("access_scope");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "sessions_revoked_at_idx" ON "sessions"("revoked_at");

ALTER TABLE "account_tokens"
  ADD CONSTRAINT "account_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
