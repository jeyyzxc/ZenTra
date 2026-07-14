import {
  EmailStatus,
  EmailType,
  RelatedModule,
  TriggerSource,
} from '@prisma/client';
import {
  enforceOrchestrationRateLimit,
  requireBookingOrchestrationKey,
  requireBookingReferenceHeader,
  requireN8nWorkflowHeaders,
} from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService, DashboardServiceError } from '@/lib/dashboard-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PRODUCTION_EMAIL_STATUSES: readonly EmailStatus[] = Object.values(EmailStatus).filter(
  (status) => status !== EmailStatus.PENDING_DEMO && status !== EmailStatus.SENT_DEMO,
);

const PRODUCTION_TRIGGER_SOURCES: readonly TriggerSource[] = Object.values(TriggerSource).filter(
  (source) => source !== TriggerSource.DEMO_CLIENT_ADMIN_BRIDGE,
);

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requiredText(value: unknown, label: string) {
  const trimmed = text(value);

  if (!trimmed) {
    throw new DashboardServiceError(`${label} is required.`);
  }

  return trimmed;
}

function enumValue<T extends string>(value: unknown, options: readonly T[], label: string) {
  const rawValue = requiredText(value, label).toUpperCase();

  if (!options.includes(rawValue as T)) {
    throw new DashboardServiceError(`${label} is invalid.`);
  }

  return rawValue as T;
}

function emailLogStatus(value: unknown) {
  const rawValue = requiredText(value, 'status').toUpperCase();

  if (rawValue === 'SKIPPED') {
    return EmailStatus.NOT_SENT;
  }

  if (!PRODUCTION_EMAIL_STATUSES.includes(rawValue as EmailStatus)) {
    throw new DashboardServiceError('status is invalid.');
  }

  return rawValue as EmailStatus;
}

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    requireN8nWorkflowHeaders(request);
    const body = await request.json() as Record<string, unknown>;
    const bookingReference = requireBookingReferenceHeader(request);
    const relatedModule = enumValue(body.relatedModule, Object.values(RelatedModule), 'relatedModule');
    const relatedRecordId = requiredText(body.relatedRecordId, 'relatedRecordId');

    if (relatedModule !== RelatedModule.BOOKING) {
      throw new DashboardServiceError('This workflow can only create booking email logs.', 403);
    }

    const booking = await prisma.booking.findFirst({
      where: { id: relatedRecordId, bookingReference },
      select: { id: true },
    });

    if (!booking) {
      throw new DashboardServiceError('Booking reference does not match the email-log booking.', 403);
    }

    await enforceOrchestrationRateLimit({
      request,
      scope: 'booking-email-log-write',
    });

    if (body.payloadSummary && typeof body.payloadSummary === 'object') {
      const summaryReference = text((body.payloadSummary as Record<string, unknown>).bookingReference);

      if (summaryReference && summaryReference !== bookingReference) {
        throw new DashboardServiceError('Payload booking reference does not match the request header.', 403);
      }
    }

    const now = new Date();
    const status = emailLogStatus(body.status);
    const isSent = status === EmailStatus.SENT || status === EmailStatus.DELIVERED;
    const isFailed = status === EmailStatus.FAILED || status === EmailStatus.BOUNCED;
    const emailLog = await prisma.emailLog.create({
      data: {
        recipientEmail: requiredText(body.recipientEmail, 'recipientEmail').toLowerCase(),
        recipientName: text(body.recipientName),
        emailType: enumValue(body.emailType, Object.values(EmailType), 'emailType'),
        relatedModule,
        relatedRecordId,
        subject: requiredText(body.subject, 'subject'),
        triggerSource: enumValue(body.triggerSource, PRODUCTION_TRIGGER_SOURCES, 'triggerSource'),
        workflowName: text(body.workflowName),
        workflowExecutionId: text(body.workflowExecutionId) ?? text(body.n8nExecutionId),
        providerMessageId: text(body.providerMessageId),
        status,
        retryCount: Number(body.retryCount) || 0,
        lastAttemptAt: now,
        sentAt: isSent ? now : null,
        deliveredAt: status === EmailStatus.DELIVERED ? now : null,
        failedAt: isFailed ? now : null,
        errorMessage: text(body.errorMessage),
        failureReason: text(body.failureReason),
        emailPreview: text(body.emailPreview),
        payloadSummary: typeof body.payloadSummary === 'object' && body.payloadSummary
          ? body.payloadSummary
          : undefined,
      },
    });

    if (isFailed) {
      await DashboardService.createNotification({
        title: 'Email delivery failed',
        message: `${emailLog.subject} could not be delivered to ${emailLog.recipientEmail}.`,
        type: 'EMAIL',
        priority: 'HIGH',
        relatedModule: 'email_logs',
        relatedRecordId: emailLog.id,
      });
    }

    return dashboardCreated({ id: emailLog.id }, 'Email log saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to save email log.');
  }
}
