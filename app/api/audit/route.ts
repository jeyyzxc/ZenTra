import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { AuditQueryError, getAuditLogPage } from '@/lib/audit-query';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const skipAudit = request.headers.get('X-Audit-Skip') === 'poll';
    const result = await getAuditLogPage(searchParams, actor);

    if (!skipAudit) {
      await createAuditLog({
        ...auditActor(actor),
        action: AuditAction.READ,
        module: 'Audit',
        description: actor.role === 'SUPERADMIN'
          ? 'Viewed audit logs.'
          : 'Viewed personal activity log.',
        status: AuditStatus.SUCCESS,
        ...getRequestContext(request),
        metadata: {
          requestPath: new URL(request.url).pathname,
          query: Object.fromEntries(searchParams.entries()),
          returnedRecords: result.logs.length,
          totalRecords: result.pagination.totalRecords,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuditQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.ERROR,
      module: 'Audit',
      description: 'Audit log query failed.',
      status: AuditStatus.FAILED,
      ...getRequestContext(request),
      metadata: {
        requestPath: new URL(request.url).pathname,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to load audit logs.' }, { status: 500 });
  }
}
