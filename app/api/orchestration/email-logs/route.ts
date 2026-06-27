import {
  EmailStatus,
  EmailType,
  RelatedModule,
  TriggerSource,
} from '@prisma/client';
import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService, DashboardServiceError } from '@/lib/dashboard-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

function enumValue<T extends string>(value: unknown, options: readonly T[], fallback: T) {
  return typeof value === 'string' && options.includes(value.toUpperCase() as T)
    ? value.toUpperCase() as T
    : fallback;
}

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    const now = new Date();
    const status = enumValue(body.status, Object.values(EmailStatus), EmailStatus.QUEUED);
    const isSent = status === EmailStatus.SENT || status === EmailStatus.DELIVERED;
    const isFailed = status === EmailStatus.FAILED || status === EmailStatus.BOUNCED;
    const emailLog = await prisma.emailLog.create({
      data: {
        recipientEmail: requiredText(body.recipientEmail, 'recipientEmail').toLowerCase(),
        recipientName: text(body.recipientName),
        emailType: enumValue(body.emailType, Object.values(EmailType), EmailType.GENERAL),
        relatedModule: text(body.relatedModule)
          ? enumValue(body.relatedModule, Object.values(RelatedModule), RelatedModule.ADMIN_NOTIFICATION)
          : null,
        relatedRecordId: text(body.relatedRecordId),
        subject: requiredText(body.subject, 'subject'),
        triggerSource: enumValue(body.triggerSource, Object.values(TriggerSource), TriggerSource.N8N_WORKFLOW),
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
