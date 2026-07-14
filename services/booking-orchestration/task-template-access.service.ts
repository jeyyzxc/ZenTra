import { AuditAction, AuditStatus, TaskTemplateStatus } from '@prisma/client';
import { createAuditLog, systemAuditActor } from '@/lib/audit';
import { BookingRequestError } from '@/lib/booking-validation';
import { prisma } from '@/lib/prisma';
import {
  requireBackendOrchestrationSecret,
  requireN8nWorkflowHeaders,
} from './orchestration.service';
import { enforceOrchestrationRateLimit } from './orchestration-rate-limit.service';

function requiredHeader(request: Request, name: string) {
  const value = request.headers.get(name)?.trim();

  if (!value) {
    throw new BookingRequestError(`Missing ${name} header.`, 400);
  }

  return value;
}

export async function getTaskTemplateForOrchestration(input: {
  request: Request;
  requestedTemplateKey: string;
}) {
  requireBackendOrchestrationSecret(input.request);
  const { workflow } = requireN8nWorkflowHeaders(input.request);
  const bookingReference = requiredHeader(input.request, 'x-zion-booking-reference');
  await enforceOrchestrationRateLimit({
    request: input.request,
    scope: 'task-template-read',
    limit: 240,
  });
  const requestedTemplateKey = decodeURIComponent(input.requestedTemplateKey).trim();

  if (!requestedTemplateKey) {
    throw new BookingRequestError('Requested template key is required.');
  }

  const context = await prisma.bookingOrchestrationContext.findFirst({
    where: { bookingReference },
    include: {
      booking: { select: { id: true, bookingReference: true } },
    },
  });

  if (!context || context.booking.bookingReference !== bookingReference) {
    throw new BookingRequestError('Booking orchestration context not found.', 404);
  }

  if (
    requestedTemplateKey !== context.requestedTaskTemplateKey &&
    requestedTemplateKey !== context.taskTemplateKey
  ) {
    throw new BookingRequestError('Requested template key does not match the booking context.', 403);
  }

  const template = await prisma.taskTemplate.findUnique({
    where: { id: context.taskTemplateId },
    include: {
      eventCategory: { select: { categoryKey: true } },
      items: { orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  if (
    !template ||
    template.status !== TaskTemplateStatus.PUBLISHED ||
    template.templateKey !== context.taskTemplateKey ||
    template.version !== context.taskTemplateVersion
  ) {
    throw new BookingRequestError('The booking task template snapshot is unavailable.', 503);
  }

  if (template.items.length === 0) {
    throw new BookingRequestError('The resolved task template has no tasks.', 503);
  }

  await createAuditLog({
    ...systemAuditActor(),
    action: AuditAction.READ,
    module: 'Task Templates',
    description: `n8n fetched ${template.templateKey} version ${template.version} for booking ${bookingReference}.`,
    status: AuditStatus.SUCCESS,
    source: 'n8n',
    metadata: {
      event: 'TASK_TEMPLATE_RETRIEVED',
      workflow,
      bookingId: context.bookingId,
      bookingReference,
      requestedTemplateKey: context.requestedTaskTemplateKey,
      appliedTemplateKey: template.templateKey,
      taskTemplateId: template.id,
      taskTemplateVersion: template.version,
      templateFallbackUsed: context.templateFallbackUsed,
    },
  });

  return {
    id: template.id,
    templateKey: template.templateKey,
    requestedTemplateKey: context.requestedTaskTemplateKey,
    eventCategoryKey: context.eventCategoryKey,
    name: template.name,
    version: template.version,
    status: template.status,
    isFallback: context.templateFallbackUsed,
    fallbackReason: context.templateFallbackReason,
    tasks: template.items.map((item) => ({
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
