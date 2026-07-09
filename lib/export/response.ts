import type { ExportResult } from '@/lib/export/types';

export function createExportResponse(result: ExportResult) {
  return new Response(result.body, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'X-Export-Records': String(result.exportedRecords),
      ...(result.limitApplied ? { 'X-Export-Limit-Applied': 'true' } : {}),
    },
  });
}

export function datedExportFilename(prefix: string, extension: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.${extension}`;
}

