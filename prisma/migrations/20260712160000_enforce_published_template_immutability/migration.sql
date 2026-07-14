CREATE OR REPLACE FUNCTION "enforce_published_task_template_immutability"()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."status" = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Published task template definitions cannot be deleted.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."status" = 'PUBLISHED' AND (
    NEW."event_category_id" IS DISTINCT FROM OLD."event_category_id" OR
    NEW."template_key" IS DISTINCT FROM OLD."template_key" OR
    NEW."name" IS DISTINCT FROM OLD."name" OR
    NEW."description" IS DISTINCT FROM OLD."description" OR
    NEW."version" IS DISTINCT FROM OLD."version" OR
    NEW."is_default" IS DISTINCT FROM OLD."is_default" OR
    NEW."source_template_id" IS DISTINCT FROM OLD."source_template_id"
  ) THEN
    RAISE EXCEPTION 'Published task template definitions are immutable.';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "task_templates_published_immutability"
BEFORE UPDATE OR DELETE ON "task_templates"
FOR EACH ROW
EXECUTE FUNCTION "enforce_published_task_template_immutability"();

CREATE OR REPLACE FUNCTION "enforce_published_task_template_item_immutability"()
RETURNS TRIGGER AS $$
DECLARE
  parent_status "TaskTemplateStatus";
  parent_id TEXT;
BEGIN
  parent_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."task_template_id" ELSE NEW."task_template_id" END;

  SELECT "status" INTO parent_status
  FROM "task_templates"
  WHERE "id" = parent_id;

  IF parent_status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Items belonging to a published task template are immutable.';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "task_template_items_published_immutability"
BEFORE INSERT OR UPDATE OR DELETE ON "task_template_items"
FOR EACH ROW
EXECUTE FUNCTION "enforce_published_task_template_item_immutability"();
