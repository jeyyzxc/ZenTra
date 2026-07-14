import { AuditAction, AuditStatus, NotificationPriority, NotificationType, Prisma, TaskTemplateStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  GENERAL_EVENT_TEMPLATE_KEY,
  TaskTemplateError,
  templateDto,
} from './task-template.service';

type TemplateDb = typeof prisma | Prisma.TransactionClient;

const resolutionInclude = {
  eventCategory: {
    select: { id: true, name: true, categoryKey: true },
  },
  items: {
    orderBy: [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.TaskTemplateInclude;

export type TaskTemplateResolution = {
  requestedTemplateKey: string;
  templateKey: string;
  taskTemplateId: string;
  taskTemplateVersion: number;
  templateFallbackUsed: boolean;
  templateFallbackReason: string | null;
  template: ReturnType<typeof templateDto>;
};

async function findPublishedTemplate(templateKey: string, db: TemplateDb) {
  return db.taskTemplate.findFirst({
    where: {
      templateKey,
      status: TaskTemplateStatus.PUBLISHED,
      isActive: true,
    },
    include: resolutionInclude,
    orderBy: { version: 'desc' },
  });
}

export async function resolvePublishedTaskTemplate(
  requestedTemplateKey: string,
  db: TemplateDb = prisma,
): Promise<TaskTemplateResolution> {
  const requestedKey = requestedTemplateKey.trim();

  if (!requestedKey) {
    throw new TaskTemplateError('Requested template key is required.');
  }

  const requested = await findPublishedTemplate(requestedKey, db);
  const selected = requested ?? await findPublishedTemplate(GENERAL_EVENT_TEMPLATE_KEY, db);

  if (!selected || selected.items.length === 0) {
    throw new TaskTemplateError('No published task template is available for this booking.', 503);
  }

  const fallbackUsed = !requested;
  return {
    requestedTemplateKey: requestedKey,
    templateKey: selected.templateKey,
    taskTemplateId: selected.id,
    taskTemplateVersion: selected.version,
    templateFallbackUsed: fallbackUsed,
    templateFallbackReason: fallbackUsed ? 'NO_PUBLISHED_CATEGORY_TEMPLATE' : null,
    template: templateDto(selected),
  };
}

export async function recordTemplateFallback(input: {
  db: Prisma.TransactionClient;
  bookingId: string;
  bookingReference: string;
  eventCategoryKey: string;
  requestedTemplateKey: string;
  appliedTemplateKey: string;
}) {
  await input.db.auditLog.create({
    data: {
      userName: 'System',
      userRole: 'SYSTEM',
      action: AuditAction.UPDATE,
      module: 'Task Templates',
      description: `Used ${input.appliedTemplateKey} fallback for booking ${input.bookingReference}.`,
      status: AuditStatus.WARNING,
      source: 'booking_orchestration',
      metadata: {
        event: 'TASK_TEMPLATE_FALLBACK_USED',
        bookingId: input.bookingId,
        bookingReference: input.bookingReference,
        eventCategoryKey: input.eventCategoryKey,
        requestedTemplateKey: input.requestedTemplateKey,
        appliedTemplateKey: input.appliedTemplateKey,
        fallbackReason: 'NO_PUBLISHED_CATEGORY_TEMPLATE',
      },
    },
  });

  await input.db.notification.create({
    data: {
      title: 'Task template fallback used',
      message: `Booking ${input.bookingReference} used ${input.appliedTemplateKey} because ${input.requestedTemplateKey} is not published. Review and publish the category draft.`,
      type: NotificationType.WORKFLOW,
      priority: NotificationPriority.HIGH,
      relatedModule: 'bookings',
      relatedRecordId: input.bookingId,
      createdFor: null,
      createdBy: 'system',
      source: 'booking_orchestration',
    },
  });
}
