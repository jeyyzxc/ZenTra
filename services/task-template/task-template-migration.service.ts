import {
  AuditAction,
  AuditStatus,
  DashboardTaskPriority,
  DashboardTaskSource,
  DashboardTaskStatus,
  Prisma,
  TaskTemplateMigrationStatus,
  TaskTemplateStatus,
  TaskTemplateSyncState,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { auditActor, createAuditLog } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { calculateBookingTaskDueDate } from '@/services/booking-orchestration/booking-task-snapshot.service';
import { templateTaskContentHash } from './task-content';

const PREVIEW_TTL_MS = 30 * 60 * 1000;
const MIGRATABLE_FIELDS = new Set([
  'title',
  'description',
  'priority',
  'assignedToRole',
  'category',
  'dueDate',
]);

type PreviewAction = 'update' | 'add' | 'cancel';

type PreviewTask = {
  action: PreviewAction;
  taskId: string | null;
  itemKey: string;
  title: string;
  eligible: boolean;
  reason: string | null;
  changedFields: string[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

type PreviewBooking = {
  bookingId: string;
  bookingReference: string;
  eventDate: string;
  tasks: PreviewTask[];
};

type PreviewPayload = {
  targetTemplateId: string;
  targetTemplateKey: string;
  targetVersion: number;
  createdAt: string;
  expiresAt: string;
  bookings: PreviewBooking[];
  summary: {
    bookingCount: number;
    updateCount: number;
    addCount: number;
    cancelCount: number;
    excludedCount: number;
  };
};

export class TaskTemplateMigrationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TaskTemplateMigrationError';
    this.status = status;
  }
}

function requiredText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TaskTemplateMigrationError(`${label} is required.`);
  }
  return value.trim();
}

function snapshotDueOffset(value: Prisma.JsonValue | null): number | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const dueOffsetDays = (value as Record<string, unknown>).dueOffsetDays;
  return typeof dueOffsetDays === 'number' && Number.isInteger(dueOffsetDays)
    ? dueOffsetDays
    : null;
}

function currentTaskHash(task: {
  templateItemKey: string | null;
  title: string;
  description: string | null;
  priority: DashboardTaskPriority;
  assignedToRole: string | null;
  category: string | null;
  templateSnapshot: Prisma.JsonValue | null;
}) {
  if (!task.templateItemKey) return null;
  return templateTaskContentHash({
    itemKey: task.templateItemKey,
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignedToRole: task.assignedToRole,
    category: task.category,
    dueOffsetDays: snapshotDueOffset(task.templateSnapshot),
  });
}

function taskEligibility(task: {
  status: DashboardTaskStatus;
  templateSyncState: TaskTemplateSyncState;
  manualOverrideAt: Date | null;
  templateContentHash: string | null;
  templateItemKey: string | null;
  title: string;
  description: string | null;
  priority: DashboardTaskPriority;
  assignedToRole: string | null;
  category: string | null;
  templateSnapshot: Prisma.JsonValue | null;
}) {
  if (task.status === DashboardTaskStatus.COMPLETED) return 'Completed tasks are locked.';
  if (task.status === DashboardTaskStatus.CANCELLED) return 'Cancelled tasks are locked.';
  if (task.templateSyncState !== TaskTemplateSyncState.SYNCED || task.manualOverrideAt) {
    return 'The task was manually customized or locked.';
  }
  if (!task.templateContentHash || currentTaskHash(task) !== task.templateContentHash) {
    return 'The task no longer matches its original template snapshot.';
  }
  return null;
}

function parseBookingIds(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new TaskTemplateMigrationError('bookingIds must be an array.');
  const ids = value.map((item) => requiredText(item, 'bookingIds[]'));
  return [...new Set(ids)].slice(0, 500);
}

function priority(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!Object.values(DashboardTaskPriority).includes(normalized as DashboardTaskPriority)) {
    throw new TaskTemplateMigrationError(`Unsupported task priority: ${value}`);
  }
  return normalized as DashboardTaskPriority;
}

function afterValues(
  item: {
    title: string;
    description: string | null;
    priority: string;
    assignedToRole: string;
    category: string | null;
    dueOffsetDays: number | null;
    orderIndex: number;
  },
  eventDate: Date,
  taskCount: number,
) {
  const due = calculateBookingTaskDueDate({
    eventDate,
    dueOffsetDays: item.dueOffsetDays,
    orderIndex: item.orderIndex,
    taskCount,
  });
  return {
    title: item.title,
    description: item.description,
    priority: priority(item.priority),
    assignedToRole: item.assignedToRole,
    category: item.category,
    dueDate: due.dueDate.toISOString(),
    isHighRisk: due.isHighRisk,
    orderIndex: item.orderIndex,
  };
}

function changedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  return [...MIGRATABLE_FIELDS].filter((field) => {
    const beforeValue = field === 'dueDate' ? new Date(String(before[field])).toISOString() : before[field];
    return beforeValue !== after[field];
  });
}

export async function previewTaskTemplateMigration(
  input: { targetTemplateId?: unknown; bookingIds?: unknown },
  actor: CurrentAdmin,
  request?: Request,
) {
  const targetTemplateId = requiredText(input.targetTemplateId, 'targetTemplateId');
  const bookingIds = parseBookingIds(input.bookingIds);
  const target = await prisma.taskTemplate.findUnique({
    where: { id: targetTemplateId },
    include: { items: { orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] } },
  });

  if (!target || target.status !== TaskTemplateStatus.PUBLISHED || !target.isActive) {
    throw new TaskTemplateMigrationError('Select the active published target template.', 409);
  }

  const existingTasks = await prisma.dashboardTask.findMany({
    where: {
      taskTemplateKey: target.templateKey,
      taskTemplateId: { not: target.id },
      templateItemKey: { not: null },
      source: DashboardTaskSource.N8N_WORKFLOW,
      relatedModule: 'bookings',
      relatedRecordId: bookingIds ? { in: bookingIds } : { not: null },
    },
    orderBy: [{ relatedRecordId: 'asc' }, { orderIndex: 'asc' }],
  });

  const relatedBookingIds = [...new Set(existingTasks
    .map((task) => task.relatedRecordId)
    .filter((id): id is string => Boolean(id)))];
  const bookingRecords = await prisma.booking.findMany({
    where: { id: { in: relatedBookingIds } },
    select: { id: true, bookingReference: true, eventDate: true },
  });
  const bookingById = new Map(bookingRecords.map((booking) => [booking.id, booking]));
  const byBooking = new Map<string, typeof existingTasks>();
  for (const task of existingTasks) {
    if (!task.relatedRecordId || !bookingById.has(task.relatedRecordId)) continue;
    const group = byBooking.get(task.relatedRecordId) ?? [];
    group.push(task);
    byBooking.set(task.relatedRecordId, group);
  }

  const targetByKey = new Map(target.items.map((item) => [item.itemKey, item]));
  const bookings: PreviewBooking[] = [];
  let updateCount = 0;
  let addCount = 0;
  let cancelCount = 0;
  let excludedCount = 0;

  for (const [bookingId, tasks] of byBooking.entries()) {
    const booking = bookingById.get(bookingId)!;
    const existingByKey = new Map(tasks.map((task) => [task.templateItemKey!, task]));
    const previewTasks: PreviewTask[] = [];

    for (const task of tasks) {
      const item = targetByKey.get(task.templateItemKey!);
      const reason = taskEligibility(task);
      const before = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignedToRole: task.assignedToRole,
        category: task.category,
        dueDate: task.taskDate.toISOString(),
        orderIndex: task.orderIndex,
      };

      if (!item) {
        const eligible = !reason;
        previewTasks.push({
          action: 'cancel', taskId: task.id, itemKey: task.templateItemKey!, title: task.title,
          eligible, reason, changedFields: ['status'], before, after: { status: 'CANCELLED' },
        });
        if (eligible) cancelCount += 1; else excludedCount += 1;
        continue;
      }

      const after = afterValues(item, booking.eventDate, target.items.length);
      const changes = changedFields(before, after);
      const eligible = !reason;
      previewTasks.push({
        action: 'update', taskId: task.id, itemKey: item.itemKey, title: item.title,
        eligible, reason, changedFields: changes, before, after,
      });
      if (eligible) updateCount += 1; else excludedCount += 1;
    }

    for (const item of target.items) {
      if (existingByKey.has(item.itemKey)) continue;
      const after = afterValues(item, booking.eventDate, target.items.length);
      previewTasks.push({
        action: 'add', taskId: null, itemKey: item.itemKey, title: item.title,
        eligible: true, reason: null, changedFields: Object.keys(after), before: null, after,
      });
      addCount += 1;
    }

    bookings.push({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      eventDate: booking.eventDate.toISOString(),
      tasks: previewTasks,
    });
  }

  const createdAt = new Date();
  const payload: PreviewPayload = {
    targetTemplateId: target.id,
    targetTemplateKey: target.templateKey,
    targetVersion: target.version,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + PREVIEW_TTL_MS).toISOString(),
    bookings,
    summary: { bookingCount: bookings.length, updateCount, addCount, cancelCount, excludedCount },
  };
  const run = await prisma.taskTemplateMigrationRun.create({
    data: {
      publicReference: `tmr_${randomUUID().replaceAll('-', '')}`,
      sourceTemplateId: existingTasks[0]?.taskTemplateId ?? target.sourceTemplateId ?? target.id,
      targetTemplateId: target.id,
      previewPayload: payload as unknown as Prisma.InputJsonValue,
      createdBy: actor.id,
    },
  });

  await createAuditLog({
    ...auditActor(actor), action: AuditAction.READ, module: 'Command Center',
    description: `Previewed task-template migration to ${target.templateKey} v${target.version}.`,
    status: AuditStatus.SUCCESS,
    metadata: { previewReference: run.publicReference, ...payload.summary },
    ipAddress: request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request?.headers.get('user-agent') ?? null,
  });

  return { previewReference: run.publicReference, ...payload };
}

export async function applyTaskTemplateMigration(
  input: {
    previewReference?: unknown;
    idempotencyKey?: unknown;
    bookingIds?: unknown;
    fields?: unknown;
    addNewTasks?: unknown;
    cancelRemovedTasks?: unknown;
  },
  actor: CurrentAdmin,
  request?: Request,
) {
  const previewReference = requiredText(input.previewReference, 'previewReference');
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey');
  if (idempotencyKey.length > 160) throw new TaskTemplateMigrationError('idempotencyKey is too long.');
  const selectedBookingIds = parseBookingIds(input.bookingIds);
  const selectedFields = input.fields === undefined
    ? new Set(MIGRATABLE_FIELDS)
    : new Set(Array.isArray(input.fields) ? input.fields.map((field) => requiredText(field, 'fields[]')) : []);
  for (const field of selectedFields) {
    if (!MIGRATABLE_FIELDS.has(field)) throw new TaskTemplateMigrationError(`Unsupported migration field: ${field}`);
  }
  const addNewTasks = input.addNewTasks !== false;
  const cancelRemovedTasks = input.cancelRemovedTasks === true;

  const prior = await prisma.taskTemplateMigrationRun.findUnique({ where: { idempotencyKey } });
  if (prior) {
    if (prior.publicReference !== previewReference) {
      throw new TaskTemplateMigrationError('The idempotency key belongs to another preview.', 409);
    }
    if (prior.status === TaskTemplateMigrationStatus.COMPLETED) return prior.resultPayload;
    throw new TaskTemplateMigrationError('This migration request is already being processed.', 409);
  }

  const run = await prisma.taskTemplateMigrationRun.findUnique({ where: { publicReference: previewReference } });
  if (!run || run.status !== TaskTemplateMigrationStatus.PREVIEWED) {
    throw new TaskTemplateMigrationError('Migration preview is missing or no longer applicable.', 409);
  }
  const preview = run.previewPayload as unknown as PreviewPayload;
  if (new Date(preview.expiresAt).getTime() < Date.now()) {
    throw new TaskTemplateMigrationError('Migration preview expired. Generate a new impact preview.', 409);
  }

  const claimed = await prisma.taskTemplateMigrationRun.updateMany({
    where: { id: run.id, status: TaskTemplateMigrationStatus.PREVIEWED, idempotencyKey: null },
    data: { status: TaskTemplateMigrationStatus.APPLYING, idempotencyKey, appliedBy: actor.id },
  });
  if (claimed.count !== 1) throw new TaskTemplateMigrationError('Migration preview was already claimed.', 409);

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const target = await transaction.taskTemplate.findUnique({
        where: { id: preview.targetTemplateId },
        include: { items: { orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] } },
      });
      if (!target || target.status !== TaskTemplateStatus.PUBLISHED || !target.isActive) {
        throw new TaskTemplateMigrationError('The target template is no longer active.', 409);
      }
      const targetByKey = new Map(target.items.map((item) => [item.itemKey, item]));
      const allowedBookings = selectedBookingIds ? new Set(selectedBookingIds) : null;
      const results: Array<Record<string, unknown>> = [];
      let updated = 0;
      let added = 0;
      let cancelled = 0;
      let skipped = 0;

      for (const bookingPreview of preview.bookings) {
        if (allowedBookings && !allowedBookings.has(bookingPreview.bookingId)) continue;
        const booking = await transaction.booking.findUnique({
          where: { id: bookingPreview.bookingId },
          select: { id: true, bookingReference: true, eventDate: true, status: true },
        });
        if (!booking) { skipped += bookingPreview.tasks.length; continue; }
        const current = await transaction.dashboardTask.findMany({
          where: { relatedModule: 'bookings', relatedRecordId: booking.id, templateItemKey: { not: null } },
        });
        const currentById = new Map(current.map((task) => [task.id, task]));
        const currentByKey = new Map(current.map((task) => [task.templateItemKey!, task]));

        for (const action of bookingPreview.tasks) {
          if (action.action === 'add') {
            if (!addNewTasks || currentByKey.has(action.itemKey)) { skipped += 1; continue; }
            const item = targetByKey.get(action.itemKey);
            if (!item) { skipped += 1; continue; }
            const after = afterValues(item, booking.eventDate, target.items.length);
            const hash = templateTaskContentHash({ ...item, itemKey: item.itemKey });
            const created = await transaction.dashboardTask.create({
              data: {
                title: item.title, description: item.description, taskDate: new Date(String(after.dueDate)),
                priority: priority(item.priority), assignedTo: item.assignedToRole,
                assignedToRole: item.assignedToRole, relatedModule: 'bookings', relatedRecordId: booking.id,
                bookingReference: booking.bookingReference, category: item.category,
                source: DashboardTaskSource.N8N_WORKFLOW, orderIndex: item.orderIndex,
                taskTemplateKey: target.templateKey, taskTemplateId: target.id,
                taskTemplateVersion: target.version, templateItemId: item.id, templateItemKey: item.itemKey,
                templateSnapshot: {
                  taskTemplateId: target.id, taskTemplateKey: target.templateKey,
                  taskTemplateVersion: target.version, templateItemId: item.id, itemKey: item.itemKey,
                  orderIndex: item.orderIndex, title: item.title, description: item.description,
                  priority: item.priority, assignedToRole: item.assignedToRole, category: item.category,
                  isRequired: item.isRequired, dueOffsetDays: item.dueOffsetDays, dueDate: after.dueDate,
                },
                templateSyncState: TaskTemplateSyncState.SYNCED, templateContentHash: hash,
                templateMigrationRunId: run.id, isHighRisk: Boolean(after.isHighRisk),
                activationStatus: 'active', isActive: true, isEditable: true,
                startedAt: new Date(), createdBy: actor.id,
              },
            });
            currentByKey.set(item.itemKey, created);
            added += 1;
            results.push({ bookingReference: booking.bookingReference, action: 'add', taskId: created.id, itemKey: item.itemKey });
            continue;
          }

          const task = action.taskId ? currentById.get(action.taskId) : undefined;
          if (!task || taskEligibility(task)) { skipped += 1; continue; }
          if (action.action === 'cancel') {
            if (!cancelRemovedTasks) { skipped += 1; continue; }
            await transaction.dashboardTask.update({ where: { id: task.id }, data: {
              status: DashboardTaskStatus.CANCELLED, isActive: false, activationStatus: 'cancelled_by_template_migration',
              templateSyncState: TaskTemplateSyncState.LOCKED, templateMigrationRunId: run.id,
            } });
            cancelled += 1;
            results.push({ bookingReference: booking.bookingReference, action: 'cancel', taskId: task.id, itemKey: task.templateItemKey });
            continue;
          }

          const item = targetByKey.get(action.itemKey);
          if (!item) { skipped += 1; continue; }
          const after = afterValues(item, booking.eventDate, target.items.length);
          const data: Prisma.DashboardTaskUpdateInput = {
            taskTemplateKey: target.templateKey, taskTemplate: { connect: { id: target.id } },
            taskTemplateVersion: target.version, templateItem: { connect: { id: item.id } },
            templateItemKey: item.itemKey, orderIndex: item.orderIndex,
            templateSyncState: TaskTemplateSyncState.SYNCED, manualOverrideAt: null, manualOverrideBy: null,
            templateContentHash: templateTaskContentHash({ ...item, itemKey: item.itemKey }),
            templateMigrationRun: { connect: { id: run.id } },
            templateSnapshot: {
              taskTemplateId: target.id, taskTemplateKey: target.templateKey,
              taskTemplateVersion: target.version, templateItemId: item.id, itemKey: item.itemKey,
              orderIndex: item.orderIndex, title: item.title, description: item.description,
              priority: item.priority, assignedToRole: item.assignedToRole, category: item.category,
              isRequired: item.isRequired, dueOffsetDays: item.dueOffsetDays, dueDate: after.dueDate,
            },
          };
          if (selectedFields.has('title')) data.title = item.title;
          if (selectedFields.has('description')) data.description = item.description;
          if (selectedFields.has('priority')) data.priority = priority(item.priority);
          if (selectedFields.has('assignedToRole')) { data.assignedToRole = item.assignedToRole; data.assignedTo = item.assignedToRole; }
          if (selectedFields.has('category')) data.category = item.category;
          if (selectedFields.has('dueDate')) { data.taskDate = new Date(String(after.dueDate)); data.isHighRisk = Boolean(after.isHighRisk); }
          const before = { title: task.title, description: task.description, priority: task.priority, assignedToRole: task.assignedToRole, category: task.category, dueDate: task.taskDate.toISOString() };
          await transaction.dashboardTask.update({ where: { id: task.id }, data });
          updated += 1;
          results.push({ bookingReference: booking.bookingReference, action: 'update', taskId: task.id, itemKey: item.itemKey, before, after });
        }
      }

      const resultPayload = { updated, added, cancelled, skipped, results };
      await transaction.taskTemplateMigrationRun.update({ where: { id: run.id }, data: {
        status: TaskTemplateMigrationStatus.COMPLETED,
        applyPayload: { bookingIds: selectedBookingIds ?? null, fields: [...selectedFields], addNewTasks, cancelRemovedTasks },
        resultPayload: resultPayload as unknown as Prisma.InputJsonValue,
        appliedAt: new Date(),
      } });
      return resultPayload;
    }, { timeout: 30_000 });

    await createAuditLog({
      ...auditActor(actor), action: AuditAction.UPDATE, module: 'Command Center',
      description: `Applied reviewed task-template migration ${previewReference}.`,
      status: AuditStatus.SUCCESS, metadata: { previewReference, idempotencyKey, ...result },
      ipAddress: request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request?.headers.get('user-agent') ?? null,
    });
    return result;
  } catch (error) {
    await prisma.taskTemplateMigrationRun.update({
      where: { id: run.id },
      data: { status: TaskTemplateMigrationStatus.FAILED, safeError: error instanceof Error ? error.message.slice(0, 1000) : 'Migration failed.' },
    }).catch(() => undefined);
    throw error;
  }
}

export function handleTaskTemplateMigrationError(error: unknown) {
  if (error instanceof TaskTemplateMigrationError) {
    return Response.json({ success: false, error: error.message }, { status: error.status });
  }
  console.error('Task-template migration failed.', error);
  return Response.json({ success: false, error: 'Unable to process the task-template migration.' }, { status: 500 });
}
