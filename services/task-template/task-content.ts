import { createHash } from 'node:crypto';

export type TemplateTaskContent = {
  itemKey: string;
  title: string;
  description?: string | null;
  priority: string;
  assignedToRole?: string | null;
  category?: string | null;
  dueOffsetDays?: number | null;
};

export function templateTaskContentHash(input: TemplateTaskContent) {
  return createHash('sha256').update(JSON.stringify({
    itemKey: input.itemKey,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    priority: input.priority.trim().toLowerCase(),
    assignedToRole: input.assignedToRole?.trim().toUpperCase() || null,
    category: input.category?.trim() || null,
    dueOffsetDays: input.dueOffsetDays ?? null,
  })).digest('hex');
}
