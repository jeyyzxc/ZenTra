import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { BookingQueryError } from '@/lib/booking-query';
import { createBookingExportResult, getBookingsForExport } from '@/lib/export/booking-export';
import { idsFromSearchParams, normalizeExportIds } from '@/lib/export/request';
import { createExportResponse } from '@/lib/export/response';
import type { ExportScope } from '@/lib/export/types';

export const dynamic = 'force-dynamic';

const FORMATS = ['csv', 'excel', 'pdf'] as const;
const SCOPES = ['filtered', 'selected', 'all'] as const;

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
  const scopeParam = forceSelected || ids?.length
    ? 'selected'
    : requestUrl.searchParams.get('scope')?.trim().toLowerCase() || 'filtered';
  const timeZone = requestUrl.searchParams.get('timeZone')?.trim() || undefined;

  if (!isExportFormat(format)) {
    return NextResponse.json({ error: 'format must be csv, excel, or pdf.' }, { status: 400 });
  }

  if (!isExportScope(scopeParam)) {
    return NextResponse.json({ error: 'scope must be filtered, selected, or all.' }, { status: 400 });
  }

  if (scopeParam === 'selected' && !ids?.length) {
    return NextResponse.json({ error: 'At least one booking must be selected.' }, { status: 400 });
  }

  try {
    const exportData = await getBookingsForExport(requestUrl.searchParams, scopeParam, ids);
    const result = createBookingExportResult(
      format,
      exportData.records,
      requestUrl.searchParams,
      scopeParam,
      actor,
      timeZone,
      exportData.limitApplied,
    );

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Bookings',
      description: `Exported ${exportData.records.length} booking record(s) as ${format.toUpperCase()}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        scope: scopeParam,
        filters: exportData.filters,
        totalRecords: exportData.totalRecords,
        exportedRecords: exportData.records.length,
        limitApplied: exportData.limitApplied,
      },
    });

    return createExportResponse(result);
  } catch (error) {
    if (error instanceof BookingQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Bookings',
      description: `Failed to export booking records as ${format.toUpperCase()}.`,
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        scope: scopeParam,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to export bookings.' }, { status: 500 });
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
