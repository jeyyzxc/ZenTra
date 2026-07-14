CREATE TYPE "TaskTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "bookings"
  ADD COLUMN "completed_at" TIMESTAMP(3);

ALTER TABLE "event_categories"
  ADD COLUMN "category_key" TEXT;

WITH normalized AS (
  SELECT
    "id",
    TRIM(BOTH '_' FROM REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(REPLACE("name", '&', ' and ')), '[^a-z0-9]+', '_', 'g'),
      '_+', '_', 'g'
    )) AS base_key
  FROM "event_categories"
), numbered AS (
  SELECT
    "id",
    CASE
      WHEN base_key = '' THEN 'event'
      ELSE base_key
    END AS base_key,
    ROW_NUMBER() OVER (
      PARTITION BY CASE WHEN base_key = '' THEN 'event' ELSE base_key END
      ORDER BY "id"
    ) AS duplicate_number
  FROM normalized
)
UPDATE "event_categories" AS category
SET "category_key" = CASE
  WHEN numbered.duplicate_number = 1 THEN numbered.base_key
  ELSE numbered.base_key || '_' || numbered.duplicate_number
END
FROM numbered
WHERE category."id" = numbered."id";

ALTER TABLE "event_categories"
  ALTER COLUMN "category_key" SET NOT NULL;

CREATE UNIQUE INDEX "event_categories_category_key_key"
  ON "event_categories"("category_key");

CREATE TABLE "task_templates" (
  "id" TEXT NOT NULL,
  "event_category_id" TEXT,
  "template_key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "TaskTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "source_template_id" TEXT,
  "published_at" TIMESTAMP(3),
  "published_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_template_items" (
  "id" TEXT NOT NULL,
  "task_template_id" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "assigned_to_role" VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "due_offset_days" INTEGER,
  "category" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_template_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_templates_template_key_version_key"
  ON "task_templates"("template_key", "version");
CREATE INDEX "task_templates_event_category_id_idx"
  ON "task_templates"("event_category_id");
CREATE INDEX "task_templates_template_key_status_is_active_idx"
  ON "task_templates"("template_key", "status", "is_active");
CREATE INDEX "task_templates_source_template_id_idx"
  ON "task_templates"("source_template_id");
CREATE UNIQUE INDEX "task_templates_one_active_published_key"
  ON "task_templates"("template_key")
  WHERE "status" = 'PUBLISHED' AND "is_active" = true;

CREATE UNIQUE INDEX "task_template_items_task_template_id_order_index_key"
  ON "task_template_items"("task_template_id", "order_index");
CREATE INDEX "task_template_items_task_template_id_idx"
  ON "task_template_items"("task_template_id");

ALTER TABLE "task_templates"
  ADD CONSTRAINT "task_templates_event_category_id_fkey"
  FOREIGN KEY ("event_category_id") REFERENCES "event_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_templates"
  ADD CONSTRAINT "task_templates_source_template_id_fkey"
  FOREIGN KEY ("source_template_id") REFERENCES "task_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_template_items"
  ADD CONSTRAINT "task_template_items_task_template_id_fkey"
  FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "task_templates" (
  "id", "template_key", "name", "description", "version", "status",
  "is_active", "is_default", "published_at", "updated_at"
) VALUES
  ('task-template-general-event-v1', 'general_event_standard', 'General Event Standard Task Template', 'Default operational checklist used when no category-specific published template is available.', 1, 'PUBLISHED', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('task-template-wedding-v1', 'wedding_standard', 'Wedding Standard Task Template', 'Legacy wedding checklist migrated from the n8n workflow.', 1, 'PUBLISHED', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('task-template-birthday-debut-v1', 'birthday_debut_standard', 'Birthday and Debut Standard Task Template', 'Legacy birthday and debut checklist migrated from the n8n workflow.', 1, 'PUBLISHED', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('task-template-christening-v1', 'christening_standard', 'Christening Standard Task Template', 'Legacy christening checklist migrated from the n8n workflow.', 1, 'PUBLISHED', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('task-template-corporate-group-v1', 'corporate_group_standard', 'Corporate and Group Standard Task Template', 'Legacy corporate and group checklist migrated from the n8n workflow.', 1, 'PUBLISHED', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("template_key", "version") DO NOTHING;

WITH base_items("order_index", "title", "description", "priority", "due_offset_days", "category") AS (
  VALUES
    (1, 'Review submitted booking details', 'Review the complete client and event information.', 'high', 1, 'booking_review'),
    (2, 'Verify event date and schedule availability', 'Confirm the date, time window, venue, and schedule conflicts.', 'high', 2, 'schedule_review'),
    (3, 'Confirm selected package inclusions', 'Validate the selected package and its inclusion snapshot.', 'medium', 7, 'package_review'),
    (4, 'Check payment and down payment requirements', 'Review reservation, down payment, and outstanding balance requirements.', 'medium', 7, 'payment_review'),
    (5, 'Prepare client confirmation requirements', 'List the information and documents still required from the client.', 'medium', 10, 'client_confirmation'),
    (6, 'Confirm event requirements', 'Confirm the operational requirements for the event.', 'medium', 14, 'event_requirements'),
    (7, 'Review setup and package inclusions', 'Review the setup plan against the agreed package inclusions.', 'medium', 10, 'setup_review'),
    (8, 'Confirm food and guest count', 'Confirm the catering plan and final guest count.', 'medium', 7, 'program_food'),
    (9, 'Prepare logistics checklist', 'Prepare venue, supplier, access, and delivery logistics.', 'medium', 5, 'logistics'),
    (10, 'Prepare final event coordination checklist', 'Complete the final readiness and coordination review.', 'high', 1, 'final_coordination')
)
INSERT INTO "task_template_items" (
  "id", "task_template_id", "order_index", "title", "description",
  "priority", "assigned_to_role", "is_required", "due_offset_days", "category", "updated_at"
)
SELECT
  'tti-general-' || LPAD(base_items."order_index"::TEXT, 2, '0'),
  'task-template-general-event-v1',
  base_items."order_index", base_items."title", base_items."description",
  base_items."priority", 'ADMIN', true, base_items."due_offset_days", base_items."category", CURRENT_TIMESTAMP
FROM base_items
ON CONFLICT ("task_template_id", "order_index") DO NOTHING;

WITH legacy_templates("template_id", "specific_titles") AS (
  VALUES
    ('task-template-wedding-v1', ARRAY['Coordinate ceremony and reception requirements','Confirm motif, layout, and styling details','Prepare supplier coordination checklist','Confirm food, guest count, and program timeline','Prepare final event coordination checklist']),
    ('task-template-birthday-debut-v1', ARRAY['Confirm theme and program flow','Review setup, decorations, and stage requirements','Confirm food and guest count','Prepare event host and program coordination checklist','Prepare final event coordination checklist']),
    ('task-template-christening-v1', ARRAY['Confirm ceremony and reception schedule','Review family and guest seating needs','Confirm food and guest count','Prepare styling and setup requirements','Prepare final event coordination checklist']),
    ('task-template-corporate-group-v1', ARRAY['Confirm company or group event requirements','Review technical and program flow requirements','Confirm food and guest count','Prepare logistics and supplier coordination checklist','Prepare final event coordination checklist'])
), common_items("order_index", "title", "category", "priority", "due_offset_days") AS (
  VALUES
    (1, 'Review submitted booking details', 'booking_review', 'high', 1),
    (2, 'Verify event date and schedule availability', 'schedule_review', 'high', 2),
    (3, 'Confirm selected package inclusions', 'package_review', 'medium', 7),
    (4, 'Check payment and down payment requirements', 'payment_review', 'medium', 7),
    (5, 'Prepare client confirmation requirements', 'client_confirmation', 'medium', 10)
), expanded AS (
  SELECT legacy_templates."template_id", common_items.*
  FROM legacy_templates CROSS JOIN common_items
  UNION ALL
  SELECT
    legacy_templates."template_id",
    5 + title_data.ordinality::INTEGER,
    title_data.title,
    CASE title_data.ordinality
      WHEN 1 THEN 'event_requirements'
      WHEN 2 THEN 'styling'
      WHEN 3 THEN 'supplier_coordination'
      WHEN 4 THEN 'program_food'
      ELSE 'final_coordination'
    END,
    CASE WHEN title_data.ordinality = 5 THEN 'high' ELSE 'medium' END,
    CASE title_data.ordinality WHEN 1 THEN 14 WHEN 2 THEN 10 WHEN 3 THEN 7 WHEN 4 THEN 5 ELSE 1 END
  FROM legacy_templates
  CROSS JOIN LATERAL UNNEST(legacy_templates."specific_titles") WITH ORDINALITY AS title_data(title, ordinality)
)
INSERT INTO "task_template_items" (
  "id", "task_template_id", "order_index", "title", "description",
  "priority", "assigned_to_role", "is_required", "due_offset_days", "category", "updated_at"
)
SELECT
  'tti-' || REPLACE(expanded."template_id", 'task-template-', '') || '-' || LPAD(expanded."order_index"::TEXT, 2, '0'),
  expanded."template_id", expanded."order_index", expanded."title",
  expanded."title" || '.', expanded."priority", 'ADMIN', true,
  expanded."due_offset_days", expanded."category", CURRENT_TIMESTAMP
FROM expanded
ON CONFLICT ("task_template_id", "order_index") DO NOTHING;

INSERT INTO "task_templates" (
  "id", "event_category_id", "template_key", "name", "description", "version",
  "status", "is_active", "is_default", "source_template_id", "published_at", "updated_at"
)
SELECT
  'migrated-template-' || category."id",
  category."id",
  category."category_key" || '_standard',
  category."name" || ' Standard Task Template',
  'Initial category template cloned from general_event_standard during migration.',
  1, 'PUBLISHED', true, false, 'task-template-general-event-v1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "event_categories" AS category
ON CONFLICT ("template_key", "version") DO NOTHING;

INSERT INTO "task_template_items" (
  "id", "task_template_id", "order_index", "title", "description", "priority",
  "assigned_to_role", "is_required", "due_offset_days", "category", "updated_at"
)
SELECT
  'migrated-item-' || template."id" || '-' || item."order_index",
  template."id", item."order_index",
  CASE
    WHEN item."order_index" = 1 THEN 'Review submitted ' || category."name" || ' booking details'
    ELSE item."title"
  END,
  item."description", item."priority", item."assigned_to_role", item."is_required",
  item."due_offset_days", item."category", CURRENT_TIMESTAMP
FROM "task_templates" AS template
JOIN "event_categories" AS category ON category."id" = template."event_category_id"
CROSS JOIN "task_template_items" AS item
WHERE template."source_template_id" = 'task-template-general-event-v1'
  AND item."task_template_id" = 'task-template-general-event-v1'
ON CONFLICT ("task_template_id", "order_index") DO NOTHING;

ALTER TABLE "booking_orchestration_contexts"
  ADD COLUMN "requested_task_template_key" TEXT,
  ADD COLUMN "task_template_id" TEXT,
  ADD COLUMN "task_template_version" INTEGER,
  ADD COLUMN "template_fallback_used" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "template_fallback_reason" TEXT;

WITH resolved_contexts AS (
  SELECT
    context."id" AS context_id,
    context."task_template_key" AS requested_template_key,
    COALESCE(requested."id", fallback."id") AS applied_template_id,
    COALESCE(requested."version", fallback."version") AS applied_template_version,
    COALESCE(requested."template_key", fallback."template_key") AS applied_template_key,
    requested."id" IS NULL AS fallback_used
  FROM "booking_orchestration_contexts" AS context
  CROSS JOIN "task_templates" AS fallback
  LEFT JOIN "task_templates" AS requested
    ON requested."template_key" = context."task_template_key"
    AND requested."status" = 'PUBLISHED'
    AND requested."is_active" = true
  WHERE fallback."template_key" = 'general_event_standard'
    AND fallback."status" = 'PUBLISHED'
    AND fallback."is_active" = true
)
UPDATE "booking_orchestration_contexts" AS context
SET
  "requested_task_template_key" = resolved.requested_template_key,
  "task_template_id" = resolved.applied_template_id,
  "task_template_version" = resolved.applied_template_version,
  "task_template_key" = resolved.applied_template_key,
  "template_fallback_used" = resolved.fallback_used,
  "template_fallback_reason" = CASE WHEN resolved.fallback_used THEN 'NO_PUBLISHED_CATEGORY_TEMPLATE' ELSE NULL END
FROM resolved_contexts AS resolved
WHERE context."id" = resolved.context_id;

ALTER TABLE "booking_orchestration_contexts"
  ALTER COLUMN "requested_task_template_key" SET NOT NULL,
  ALTER COLUMN "task_template_id" SET NOT NULL,
  ALTER COLUMN "task_template_version" SET NOT NULL;

ALTER TABLE "dashboard_tasks"
  ADD COLUMN "task_template_id" TEXT,
  ADD COLUMN "task_template_version" INTEGER,
  ADD COLUMN "template_item_id" TEXT,
  ADD COLUMN "template_snapshot" JSONB,
  ADD COLUMN "is_high_risk" BOOLEAN NOT NULL DEFAULT false;

UPDATE "dashboard_tasks" AS task
SET
  "task_template_id" = template."id",
  "task_template_version" = template."version",
  "template_item_id" = item."id",
  "template_snapshot" = JSONB_BUILD_OBJECT(
    'templateId', template."id",
    'templateKey', template."template_key",
    'templateVersion', template."version",
    'templateItemId', item."id",
    'orderIndex', task."order_index",
    'title', task."title",
    'description', task."description",
    'priority', task."priority",
    'assignedToRole', task."assigned_to_role",
    'category', task."category"
  )
FROM "task_templates" AS template, "task_template_items" AS item
WHERE template."template_key" = task."task_template_key"
  AND template."status" = 'PUBLISHED'
  AND template."is_active" = true
  AND item."task_template_id" = template."id"
  AND item."order_index" = task."order_index";

CREATE INDEX "dashboard_tasks_task_template_key_task_template_version_idx"
  ON "dashboard_tasks"("task_template_key", "task_template_version");
CREATE INDEX "dashboard_tasks_task_template_id_idx"
  ON "dashboard_tasks"("task_template_id");
CREATE INDEX "dashboard_tasks_template_item_id_idx"
  ON "dashboard_tasks"("template_item_id");
CREATE UNIQUE INDEX "dashboard_tasks_related_record_id_template_item_id_order_index_key"
  ON "dashboard_tasks"("related_record_id", "template_item_id", "order_index");

ALTER TABLE "dashboard_tasks"
  ADD CONSTRAINT "dashboard_tasks_task_template_id_fkey"
  FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dashboard_tasks"
  ADD CONSTRAINT "dashboard_tasks_template_item_id_fkey"
  FOREIGN KEY ("template_item_id") REFERENCES "task_template_items"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
