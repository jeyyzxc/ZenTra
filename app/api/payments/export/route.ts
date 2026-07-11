import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { createPaymentExportResult, paymentFiltersFromSearchParams } from '@/lib/export/payment-export';
import { idsFromSearchParams, normalizeExportIds } from '@/lib/export/request';
import { createExportResponse } from '@/lib/export/response';
import type { ExportScope } from '@/lib/export/types';
import { listPaymentRecords, paymentErrorResponse } from '@/lib/payment-service';

export const dynamic = 'force-dynamic';

const FORMATS = ['csv', 'excel', 'pdf'] as const;
const SCOPES = ['filtered', 'selected', 'all'] as const;
const EXPORT_LIMIT = 10000;

type ExportFormat = (typeof FORMATS)[number];

function isExportFormat(format: string): format is ExportFormat {
  return FORMATS.includes(format as ExportFormat);
}

function isExportScope(scope: string): scope is ExportScope {
  return SCOPES.includes(scope as (typeof SCOPES)[number]);
}

async function handleExport(request: Request, ids?: string[], forceSelected = false) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestUrl = new URL(request.url);
  const requestContext = getRequestContext(request);
  const format = requestUrl.searchParams.get('format')?.trim().toLowerCase() || 'csv';
  const scope = forceSelected || ids?.length
    ? 'selected'
    : requestUrl.searchParams.get('scope')?.trim().toLowerCase() || 'filtered';
  const timeZone = requestUrl.searchParams.get('timeZone')?.trim() || undefined;

  if (!isExportFormat(format)) {
    return NextResponse.json({ error: 'format must be csv, excel, or pdf.' }, { status: 400 });
  }

  if (!isExportScope(scope)) {
    return NextResponse.json({ error: 'scope must be filtered, selected, or all.' }, { status: 400 });
  }

  if (scope === 'selected' && !ids?.length) {
    return NextResponse.json({ error: 'At least one payment record must be selected.' }, { status: 400 });
  }

  try {
    const filters = scope === 'all' ? {} : paymentFiltersFromSearchParams(requestUrl.searchParams);
    const paymentData = await listPaymentRecords(filters);
    const scopedRecords = scope === 'selected'
      ? paymentData.records.filter((record) => ids?.includes(record.id))
      : paymentData.records;
    const records = scopedRecords.slice(0, EXPORT_LIMIT);
    const limitApplied = scopedRecords.length > records.length;
    const result = createPaymentExportResult(
      format,
      records,
      requestUrl.searchParams,
      scope,
      actor,
      timeZone,
      limitApplied,
    );

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Payments',
      description: `Exported ${records.length} payment record(s) as ${format.toUpperCase()}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        scope,
        filters,
        totalRecords: scopedRecords.length,
        exportedRecords: records.length,
        limitApplied,
      },
    });

    return createExportResponse(result);
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Payments',
      description: `Failed to export payment records as ${format.toUpperCase()}.`,
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        scope,
        ...errorMetadata(error),
      },
    });

    return paymentErrorResponse(error);
  }
}

export async function GET(request: Request) {
  const ids = idsFromSearchParams(new URL(request.url).searchParams);

  return handleExport(request, ids?.length ? ids : undefined);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { ids?: unknown };
  const ids = normalizeExportIds(body.ids);

  return handleExport(request, ids, true);
}
