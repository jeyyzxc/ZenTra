import type { ExportColumn } from '@/lib/export/types';

const FORMULA_INJECTION_PATTERN = /^[=+\-@\t\r]/;

export function safeExportText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = value instanceof Date
    ? value.toISOString()
    : String(value);

  return FORMULA_INJECTION_PATTERN.test(text) ? `'${text}` : text;
}

function csvCell(value: unknown) {
  return `"${safeExportText(value).replaceAll('"', '""')}"`;
}

export function createCsv<T>(columns: Array<ExportColumn<T>>, rows: T[]) {
  return [
    columns.map((column) => csvCell(column.header)).join(','),
    ...rows.map((row) => (
      columns.map((column) => csvCell(column.value(row))).join(',')
    )),
  ].join('\r\n');
}

