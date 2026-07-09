import type { EmailLogDto } from '@/lib/email-log-query';
import { createCsv } from '@/lib/export/csv';
import { createXlsx } from '@/lib/export/spreadsheet';
import type { ExportColumn, ExportSheet } from '@/lib/export/types';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';

export type EmailLogExportScope = 'all' | 'admin';

type EmailLogExportRow = {
  Created: string;
  'Recipient Email': string;
  'Recipient Name': string;
  'Email Type': string;
  'Related Module': string;
  'Related Record ID': string;
  Subject: string;
  'Trigger Source': string;
  Workflow: string;
  Status: string;
  'Retry Count': string;
  'Last Attempt': string;
  Sent: string;
  Delivered: string;
  Failed: string;
  'Failure Reason': string;
  'Error Message': string;
  'Payload Summary': string;
};

const FILTER_LABELS: Record<string, string> = {
  search: 'Search',
  startDate: 'Start Date',
  endDate: 'End Date',
  emailType: 'Email Type',
  status: 'Status',
  triggerSource: 'Trigger Source',
  workflowName: 'Workflow',
  relatedModule: 'Related Module',
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
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
}

function stringifyPayload(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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

const STANDARD_COLUMNS: Array<ExportColumn<EmailLogDto>> = [
  { header: 'Created', key: 'createdAt', type: 'datetime', width: 24, value: (log) => toDate(log.createdAt) },
  { header: 'Recipient Email', key: 'recipientEmail', width: 32, value: (log) => log.recipientEmail },
  { header: 'Recipient Name', key: 'recipientName', width: 28, value: (log) => text(log.recipientName) },
  { header: 'Email Type', key: 'emailType', width: 24, value: (log) => formatEnum(log.emailType) },
  { header: 'Related Module', key: 'relatedModule', width: 24, value: (log) => formatEnum(log.relatedModule) },
  { header: 'Related Record ID', key: 'relatedRecordId', width: 30, value: (log) => text(log.relatedRecordId) },
  { header: 'Subject', key: 'subject', width: 46, value: (log) => log.subject },
  { header: 'Trigger Source', key: 'triggerSource', width: 24, value: (log) => formatEnum(log.triggerSource) },
  { header: 'Workflow', key: 'workflowName', width: 28, value: (log) => text(log.workflowName) },
  { header: 'Status', key: 'status', width: 18, value: (log) => formatEnum(log.status) },
  { header: 'Retry Count', key: 'retryCount', type: 'number', width: 14, value: (log) => log.retryCount },
  { header: 'Last Attempt', key: 'lastAttemptAt', type: 'datetime', width: 24, value: (log) => toDate(log.lastAttemptAt) },
  { header: 'Sent', key: 'sentAt', type: 'datetime', width: 24, value: (log) => toDate(log.sentAt) },
  { header: 'Delivered', key: 'deliveredAt', type: 'datetime', width: 24, value: (log) => toDate(log.deliveredAt) },
  { header: 'Failed', key: 'failedAt', type: 'datetime', width: 24, value: (log) => toDate(log.failedAt) },
  { header: 'Failure Reason', key: 'failureReason', width: 28, value: (log) => formatEnum(log.failureReason) },
  { header: 'Error Message', key: 'errorMessage', width: 54, value: (log) => text(log.errorMessage) },
];

const SUPERADMIN_ONLY_COLUMNS: Array<ExportColumn<EmailLogDto>> = [
  { header: 'Payload Summary', key: 'payloadSummary', width: 64, value: (log) => stringifyPayload(log.payloadSummary) },
];

function getColumns(scope: EmailLogExportScope): Array<ExportColumn<EmailLogDto>> {
  return scope === 'all'
    ? [...STANDARD_COLUMNS, ...SUPERADMIN_ONLY_COLUMNS]
    : STANDARD_COLUMNS;
}

function toRows(logs: EmailLogDto[], timeZone?: string): EmailLogExportRow[] {
  return logs.map((log) => ({
    Created: formatTimestamp(log.createdAt, timeZone),
    'Recipient Email': log.recipientEmail,
    'Recipient Name': text(log.recipientName),
    'Email Type': formatEnum(log.emailType),
    'Related Module': formatEnum(log.relatedModule),
    'Related Record ID': text(log.relatedRecordId),
    Subject: log.subject,
    'Trigger Source': formatEnum(log.triggerSource),
    Workflow: text(log.workflowName),
    Status: formatEnum(log.status),
    'Retry Count': String(log.retryCount),
    'Last Attempt': formatTimestamp(log.lastAttemptAt, timeZone),
    Sent: formatTimestamp(log.sentAt, timeZone),
    Delivered: formatTimestamp(log.deliveredAt, timeZone),
    Failed: formatTimestamp(log.failedAt, timeZone),
    'Failure Reason': formatEnum(log.failureReason),
    'Error Message': text(log.errorMessage),
    'Payload Summary': stringifyPayload(log.payloadSummary),
  }));
}

function overviewRows(logs: EmailLogDto[]) {
  const totalRetries = logs.reduce((sum, log) => sum + log.retryCount, 0);
  const failedRecords = logs.filter((log) => log.status === 'FAILED' || Boolean(log.failedAt)).length;

  return [
    ['Delivery', 'Total Email Types', countBy(logs, (log) => formatEnum(log.emailType)).length],
    ['Delivery', 'Total Trigger Sources', countBy(logs, (log) => formatEnum(log.triggerSource)).length],
    ['Delivery', 'Failed Records', failedRecords],
    ['Delivery', 'Total Retry Attempts', totalRetries],
    ...countBy(logs, (log) => formatEnum(log.status)).map(([status, count]) => ['Status', status, count]),
    ...countBy(logs, (log) => formatEnum(log.emailType)).map(([emailType, count]) => ['Email Type', emailType, count]),
    ...countBy(logs, (log) => formatEnum(log.triggerSource)).map(([source, count]) => ['Trigger Source', source, count]),
  ];
}

export function createEmailLogCsv(
  logs: EmailLogDto[],
  timeZone?: string,
  scope: EmailLogExportScope = 'all',
) {
  void timeZone;
  return createCsv(getColumns(scope), logs);
}

export function createEmailLogXlsx(
  logs: EmailLogDto[],
  timeZone?: string,
  scope: EmailLogExportScope = 'all',
  generatedBy = 'Zion Admin',
  filters?: Record<string, unknown>,
) {
  const columns = getColumns(scope);
  const summaryRows = [
    ['Zion Events Place - Email Logs Export'],
    ['Generated At', formatTimestamp(new Date(), timeZone)],
    ['Generated By', generatedBy],
    ['Scope', scope === 'all' ? 'All authorized email activity' : 'Admin authorized email activity'],
    ['Records', logs.length],
    ['Filters', filterSummary(filters, timeZone)],
  ];
  const sheets: ExportSheet[] = [
    { name: 'Summary', rows: summaryRows },
    {
      name: 'Email Logs',
      columns: columns.map((column) => ({
        header: column.header,
        width: column.width,
        type: column.type,
      })),
      rows: logs.map((log) => columns.map((column) => column.value(log))),
      freezeHeader: true,
    },
    {
      name: 'Delivery Overview',
      columns: [
        { header: 'Category', width: 22 },
        { header: 'Metric', width: 36 },
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

export function createEmailLogPdf(
  logs: EmailLogDto[],
  timeZone?: string,
  scope: EmailLogExportScope = 'all',
) {
  const rows = toRows(logs, timeZone);
  const columns: Array<ZionPdfColumn<EmailLogExportRow>> = [
    { header: 'Created', width: 76, maxLines: 2, value: (row) => row.Created },
    { header: 'Recipient', width: 116, maxLines: 3, value: (row) => row['Recipient Email'] },
    { header: 'Type', width: 78, maxLines: 3, value: (row) => row['Email Type'] },
    { header: 'Source', width: 72, maxLines: 2, value: (row) => row['Trigger Source'] },
    { header: 'Status', width: 54, align: 'center', maxLines: 1, value: (row) => row.Status },
    {
      header: 'Details',
      width: 160,
      maxLines: 4,
      value: (row) => [
        row.Subject,
        row.Workflow ? `Workflow: ${row.Workflow}` : '',
        row['Related Module'] ? `Related: ${row['Related Module']} ${row['Related Record ID']}` : '',
        row['Error Message'] ? `Error: ${row['Error Message']}` : '',
        scope === 'all' && row['Payload Summary'] ? `Payload: ${row['Payload Summary']}` : '',
      ].filter(Boolean).join(' | '),
    },
  ];

  return createZionBrandedTablePdf({
    title: 'Email Delivery Logs',
    subtitle: 'A branded and confidential delivery export from System Logs.',
    badge: scope === 'all' ? 'All Email Activity' : 'Admin Email Activity',
    generatedAt: formatTimestamp(new Date().toISOString(), timeZone),
    recordCount: rows.length,
    rows,
    columns,
    emptyMessage: 'No email log records matched the selected filters.',
  });
}

export function getEmailLogExportFilename(extension: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `zentra-email-logs-${date}.${extension}`;
}
