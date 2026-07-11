import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import {
  type AuditExportScope,
  createAuditCsv,
  createAuditPdf,
  createAuditXlsx,
  getAuditExportFilename,
} from '@/lib/audit-export';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { AuditQueryError, getAuditLogsForExport } from '@/lib/audit-query';

export const dynamic = 'force-dynamic';

const FORMATS = ['csv', 'excel', 'pdf'] as const;

type ExportFormat = (typeof FORMATS)[number];

function isExportFormat(format: string): format is ExportFormat {
  return FORMATS.includes(format as ExportFormat);
}

function responseForExport(
  format: ExportFormat,
  logs: Awaited<ReturnType<typeof getAuditLogsForExport>>['logs'],
  scope: AuditExportScope,
  timeZone?: string,
  generatedBy?: string,
  filters?: Record<string, unknown>,
) {
  if (format === 'csv') {
    return {
      body: createAuditCsv(logs, timeZone, scope),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
    };
  }

  if (format === 'excel') {
    return {
      body: createAuditXlsx(logs, timeZone, scope, generatedBy, filters),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }

  return {
    body: createAuditPdf(logs, timeZone, scope),
    contentType: 'application/pdf',
    extension: 'pdf',
  };
}

export async function GET(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestContext = getRequestContext(request);
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get('format')?.trim().toLowerCase() || 'csv';
  const timeZone = searchParams.get('timeZone')?.trim() || undefined;

  if (!isExportFormat(format)) {
    return NextResponse.json({ error: 'format must be csv, excel, or pdf.' }, { status: 400 });
  }

  try {
    const scope: AuditExportScope = actor.role === 'SUPERADMIN' ? 'all' : 'own';
    const exportData = await getAuditLogsForExport(searchParams, actor);
    const output = responseForExport(
      format,
      exportData.logs,
      scope,
      timeZone,
      actor.fullName || actor.email,
      exportData.filters,
    );
    const filename = getAuditExportFilename(output.extension, scope);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Audit',
      description: `Exported ${exportData.logs.length} audit log record(s) as ${format.toUpperCase()}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: new URL(request.url).pathname,
        format,
        timeZone,
        filters: exportData.filters,
        totalRecords: exportData.totalRecords,
        exportedRecords: exportData.logs.length,
        limitApplied: exportData.limitApplied,
      },
    });

    return new Response(output.body, {
      headers: {
        'Content-Type': output.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(exportData.limitApplied ? { 'X-Export-Limit-Applied': '10000' } : {}),
      },
    });
  } catch (error) {
    if (error instanceof AuditQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Audit',
      description: `Failed to export audit logs as ${format.toUpperCase()}.`,
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: new URL(request.url).pathname,
        format,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to export audit logs.' }, { status: 500 });
  }
}
