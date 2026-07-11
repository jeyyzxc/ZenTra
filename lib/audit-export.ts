import type { AuditLogDto } from '@/lib/audit-query';
import { createCsv } from '@/lib/export/csv';
import { createXlsx } from '@/lib/export/spreadsheet';
import type { ExportColumn, ExportSheet } from '@/lib/export/types';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';

export type AuditExportScope = 'all' | 'own';

type AuditExportRow = {
  Timestamp: string;
  User: string;
  Role: string;
  Action: string;
  Module: string;
  Status: string;
  'IP Address': string;
  Description: string;
};

const FILTER_LABELS: Record<string, string> = {
  search: 'Search',
  startDate: 'Start Date',
  endDate: 'End Date',
  userId: 'User ID',
  userRole: 'User Role',
  action: 'Action',
  module: 'Module',
  status: 'Status',
  sortBy: 'Sort By',
  sortOrder: 'Sort Order',
};

function text(value: string | null | undefined) {
  return value?.trim() || '';
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimestamp(timestamp: Date | string | null | undefined, timeZone: string | undefined) {
  const date = toDate(timestamp);

  if (!date) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatEnum(value: string | null | undefined) {
  return value
    ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    : '';
}

function formatFilterLabel(key: string) {
  return FILTER_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatFilterValue(key: string, value: unknown, timeZone?: string) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if ((key === 'startDate' || key === 'endDate') && typeof value === 'string') {
    return formatTimestamp(value, timeZone);
  }

  if (typeof value === 'string' && /^[A-Z0-9_]+$/.test(value)) {
    return formatEnum(value);
  }

  return String(value);
}

function appliedFilterRows(filters: Record<string, unknown> | undefined, timeZone?: string) {
  const rows = Object.entries(filters ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [formatFilterLabel(key), formatFilterValue(key, value, timeZone)]);

  return rows.length ? rows : [['None', 'No filters applied']];
}

function filterSummary(filters: Record<string, unknown> | undefined, timeZone?: string) {
  const rows = appliedFilterRows(filters, timeZone);

  if (rows.length === 1 && rows[0][0] === 'None') {
    return rows[0][1];
  }

  return rows.map(([key, value]) => `${key}: ${value}`).join(' | ');
}

function countBy<T>(records: T[], value: (record: T) => string) {
  const counts = new Map<string, number>();

  for (const record of records) {
    const key = value(record) || 'Unspecified';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort(([first], [second]) => first.localeCompare(second));
}

const SUPERADMIN_EXPORT_COLUMNS: Array<ExportColumn<AuditLogDto>> = [
  { header: 'Timestamp', key: 'timestamp', type: 'datetime', width: 24, value: (log) => toDate(log.timestamp) },
  { header: 'User', key: 'userName', width: 28, value: (log) => log.userName },
  { header: 'Role', key: 'userRole', width: 18, value: (log) => formatEnum(log.userRole) },
  { header: 'Action', key: 'action', width: 22, value: (log) => formatEnum(log.action) },
  { header: 'Module', key: 'module', width: 22, value: (log) => log.module },
  { header: 'Status', key: 'status', width: 16, value: (log) => formatEnum(log.status) },
  { header: 'IP Address', key: 'ipAddress', width: 22, value: (log) => text(log.ipAddress) },
  { header: 'Description', key: 'description', width: 64, value: (log) => log.description },
];

const ADMIN_EXPORT_COLUMNS: Array<ExportColumn<AuditLogDto>> = [
  { header: 'Timestamp', key: 'timestamp', type: 'datetime', width: 24, value: (log) => toDate(log.timestamp) },
  { header: 'Action', key: 'action', width: 22, value: (log) => formatEnum(log.action) },
  { header: 'Module', key: 'module', width: 22, value: (log) => log.module },
  { header: 'Status', key: 'status', width: 16, value: (log) => formatEnum(log.status) },
  { header: 'Description', key: 'description', width: 64, value: (log) => log.description },
];

function getExportColumns(scope: AuditExportScope): Array<ExportColumn<AuditLogDto>> {
  return scope === 'own' ? ADMIN_EXPORT_COLUMNS : SUPERADMIN_EXPORT_COLUMNS;
}

function toRows(logs: AuditLogDto[], timeZone: string | undefined): AuditExportRow[] {
  return logs.map((log) => ({
    Timestamp: formatTimestamp(log.timestamp, timeZone),
    User: log.userName,
    Role: formatEnum(log.userRole),
    Action: formatEnum(log.action),
    Module: log.module,
    Status: formatEnum(log.status),
    'IP Address': text(log.ipAddress),
    Description: log.description,
  }));
}

function overviewRows(logs: AuditLogDto[]) {
  return [
    ['Action', 'Total Action Types', countBy(logs, (log) => formatEnum(log.action)).length],
    ['Module', 'Total Modules', countBy(logs, (log) => log.module).length],
    ['Status', 'Successful Records', logs.filter((log) => log.status === 'SUCCESS').length],
    ['Status', 'Failed Records', logs.filter((log) => log.status === 'FAILED').length],
    ...countBy(logs, (log) => formatEnum(log.action)).map(([action, count]) => ['Action', action, count]),
    ...countBy(logs, (log) => log.module).map(([module, count]) => ['Module', module, count]),
    ...countBy(logs, (log) => formatEnum(log.status)).map(([status, count]) => ['Status', status, count]),
  ];
}

export function createAuditCsv(
  logs: AuditLogDto[],
  timeZone?: string,
  scope: AuditExportScope = 'all',
) {
  void timeZone;
  return createCsv(getExportColumns(scope), logs);
}

export function createAuditXlsx(
  logs: AuditLogDto[],
  timeZone?: string,
  scope: AuditExportScope = 'all',
  generatedBy = 'Zion Admin',
  filters?: Record<string, unknown>,
) {
  const columns = getExportColumns(scope);
  const summaryRows = [
    [scope === 'own' ? 'Zion Events Place - My Activity Log Export' : 'Zion Events Place - System Audit Logs Export'],
    ['Generated At', formatTimestamp(new Date(), timeZone)],
    ['Generated By', generatedBy],
    ['Scope', scope === 'own' ? 'Own authorized activity' : 'All authorized audit logs'],
    ['Records', logs.length],
    ['Filters', filterSummary(filters, timeZone)],
  ];
  const sheets: ExportSheet[] = [
    { name: 'Summary', rows: summaryRows },
    {
      name: scope === 'own' ? 'My Activity Log' : 'Audit Logs',
      columns: columns.map((column) => ({
        header: column.header,
        width: column.width,
        type: column.type,
      })),
      rows: logs.map((log) => columns.map((column) => column.value(log))),
      freezeHeader: true,
    },
    {
      name: 'Activity Overview',
      columns: [
        { header: 'Category', width: 22 },
        { header: 'Metric', width: 34 },
        { header: 'Count', type: 'number', width: 14 },
      ],
      rows: overviewRows(logs),
      freezeHeader: true,
    },
    {
      name: 'Applied Filters',
      columns: [
        { header: 'Filter', width: 28 },
        { header: 'Value', width: 54 },
      ],
      rows: appliedFilterRows(filters, timeZone),
      freezeHeader: true,
    },
  ];

  return createXlsx(sheets);
}

export function createAuditPdf(
  logs: AuditLogDto[],
  timeZone?: string,
  scope: AuditExportScope = 'all',
) {
  const rows = toRows(logs, timeZone);
  const columns: Array<ZionPdfColumn<AuditExportRow>> = scope === 'own'
    ? [
        { header: 'Time', width: 84, maxLines: 2, value: (row) => row.Timestamp },
        { header: 'Action', width: 80, maxLines: 2, value: (row) => row.Action },
        { header: 'Module', width: 70, maxLines: 2, value: (row) => row.Module },
        { header: 'Status', width: 54, align: 'center', maxLines: 1, value: (row) => row.Status },
        { header: 'Details', width: 268, maxLines: 4, value: (row) => row.Description },
      ]
    : [
        { header: 'Time', width: 72, maxLines: 2, value: (row) => row.Timestamp },
        { header: 'User', width: 74, maxLines: 2, value: (row) => row.User },
        { header: 'Role', width: 62, maxLines: 2, value: (row) => row.Role },
        { header: 'Action', width: 62, maxLines: 2, value: (row) => row.Action },
        { header: 'Module', width: 56, maxLines: 2, value: (row) => row.Module },
        { header: 'Status', width: 48, align: 'center', maxLines: 1, value: (row) => row.Status },
        {
          header: 'Details',
          width: 182,
          maxLines: 4,
          value: (row) => [row.Description, row['IP Address'] ? `IP: ${row['IP Address']}` : '']
            .filter(Boolean)
            .join(' | '),
        },
      ];

  return createZionBrandedTablePdf({
    title: scope === 'own' ? 'My Activity Log' : 'System Audit Logs',
    subtitle: 'A branded and confidential activity export from System Logs.',
    badge: scope === 'own' ? 'Personal Activity' : 'Audit Trail',
    generatedAt: formatTimestamp(new Date().toISOString(), timeZone),
    recordCount: rows.length,
    rows,
    columns,
    emptyMessage: 'No audit log records matched the selected filters.',
  });
}

export function getAuditExportFilename(
  extension: string,
  scope: AuditExportScope = 'all',
) {
  const date = new Date().toISOString().slice(0, 10);
  const prefix = scope === 'own' ? 'zentra-my-activity-log' : 'zentra-audit-logs';
  return `${prefix}-${date}.${extension}`;
}
