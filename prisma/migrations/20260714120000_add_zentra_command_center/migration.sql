-- ZENTRA Command Center: immutable content, knowledge retrieval, worker jobs,
-- booking-scoped assistant access, and reviewed task-template migrations.
-- pgvector is a hard production prerequisite. This statement intentionally aborts
-- the migration when the database cannot install or expose the extension.
CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'ZENTRA Command Center requires the PostgreSQL vector extension';
  END IF;
END $$;

CREATE TYPE "TaskTemplateSyncState" AS ENUM ('SYNCED', 'CUSTOMIZED', 'LOCKED');
CREATE TYPE "TaskTemplateMigrationStatus" AS ENUM ('PREVIEWED', 'APPLYING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'EXPIRED', 'REJECTED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "ContentType" AS ENUM ('GALLERY_ITEM', 'FACILITY', 'RULES', 'PRIVACY', 'TERMS');
CREATE TYPE "MediaAssetStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'TRASHED', 'DELETED');
CREATE TYPE "KnowledgeDocumentType" AS ENUM ('TEXT', 'PDF', 'DOCX');
CREATE TYPE "KnowledgeAccessLevel" AS ENUM ('PUBLIC', 'CLIENT', 'ADMIN', 'SUPERADMIN');
CREATE TYPE "KnowledgeIndexStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');
CREATE TYPE "CommandCenterJobType" AS ENUM ('PUBLISH_VERSION', 'EXPIRE_VERSION', 'INDEX_KNOWLEDGE', 'DELETE_MEDIA', 'TASK_MIGRATION');
CREATE TYPE "CommandCenterJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRYING', 'CANCELLED');
CREATE TYPE "AssistantActorType" AS ENUM ('GUEST', 'CLIENT', 'ADMIN', 'SUPERADMIN');
CREATE TYPE "AssistantResponseStatus" AS ENUM ('ANSWERED', 'UNABLE_TO_VERIFY', 'FORBIDDEN', 'PROVIDER_UNAVAILABLE', 'FAILED');

ALTER TABLE "task_template_items" ADD COLUMN "item_key" VARCHAR(80);
ALTER TABLE "task_template_items" DISABLE TRIGGER "task_template_items_published_immutability";
UPDATE "task_template_items" SET "item_key" = "id" WHERE "item_key" IS NULL;
ALTER TABLE "task_template_items" ENABLE TRIGGER "task_template_items_published_immutability";
ALTER TABLE "task_template_items" ALTER COLUMN "item_key" SET NOT NULL;
CREATE UNIQUE INDEX "task_template_items_task_template_id_item_key_key"
  ON "task_template_items"("task_template_id", "item_key");

ALTER TABLE "dashboard_tasks"
  ADD COLUMN "manual_override_at" TIMESTAMP(3),
  ADD COLUMN "manual_override_by" TEXT,
  ADD COLUMN "template_content_hash" VARCHAR(64),
  ADD COLUMN "template_item_key" VARCHAR(80),
  ADD COLUMN "template_migration_run_id" TEXT,
  ADD COLUMN "template_sync_state" "TaskTemplateSyncState" NOT NULL DEFAULT 'SYNCED';

UPDATE "dashboard_tasks" AS task
SET "template_item_key" = item."item_key",
    "template_sync_state" = 'LOCKED'
FROM "task_template_items" AS item
WHERE task."template_item_id" = item."id";

ALTER TABLE "support_faq_entries"
  ADD COLUMN "current_draft_version_id" TEXT,
  ADD COLUMN "current_published_version_id" TEXT;

ALTER TABLE "support_faq_versions"
  ADD COLUMN "answer" TEXT,
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "approved_by" TEXT,
  ADD COLUMN "assistant_enabled" BOOLEAN,
  ADD COLUMN "category_id" TEXT,
  ADD COLUMN "client_visible" BOOLEAN,
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "internal_notes" TEXT,
  ADD COLUMN "priority" INTEGER,
  ADD COLUMN "publication_status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "publish_at" TIMESTAMP(3),
  ADD COLUMN "published_at" TIMESTAMP(3),
  ADD COLUMN "published_by" TEXT,
  ADD COLUMN "question" TEXT,
  ADD COLUMN "related_module" "SupportRelatedModule",
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "version_number" INTEGER;

CREATE TABLE "gallery_collections" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "event_category_id" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gallery_collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_items" (
  "id" TEXT NOT NULL,
  "type" "ContentType" NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "collection_id" TEXT,
  "event_category_id" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_versions" (
  "id" TEXT NOT NULL,
  "content_item_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "payload" JSONB NOT NULL,
  "change_summary" TEXT,
  "internal_notes" TEXT,
  "publish_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "approved_by" TEXT,
  "published_by" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_assets" (
  "id" TEXT NOT NULL,
  "provider" VARCHAR(40) NOT NULL DEFAULT 'supabase',
  "bucket" VARCHAR(120) NOT NULL,
  "object_path" TEXT NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL,
  "byte_size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "status" "MediaAssetStatus" NOT NULL DEFAULT 'DRAFT',
  "public_url" TEXT,
  "trash_eligible_at" TIMESTAMP(3),
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_documents" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "KnowledgeDocumentType" NOT NULL,
  "access_level" "KnowledgeAccessLevel" NOT NULL DEFAULT 'PUBLIC',
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_document_versions" (
  "id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "extracted_text" TEXT,
  "source_object_path" TEXT,
  "source_checksum" VARCHAR(64),
  "change_summary" TEXT,
  "publish_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "approved_by" TEXT,
  "published_by" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_index_generations" (
  "id" TEXT NOT NULL,
  "generation" INTEGER NOT NULL,
  "model_identifier" VARCHAR(120) NOT NULL,
  "embedding_dimension" INTEGER NOT NULL DEFAULT 768,
  "status" "KnowledgeIndexStatus" NOT NULL DEFAULT 'PENDING',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "validated_at" TIMESTAMP(3),
  "activated_at" TIMESTAMP(3),
  "safe_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_index_generations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_sources" (
  "id" TEXT NOT NULL,
  "document_version_id" TEXT,
  "index_generation_id" TEXT NOT NULL,
  "resource_type" VARCHAR(60) NOT NULL,
  "resource_id" TEXT NOT NULL,
  "resource_version" INTEGER,
  "source_path" VARCHAR(255),
  "title" TEXT NOT NULL,
  "source_checksum" VARCHAR(64) NOT NULL,
  "access_level" "KnowledgeAccessLevel" NOT NULL DEFAULT 'PUBLIC',
  "published_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_chunks" (
  "id" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  "heading" TEXT,
  "content" TEXT NOT NULL,
  "token_count" INTEGER NOT NULL,
  "content_checksum" VARCHAR(64) NOT NULL,
  "search_text" TEXT NOT NULL,
  "embedding" vector(768),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "command_center_jobs" (
  "id" TEXT NOT NULL,
  "type" "CommandCenterJobType" NOT NULL,
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" TEXT NOT NULL,
  "status" "CommandCenterJobStatus" NOT NULL DEFAULT 'QUEUED',
  "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lease_owner" VARCHAR(120),
  "lease_expires_at" TIMESTAMP(3),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "idempotency_key" VARCHAR(160) NOT NULL,
  "payload" JSONB,
  "result" JSONB,
  "safe_error" TEXT,
  "completed_at" TIMESTAMP(3),
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "command_center_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_conversations" (
  "id" TEXT NOT NULL,
  "public_reference" VARCHAR(80) NOT NULL,
  "actor_type" "AssistantActorType" NOT NULL,
  "actor_reference" VARCHAR(160),
  "booking_id" TEXT,
  "locale" VARCHAR(20),
  "source_page" VARCHAR(255),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_interactions" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "trace_reference" VARCHAR(80) NOT NULL,
  "status" "AssistantResponseStatus" NOT NULL,
  "answer_mode" VARCHAR(80) NOT NULL,
  "redacted_question" TEXT,
  "redacted_answer" TEXT,
  "intent_plan" JSONB,
  "citation_metadata" JSONB,
  "tool_metadata" JSONB,
  "provider_model" VARCHAR(120),
  "latency_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_interactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assistant_feedback" (
  "id" TEXT NOT NULL,
  "interaction_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "correction" TEXT,
  "escalation" BOOLEAN NOT NULL DEFAULT false,
  "submitted_by" VARCHAR(160),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_access_grants" (
  "id" TEXT NOT NULL,
  "public_reference" VARCHAR(80) NOT NULL,
  "booking_id" TEXT NOT NULL,
  "contact_channel" VARCHAR(20) NOT NULL,
  "contact_hash" VARCHAR(64) NOT NULL,
  "code_hash" VARCHAR(64) NOT NULL,
  "grant_token_hash" VARCHAR(64),
  "code_expires_at" TIMESTAMP(3) NOT NULL,
  "grant_expires_at" TIMESTAMP(3),
  "verified_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "ip_address" VARCHAR(100),
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_access_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_template_migration_runs" (
  "id" TEXT NOT NULL,
  "public_reference" VARCHAR(80) NOT NULL,
  "source_template_id" TEXT NOT NULL,
  "target_template_id" TEXT NOT NULL,
  "status" "TaskTemplateMigrationStatus" NOT NULL DEFAULT 'PREVIEWED',
  "preview_payload" JSONB NOT NULL,
  "apply_payload" JSONB,
  "idempotency_key" VARCHAR(160),
  "result_payload" JSONB,
  "safe_error" TEXT,
  "created_by" TEXT NOT NULL,
  "applied_by" TEXT,
  "applied_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "task_template_migration_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gallery_collections_slug_key" ON "gallery_collections"("slug");
CREATE INDEX "gallery_collections_display_order_idx" ON "gallery_collections"("display_order");
CREATE INDEX "gallery_collections_event_category_id_idx" ON "gallery_collections"("event_category_id");
CREATE UNIQUE INDEX "content_items_type_slug_key" ON "content_items"("type", "slug");
CREATE INDEX "content_items_type_display_order_idx" ON "content_items"("type", "display_order");
CREATE INDEX "content_items_collection_id_idx" ON "content_items"("collection_id");
CREATE INDEX "content_items_event_category_id_idx" ON "content_items"("event_category_id");
CREATE UNIQUE INDEX "content_versions_content_item_id_version_number_key" ON "content_versions"("content_item_id", "version_number");
CREATE INDEX "content_versions_status_publish_at_idx" ON "content_versions"("status", "publish_at");
CREATE INDEX "content_versions_status_expires_at_idx" ON "content_versions"("status", "expires_at");
CREATE UNIQUE INDEX "content_versions_one_scheduled_per_item_idx" ON "content_versions"("content_item_id") WHERE "status" = 'SCHEDULED';
CREATE UNIQUE INDEX "media_assets_bucket_object_path_key" ON "media_assets"("bucket", "object_path");
CREATE INDEX "media_assets_checksum_idx" ON "media_assets"("checksum");
CREATE INDEX "media_assets_status_trash_eligible_at_idx" ON "media_assets"("status", "trash_eligible_at");
CREATE UNIQUE INDEX "knowledge_documents_slug_key" ON "knowledge_documents"("slug");
CREATE INDEX "knowledge_documents_access_level_idx" ON "knowledge_documents"("access_level");
CREATE UNIQUE INDEX "knowledge_document_versions_document_id_version_number_key" ON "knowledge_document_versions"("document_id", "version_number");
CREATE INDEX "knowledge_document_versions_status_publish_at_idx" ON "knowledge_document_versions"("status", "publish_at");
CREATE UNIQUE INDEX "knowledge_index_generations_generation_key" ON "knowledge_index_generations"("generation");
CREATE INDEX "knowledge_index_generations_status_is_active_idx" ON "knowledge_index_generations"("status", "is_active");
CREATE UNIQUE INDEX "knowledge_index_generations_one_active_idx" ON "knowledge_index_generations"("is_active") WHERE "is_active" = true;
CREATE UNIQUE INDEX "knowledge_sources_index_generation_resource_key" ON "knowledge_sources"("index_generation_id", "resource_type", "resource_id");
CREATE INDEX "knowledge_sources_index_generation_id_access_level_idx" ON "knowledge_sources"("index_generation_id", "access_level");
CREATE INDEX "knowledge_sources_published_at_expires_at_idx" ON "knowledge_sources"("published_at", "expires_at");
CREATE UNIQUE INDEX "knowledge_chunks_source_id_chunk_index_key" ON "knowledge_chunks"("source_id", "chunk_index");
CREATE INDEX "knowledge_chunks_source_id_idx" ON "knowledge_chunks"("source_id");
CREATE INDEX "knowledge_chunks_content_checksum_idx" ON "knowledge_chunks"("content_checksum");
CREATE INDEX "knowledge_chunks_embedding_hnsw_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "knowledge_chunks_search_text_fts_idx" ON "knowledge_chunks" USING gin (to_tsvector('english', "search_text"));
CREATE UNIQUE INDEX "command_center_jobs_idempotency_key_key" ON "command_center_jobs"("idempotency_key");
CREATE INDEX "command_center_jobs_status_scheduled_at_idx" ON "command_center_jobs"("status", "scheduled_at");
CREATE INDEX "command_center_jobs_lease_expires_at_idx" ON "command_center_jobs"("lease_expires_at");
CREATE INDEX "command_center_jobs_resource_type_resource_id_idx" ON "command_center_jobs"("resource_type", "resource_id");
CREATE UNIQUE INDEX "assistant_conversations_public_reference_key" ON "assistant_conversations"("public_reference");
CREATE INDEX "assistant_conversations_actor_type_actor_reference_idx" ON "assistant_conversations"("actor_type", "actor_reference");
CREATE INDEX "assistant_conversations_booking_id_idx" ON "assistant_conversations"("booking_id");
CREATE INDEX "assistant_conversations_expires_at_idx" ON "assistant_conversations"("expires_at");
CREATE UNIQUE INDEX "assistant_interactions_trace_reference_key" ON "assistant_interactions"("trace_reference");
CREATE INDEX "assistant_interactions_conversation_id_created_at_idx" ON "assistant_interactions"("conversation_id", "created_at");
CREATE INDEX "assistant_interactions_status_created_at_idx" ON "assistant_interactions"("status", "created_at");
CREATE INDEX "assistant_feedback_interaction_id_idx" ON "assistant_feedback"("interaction_id");
CREATE INDEX "assistant_feedback_rating_created_at_idx" ON "assistant_feedback"("rating", "created_at");
CREATE UNIQUE INDEX "client_access_grants_public_reference_key" ON "client_access_grants"("public_reference");
CREATE UNIQUE INDEX "client_access_grants_grant_token_hash_key" ON "client_access_grants"("grant_token_hash");
CREATE INDEX "client_access_grants_booking_id_code_expires_at_idx" ON "client_access_grants"("booking_id", "code_expires_at");
CREATE INDEX "client_access_grants_grant_expires_at_idx" ON "client_access_grants"("grant_expires_at");
CREATE INDEX "client_access_grants_revoked_at_idx" ON "client_access_grants"("revoked_at");
CREATE UNIQUE INDEX "task_template_migration_runs_public_reference_key" ON "task_template_migration_runs"("public_reference");
CREATE UNIQUE INDEX "task_template_migration_runs_idempotency_key_key" ON "task_template_migration_runs"("idempotency_key");
CREATE INDEX "task_template_migration_runs_source_template_id_target_temp_idx" ON "task_template_migration_runs"("source_template_id", "target_template_id");
CREATE INDEX "task_template_migration_runs_status_created_at_idx" ON "task_template_migration_runs"("status", "created_at");
CREATE INDEX "dashboard_tasks_template_item_key_idx" ON "dashboard_tasks"("template_item_key");
CREATE INDEX "dashboard_tasks_template_sync_state_idx" ON "dashboard_tasks"("template_sync_state");
CREATE INDEX "dashboard_tasks_template_migration_run_id_idx" ON "dashboard_tasks"("template_migration_run_id");

-- Backfill complete immutable FAQ snapshots. Historical change-only rows remain intact.
INSERT INTO "support_faq_versions" (
  "id", "faq_entry_id", "version_number", "question", "answer", "category_id", "tags",
  "related_module", "client_visible", "assistant_enabled", "priority", "internal_notes",
  "publication_status", "published_at", "published_by", "change_summary", "changed_by", "created_at"
)
SELECT
  'faq_snapshot_' || md5(entry."id"), entry."id", 1, entry."question", entry."answer",
  entry."category_id", entry."tags", entry."related_module", entry."client_visible",
  entry."assistant_enabled", entry."priority", entry."internal_notes",
  CASE entry."status"::text
    WHEN 'PUBLISHED' THEN 'PUBLISHED'::"PublicationStatus"
    WHEN 'ARCHIVED' THEN 'ARCHIVED'::"PublicationStatus"
    ELSE 'DRAFT'::"PublicationStatus"
  END,
  CASE WHEN entry."status"::text = 'PUBLISHED' THEN entry."updated_at" ELSE NULL END,
  CASE WHEN entry."status"::text = 'PUBLISHED' THEN entry."updated_by" ELSE NULL END,
  'Backfilled complete FAQ snapshot for Command Center', entry."updated_by", entry."created_at"
FROM "support_faq_entries" AS entry;

UPDATE "support_faq_entries"
SET "current_published_version_id" = 'faq_snapshot_' || md5("id")
WHERE "status"::text = 'PUBLISHED';

UPDATE "support_faq_entries"
SET "current_draft_version_id" = 'faq_snapshot_' || md5("id")
WHERE "status"::text = 'DRAFT';

CREATE UNIQUE INDEX "support_faq_entries_current_draft_version_id_key" ON "support_faq_entries"("current_draft_version_id");
CREATE UNIQUE INDEX "support_faq_entries_current_published_version_id_key" ON "support_faq_entries"("current_published_version_id");
CREATE UNIQUE INDEX "support_faq_versions_faq_entry_id_version_number_key" ON "support_faq_versions"("faq_entry_id", "version_number");
CREATE INDEX "support_faq_versions_publication_status_publish_at_idx" ON "support_faq_versions"("publication_status", "publish_at");

ALTER TABLE "support_faq_entries" ADD CONSTRAINT "support_faq_entries_current_draft_version_id_fkey"
  FOREIGN KEY ("current_draft_version_id") REFERENCES "support_faq_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_faq_entries" ADD CONSTRAINT "support_faq_entries_current_published_version_id_fkey"
  FOREIGN KEY ("current_published_version_id") REFERENCES "support_faq_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_collection_id_fkey"
  FOREIGN KEY ("collection_id") REFERENCES "gallery_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_item_id_fkey"
  FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_document_versions_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_document_version_id_fkey"
  FOREIGN KEY ("document_version_id") REFERENCES "knowledge_document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_index_generation_id_fkey"
  FOREIGN KEY ("index_generation_id") REFERENCES "knowledge_index_generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_fkey"
  FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assistant_interactions" ADD CONSTRAINT "assistant_interactions_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assistant_feedback" ADD CONSTRAINT "assistant_feedback_interaction_id_fkey"
  FOREIGN KEY ("interaction_id") REFERENCES "assistant_interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_access_grants" ADD CONSTRAINT "client_access_grants_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dashboard_tasks" ADD CONSTRAINT "dashboard_tasks_template_migration_run_id_fkey"
  FOREIGN KEY ("template_migration_run_id") REFERENCES "task_template_migration_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve current real Gallery categories and media as published version 1.
INSERT INTO "gallery_collections" ("id", "name", "slug", "display_order", "created_by", "updated_at") VALUES
  ('seed_gallery_weddings', 'Weddings', 'weddings', 1, 'system:migration', NOW()),
  ('seed_gallery_birthdays', 'Birthdays', 'birthdays', 2, 'system:migration', NOW()),
  ('seed_gallery_debuts', 'Debuts', 'debuts', 3, 'system:migration', NOW()),
  ('seed_gallery_gender_reveal', 'Gender Reveal', 'gender-reveal', 4, 'system:migration', NOW()),
  ('seed_gallery_christmas', 'Christmas Party', 'christmas-party', 5, 'system:migration', NOW()),
  ('seed_gallery_christening', 'Christening', 'christening', 6, 'system:migration', NOW());

WITH seed(slug, title, collection_id, image_url, alt_text, display_order) AS (VALUES
  ('wedding-ceremony-setup', 'Wedding Ceremony Setup', 'seed_gallery_weddings', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop', 'Wedding Ceremony Setup', 1),
  ('wedding-reception-decor', 'Wedding Reception Decor', 'seed_gallery_weddings', '/zion/684222572_17948428422152473_4013856636383990076_n.jpg', 'Wedding Reception Decor', 2),
  ('wedding-details', 'Wedding Details', 'seed_gallery_weddings', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', 'Wedding Details', 3),
  ('wedding-couple', 'Wedding Couple', 'seed_gallery_weddings', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop', 'Wedding Couple', 4),
  ('birthday-celebration', 'Birthday Celebration', 'seed_gallery_birthdays', 'https://images.unsplash.com/photo-1530103862676-de8892f12703?q=80&w=2070&auto=format&fit=crop', 'Birthday Celebration', 5),
  ('birthday-cake-decor', 'Birthday Cake and Decor', 'seed_gallery_birthdays', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop', 'Birthday Cake and Decor', 6),
  ('birthday-party-setup', 'Birthday Party Setup', 'seed_gallery_birthdays', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop', 'Birthday Party Setup', 7),
  ('debutante-gown', 'Debutante Gown', 'seed_gallery_debuts', 'https://images.unsplash.com/photo-1542614471-001ccf2bb8cb?q=80&w=2070&auto=format&fit=crop', 'Debutante Gown', 8),
  ('debut-celebration-lights', 'Debut Celebration Lights', 'seed_gallery_debuts', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2162&auto=format&fit=crop', 'Debut Celebration Lights', 9),
  ('debut-venue-setup', 'Debut Venue Setup', 'seed_gallery_debuts', 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop', 'Debut Venue Setup', 10),
  ('gender-reveal-balloons', 'Gender Reveal Balloons', 'seed_gallery_gender_reveal', 'https://images.unsplash.com/photo-1596770289871-38290378b2d1?q=80&w=2070&auto=format&fit=crop', 'Gender Reveal Balloons', 11),
  ('gender-reveal-box', 'Gender Reveal Party Box', 'seed_gallery_gender_reveal', 'https://images.unsplash.com/photo-1543419997-7690a2a53716?q=80&w=2070&auto=format&fit=crop', 'Gender Reveal Party Box', 12),
  ('christmas-party-table', 'Christmas Party Table', 'seed_gallery_christmas', 'https://images.unsplash.com/photo-1512474932049-78ac69ede12c?q=80&w=2070&auto=format&fit=crop', 'Christmas Party Table', 13),
  ('christmas-celebration', 'Christmas Celebration', 'seed_gallery_christmas', 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=2070&auto=format&fit=crop', 'Christmas Celebration', 14),
  ('christening-decor', 'Christening Decor', 'seed_gallery_christening', 'https://images.unsplash.com/photo-1555529733-0e67056058bb?q=80&w=2070&auto=format&fit=crop', 'Christening Decor', 15),
  ('christening-toys-decor', 'Baby Toys and Decor', 'seed_gallery_christening', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=2075&auto=format&fit=crop', 'Baby Toys and Decor', 16)
)
INSERT INTO "content_items" ("id", "type", "slug", "title", "collection_id", "display_order", "created_by", "updated_at")
SELECT 'seed_gallery_' || md5(slug), 'GALLERY_ITEM', slug, title, collection_id, display_order, 'system:migration', NOW() FROM seed;

WITH seed(slug, image_url, alt_text) AS (VALUES
  ('wedding-ceremony-setup', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop', 'Wedding Ceremony Setup'),
  ('wedding-reception-decor', '/zion/684222572_17948428422152473_4013856636383990076_n.jpg', 'Wedding Reception Decor'),
  ('wedding-details', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', 'Wedding Details'),
  ('wedding-couple', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop', 'Wedding Couple'),
  ('birthday-celebration', 'https://images.unsplash.com/photo-1530103862676-de8892f12703?q=80&w=2070&auto=format&fit=crop', 'Birthday Celebration'),
  ('birthday-cake-decor', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop', 'Birthday Cake and Decor'),
  ('birthday-party-setup', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop', 'Birthday Party Setup'),
  ('debutante-gown', 'https://images.unsplash.com/photo-1542614471-001ccf2bb8cb?q=80&w=2070&auto=format&fit=crop', 'Debutante Gown'),
  ('debut-celebration-lights', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2162&auto=format&fit=crop', 'Debut Celebration Lights'),
  ('debut-venue-setup', 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop', 'Debut Venue Setup'),
  ('gender-reveal-balloons', 'https://images.unsplash.com/photo-1596770289871-38290378b2d1?q=80&w=2070&auto=format&fit=crop', 'Gender Reveal Balloons'),
  ('gender-reveal-box', 'https://images.unsplash.com/photo-1543419997-7690a2a53716?q=80&w=2070&auto=format&fit=crop', 'Gender Reveal Party Box'),
  ('christmas-party-table', 'https://images.unsplash.com/photo-1512474932049-78ac69ede12c?q=80&w=2070&auto=format&fit=crop', 'Christmas Party Table'),
  ('christmas-celebration', 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=2070&auto=format&fit=crop', 'Christmas Celebration'),
  ('christening-decor', 'https://images.unsplash.com/photo-1555529733-0e67056058bb?q=80&w=2070&auto=format&fit=crop', 'Christening Decor'),
  ('christening-toys-decor', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=2075&auto=format&fit=crop', 'Baby Toys and Decor')
)
INSERT INTO "content_versions" ("id", "content_item_id", "version_number", "status", "payload", "change_summary", "published_at", "published_by", "created_by", "updated_at")
SELECT 'seed_gallery_v1_' || md5(item."id"), item."id", 1, 'PUBLISHED',
  jsonb_build_object('title', item."title", 'caption', NULL, 'altText', seed.alt_text, 'mediaAssetId', NULL, 'imageUrl', seed.image_url, 'eventCategoryId', NULL, 'collectionId', item."collection_id", 'featured', false, 'displayOrder', item."display_order"),
  'Seeded from existing public Gallery', NOW(), 'system:migration', 'system:migration', NOW()
FROM "content_items" item JOIN seed ON seed.slug = item."slug" WHERE item."type" = 'GALLERY_ITEM';

WITH facilities(slug, name, summary, description, image_url, display_order) AS (VALUES
  ('the-glass-hall', 'The Glass Hall', 'A polished, all-weather indoor event space.', 'A refined indoor setting for ceremonies, receptions, milestone dinners, and programs that benefit from a polished all-weather space.', '/zion/684222572_17948428422152473_4013856636383990076_n.jpg', 1),
  ('the-pavilion-garden', 'The Pavilion Garden', 'An open-air venue surrounded by greenery.', 'An open-air venue well suited to garden ceremonies, relaxed gatherings, and celebrations that flow into the outdoors.', '/zion/ChatGPT Image Jul 2, 2026, 10_19_13 PM.png', 2),
  ('the-pool-and-grounds', 'The Pool and Grounds', 'A distinctive outdoor backdrop across Zion.', 'A distinctive outdoor backdrop for portraits, guest experiences, and event moments shaped by the scenery of Zion.', '/zion/620971763_782204770989828_1960603748204775146_n.jpg', 3)
), inserted AS (
  INSERT INTO "content_items" ("id", "type", "slug", "title", "display_order", "created_by", "updated_at")
  SELECT 'seed_facility_' || md5(slug), 'FACILITY', slug, name, display_order, 'system:migration', NOW() FROM facilities
  RETURNING "id", "slug"
)
INSERT INTO "content_versions" ("id", "content_item_id", "version_number", "status", "payload", "change_summary", "published_at", "published_by", "created_by", "updated_at")
SELECT 'seed_facility_v1_' || md5(inserted."id"), inserted."id", 1, 'PUBLISHED',
  jsonb_build_object('name', facilities.name, 'slug', facilities.slug, 'summary', facilities.summary, 'description', facilities.description, 'amenities', jsonb_build_array(), 'accessibilityGuidance', 'Confirm mobility, senior, child, and supplier access needs with the Zion team before finalizing the layout.', 'mediaAssetIds', jsonb_build_array(), 'imageUrls', jsonb_build_array(facilities.image_url), 'cta', jsonb_build_object('label', 'Plan a Site Visit', 'href', '/contact'), 'displayOrder', facilities.display_order, 'visible', true),
  'Seeded from existing public Facilities page', NOW(), 'system:migration', 'system:migration', NOW()
FROM inserted JOIN facilities USING (slug);

INSERT INTO "content_items" ("id", "type", "slug", "title", "display_order", "created_by", "updated_at")
VALUES ('seed_rules_public', 'RULES', 'venue-rules-and-regulations', 'Venue Rules and Regulations', 1, 'system:migration', NOW());

INSERT INTO "content_versions" ("id", "content_item_id", "version_number", "status", "payload", "change_summary", "published_at", "published_by", "created_by", "updated_at")
VALUES (
  'seed_rules_public_v1', 'seed_rules_public', 1, 'PUBLISHED',
  jsonb_build_object(
    'title', 'Venue Rules and Regulations', 'effectiveDate', NULL,
    'summary', 'These general guidelines help protect guests, suppliers, and the venue. Your signed agreement and the latest instructions from the Zion team remain the final authority for your event.',
    'blocks', jsonb_build_array(
      jsonb_build_object('type','heading','level',2,'text','Venue access and approved areas'),
      jsonb_build_object('type','paragraph','text','Use only the spaces included in your confirmed booking. Guests and suppliers should follow on-site signs, staff instructions, and any restricted-area notices.'),
      jsonb_build_object('type','heading','level',2,'text','Supplier setup and pull-out'),
      jsonb_build_object('type','paragraph','text','Coordinate arrival, installation, and removal schedules with the Zion team before event day. Suppliers should not begin work without the agreed access window.'),
      jsonb_build_object('type','heading','level',2,'text','Decorations and venue care'),
      jsonb_build_object('type','paragraph','text','Confirm hanging, fastening, electrical, flame, confetti, and special-effect requirements in advance. Decorations must not damage venue surfaces, landscaping, fixtures, or equipment.'),
      jsonb_build_object('type','heading','level',2,'text','Guest safety and supervision'),
      jsonb_build_object('type','paragraph','text','Keep walkways and exits clear, follow the approved layout, and supervise children around the pool, steps, gardens, and other outdoor areas at all times.'),
      jsonb_build_object('type','heading','level',2,'text','Program, sound, and event timing'),
      jsonb_build_object('type','paragraph','text','Follow the confirmed event schedule and any sound limits or closing arrangements in your agreement. Program changes that affect operations should be raised with the assigned coordinator.'),
      jsonb_build_object('type','heading','level',2,'text','Clean closeout and accountability'),
      jsonb_build_object('type','paragraph','text','Before leaving, suppliers should remove their materials and guests should return any venue property. Report damage, spills, safety issues, or lost items promptly to the Zion team.')
    )
  ),
  'Seeded from existing public Rules page', NOW(), 'system:migration', 'system:migration', NOW()
);

-- Privacy and Terms intentionally begin as private drafts; lorem ipsum is never published or indexed.
INSERT INTO "content_items" ("id", "type", "slug", "title", "display_order", "created_by", "updated_at") VALUES
  ('seed_privacy_draft', 'PRIVACY', 'privacy-policy', 'Privacy Policy', 1, 'system:migration', NOW()),
  ('seed_terms_draft', 'TERMS', 'terms-and-conditions', 'Terms and Conditions', 1, 'system:migration', NOW());

INSERT INTO "content_versions" ("id", "content_item_id", "version_number", "status", "payload", "change_summary", "internal_notes", "created_by", "updated_at") VALUES
  ('seed_privacy_draft_v1', 'seed_privacy_draft', 1, 'DRAFT', '{"title":"Privacy Policy","effectiveDate":null,"summary":"Legal review required before first publication.","blocks":[{"type":"callout","text":"Awaiting legally reviewed Privacy Policy content."}]}'::jsonb, 'Created legal-review draft; no placeholder content migrated.', 'Must be approved by legal review before publication.', 'system:migration', NOW()),
  ('seed_terms_draft_v1', 'seed_terms_draft', 1, 'DRAFT', '{"title":"Terms and Conditions","effectiveDate":null,"summary":"Legal review required before first publication.","blocks":[{"type":"callout","text":"Awaiting legally reviewed Terms and Conditions content."}]}'::jsonb, 'Created legal-review draft; no placeholder content migrated.', 'Must be approved by legal review before publication. Contract clauses remain unchanged.', 'system:migration', NOW());
