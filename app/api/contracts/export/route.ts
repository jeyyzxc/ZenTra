import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { createContractExportResult } from '@/lib/export/contract-export';
import { idsFromSearchParams, normalizeExportIds } from '@/lib/export/request';
import { createExportResponse } from '@/lib/export/response';
import type { ExportScope } from '@/lib/export/types';
import { ContractService, ContractServiceError } from '@/services/contract';

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
    return NextResponse.json({ error: 'At least one contract must be selected.' }, { status: 400 });
  }

  try {
    const exportParams = scope === 'all' ? new URLSearchParams() : requestUrl.searchParams;
    const exportData = await ContractService.getRegistryForExport(
      actor,
      exportParams,
      scope === 'selected' ? ids : undefined,
    );
    const result = createContractExportResult(format, {
      ...exportData,
      searchParams: exportParams,
      scope,
      actor,
      timeZone,
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Contracts',
      description: `Exported ${exportData.contracts.length} contract registry record(s) as ${format.toUpperCase()}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        scope,
        filters: exportData.filters,
        totalRecords: exportData.totalRecords,
        exportedRecords: exportData.contracts.length,
        limitApplied: exportData.limitApplied,
      },
    });

    return createExportResponse(result);
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Contracts',
      description: `Failed to export contract registry as ${format.toUpperCase()}.`,
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        scope,
        ...errorMetadata(error),
      },
    });

    if (error instanceof ContractServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Unable to export contract registry.' }, { status: 500 });
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
