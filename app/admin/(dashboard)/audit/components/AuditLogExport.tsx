'use client';

import ExportFormatMenu, { type ExportFormat } from '@/components/admin/ExportFormatMenu';

type DownloadExportFormat = Exclude<ExportFormat, 'print'>;

export default function AuditLogExport({
  onExport,
}: {
  onExport: (format: DownloadExportFormat) => void;
}) {
  return (
    <ExportFormatMenu
      onExport={(format) => {
        if (format !== 'print') {
          onExport(format);
        }
      }}
    />
  );
}
