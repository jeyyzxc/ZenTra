import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { canReadAuditLog, sanitizeAuditLogForRole, serializeAuditLog } from '@/lib/audit-query';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const skipAudit = request.headers.get('X-Audit-Skip') === 'poll';
    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      return NextResponse.json({ error: 'Audit log not found.' }, { status: 404 });
    }

    if (!canReadAuditLog(actor, log)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!skipAudit) {
      await createAuditLog({
        ...auditActor(actor),
        action: AuditAction.READ,
        module: 'Audit',
        description: `Viewed audit log entry ${log.id}.`,
        status: AuditStatus.SUCCESS,
        ...getRequestContext(request),
        metadata: {
          requestPath: new URL(request.url).pathname,
          auditLogId: log.id,
        },
      });
    }

    return NextResponse.json({
      log: sanitizeAuditLogForRole(serializeAuditLog(log), actor.role),
    });
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.ERROR,
      module: 'Audit',
      description: 'Audit log detail query failed.',
      status: AuditStatus.FAILED,
      ...getRequestContext(request),
      metadata: {
        requestPath: new URL(request.url).pathname,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to load this audit log.' }, { status: 500 });
  }
}
