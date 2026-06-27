import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import {
  type EmailLogExportScope,
  createEmailLogCsv,
  createEmailLogPdf,
  createEmailLogXlsx,
  getEmailLogExportFilename,
} from '@/lib/email-log-export';
import { EmailLogQueryError, getEmailLogsForExport } from '@/lib/email-log-query';

export const dynamic = 'force-dynamic';

const FORMATS = ['csv', 'excel', 'pdf'] as const;

type ExportFormat = (typeof FORMATS)[number];

function isExportFormat(format: string): format is ExportFormat {
  return FORMATS.includes(format as ExportFormat);
}

function responseForExport(
  format: ExportFormat,
  logs: Awaited<ReturnType<typeof getEmailLogsForExport>>['logs'],
  scope: EmailLogExportScope,
  timeZone?: string,
) {
  if (format === 'csv') {
    return {
      body: createEmailLogCsv(logs, timeZone, scope),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
    };
  }

  if (format === 'excel') {
    return {
      body: createEmailLogXlsx(logs, timeZone, scope),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }

  return {
    body: createEmailLogPdf(logs, timeZone, scope),
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

  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get('format')?.trim().toLowerCase() || 'csv';
  const timeZone = searchParams.get('timeZone')?.trim() || undefined;

  if (!isExportFormat(format)) {
    return NextResponse.json({ error: 'format must be csv, excel, or pdf.' }, { status: 400 });
  }

  try {
    const scope: EmailLogExportScope = actor.role === 'SUPERADMIN' ? 'all' : 'admin';
    const exportData = await getEmailLogsForExport(searchParams, actor);
    const output = responseForExport(format, exportData.logs, scope, timeZone);
    const filename = getEmailLogExportFilename(output.extension);

    return new Response(output.body, {
      headers: {
        'Content-Type': output.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(exportData.limitApplied ? { 'X-Export-Limit-Applied': '10000' } : {}),
      },
    });
  } catch (error) {
    if (error instanceof EmailLogQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Unable to export email logs.' }, { status: 500 });
  }
}
