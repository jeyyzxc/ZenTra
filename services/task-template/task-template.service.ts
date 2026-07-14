import {
  AuditAction,
  AuditStatus,
  Prisma,
  TaskTemplateStatus,
} from '@prisma/client';
import {
  auditActor,
  createAuditLog,
  errorMetadata,
  getRequestContext,
  systemAuditActor,
} from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { taskTemplateKeyForCategory } from '@/services/event-category';
import { taskTemplatePublishValidationErrors } from './task-template-domain';

export const GENERAL_EVENT_TEMPLATE_KEY = 'general_event_standard';

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_ASSIGNED_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

type TemplateDb = typeof prisma | Prisma.TransactionClient;

const templateInclude = {
  eventCategory: {
    select: {
      id: true,
      name: true,
      categoryKey: true,
    },
  },
  items: {
    orderBy: [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.TaskTemplateInclude;

type TemplateRecord = Prisma.TaskTemplateGetPayload<{
  include: typeof templateInclude;
}>;

export class TaskTemplateError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TaskTemplateError';
    this.status = status;
  }
}

export type TaskTemplateItemInput = {
  orderIndex?: unknown;
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  assignedToRole?: unknown;
  isRequired?: unknown;
  dueOffsetDays?: unknown;
  category?: unknown;
};

export type TaskTemplateInput = {
  name?: unknown;
  description?: unknown;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown) {
  const valueText = text(value);
  return valueText || null;
}

function requiredText(value: unknown, label: string) {
  const valueText = text(value);

  if (!valueText) {
    throw new TaskTemplateError(`${label} is required.`);
  }

  return valueText;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && value.toLowerCase() === 'true') return true;
  if (typeof value === 'string' && value.toLowerCase() === 'false') return false;
  return fallback;
}

function positiveInteger(value: unknown, label: string, fallback?: number) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw new TaskTemplateError(`${label} is required.`);
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new TaskTemplateError(`${label} must be a positive whole number.`);
  }

  return parsed;
}

function nullableNonNegativeInteger(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new TaskTemplateError(`${label} must be a non-negative whole number.`);
  }

  return parsed;
}

function normalizePriority(value: unknown, fallback = 'medium') {
  const priority = text(value).toLowerCase() || fallback;

  if (!VALID_PRIORITIES.has(priority)) {
    throw new TaskTemplateError('Task priority is invalid.');
  }

  return priority;
}

function normalizeAssignedRole(value: unknown, fallback = 'ADMIN') {
  const role = text(value).toUpperCase() || fallback;

  if (!VALID_ASSIGNED_ROLES.has(role)) {
    throw new TaskTemplateError('Assigned role is invalid.');
  }

  return role;
}

function normalizeItemInput(
  input: TaskTemplateItemInput,
  fallback?: Partial<{
    orderIndex: number;
    title: string;
    description: string | null;
    priority: string;
    assignedToRole: string;
    isRequired: boolean;
    dueOffsetDays: number | null;
    category: string | null;
  }>,
) {
  return {
    orderIndex: positiveInteger(input.orderIndex, 'Task order', fallback?.orderIndex),
    title: input.title === undefined
      ? requiredText(fallback?.title, 'Task title')
      : requiredText(input.title, 'Task title'),
    description: input.description === undefined
      ? fallback?.description ?? null
      : optionalText(input.description),
    priority: input.priority === undefined
      ? normalizePriority(fallback?.priority)
      : normalizePriority(input.priority),
    assignedToRole: input.assignedToRole === undefined
      ? normalizeAssignedRole(fallback?.assignedToRole)
      : normalizeAssignedRole(input.assignedToRole),
    isRequired: input.isRequired === undefined
      ? fallback?.isRequired ?? true
      : booleanValue(input.isRequired, true),
    dueOffsetDays: input.dueOffsetDays === undefined
      ? fallback?.dueOffsetDays ?? null
      : nullableNonNegativeInteger(input.dueOffsetDays, 'Due offset days'),
    category: input.category === undefined
      ? fallback?.category ?? null
      : optionalText(input.category)?.toLowerCase() ?? null,
  };
}

function templateDto(template: TemplateRecord) {
  return {
    id: template.id,
    eventCategoryId: template.eventCategoryId,
    eventCategoryName: template.eventCategory?.name ?? null,
    eventCategoryKey: template.eventCategory?.categoryKey ?? null,
    templateKey: template.templateKey,
    name: template.name,
    description: template.description,
    version: template.version,
    status: template.status,
    isActive: template.isActive,
    isDefault: template.isDefault,
    sourceTemplateId: template.sourceTemplateId,
    publishedAt: template.publishedAt?.toISOString() ?? null,
    publishedById: template.publishedById,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    items: template.items.map((item) => ({
      id: item.id,
      templateItemId: item.id,
      itemKey: item.itemKey,
      orderIndex: item.orderIndex,
      title: item.title,
      description: item.description,
      priority: item.priority,
      assignedToRole: item.assignedToRole,
      isRequired: item.isRequired,
      dueOffsetDays: item.dueOffsetDays,
      category: item.category,
    })),
  };
}

async function findTemplateOrThrow(id: string, db: TemplateDb = prisma) {
  const template = await db.taskTemplate.findUnique({
    where: { id },
    include: templateInclude,
  });

  if (!template) {
    throw new TaskTemplateError('Task template not found.', 404);
  }

  return template;
}

function requireDraft(template: Pick<TemplateRecord, 'status'>) {
  if (template.status !== TaskTemplateStatus.DRAFT) {
    throw new TaskTemplateError(
      'Published and archived templates are immutable. Clone a new draft version to edit.',
      409,
    );
  }
}

async function auditTemplateEvent(input: {
  actor: CurrentAdmin;
  request?: Request;
  action: AuditAction;
  event: string;
  description: string;
  templateId?: string;
  templateKey?: string;
  version?: number;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  await createAuditLog({
    ...auditActor(input.actor),
    action: input.action,
    module: 'Task Templates',
    description: input.description,
    status: AuditStatus.SUCCESS,
    previousValues: input.previousValues,
    newValues: input.newValues,
    metadata: {
      event: input.event,
      taskTemplateId: input.templateId,
      taskTemplateKey: input.templateKey,
      taskTemplateVersion: input.version,
    },
    ...(input.request ? getRequestContext(input.request) : {}),
  });
}

export async function bootstrapCategoryTemplate(input: {
  db: Prisma.TransactionClient;
  eventCategoryId: string;
  categoryName: string;
  categoryKey: string;
}) {
  const general = await input.db.taskTemplate.findFirst({
    where: {
      templateKey: GENERAL_EVENT_TEMPLATE_KEY,
      status: TaskTemplateStatus.PUBLISHED,
      isActive: true,
    },
    include: templateInclude,
    orderBy: { version: 'desc' },
  });

  if (!general || general.items.length === 0) {
    throw new TaskTemplateError(
      'The published general event template is unavailable. Category creation was rolled back.',
      503,
    );
  }

  const templateKey = taskTemplateKeyForCategory(input.categoryKey);
  const created = await input.db.taskTemplate.create({
    data: {
      eventCategoryId: input.eventCategoryId,
      templateKey,
      name: `${input.categoryName} Standard Task Template`,
      description: `Draft checklist for ${input.categoryName}, cloned from ${GENERAL_EVENT_TEMPLATE_KEY}.`,
      version: 1,
      status: TaskTemplateStatus.DRAFT,
      isActive: false,
      isDefault: false,
      sourceTemplateId: general.id,
      items: {
        create: general.items.map((item) => ({
          itemKey: item.itemKey,
          orderIndex: item.orderIndex,
          title: item.orderIndex === 1
            ? `Review submitted ${input.categoryName} booking details`
            : item.title,
          description: item.description,
          priority: item.priority,
          assignedToRole: item.assignedToRole,
          isRequired: item.isRequired,
          dueOffsetDays: item.dueOffsetDays,
          category: item.category,
        })),
      },
    },
    include: templateInclude,
  });

  return templateDto(created);
}

export async function listCategoryTaskTemplates(categoryId: string) {
  const category = await prisma.eventCategory.findFirst({
    where: { OR: [{ id: categoryId }, { slug: categoryId }, { categoryKey: categoryId }] },
    select: { id: true },
  });

  if (!category) {
    throw new TaskTemplateError('Event category not found.', 404);
  }

  const templates = await prisma.taskTemplate.findMany({
    where: { eventCategoryId: category.id },
    include: templateInclude,
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
  });

  return templates.map(templateDto);
}

export async function listDefaultTaskTemplates() {
  const templates = await prisma.taskTemplate.findMany({
    where: {
      OR: [
        { isDefault: true },
        { templateKey: GENERAL_EVENT_TEMPLATE_KEY },
      ],
    },
    include: templateInclude,
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
  });

  return templates.map(templateDto);
}

export async function getTaskTemplate(templateId: string) {
  return templateDto(await findTemplateOrThrow(templateId));
}

export async function updateTaskTemplate(
  templateId: string,
  input: TaskTemplateInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await findTemplateOrThrow(templateId);
  requireDraft(previous);

  const updated = await prisma.taskTemplate.update({
    where: { id: previous.id },
    data: {
      ...(input.name !== undefined ? { name: requiredText(input.name, 'Template name') } : {}),
      ...(input.description !== undefined ? { description: optionalText(input.description) } : {}),
    },
    include: templateInclude,
  });

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.UPDATE,
    event: 'TASK_TEMPLATE_DRAFT_UPDATED',
    description: `Updated draft ${updated.templateKey} version ${updated.version}.`,
    templateId: updated.id,
    templateKey: updated.templateKey,
    version: updated.version,
    previousValues: { name: previous.name, description: previous.description },
    newValues: { name: updated.name, description: updated.description },
  });

  return templateDto(updated);
}

export async function addTaskTemplateItem(
  templateId: string,
  input: TaskTemplateItemInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const template = await findTemplateOrThrow(templateId);
  requireDraft(template);
  const requestedOrder = input.orderIndex === undefined
    ? template.items.length + 1
    : positiveInteger(input.orderIndex, 'Task order');

  if (requestedOrder > template.items.length + 1) {
    throw new TaskTemplateError('Task order cannot leave gaps.');
  }

  const item = normalizeItemInput({ ...input, orderIndex: requestedOrder });
  const updated = await prisma.$transaction(async (transaction) => {
    const itemsToMove = template.items
      .filter((existing) => existing.orderIndex >= requestedOrder)
      .sort((a, b) => b.orderIndex - a.orderIndex);

    for (const existing of itemsToMove) {
      await transaction.taskTemplateItem.update({
        where: { id: existing.id },
        data: { orderIndex: existing.orderIndex + 1 },
      });
    }

    await transaction.taskTemplateItem.create({
      data: { taskTemplateId: template.id, ...item },
    });

    return findTemplateOrThrow(template.id, transaction);
  });

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.UPDATE,
    event: 'TASK_TEMPLATE_DRAFT_UPDATED',
    description: `Added a task to ${updated.templateKey} version ${updated.version}.`,
    templateId: updated.id,
    templateKey: updated.templateKey,
    version: updated.version,
    newValues: item,
  });

  return templateDto(updated);
}

export async function updateTaskTemplateItem(
  itemId: string,
  input: TaskTemplateItemInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await prisma.taskTemplateItem.findUnique({
    where: { id: itemId },
    include: { taskTemplate: true },
  });

  if (!previous) throw new TaskTemplateError('Task template item not found.', 404);
  requireDraft(previous.taskTemplate as TemplateRecord);
  const item = normalizeItemInput(input, previous);

  if (item.orderIndex !== previous.orderIndex) {
    throw new TaskTemplateError('Use the reorder endpoint to change task order.');
  }

  await prisma.taskTemplateItem.update({ where: { id: previous.id }, data: item });
  const updated = await findTemplateOrThrow(previous.taskTemplateId);

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.UPDATE,
    event: 'TASK_TEMPLATE_DRAFT_UPDATED',
    description: `Updated a task in ${updated.templateKey} version ${updated.version}.`,
    templateId: updated.id,
    templateKey: updated.templateKey,
    version: updated.version,
    previousValues: previous as unknown as Record<string, unknown>,
    newValues: item,
  });

  return templateDto(updated);
}

export async function deleteTaskTemplateItem(
  itemId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const item = await prisma.taskTemplateItem.findUnique({
    where: { id: itemId },
    include: { taskTemplate: true },
  });

  if (!item) throw new TaskTemplateError('Task template item not found.', 404);
  requireDraft(item.taskTemplate as TemplateRecord);

  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.taskTemplateItem.delete({ where: { id: item.id } });
    const remaining = await transaction.taskTemplateItem.findMany({
      where: { taskTemplateId: item.taskTemplateId },
      orderBy: { orderIndex: 'asc' },
    });

    for (let index = 0; index < remaining.length; index += 1) {
      await transaction.taskTemplateItem.update({
        where: { id: remaining[index].id },
        data: { orderIndex: -(index + 1) },
      });
    }

    for (let index = 0; index < remaining.length; index += 1) {
      await transaction.taskTemplateItem.update({
        where: { id: remaining[index].id },
        data: { orderIndex: index + 1 },
      });
    }

    return findTemplateOrThrow(item.taskTemplateId, transaction);
  });

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.DELETE,
    event: 'TASK_TEMPLATE_DRAFT_UPDATED',
    description: `Removed a task from ${updated.templateKey} version ${updated.version}.`,
    templateId: updated.id,
    templateKey: updated.templateKey,
    version: updated.version,
    previousValues: { taskTemplateItemId: item.id, title: item.title },
  });

  return templateDto(updated);
}

export async function reorderTaskTemplateItems(
  templateId: string,
  orderedItemIds: unknown,
  actor: CurrentAdmin,
  request?: Request,
) {
  const template = await findTemplateOrThrow(templateId);
  requireDraft(template);

  if (!Array.isArray(orderedItemIds) || orderedItemIds.some((id) => !text(id))) {
    throw new TaskTemplateError('orderedItemIds must be an array of task item IDs.');
  }

  const ids = orderedItemIds.map(String);
  const existingIds = new Set(template.items.map((item) => item.id));

  if (ids.length !== template.items.length || new Set(ids).size !== ids.length || ids.some((id) => !existingIds.has(id))) {
    throw new TaskTemplateError('Reorder payload must include every task exactly once.');
  }

  const updated = await prisma.$transaction(async (transaction) => {
    for (let index = 0; index < ids.length; index += 1) {
      await transaction.taskTemplateItem.update({
        where: { id: ids[index] },
        data: { orderIndex: -(index + 1) },
      });
    }

    for (let index = 0; index < ids.length; index += 1) {
      await transaction.taskTemplateItem.update({
        where: { id: ids[index] },
        data: { orderIndex: index + 1 },
      });
    }

    return findTemplateOrThrow(template.id, transaction);
  });

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.UPDATE,
    event: 'TASK_TEMPLATE_DRAFT_UPDATED',
    description: `Reordered tasks in ${updated.templateKey} version ${updated.version}.`,
    templateId: updated.id,
    templateKey: updated.templateKey,
    version: updated.version,
    newValues: { orderedItemIds: ids },
  });

  return templateDto(updated);
}

export async function cloneTaskTemplateVersion(
  templateId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const source = await findTemplateOrThrow(templateId);

  if (source.status !== TaskTemplateStatus.PUBLISHED) {
    throw new TaskTemplateError('Only a published template can be cloned into a new draft.', 409);
  }

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<{ acquired: string }[]>`
      SELECT pg_advisory_xact_lock(hashtext(${source.templateKey}))::text AS acquired
    `;
    const existingDraft = await transaction.taskTemplate.findFirst({
      where: { templateKey: source.templateKey, status: TaskTemplateStatus.DRAFT },
      include: templateInclude,
      orderBy: { version: 'desc' },
    });

    if (existingDraft) return { template: existingDraft, created: false };

    const latest = await transaction.taskTemplate.aggregate({
      where: { templateKey: source.templateKey },
      _max: { version: true },
    });
    const created = await transaction.taskTemplate.create({
      data: {
        eventCategoryId: source.eventCategoryId,
        templateKey: source.templateKey,
        name: source.name,
        description: source.description,
        version: (latest._max.version ?? source.version) + 1,
        status: TaskTemplateStatus.DRAFT,
        isActive: false,
        isDefault: source.isDefault,
        sourceTemplateId: source.id,
        items: {
          create: source.items.map((item) => ({
            itemKey: item.itemKey,
            orderIndex: item.orderIndex,
            title: item.title,
            description: item.description,
            priority: item.priority,
            assignedToRole: item.assignedToRole,
            isRequired: item.isRequired,
            dueOffsetDays: item.dueOffsetDays,
            category: item.category,
          })),
        },
      },
      include: templateInclude,
    });

    return { template: created, created: true };
  });
  const created = result.template;

  if (!result.created) return templateDto(created);

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.CREATE,
    event: 'TASK_TEMPLATE_VERSION_CREATED',
    description: `Created draft ${created.templateKey} version ${created.version}.`,
    templateId: created.id,
    templateKey: created.templateKey,
    version: created.version,
    newValues: { sourceTemplateId: source.id, itemCount: created.items.length },
  });

  return templateDto(created);
}

function validatePublishable(template: TemplateRecord) {
  const errors = taskTemplatePublishValidationErrors(template);

  if (errors.length > 0) throw new TaskTemplateError(errors[0], 409);
}

export async function publishTaskTemplate(
  templateId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const draft = await findTemplateOrThrow(templateId);
  validatePublishable(draft);

  const published = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<{ acquired: string }[]>`
      SELECT pg_advisory_xact_lock(hashtext(${draft.templateKey}))::text AS acquired
    `;
    const currentDraft = await findTemplateOrThrow(draft.id, transaction);
    validatePublishable(currentDraft);
    await transaction.taskTemplate.updateMany({
      where: {
        templateKey: draft.templateKey,
        status: TaskTemplateStatus.PUBLISHED,
        isActive: true,
      },
      data: { isActive: false },
    });

    return transaction.taskTemplate.update({
      where: { id: draft.id },
      data: {
        status: TaskTemplateStatus.PUBLISHED,
        isActive: true,
        publishedAt: new Date(),
        publishedById: actor.id,
      },
      include: templateInclude,
    });
  });

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.APPROVAL,
    event: 'TASK_TEMPLATE_PUBLISHED',
    description: `Published ${published.templateKey} version ${published.version}.`,
    templateId: published.id,
    templateKey: published.templateKey,
    version: published.version,
    newValues: { status: published.status, isActive: published.isActive, itemCount: published.items.length },
  });

  return templateDto(published);
}

export async function archiveTaskTemplate(
  templateId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const template = await findTemplateOrThrow(templateId);

  if (template.isDefault && template.isActive) {
    throw new TaskTemplateError('The active default template cannot be archived.', 409);
  }

  const archived = await prisma.taskTemplate.update({
    where: { id: template.id },
    data: { status: TaskTemplateStatus.ARCHIVED, isActive: false },
    include: templateInclude,
  });

  await auditTemplateEvent({
    actor,
    request,
    action: AuditAction.DELETE,
    event: 'TASK_TEMPLATE_ARCHIVED',
    description: `Archived ${archived.templateKey} version ${archived.version}.`,
    templateId: archived.id,
    templateKey: archived.templateKey,
    version: archived.version,
    previousValues: { status: template.status, isActive: template.isActive },
    newValues: { status: archived.status, isActive: archived.isActive },
  });

  return templateDto(archived);
}

export async function handleTaskTemplateError(error: unknown) {
  await createAuditLog({
    ...systemAuditActor(),
    action: AuditAction.ERROR,
    module: 'Task Templates',
    description: 'Task template operation failed.',
    status: AuditStatus.FAILED,
    metadata: {
      event: 'TASK_TEMPLATE_OPERATION_FAILED',
      httpStatus: error instanceof TaskTemplateError ? error.status : 500,
      ...errorMetadata(error),
    },
  });

  if (error instanceof TaskTemplateError) {
    return Response.json({ success: false, error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  if (error instanceof Error && error.message.startsWith('Forbidden')) {
    return Response.json({ success: false, error: error.message }, { status: 403 });
  }

  console.error('Task template request failed:', error);
  return Response.json({ success: false, error: 'Unable to process task template request.' }, { status: 500 });
}

export { templateDto };
