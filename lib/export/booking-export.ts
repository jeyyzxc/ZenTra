import { Prisma } from '@prisma/client';
import type { CurrentAdmin } from '@/lib/authorization';
import { buildBookingQuery, serializeBooking, type BookingDto } from '@/lib/booking-query';
import { prisma } from '@/lib/prisma';
import { createZionBrandedTablePdf, type ZionPdfColumn } from '@/lib/zion-pdf-export';
import { createCsv } from '@/lib/export/csv';
import { createXlsx } from '@/lib/export/spreadsheet';
import { datedExportFilename } from '@/lib/export/response';
import type { ExportColumn, ExportResult, ExportScope, ExportSheet } from '@/lib/export/types';

const EXPORT_LIMIT = 10000;

type BookingSummaryRow = {
  section: string;
  field: string;
  value: string;
};

const BOOKING_COLUMNS: Array<ExportColumn<BookingDto>> = [
  { header: 'Booking ID', key: 'id', width: 28, value: (booking) => booking.id },
  { header: 'Reference Number', key: 'bookingReference', width: 24, value: (booking) => booking.bookingReference },
  { header: 'Client Name', key: 'clientName', width: 28, value: (booking) => booking.clientName },
  { header: 'Contact Number', key: 'clientPhone', width: 20, value: (booking) => booking.clientPhone },
  { header: 'Email Address', key: 'clientEmail', width: 32, value: (booking) => booking.clientEmail },
  { header: 'Event Category', key: 'eventType', width: 24, value: (booking) => booking.eventCategoryName ?? booking.eventType },
  { header: 'Event Title', key: 'eventTitle', width: 30, value: (booking) => booking.eventTitle },
  { header: 'Event Date', key: 'eventDate', type: 'date', width: 18, value: (booking) => toDate(booking.eventDate) },
  { header: 'Event Start Time', key: 'startTime', width: 18, value: (booking) => booking.startTime },
  { header: 'Event End Time', key: 'endTime', width: 18, value: (booking) => booking.endTime },
  { header: 'Venue', key: 'venue', width: 22, value: (booking) => booking.venue },
  { header: 'Package', key: 'packageSelected', width: 30, value: (booking) => booking.packageSelected },
  { header: 'Add-ons / Notes', key: 'specialRequests', width: 42, value: (booking) => booking.specialRequests },
  { header: 'Booking Status', key: 'status', width: 22, value: (booking) => formatEnum(booking.status) },
  { header: 'Payment Status', key: 'paymentSummaryStatus', width: 24, value: (booking) => formatEnum(booking.paymentSummaryStatus) },
  { header: 'Assigned Coordinator', key: 'assignedCoordinator', width: 28, value: (booking) => booking.assignedCoordinator },
  { header: 'Date Created', key: 'createdAt', type: 'datetime', width: 22, value: (booking) => toDate(booking.createdAt) },
  { header: 'Last Updated', key: 'updatedAt', type: 'datetime', width: 22, value: (booking) => toDate(booking.updatedAt) },
];

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
  return value ?? 0;
}

function text(value: string | null | undefined) {
  return value?.trim() || '';
}

function filterSummary(searchParams: URLSearchParams, scope: ExportScope, count: number) {
  const filters = Array.from(searchParams.entries())
    .filter(([key, value]) => value && !['format', 'scope', 'timeZone', 'page', 'limit'].includes(key))
    .map(([key, value]) => `${key}: ${value}`);

  return [
    ['Scope', scope],
    ['Records', count],
    ['Filters', filters.length ? filters.join(' | ') : 'No filters applied'],
  ];
}

function addIdSelection(where: Prisma.BookingWhereInput, ids?: string[]) {
  if (!ids?.length) {
    return where;
  }

  return {
    AND: [
      where,
      { id: { in: ids } },
    ],
  } satisfies Prisma.BookingWhereInput;
}

export async function getBookingsForExport(
  searchParams: URLSearchParams,
  scope: ExportScope,
  ids?: string[],
) {
  const effectiveSearchParams = scope === 'all' ? new URLSearchParams() : searchParams;
  const query = buildBookingQuery(effectiveSearchParams);
  const where = addIdSelection(query.where, scope === 'selected' ? ids : undefined);
  const totalRecords = await prisma.booking.count({ where });
  const records = await prisma.booking.findMany({
    where,
    orderBy: query.orderBy,
    take: EXPORT_LIMIT,
  });

  return {
    records: records.map(serializeBooking),
    filters: Object.fromEntries(effectiveSearchParams.entries()),
    totalRecords,
    limitApplied: totalRecords > records.length,
  };
}

function createBookingXlsx(
  bookings: BookingDto[],
  searchParams: URLSearchParams,
  scope: ExportScope,
  actor: CurrentAdmin,
  timeZone?: string,
) {
  const summaryRows = [
    ['Zion Events Place - Booking Management Export'],
    ['Generated At', formatDateTime(new Date(), timeZone)],
    ['Generated By', actor.fullName || actor.email],
    ...filterSummary(searchParams, scope, bookings.length),
  ];
  const bookingRows = bookings.map((booking) => BOOKING_COLUMNS.map((column) => column.value(booking)));
  const addOnRows = bookings.map((booking) => [
    booking.bookingReference,
    booking.clientName,
    booking.packageSelected ?? '',
    booking.specialRequests ?? '',
    booking.internalNotes ?? '',
  ]);
  const appliedFilterRows = Array.from(searchParams.entries())
    .filter(([key]) => !['format', 'timeZone'].includes(key))
    .map(([key, value]) => [key, value]);
  const sheets: ExportSheet[] = [
    { name: 'Summary', rows: summaryRows },
    {
      name: 'Bookings',
      columns: BOOKING_COLUMNS.map((column) => ({
        header: column.header,
        width: column.width,
        type: column.type,
      })),
      rows: bookingRows,
      freezeHeader: true,
    },
    {
      name: 'Add Ons',
      columns: [
        { header: 'Booking Reference', width: 24 },
        { header: 'Client Name', width: 28 },
        { header: 'Package', width: 30 },
        { header: 'Special Requests / Add-ons', width: 52 },
        { header: 'Internal Notes', width: 52 },
      ],
      rows: addOnRows,
      freezeHeader: true,
    },
    {
      name: 'Applied Filters',
      columns: [
        { header: 'Filter', width: 28 },
        { header: 'Value', width: 48 },
      ],
      rows: appliedFilterRows.length ? appliedFilterRows : [['None', 'No filters applied']],
      freezeHeader: true,
    },
  ];

  return createXlsx(sheets);
}

function createBookingPdf(bookings: BookingDto[], timeZone?: string) {
  const columns: Array<ZionPdfColumn<BookingDto>> = [
    { header: 'Reference', width: 78, maxLines: 2, value: (booking) => booking.bookingReference },
    {
      header: 'Client',
      width: 100,
      maxLines: 4,
      value: (booking) => [
        booking.clientName,
        booking.clientEmail ?? '',
        booking.clientPhone ?? '',
      ].filter(Boolean).join(' | '),
    },
    {
      header: 'Event',
      width: 126,
      maxLines: 5,
      value: (booking) => [
        booking.eventTitle,
        booking.eventCategoryName ?? booking.eventType,
        formatDate(booking.eventDate, timeZone),
        [booking.startTime, booking.endTime].filter(Boolean).join(' - '),
      ].filter(Boolean).join(' | '),
    },
    {
      header: 'Venue',
      width: 82,
      maxLines: 3,
      value: (booking) => booking.venue,
    },
    {
      header: 'Status',
      width: 70,
      align: 'center',
      maxLines: 3,
      value: (booking) => `${formatEnum(booking.status)} | ${formatEnum(booking.paymentSummaryStatus)}`,
    },
    {
      header: 'Details',
      width: 100,
      maxLines: 5,
      value: (booking) => [
        `Package: ${booking.packageSelected ?? 'Not set'}`,
        `Coordinator: ${booking.assignedCoordinator ?? 'Unassigned'}`,
        booking.specialRequests ? `Notes: ${booking.specialRequests}` : '',
      ].filter(Boolean).join(' | '),
    },
  ];

  return createZionBrandedTablePdf({
    title: 'Booking Operations Schedule',
    subtitle: 'A branded coordination export from Booking Management.',
    badge: 'Booking Management',
    generatedAt: formatDateTime(new Date(), timeZone),
    recordCount: bookings.length,
    rows: bookings,
    columns,
    emptyMessage: 'No booking records matched the selected export scope.',
    footerLabel: 'Confidential booking management export - Zion Events Place',
  });
}

export function createBookingSummaryPdf(booking: BookingDto, actor: CurrentAdmin, timeZone?: string) {
  const rows: BookingSummaryRow[] = [
    { section: 'Booking', field: 'Reference', value: booking.bookingReference },
    { section: 'Booking', field: 'Status', value: formatEnum(booking.status) },
    { section: 'Client', field: 'Name', value: booking.clientName },
    { section: 'Client', field: 'Email', value: text(booking.clientEmail) || 'Not provided' },
    { section: 'Client', field: 'Contact', value: text(booking.clientPhone) || 'Not provided' },
    { section: 'Event', field: 'Title', value: booking.eventTitle },
    { section: 'Event', field: 'Category', value: booking.eventCategoryName ?? booking.eventType },
    { section: 'Event', field: 'Date', value: formatDate(booking.eventDate, timeZone) },
    { section: 'Event', field: 'Time', value: [booking.startTime, booking.endTime].filter(Boolean).join(' - ') || 'Not set' },
    { section: 'Event', field: 'Venue', value: booking.venue },
    { section: 'Event', field: 'Guests', value: String(booking.guestCount) },
    { section: 'Package', field: 'Package', value: booking.packageSelected ?? 'Not set' },
    { section: 'Package', field: 'Theme / Colors', value: [booking.theme, booking.colors].filter(Boolean).join(' | ') || 'Not set' },
    { section: 'Payment', field: 'Payment Status', value: formatEnum(booking.paymentSummaryStatus) },
    { section: 'Payment', field: 'Total Amount', value: `PHP ${money(booking.paymentTotalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { section: 'Payment', field: 'Amount Paid', value: `PHP ${money(booking.paymentAmountPaid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { section: 'Payment', field: 'Remaining Balance', value: `PHP ${money(booking.paymentRemainingBalance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { section: 'Admin', field: 'Coordinator', value: booking.assignedCoordinator ?? 'Unassigned' },
    { section: 'Admin', field: 'Generated By', value: actor.fullName || actor.email },
    { section: 'Notes', field: 'Special Requests', value: booking.specialRequests ?? 'None recorded' },
    { section: 'Notes', field: 'Internal Notes', value: booking.internalNotes ?? 'None recorded' },
  ];
  const columns: Array<ZionPdfColumn<BookingSummaryRow>> = [
    { header: 'Section', width: 88, maxLines: 2, value: (row) => row.section },
    { header: 'Field', width: 120, maxLines: 2, value: (row) => row.field },
    { header: 'Information', width: 348, maxLines: 5, value: (row) => row.value },
  ];

  return createZionBrandedTablePdf({
    title: 'Booking Summary',
    subtitle: `Formal booking summary for ${booking.bookingReference}.`,
    badge: 'Individual Booking',
    generatedAt: formatDateTime(new Date(), timeZone),
    recordCount: 1,
    rows,
    columns,
    emptyMessage: 'Booking details are unavailable.',
    footerLabel: 'Confidential booking summary - Zion Events Place',
  });
}

export function createBookingExportResult(
  format: 'csv' | 'excel' | 'pdf',
  bookings: BookingDto[],
  searchParams: URLSearchParams,
  scope: ExportScope,
  actor: CurrentAdmin,
  timeZone?: string,
  limitApplied = false,
): ExportResult {
  if (format === 'csv') {
    return {
      body: createCsv(BOOKING_COLUMNS, bookings),
      contentType: 'text/csv; charset=utf-8',
      filename: datedExportFilename('zion-bookings', 'csv'),
      exportedRecords: bookings.length,
      limitApplied,
    };
  }

  if (format === 'excel') {
    return {
      body: createBookingXlsx(bookings, searchParams, scope, actor, timeZone),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: datedExportFilename('zion-bookings', 'xlsx'),
      exportedRecords: bookings.length,
      limitApplied,
    };
  }

  return {
    body: createBookingPdf(bookings, timeZone),
    contentType: 'application/pdf',
    filename: datedExportFilename('zion-booking-operations-schedule', 'pdf'),
    exportedRecords: bookings.length,
    limitApplied,
  };
}

