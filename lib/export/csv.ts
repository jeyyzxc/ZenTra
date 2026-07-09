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

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(',');
}

function normalizedBrandRow(values: string[], columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) => values[index] ?? '');
}

function brandedCsvHeader(columnCount: number) {
  const width = Math.max(columnCount, 1);

  return [
    normalizedBrandRow(['ZION EVENTS PLACE EXPORT'], width),
    normalizedBrandRow(['[ CIRCULAR ZION LOGO MEDALLION ]'], width),
    normalizedBrandRow(['Charcoal #1a1f18 | Gold #D6B53B | Cream #FDF5CC'], width),
    normalizedBrandRow([], width),
  ].map(csvRow);
}

export function createCsv<T>(columns: Array<ExportColumn<T>>, rows: T[]) {
  return [
    ...brandedCsvHeader(columns.length),
    csvRow(columns.map((column) => column.header)),
    ...rows.map((row) => (
      csvRow(columns.map((column) => column.value(row)))
    )),
  ].join('\r\n');
}
