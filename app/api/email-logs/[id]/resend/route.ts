import { AuditAction, AuditStatus, EmailStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { sanitizeEmailLogForRole, serializeEmailLog } from '@/lib/email-log-query';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const RESENDABLE_STATUSES = new Set<EmailStatus>([
  EmailStatus.FAILED,
  EmailStatus.BOUNCED,
  EmailStatus.PENDING,
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const emailLog = await prisma.emailLog.findUnique({
    where: { id },
  });

  if (!emailLog) {
    return NextResponse.json({ error: 'Email log not found.' }, { status: 404 });
  }

  if (!RESENDABLE_STATUSES.has(emailLog.status)) {
    return NextResponse.json({ error: 'This email cannot be resent.' }, { status: 400 });
  }

  const updatedLog = await prisma.emailLog.update({
    where: { id },
    data: {
      status: EmailStatus.RETRIED,
      retryCount: { increment: 1 },
      lastAttemptAt: new Date(),
      resentBy: actor.username,
    },
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.UPDATE,
    module: 'Email Logs',
    description: `Resent email log ${emailLog.id} to ${emailLog.recipientEmail}.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues: {
      status: emailLog.status,
      retryCount: emailLog.retryCount,
      lastAttemptAt: emailLog.lastAttemptAt,
      resentBy: emailLog.resentBy,
    },
    newValues: {
      status: updatedLog.status,
      retryCount: updatedLog.retryCount,
      lastAttemptAt: updatedLog.lastAttemptAt,
      resentBy: updatedLog.resentBy,
    },
    metadata: {
      requestPath: new URL(request.url).pathname,
      emailLogId: emailLog.id,
    },
  });

  return NextResponse.json({
    success: true,
    log: sanitizeEmailLogForRole(serializeEmailLog(updatedLog), actor.role),
  });
}
