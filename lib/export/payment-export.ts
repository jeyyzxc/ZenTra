import type { CurrentAdmin } from '@/lib/authorization';
import type { getPaymentRecord, listPaymentRecords, PaymentFilters } from '@/lib/payment-service';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';
import { createCsv } from '@/lib/export/csv';
import { createXlsx } from '@/lib/export/spreadsheet';
import { datedExportFilename } from '@/lib/export/response';
import type { ExportColumn, ExportResult, ExportScope, ExportSheet } from '@/lib/export/types';

export type PaymentExportRecord = Awaited<ReturnType<typeof listPaymentRecords>>['records'][number];
export type PaymentDetailRecord = Awaited<ReturnType<typeof getPaymentRecord>>;

type PaymentDocumentRow = {
  section: string;
  field: string;
  value: string;
};

const PAYMENT_COLUMNS: Array<ExportColumn<PaymentExportRecord>> = [
  { header: 'Transaction ID', key: 'id', width: 28, value: (record) => record.id },
  { header: 'Official Receipt Number', key: 'paymentReference', width: 28, value: (record) => record.paymentReference },
  { header: 'Booking Reference', key: 'bookingReference', width: 24, value: (record) => record.bookingReference },
  { header: 'Client Name', key: 'clientName', width: 28, value: (record) => record.clientName },
  { header: 'Event Category', key: 'eventType', width: 24, value: (record) => record.eventType },
  { header: 'Event Date', key: 'eventDate', type: 'date', width: 18, value: (record) => toDate(record.eventDate) },
  { header: 'Package', key: 'packageName', width: 28, value: (record) => record.packageName },
  { header: 'Total Contract Amount', key: 'totalAmount', type: 'currency', width: 20, value: (record) => record.totalAmount },
  { header: 'Amount Paid', key: 'amountPaid', type: 'currency', width: 18, value: (record) => record.amountPaid },
  { header: 'Pending Amount', key: 'pendingAmount', type: 'currency', width: 18, value: (record) => record.pendingAmount },
  { header: 'Remaining Balance', key: 'remainingBalance', type: 'currency', width: 20, value: (record) => record.remainingBalance },
  { header: 'Payment Type', key: 'paymentType', width: 24, value: (record) => formatEnum(record.paymentType) },
  { header: 'Payment Method', key: 'paymentMethod', width: 24, value: (record) => record.paymentMethod },
  { header: 'Payment Date', key: 'paymentDate', type: 'datetime', width: 22, value: (record) => toDate(record.paymentDate) },
  { header: 'Due Date', key: 'dueDate', type: 'date', width: 18, value: (record) => toDate(record.dueDate) },
  { header: 'Payment Status', key: 'status', width: 24, value: (record) => formatEnum(record.status) },
  { header: 'Verification Status', key: 'verificationStatus', width: 24, value: (record) => formatEnum(record.verificationStatus) },
  { header: 'Reference Number', key: 'proofFileName', width: 28, value: (record) => record.proofFileName },
  { header: 'Recorded By', key: 'createdBy', width: 24, value: (record) => record.createdBy ?? record.proofUploadedBy ?? record.updatedBy ?? '' },
  { header: 'Date Recorded', key: 'createdAt', type: 'datetime', width: 22, value: (record) => toDate(record.createdAt) },
];

export function paymentFiltersFromSearchParams(params: URLSearchParams): PaymentFilters {
  return {
    search: params.get('search') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    eventType: params.get('eventType') ?? undefined,
    packageName: params.get('package') ?? undefined,
    paymentType: params.get('paymentType') ?? undefined,
    status: params.get('status') ?? undefined,
    dueStatus: params.get('dueStatus') ?? undefined,
    verificationStatus: params.get('verificationStatus') ?? undefined,
    coordinator: params.get('coordinator') ?? undefined,
    month: params.get('month') ?? undefined,
  };
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: Date | string | null | undefined, timeZone?: string) {
  const date = toDate(value);
  if (!date) return '';

  if (!timeZone) {
    return date.toISOString();
  }

  try {
    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatDate(value: Date | string | null | undefined, timeZone?: string) {
  const date = toDate(value);
  if (!date) return '';

  if (!timeZone) {
    return date.toISOString().slice(0, 10);
  }

  try {
    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeZone,
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatEnum(value: string | null | undefined) {
  return value
    ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    : '';
}

function money(value: number | null | undefined) {
  return `PHP ${(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function paymentSummaryRows(records: PaymentExportRecord[]) {
  const totalAmount = records.reduce((sum, record) => sum + record.totalAmount, 0);
  const amountPaid = records.reduce((sum, record) => sum + record.amountPaid, 0);
  const pendingAmount = records.reduce((sum, record) => sum + record.pendingAmount, 0);
  const remainingBalance = records.reduce((sum, record) => sum + record.remainingBalance, 0);

  return [
    ['Records', records.length],
    ['Total Contract Amount', totalAmount],
    ['Amount Paid', amountPaid],
    ['Pending Amount', pendingAmount],
    ['Remaining Balance', remainingBalance],
    ['Overdue Records', records.filter((record) => record.status === 'OVERDUE').length],
    ['For Verification', records.filter((record) => record.verificationStatus === 'PENDING').length],
  ];
}

function createPaymentXlsx(
  records: PaymentExportRecord[],
  searchParams: URLSearchParams,
  scope: ExportScope,
  actor: CurrentAdmin,
  timeZone?: string,
) {
  const summaryRows = [
    ['Zion Events Place - Payment Reconciliation Export'],
    ['Generated At', formatDateTime(new Date(), timeZone)],
    ['Generated By', actor.fullName || actor.email],
    ['Scope', scope],
    ...paymentSummaryRows(records),
  ];
  const transactionRows = records.map((record) => PAYMENT_COLUMNS.map((column) => column.value(record)));
  const milestoneRows = records.flatMap((record) => record.milestones.map((milestone) => [
    record.paymentReference,
    record.bookingReference,
    record.clientName,
    milestone.milestoneName,
    milestone.amountRequired,
    milestone.amountPaid,
    toDate(milestone.dueDate),
    formatEnum(milestone.status),
  ]));
  const historyRows = records.flatMap((record) => record.history.map((entry) => [
    record.paymentReference,
    record.bookingReference,
    entry.action,
    entry.description,
    entry.paymentAmount ?? '',
    formatEnum(entry.paymentType),
    entry.paymentMethod ?? '',
    formatEnum(entry.verification),
    entry.performedBy,
    toDate(entry.createdAt),
  ]));
  const overdueRows = records
    .filter((record) => record.status === 'OVERDUE' || record.remainingBalance > 0)
    .map((record) => [
      record.paymentReference,
      record.bookingReference,
      record.clientName,
      record.eventTitle ?? '',
      toDate(record.dueDate),
      record.remainingBalance,
      formatEnum(record.status),
    ]);
  const filterRows = Array.from(searchParams.entries())
    .filter(([key]) => !['format', 'timeZone'].includes(key))
    .map(([key, value]) => [key, value]);
  const sheets: ExportSheet[] = [
    { name: 'Summary', rows: summaryRows },
    {
      name: 'Transactions',
      columns: PAYMENT_COLUMNS.map((column) => ({ header: column.header, width: column.width, type: column.type })),
      rows: transactionRows,
      freezeHeader: true,
    },
    {
      name: 'Milestones',
      columns: [
        { header: 'Payment Reference', width: 28 },
        { header: 'Booking Reference', width: 24 },
        { header: 'Client Name', width: 28 },
        { header: 'Milestone', width: 30 },
        { header: 'Amount Required', width: 18, type: 'currency' },
        { header: 'Amount Paid', width: 18, type: 'currency' },
        { header: 'Due Date', width: 18, type: 'date' },
        { header: 'Status', width: 20 },
      ],
      rows: milestoneRows,
      freezeHeader: true,
    },
    {
      name: 'Payment History',
      columns: [
        { header: 'Payment Reference', width: 28 },
        { header: 'Booking Reference', width: 24 },
        { header: 'Action', width: 28 },
        { header: 'Description', width: 52 },
        { header: 'Payment Amount', width: 18, type: 'currency' },
        { header: 'Payment Type', width: 22 },
        { header: 'Payment Method', width: 22 },
        { header: 'Verification', width: 22 },
        { header: 'Performed By', width: 24 },
        { header: 'Created At', width: 22, type: 'datetime' },
      ],
      rows: historyRows,
      freezeHeader: true,
    },
    {
      name: 'Overdue Balances',
      columns: [
        { header: 'Payment Reference', width: 28 },
        { header: 'Booking Reference', width: 24 },
        { header: 'Client Name', width: 28 },
        { header: 'Event', width: 30 },
        { header: 'Due Date', width: 18, type: 'date' },
        { header: 'Remaining Balance', width: 20, type: 'currency' },
        { header: 'Status', width: 22 },
      ],
      rows: overdueRows,
      freezeHeader: true,
    },
    {
      name: 'Applied Filters',
      columns: [
        { header: 'Filter', width: 28 },
        { header: 'Value', width: 48 },
      ],
      rows: filterRows.length ? filterRows : [['None', 'No filters applied']],
      freezeHeader: true,
    },
  ];

  return createXlsx(sheets);
}

function createPaymentPdf(records: PaymentExportRecord[], timeZone?: string) {
  const columns: Array<ZionPdfColumn<PaymentExportRecord>> = [
    { header: 'Receipt', width: 82, maxLines: 2, value: (record) => record.paymentReference },
    {
      header: 'Booking',
      width: 88,
      maxLines: 3,
      value: (record) => `${record.bookingReference} | ${record.eventType ?? 'Event'}`,
    },
    {
      header: 'Client',
      width: 92,
      maxLines: 3,
      value: (record) => [record.clientName, record.clientEmail ?? ''].filter(Boolean).join(' | '),
    },
    {
      header: 'Status',
      width: 74,
      align: 'center',
      maxLines: 3,
      value: (record) => `${formatEnum(record.status)} | ${formatEnum(record.verificationStatus)}`,
    },
    {
      header: 'Amounts',
      width: 112,
      maxLines: 4,
      value: (record) => [
        `Total: ${money(record.totalAmount)}`,
        `Paid: ${money(record.amountPaid)}`,
        `Balance: ${money(record.remainingBalance)}`,
      ].join(' | '),
    },
    {
      header: 'Details',
      width: 108,
      maxLines: 5,
      value: (record) => [
        `Method: ${record.paymentMethod ?? 'Not set'}`,
        `Due: ${formatDate(record.dueDate, timeZone) || 'Not set'}`,
        `Updated: ${formatDateTime(record.updatedAt, timeZone)}`,
      ].join(' | '),
    },
  ];

  return createZionBrandedTablePdf({
    title: 'Financial Reconciliation',
    subtitle: 'A branded payment export from Payment & History.',
    badge: 'Payment Ledger',
    generatedAt: formatDateTime(new Date(), timeZone),
    recordCount: records.length,
    rows: records,
    columns,
    emptyMessage: 'No payment records matched the selected export scope.',
    footerLabel: 'Confidential payment reconciliation export - Zion Events Place',
  });
}

export function createPaymentReceiptPdf(record: PaymentDetailRecord, actor: CurrentAdmin, timeZone?: string) {
  const rows: PaymentDocumentRow[] = [
    { section: 'Receipt', field: 'Receipt Number', value: record.paymentReference },
    { section: 'Booking', field: 'Booking Reference', value: record.bookingReference },
    { section: 'Client', field: 'Client Name', value: record.clientName },
    { section: 'Client', field: 'Contact', value: [record.clientEmail, record.clientPhone].filter(Boolean).join(' | ') || 'Not provided' },
    { section: 'Event', field: 'Event Details', value: [record.eventTitle, record.eventType, formatDate(record.eventDate, timeZone)].filter(Boolean).join(' | ') },
    { section: 'Payment', field: 'Amount Received', value: money(record.amountPaid) },
    { section: 'Payment', field: 'Payment Type', value: formatEnum(record.paymentType) },
    { section: 'Payment', field: 'Payment Method', value: record.paymentMethod ?? 'Not set' },
    { section: 'Payment', field: 'Payment Date', value: formatDateTime(record.paymentDate, timeZone) || 'Not set' },
    { section: 'Payment', field: 'Remaining Balance', value: money(record.remainingBalance) },
    { section: 'Admin', field: 'Recorded By', value: record.updatedBy ?? record.createdBy ?? record.proofUploadedBy ?? 'Admin' },
    { section: 'Admin', field: 'Generated By', value: actor.fullName || actor.email },
    { section: 'Admin', field: 'Date Generated', value: formatDateTime(new Date(), timeZone) },
  ];

  return createPaymentDocumentPdf('Official Payment Receipt', 'Formal receipt generated from Payment & History.', 'Receipt', rows, timeZone);
}

export function createPaymentStatementPdf(record: PaymentDetailRecord, actor: CurrentAdmin, timeZone?: string) {
  const summaryRows: PaymentDocumentRow[] = [
    { section: 'Statement', field: 'Booking Reference', value: record.bookingReference },
    { section: 'Client', field: 'Client Name', value: record.clientName },
    { section: 'Event', field: 'Event Details', value: [record.eventTitle, record.eventType, formatDate(record.eventDate, timeZone)].filter(Boolean).join(' | ') },
    { section: 'Account', field: 'Total Amount', value: money(record.totalAmount) },
    { section: 'Account', field: 'Amount Paid', value: money(record.amountPaid) },
    { section: 'Account', field: 'Pending Amount', value: money(record.pendingAmount) },
    { section: 'Account', field: 'Remaining Balance', value: money(record.remainingBalance) },
    { section: 'Account', field: 'Due Date', value: formatDate(record.dueDate, timeZone) || 'Not set' },
    { section: 'Account', field: 'Current Status', value: formatEnum(record.status) },
    { section: 'Admin', field: 'Generated By', value: actor.fullName || actor.email },
  ];
  const milestoneRows = record.milestones.map<PaymentDocumentRow>((milestone) => ({
    section: 'Milestone',
    field: milestone.milestoneName,
    value: `${money(milestone.amountPaid)} of ${money(milestone.amountRequired)} | Due ${formatDate(milestone.dueDate, timeZone) || 'Not set'} | ${formatEnum(milestone.status)}`,
  }));
  const historyRows = record.history.slice(0, 18).map<PaymentDocumentRow>((entry) => ({
    section: 'History',
    field: formatDateTime(entry.createdAt, timeZone),
    value: `${entry.description} | ${entry.paymentAmount ? money(entry.paymentAmount) : 'No amount'} | By ${entry.performedBy}`,
  }));

  return createPaymentDocumentPdf(
    'Statement of Account',
    'Formal payment statement generated from Payment & History.',
    'Statement',
    [...summaryRows, ...milestoneRows, ...historyRows],
    timeZone,
  );
}

function createPaymentDocumentPdf(
  title: string,
  subtitle: string,
  badge: string,
  rows: PaymentDocumentRow[],
  timeZone?: string,
) {
  const columns: Array<ZionPdfColumn<PaymentDocumentRow>> = [
    { header: 'Section', width: 88, maxLines: 2, value: (row) => row.section },
    { header: 'Field', width: 126, maxLines: 2, value: (row) => row.field },
    { header: 'Information', width: 342, maxLines: 5, value: (row) => row.value },
  ];

  return createZionBrandedTablePdf({
    title,
    subtitle,
    badge,
    generatedAt: formatDateTime(new Date(), timeZone),
    recordCount: rows.length,
    rows,
    columns,
    emptyMessage: 'Payment document details are unavailable.',
    footerLabel: 'Confidential payment document - Zion Events Place',
  });
}

export function createPaymentExportResult(
  format: 'csv' | 'excel' | 'pdf',
  records: PaymentExportRecord[],
  searchParams: URLSearchParams,
  scope: ExportScope,
  actor: CurrentAdmin,
  timeZone?: string,
  limitApplied = false,
): ExportResult {
  if (format === 'csv') {
    return {
      body: createCsv(PAYMENT_COLUMNS, records),
      contentType: 'text/csv; charset=utf-8',
      filename: datedExportFilename('zion-payments', 'csv'),
      exportedRecords: records.length,
      limitApplied,
    };
  }

  if (format === 'excel') {
    return {
      body: createPaymentXlsx(records, searchParams, scope, actor, timeZone),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: datedExportFilename('zion-payments', 'xlsx'),
      exportedRecords: records.length,
      limitApplied,
    };
  }

  return {
    body: createPaymentPdf(records, timeZone),
    contentType: 'application/pdf',
    filename: datedExportFilename('zion-payment-reconciliation', 'pdf'),
    exportedRecords: records.length,
    limitApplied,
  };
}

