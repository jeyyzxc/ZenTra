CREATE TABLE "orchestration_rate_limits" (
  "id" TEXT NOT NULL,
  "scope" VARCHAR(120) NOT NULL,
  "client_key" VARCHAR(64) NOT NULL,
  "window_started_at" TIMESTAMP(3) NOT NULL,
  "request_count" INTEGER NOT NULL DEFAULT 1,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "orchestration_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orchestration_rate_limits_expires_at_idx"
  ON "orchestration_rate_limits"("expires_at");
CREATE INDEX "orchestration_rate_limits_scope_client_key_idx"
  ON "orchestration_rate_limits"("scope", "client_key");
