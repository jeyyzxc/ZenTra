-- Keep extension-owned types and operators outside the exposed public schema.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Trigger functions execute during privileged server-side mutations. Pin their
-- resolution path so an attacker cannot shadow referenced objects.
ALTER FUNCTION public.enforce_published_task_template_immutability()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.enforce_published_task_template_item_immutability()
  SET search_path = pg_catalog, public;

-- Cover every foreign key reported by the Supabase performance advisor.
CREATE INDEX "Task_listId_idx" ON "Task"("listId");
CREATE INDEX "assistant_unanswered_questions_converted_faq_id_idx"
  ON "assistant_unanswered_questions"("converted_faq_id");
CREATE INDEX "contracts_template_id_idx" ON "contracts"("template_id");
CREATE INDEX "knowledge_sources_document_version_id_idx"
  ON "knowledge_sources"("document_version_id");
