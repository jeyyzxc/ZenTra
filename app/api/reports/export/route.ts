import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { createReportsExportResult } from '@/lib/export/reports-export';
import { createExportResponse } from '@/lib/export/response';
import { getReportsData } from '@/lib/reports-service';

export const dynamic = 'force-dynamic';

const FORMATS = ['csv', 'excel', 'pdf'] as const;
const DATASETS = ['monthly', 'metrics', 'categories'] as const;

type ExportFormat = (typeof FORMATS)[number];

function isExportFormat(format: string): format is ExportFormat {
  return FORMATS.includes(format as ExportFormat);
}

export async function GET(request: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestUrl = new URL(request.url);
  const requestContext = getRequestContext(request);
  const format = requestUrl.searchParams.get('format')?.trim().toLowerCase() || 'csv';
  const datasetParam = requestUrl.searchParams.get('dataset')?.trim().toLowerCase() || 'monthly';
  const dataset = DATASETS.includes(datasetParam as (typeof DATASETS)[number]) ? datasetParam : 'monthly';
  const timeZone = requestUrl.searchParams.get('timeZone')?.trim() || undefined;

  if (!isExportFormat(format)) {
    return NextResponse.json({ error: 'format must be csv, excel, or pdf.' }, { status: 400 });
  }

  try {
    const data = await getReportsData();
    const result = createReportsExportResult(format, data, actor, timeZone, dataset);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Reports',
      description: `Exported reports and analytics as ${format.toUpperCase()}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        dataset,
        exportedRecords: result.exportedRecords,
      },
    });

    return createExportResponse(result);
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Reports',
      description: `Failed to export reports and analytics as ${format.toUpperCase()}.`,
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        dataset,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to export reports.' }, { status: 500 });
  }
}
