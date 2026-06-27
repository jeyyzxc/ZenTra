import {
  AuditAction,
  AuditStatus,
  BookingStatus,
  NotificationPriority,
  NotificationType,
  PaymentMilestoneStatus,
  PaymentSummaryStatus,
  PaymentType,
  PaymentVerificationStatus,
  Prisma,
  Role,
} from '@prisma/client';
import {
  auditActor,
  createAuditLog,
  systemAuditActor,
} from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import {
  deletePaymentProof,
  downloadPaymentProof,
  PaymentProofError,
  uploadPaymentProof,
  validatePaymentProof,
} from '@/lib/payment-proof-storage';
import { prisma } from '@/lib/prisma';

const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.RESCHEDULED,
  BookingStatus.ON_HOLD,
] as const;

const OVERDUE_ELIGIBLE_STATUSES = [
  PaymentSummaryStatus.UNPAID,
  PaymentSummaryStatus.RESERVATION_PAID,
  PaymentSummaryStatus.DOWN_PAYMENT_PAID,
  PaymentSummaryStatus.PARTIALLY_PAID,
] as const;

const NON_REVENUE_STATUSES = new Set<PaymentSummaryStatus>([
  PaymentSummaryStatus.REFUNDED,
  PaymentSummaryStatus.CANCELLED,
  PaymentSummaryStatus.FAILED,
]);

export class PaymentServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaymentServiceError';
    this.status = status;
  }
}

export type PaymentFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: string;
  packageName?: string;
  paymentType?: string;
  status?: string;
  dueStatus?: string;
  verificationStatus?: string;
  coordinator?: string;
  month?: string;
};

type MutationInput = Record<string, unknown>;

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requiredText(value: unknown, label: string) {
  const parsed = optionalText(value);
  if (!parsed) {
    throw new PaymentServiceError(`${label} is required.`);
  }
  return parsed;
}

function parseMoney(value: unknown, label: string, options?: { positive?: boolean }) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || (options?.positive && parsed <= 0)) {
    throw new PaymentServiceError(
      `${label} must be ${options?.positive ? 'greater than zero' : 'a non-negative number'}.`,
    );
  }
  return Math.round(parsed * 100) / 100;
}

function parseOptionalDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new PaymentServiceError(`${label} is invalid.`);
  }
  return parsed;
}

function parseStatus(value: unknown) {
  if (
    typeof value !== 'string' ||
    !Object.values(PaymentSummaryStatus).includes(value as PaymentSummaryStatus)
  ) {
    throw new PaymentServiceError('Payment status is invalid.');
  }
  return value as PaymentSummaryStatus;
}

function parsePaymentType(value: unknown) {
  if (
    typeof value !== 'string' ||
    !Object.values(PaymentType).includes(value as PaymentType)
  ) {
    throw new PaymentServiceError('Payment type is invalid.');
  }
  return value as PaymentType;
}

function parseVerificationStatus(value: unknown) {
  if (
    typeof value !== 'string' ||
    !Object.values(PaymentVerificationStatus).includes(value as PaymentVerificationStatus)
  ) {
    throw new PaymentServiceError('Verification status is invalid.');
  }
  return value as PaymentVerificationStatus;
}

function dateOnlyStart(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateOnlyEnd(value: string | undefined) {
  const parsed = dateOnlyStart(value);
  if (!parsed) return undefined;
  parsed.setDate(parsed.getDate() + 1);
  return parsed;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function defaultDueDate(createdAt: Date, eventDate: Date) {
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + 30);
  if (dueDate >= eventDate) {
    const beforeEvent = new Date(eventDate);
    beforeEvent.setDate(beforeEvent.getDate() - 1);
    return beforeEvent;
  }
  return dueDate;
}

function statusFromProgress(input: {
  amountPaid: number;
  totalAmount: number;
  paymentType: PaymentType | null;
  dueDate: Date | null;
}) {
  const remaining = Math.max(input.totalAmount - input.amountPaid, 0);
  if (input.totalAmount > 0 && remaining === 0) return PaymentSummaryStatus.FULLY_PAID;
  if (input.dueDate && input.dueDate < startOfToday() && remaining > 0) {
    return PaymentSummaryStatus.OVERDUE;
  }
  if (input.amountPaid <= 0) return PaymentSummaryStatus.UNPAID;
  if (input.paymentType === PaymentType.RESERVATION_FEE) return PaymentSummaryStatus.RESERVATION_PAID;
  if (input.paymentType === PaymentType.DOWN_PAYMENT) return PaymentSummaryStatus.DOWN_PAYMENT_PAID;
  return PaymentSummaryStatus.PARTIALLY_PAID;
}

function serializeRecord<T extends {
  id: string;
  paymentDate: Date | null;
  dueDate: Date | null;
  proofUploadedAt: Date | null;
  verifiedAt: Date | null;
  eventDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  history?: Array<{ createdAt: Date } & Record<string, unknown>>;
  milestones?: Array<{ createdAt: Date; updatedAt: Date; dueDate: Date | null } & Record<string, unknown>>;
}>(record: T) {
  return {
    ...record,
    paymentDate: record.paymentDate?.toISOString() ?? null,
    dueDate: record.dueDate?.toISOString() ?? null,
    proofUploadedAt: record.proofUploadedAt?.toISOString() ?? null,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    eventDate: record.eventDate?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    proofUrl: record.proofUploadedAt ? `/api/payments/${record.id}/proof` : null,
    history: record.history?.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    })),
    milestones: record.milestones?.map((milestone) => ({
      ...milestone,
      dueDate: milestone.dueDate?.toISOString() ?? null,
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    })),
  };
}

function monthRange(month: string | undefined) {
  const now = new Date();
  const parsed = month && /^\d{4}-\d{2}$/.test(month)
    ? new Date(`${month}-01T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 1);
  return { start: parsed, end };
}

function dueDateWhere(dueStatus: string | undefined): Prisma.DateTimeNullableFilter | undefined {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  if (dueStatus === 'DUE_TODAY') return { gte: today, lt: tomorrow };
  if (dueStatus === 'DUE_THIS_WEEK') return { gte: today, lt: weekEnd };
  if (dueStatus === 'DUE_THIS_MONTH') return { gte: today, lt: monthEnd };
  if (dueStatus === 'OVERDUE') return { lt: today };
  if (dueStatus === 'NO_DUE_DATE') return { equals: null };
  return undefined;
}

function paymentWhere(filters: PaymentFilters): Prisma.PaymentRecordWhereInput {
  const search = filters.search?.trim();
  const from = dateOnlyStart(filters.dateFrom);
  const to = dateOnlyEnd(filters.dateTo);
  const selectedMonth = filters.month && /^\d{4}-\d{2}$/.test(filters.month)
    ? monthRange(filters.month)
    : null;
  const dueFilter = dueDateWhere(filters.dueStatus);

  return {
    booking: {
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      ...(filters.coordinator
        ? { assignedCoordinator: { equals: filters.coordinator, mode: 'insensitive' } }
        : {}),
    },
    ...(search
      ? {
          OR: [
            { clientName: { contains: search, mode: 'insensitive' } },
            { clientEmail: { contains: search, mode: 'insensitive' } },
            { bookingReference: { contains: search, mode: 'insensitive' } },
            { paymentReference: { contains: search, mode: 'insensitive' } },
            { eventTitle: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(filters.eventType
      ? { eventType: { equals: filters.eventType, mode: 'insensitive' } }
      : {}),
    ...(filters.packageName
      ? { packageName: { equals: filters.packageName, mode: 'insensitive' } }
      : {}),
    ...(filters.paymentType ? { paymentType: parsePaymentType(filters.paymentType) } : {}),
    ...(filters.status ? { status: parseStatus(filters.status) } : {}),
    ...(filters.verificationStatus
      ? { verificationStatus: parseVerificationStatus(filters.verificationStatus) }
      : {}),
    ...(dueFilter ? { dueDate: dueFilter } : {}),
    ...((from || to || selectedMonth)
      ? {
          eventDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lt: to } : {}),
            ...(selectedMonth ? { gte: selectedMonth.start, lt: selectedMonth.end } : {}),
          },
        }
      : {}),
  };
}

async function syncOverduePayments() {
  const overdue = await prisma.paymentRecord.findMany({
    where: {
      dueDate: { lt: startOfToday() },
      remainingBalance: { gt: 0 },
      pendingAmount: 0,
      status: { in: [...OVERDUE_ELIGIBLE_STATUSES] },
      booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
    },
  });

  if (!overdue.length) return;

  await prisma.$transaction(async (transaction) => {
    for (const payment of overdue) {
      await transaction.paymentRecord.update({
        where: { id: payment.id },
        data: {
          status: PaymentSummaryStatus.OVERDUE,
          updatedBy: 'System',
          milestones: {
            updateMany: {
              where: {
                dueDate: { lt: startOfToday() },
                status: PaymentMilestoneStatus.PENDING,
              },
              data: { status: PaymentMilestoneStatus.OVERDUE },
            },
          },
        },
      });
      await transaction.booking.update({
        where: { id: payment.bookingId },
        data: { paymentSummaryStatus: PaymentSummaryStatus.OVERDUE },
      });
      await transaction.paymentHistory.create({
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          action: 'payment_marked_overdue',
          description: `Payment ${payment.paymentReference} was automatically marked overdue.`,
          oldStatus: payment.status,
          newStatus: PaymentSummaryStatus.OVERDUE,
          oldAmount: payment.amountPaid,
          newAmount: payment.amountPaid,
          oldBalance: payment.remainingBalance,
          newBalance: payment.remainingBalance,
          performedBy: 'System',
          source: 'payment_deadline_monitor',
        },
      });
    }
  });

  for (const payment of overdue) {
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.UPDATE,
      module: 'Payments',
      description: `Marked payment ${payment.paymentReference} overdue.`,
      status: AuditStatus.WARNING,
      previousValues: { status: payment.status },
      newValues: { status: PaymentSummaryStatus.OVERDUE },
      source: 'payment_deadline_monitor',
    });
  }
}

async function paymentSummary() {
  const { start, end } = monthRange(undefined);
  const [records, verifiedThisMonth] = await Promise.all([
    prisma.paymentRecord.findMany({
      where: { booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } } },
      select: {
        amountPaid: true,
        status: true,
        remainingBalance: true,
        verificationStatus: true,
      },
    }),
    prisma.paymentHistory.aggregate({
      where: {
        action: { in: ['payment_verified', 'payment_override'] },
        createdAt: { gte: start, lt: end },
      },
      _sum: { paymentAmount: true },
    }),
  ]);
  const revenueRecords = records.filter((record) => !NON_REVENUE_STATUSES.has(record.status));

  return {
    revenueThisMonth: verifiedThisMonth._sum.paymentAmount ?? 0,
    totalCollected: revenueRecords.reduce((sum, record) => sum + record.amountPaid, 0),
    pending: records.filter((record) => record.remainingBalance > 0 && !NON_REVENUE_STATUSES.has(record.status)).length,
    overdue: records.filter((record) => record.status === PaymentSummaryStatus.OVERDUE).length,
    downPayments: records.filter((record) => record.status === PaymentSummaryStatus.DOWN_PAYMENT_PAID).length,
    partialPayments: records.filter((record) => record.status === PaymentSummaryStatus.PARTIALLY_PAID).length,
    fullyPaid: records.filter((record) => record.status === PaymentSummaryStatus.FULLY_PAID).length,
    forVerification: records.filter((record) => (
      record.verificationStatus === PaymentVerificationStatus.PENDING ||
      record.status === PaymentSummaryStatus.FOR_VERIFICATION
    )).length,
  };
}

export async function listPaymentRecords(filters: PaymentFilters = {}) {
  await syncOverduePayments();
  const where = paymentWhere(filters);
  const [records, summary, availableBookings, optionsSource] = await Promise.all([
    prisma.paymentRecord.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            eventTitle: true,
            eventDate: true,
            packageSelected: true,
            assignedCoordinator: true,
            clientEmail: true,
            clientPhone: true,
          },
        },
        history: { orderBy: { createdAt: 'desc' }, take: 50 },
        milestones: { orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }] },
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    }),
    paymentSummary(),
    prisma.booking.findMany({
      where: {
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
        paymentRecord: { is: null },
      },
      select: {
        id: true,
        bookingReference: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        eventTitle: true,
        eventType: true,
        eventDate: true,
        packageSelected: true,
        assignedCoordinator: true,
        paymentTotalAmount: true,
        createdAt: true,
      },
      orderBy: { eventDate: 'asc' },
    }),
    prisma.paymentRecord.findMany({
      where: { booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } } },
      select: {
        eventType: true,
        packageName: true,
        booking: { select: { assignedCoordinator: true } },
      },
    }),
  ]);

  return {
    records: records.map(serializeRecord),
    summary,
    availableBookings: availableBookings.map((booking) => ({
      ...booking,
      eventDate: booking.eventDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      suggestedDueDate: defaultDueDate(booking.createdAt, booking.eventDate).toISOString(),
    })),
    options: {
      eventTypes: Array.from(new Set(optionsSource.map((item) => item.eventType).filter(Boolean))).sort(),
      packages: Array.from(new Set(optionsSource.map((item) => item.packageName).filter(Boolean))).sort(),
      coordinators: Array.from(new Set(optionsSource.map((item) => item.booking.assignedCoordinator).filter(Boolean))).sort(),
    },
  };
}

export async function getPaymentRecord(id: string) {
  await syncOverduePayments();
  const record = await prisma.paymentRecord.findUnique({
    where: { id },
    include: {
      booking: true,
      history: { orderBy: { createdAt: 'desc' } },
      milestones: { orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }] },
    },
  });
  if (!record) throw new PaymentServiceError('Payment record not found.', 404);
  return serializeRecord(record);
}

export async function getPaymentsForBooking(bookingId: string) {
  const record = await prisma.paymentRecord.findUnique({
    where: { bookingId },
    include: {
      history: { orderBy: { createdAt: 'desc' } },
      milestones: { orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }] },
    },
  });
  if (!record) throw new PaymentServiceError('No payment record exists for this booking.', 404);
  return serializeRecord(record);
}

export async function createPaymentRecord(input: MutationInput, actor: CurrentAdmin) {
  const bookingId = requiredText(input.bookingId, 'Booking reference');
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { paymentRecord: { select: { id: true } } },
  });
  if (!booking) throw new PaymentServiceError('Booking not found.', 404);
  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status as (typeof ACTIVE_BOOKING_STATUSES)[number])) {
    throw new PaymentServiceError('Only active bookings can have a new payment record.');
  }
  if (booking.paymentRecord) throw new PaymentServiceError('This booking already has a payment record.', 409);

  const totalAmount = parseMoney(
    input.totalAmount ?? booking.paymentTotalAmount ?? 0,
    'Package price',
    { positive: true },
  );
  const dueDate = parseOptionalDate(input.dueDate, 'Due date') ??
    defaultDueDate(booking.createdAt, booking.eventDate);
  const paymentReference = `PAY-${booking.bookingReference}`;

  const payment = await prisma.$transaction(async (transaction) => {
    const created = await transaction.paymentRecord.create({
      data: {
        paymentReference,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        eventTitle: booking.eventTitle,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        packageName: booking.packageSelected,
        totalAmount,
        remainingBalance: totalAmount,
        dueDate,
        notes: optionalText(input.notes),
        source: 'payment_management',
        createdBy: actor.username,
        updatedBy: actor.username,
        history: {
          create: {
            bookingId: booking.id,
            action: 'payment_record_created',
            description: `${actor.username} created payment record ${paymentReference}.`,
            newStatus: PaymentSummaryStatus.UNPAID,
            newAmount: 0,
            newBalance: totalAmount,
            performedBy: actor.username,
            source: 'payment_management',
            notes: optionalText(input.notes),
          },
        },
        milestones: {
          create: {
            bookingId: booking.id,
            milestoneName: 'Outstanding balance',
            amountRequired: totalAmount,
            dueDate,
            status: dueDate < startOfToday()
              ? PaymentMilestoneStatus.OVERDUE
              : PaymentMilestoneStatus.PENDING,
          },
        },
      },
    });
    await syncPaymentRelations(transaction, created, actor.username);
    return created;
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.CREATE,
    module: 'Payments',
    description: `Created payment ${payment.paymentReference}.`,
    status: AuditStatus.SUCCESS,
    newValues: {
      bookingReference: payment.bookingReference,
      totalAmount: payment.totalAmount,
      dueDate: payment.dueDate,
    },
    source: 'payment_management',
  });
  return payment;
}

async function syncPaymentRelations(
  transaction: Prisma.TransactionClient,
  payment: {
    id: string;
    bookingId: string;
    paymentReference: string;
    status: PaymentSummaryStatus;
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    dueDate: Date | null;
    paymentDate: Date | null;
  },
  performedBy: string,
) {
  await transaction.booking.update({
    where: { id: payment.bookingId },
    data: {
      paymentRecordId: payment.id,
      paymentSummaryStatus: payment.status,
      paymentTotalAmount: payment.totalAmount,
      paymentAmountPaid: payment.amountPaid,
      paymentRemainingBalance: payment.remainingBalance,
      paymentDueDate: payment.dueDate,
      paymentLastDate: payment.paymentDate,
      paymentReference: payment.paymentReference,
      timeline: {
        create: {
          action: 'Payment Summary Updated',
          source: 'Payment Management',
          performedBy,
          description: `Payment ${payment.paymentReference} is ${payment.status.toLowerCase().replaceAll('_', ' ')} with ${payment.remainingBalance.toFixed(2)} remaining.`,
          metadata: {
            paymentId: payment.id,
            amountPaid: payment.amountPaid,
            remainingBalance: payment.remainingBalance,
          },
        },
      },
    },
  });
  await transaction.contract.updateMany({
    where: { bookingId: payment.bookingId },
    data: {
      contractAmount: payment.totalAmount,
      totalPaid: payment.amountPaid,
      remainingBalance: payment.remainingBalance,
    },
  });
}

function protectedFieldsChanged(
  previous: {
    totalAmount: number;
    amountPaid: number;
    status: PaymentSummaryStatus;
    paymentMethod: string | null;
    paymentType: PaymentType | null;
  },
  input: MutationInput,
) {
  return (
    ('totalAmount' in input && Number(input.totalAmount) !== previous.totalAmount) ||
    ('amountPaid' in input && Number(input.amountPaid) !== previous.amountPaid) ||
    ('status' in input && input.status !== previous.status) ||
    ('paymentMethod' in input && optionalText(input.paymentMethod) !== previous.paymentMethod) ||
    ('paymentType' in input && input.paymentType !== previous.paymentType)
  );
}

export async function updatePaymentRecord(
  id: string,
  input: MutationInput,
  actor: CurrentAdmin,
  proof?: File | null,
) {
  const previous = await prisma.paymentRecord.findUnique({ where: { id } });
  if (!previous) throw new PaymentServiceError('Payment record not found.', 404);

  const protectedChange = protectedFieldsChanged(previous, input);
  if (protectedChange && actor.role !== Role.SUPERADMIN) {
    throw new PaymentServiceError('Only a Super Admin can override verified payment values.', 403);
  }
  if (protectedChange) {
    validatePaymentProof(proof);
    requiredText(input.reason, 'Override reason');
  }

  const totalAmount = 'totalAmount' in input
    ? parseMoney(input.totalAmount, 'Package price', { positive: true })
    : previous.totalAmount;
  let amountPaid = 'amountPaid' in input
    ? parseMoney(input.amountPaid, 'Amount paid')
    : previous.amountPaid;
  let status = 'status' in input ? parseStatus(input.status) : previous.status;
  const paymentType = 'paymentType' in input
    ? parsePaymentType(input.paymentType)
    : previous.paymentType;
  const paymentMethod = 'paymentMethod' in input
    ? optionalText(input.paymentMethod)
    : previous.paymentMethod;
  const dueDate = 'dueDate' in input
    ? parseOptionalDate(input.dueDate, 'Due date')
    : previous.dueDate;
  const paymentDate = 'paymentDate' in input
    ? parseOptionalDate(input.paymentDate, 'Payment date')
    : previous.paymentDate;

  if (status === PaymentSummaryStatus.FULLY_PAID) amountPaid = totalAmount;
  if (amountPaid > totalAmount) {
    throw new PaymentServiceError('Amount paid cannot exceed the package price.');
  }
  const remainingBalance = Math.max(totalAmount - amountPaid, 0);
  const preservedOverrideStatuses = new Set<PaymentSummaryStatus>([
    PaymentSummaryStatus.REFUNDED,
    PaymentSummaryStatus.CANCELLED,
    PaymentSummaryStatus.REJECTED,
  ]);
  if (!preservedOverrideStatuses.has(status)) {
    status = statusFromProgress({ amountPaid, totalAmount, paymentType, dueDate });
  }

  let storedProof: Awaited<ReturnType<typeof uploadPaymentProof>> | null = null;
  if (proof && proof.size > 0) {
    storedProof = await uploadPaymentProof({
      file: proof,
      bookingReference: previous.bookingReference,
      paymentReference: previous.paymentReference,
    });
  }

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const payment = await transaction.paymentRecord.update({
        where: { id },
        data: {
          status,
          totalAmount,
          amountPaid,
          remainingBalance,
          paymentType,
          paymentMethod,
          paymentDate,
          dueDate,
          verificationStatus: protectedChange
            ? PaymentVerificationStatus.VERIFIED
            : previous.verificationStatus,
          ...(storedProof
            ? {
                proofPath: storedProof.path,
                proofFileName: storedProof.fileName,
                proofFileType: storedProof.fileType,
                proofUploadedBy: actor.username,
                proofUploadedAt: new Date(),
              }
            : {}),
          notes: 'notes' in input ? optionalText(input.notes) : previous.notes,
          updatedBy: actor.username,
        },
      });
      const delta = Math.max(payment.amountPaid - previous.amountPaid, 0);
      await transaction.paymentHistory.create({
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          action: protectedChange ? 'payment_override' : 'payment_edited',
          description: `${actor.username} edited payment ${payment.paymentReference}.`,
          oldStatus: previous.status,
          newStatus: payment.status,
          oldAmount: previous.amountPaid,
          newAmount: payment.amountPaid,
          oldBalance: previous.remainingBalance,
          newBalance: payment.remainingBalance,
          paymentAmount: protectedChange ? delta : null,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          proofPath: storedProof?.path,
          proofFileName: storedProof?.fileName,
          proofFileType: storedProof?.fileType,
          verification: payment.verificationStatus,
          performedBy: actor.username,
          notes: optionalText(input.reason) ?? optionalText(input.notes),
          source: 'payment_management',
          previousValue: {
            status: previous.status,
            amountPaid: previous.amountPaid,
            remainingBalance: previous.remainingBalance,
          } as Prisma.InputJsonValue,
          newValue: {
            status: payment.status,
            amountPaid: payment.amountPaid,
            remainingBalance: payment.remainingBalance,
          } as Prisma.InputJsonValue,
        },
      });
      await syncPaymentRelations(transaction, payment, actor.username);
      return payment;
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Payments',
      description: `${protectedChange ? 'Overrode' : 'Updated'} payment ${updated.paymentReference}.`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        status: previous.status,
        amountPaid: previous.amountPaid,
        remainingBalance: previous.remainingBalance,
      },
      newValues: {
        status: updated.status,
        amountPaid: updated.amountPaid,
        remainingBalance: updated.remainingBalance,
        reason: optionalText(input.reason),
      },
      source: 'payment_management',
    });
    return updated;
  } catch (error) {
    if (storedProof) await deletePaymentProof(storedProof.path);
    throw error;
  }
}

export async function addPayment(
  id: string,
  input: MutationInput,
  proof: File | null | undefined,
  actor: CurrentAdmin,
) {
  validatePaymentProof(proof);
  const previous = await prisma.paymentRecord.findUnique({ where: { id } });
  if (!previous) throw new PaymentServiceError('Payment record not found.', 404);
  if (previous.pendingAmount > 0 || previous.verificationStatus === PaymentVerificationStatus.PENDING) {
    throw new PaymentServiceError('This record already has a payment waiting for verification.', 409);
  }
  if (previous.totalAmount <= 0) {
    throw new PaymentServiceError('Set a valid package price before adding a payment.');
  }

  const paymentAmount = parseMoney(input.paymentAmount, 'Payment amount', { positive: true });
  if (paymentAmount > previous.remainingBalance) {
    throw new PaymentServiceError('Payment amount cannot exceed the remaining balance.');
  }
  const paymentType = parsePaymentType(input.paymentType);
  const paymentMethod = requiredText(input.paymentMethod, 'Payment method');
  const paymentDate = parseOptionalDate(input.paymentDate, 'Payment date') ?? new Date();
  const dueDate = 'dueDate' in input
    ? parseOptionalDate(input.dueDate, 'Due date')
    : previous.dueDate;

  const storedProof = await uploadPaymentProof({
    file: proof,
    bookingReference: previous.bookingReference,
    paymentReference: previous.paymentReference,
  });

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const payment = await transaction.paymentRecord.update({
        where: { id },
        data: {
          status: PaymentSummaryStatus.FOR_VERIFICATION,
          verificationStatus: PaymentVerificationStatus.PENDING,
          pendingAmount: paymentAmount,
          paymentType,
          paymentMethod,
          paymentDate,
          dueDate,
          proofPath: storedProof.path,
          proofFileName: storedProof.fileName,
          proofFileType: storedProof.fileType,
          proofUploadedBy: actor.username,
          proofUploadedAt: new Date(),
          verifiedBy: null,
          verifiedAt: null,
          notes: optionalText(input.notes),
          updatedBy: actor.username,
        },
      });
      await transaction.paymentHistory.create({
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          action: 'payment_submitted',
          description: `${actor.username} submitted ${paymentAmount.toFixed(2)} for verification.`,
          oldStatus: previous.status,
          newStatus: PaymentSummaryStatus.FOR_VERIFICATION,
          oldAmount: previous.amountPaid,
          newAmount: previous.amountPaid,
          oldBalance: previous.remainingBalance,
          newBalance: previous.remainingBalance,
          paymentAmount,
          paymentType,
          paymentMethod,
          proofPath: storedProof.path,
          proofFileName: storedProof.fileName,
          proofFileType: storedProof.fileType,
          verification: PaymentVerificationStatus.PENDING,
          performedBy: actor.username,
          notes: optionalText(input.notes),
          source: 'payment_management',
          newValue: {
            paymentDate: paymentDate.toISOString(),
            dueDate: dueDate?.toISOString() ?? null,
          },
        },
      });
      await transaction.paymentMilestone.create({
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          milestoneName: paymentType.replaceAll('_', ' ').toLowerCase(),
          amountRequired: paymentAmount,
          amountPaid: 0,
          dueDate,
          status: PaymentMilestoneStatus.FOR_VERIFICATION,
        },
      });
      await transaction.notification.create({
        data: {
          title: 'Payment for verification',
          message: `${payment.clientName} submitted ${paymentAmount.toFixed(2)} for ${payment.bookingReference}.`,
          type: NotificationType.PAYMENT,
          priority: NotificationPriority.HIGH,
          relatedModule: 'payments',
          relatedRecordId: payment.id,
          createdBy: actor.username,
          source: 'payment_management',
        },
      });
      await syncPaymentRelations(transaction, payment, actor.username);
      return payment;
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.SUBMISSION,
      module: 'Payments',
      description: `Submitted payment ${updated.paymentReference} for verification with proof.`,
      status: AuditStatus.SUCCESS,
      newValues: {
        paymentAmount,
        paymentType,
        paymentMethod,
        verificationStatus: PaymentVerificationStatus.PENDING,
      },
      source: 'payment_management',
    });
    return updated;
  } catch (error) {
    await deletePaymentProof(storedProof.path);
    throw error;
  }
}

export async function verifyPayment(id: string, input: MutationInput, actor: CurrentAdmin) {
  if (actor.role !== Role.SUPERADMIN) {
    throw new PaymentServiceError('Only a Super Admin can verify payments.', 403);
  }
  const previous = await prisma.paymentRecord.findUnique({ where: { id } });
  if (!previous) throw new PaymentServiceError('Payment record not found.', 404);
  if (
    previous.verificationStatus !== PaymentVerificationStatus.PENDING ||
    previous.pendingAmount <= 0 ||
    !previous.proofPath
  ) {
    throw new PaymentServiceError('This payment does not have a complete submission to verify.', 409);
  }

  const amountPaid = Math.min(previous.amountPaid + previous.pendingAmount, previous.totalAmount);
  const remainingBalance = Math.max(previous.totalAmount - amountPaid, 0);
  const status = statusFromProgress({
    amountPaid,
    totalAmount: previous.totalAmount,
    paymentType: previous.paymentType,
    dueDate: previous.dueDate,
  });
  const verifiedAmount = previous.pendingAmount;

  const updated = await prisma.$transaction(async (transaction) => {
    const payment = await transaction.paymentRecord.update({
      where: { id },
      data: {
        amountPaid,
        pendingAmount: 0,
        remainingBalance,
        status,
        verificationStatus: PaymentVerificationStatus.VERIFIED,
        verifiedBy: actor.username,
        verifiedAt: new Date(),
        updatedBy: actor.username,
      },
    });
    await transaction.paymentHistory.create({
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        action: 'payment_verified',
        description: `${actor.username} verified ${verifiedAmount.toFixed(2)} for ${payment.paymentReference}.`,
        oldStatus: previous.status,
        newStatus: payment.status,
        oldAmount: previous.amountPaid,
        newAmount: payment.amountPaid,
        oldBalance: previous.remainingBalance,
        newBalance: payment.remainingBalance,
        paymentAmount: verifiedAmount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        proofPath: payment.proofPath,
        proofFileName: payment.proofFileName,
        proofFileType: payment.proofFileType,
        verification: PaymentVerificationStatus.VERIFIED,
        performedBy: actor.username,
        notes: optionalText(input.notes),
        source: 'payment_management',
      },
    });
    await transaction.paymentMilestone.updateMany({
      where: {
        paymentId: payment.id,
        status: PaymentMilestoneStatus.FOR_VERIFICATION,
      },
      data: {
        amountPaid: verifiedAmount,
        status: PaymentMilestoneStatus.PAID,
      },
    });
    await transaction.notification.create({
      data: {
        title: 'Payment verified',
        message: `${verifiedAmount.toFixed(2)} was verified for ${payment.bookingReference}.`,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.MEDIUM,
        relatedModule: 'payments',
        relatedRecordId: payment.id,
        createdBy: actor.username,
        source: 'payment_management',
      },
    });
    await syncPaymentRelations(transaction, payment, actor.username);
    return payment;
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.APPROVAL,
    module: 'Payments',
    description: `Verified payment ${updated.paymentReference}.`,
    status: AuditStatus.SUCCESS,
    previousValues: {
      amountPaid: previous.amountPaid,
      remainingBalance: previous.remainingBalance,
      verificationStatus: previous.verificationStatus,
    },
    newValues: {
      amountPaid: updated.amountPaid,
      remainingBalance: updated.remainingBalance,
      verificationStatus: updated.verificationStatus,
    },
    source: 'payment_management',
  });
  return updated;
}

export async function rejectPayment(id: string, input: MutationInput, actor: CurrentAdmin) {
  if (actor.role !== Role.SUPERADMIN) {
    throw new PaymentServiceError('Only a Super Admin can reject payments.', 403);
  }
  const reason = requiredText(input.reason, 'Rejection reason');
  const previous = await prisma.paymentRecord.findUnique({ where: { id } });
  if (!previous) throw new PaymentServiceError('Payment record not found.', 404);
  if (previous.verificationStatus !== PaymentVerificationStatus.PENDING || previous.pendingAmount <= 0) {
    throw new PaymentServiceError('This payment is not waiting for verification.', 409);
  }
  const rejectedAmount = previous.pendingAmount;

  const updated = await prisma.$transaction(async (transaction) => {
    const payment = await transaction.paymentRecord.update({
      where: { id },
      data: {
        pendingAmount: 0,
        status: PaymentSummaryStatus.REJECTED,
        verificationStatus: PaymentVerificationStatus.REJECTED,
        verifiedBy: actor.username,
        verifiedAt: new Date(),
        notes: reason,
        updatedBy: actor.username,
      },
    });
    await transaction.paymentHistory.create({
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        action: 'payment_rejected',
        description: `${actor.username} rejected ${rejectedAmount.toFixed(2)} for ${payment.paymentReference}.`,
        oldStatus: previous.status,
        newStatus: PaymentSummaryStatus.REJECTED,
        oldAmount: previous.amountPaid,
        newAmount: previous.amountPaid,
        oldBalance: previous.remainingBalance,
        newBalance: previous.remainingBalance,
        paymentAmount: rejectedAmount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        proofPath: payment.proofPath,
        proofFileName: payment.proofFileName,
        proofFileType: payment.proofFileType,
        verification: PaymentVerificationStatus.REJECTED,
        performedBy: actor.username,
        notes: reason,
        source: 'payment_management',
      },
    });
    await transaction.paymentMilestone.updateMany({
      where: {
        paymentId: payment.id,
        status: PaymentMilestoneStatus.FOR_VERIFICATION,
      },
      data: { status: PaymentMilestoneStatus.REJECTED },
    });
    await transaction.notification.create({
      data: {
        title: 'Payment rejected',
        message: `Payment proof for ${payment.bookingReference} was rejected: ${reason}`,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.HIGH,
        relatedModule: 'payments',
        relatedRecordId: payment.id,
        createdBy: actor.username,
        source: 'payment_management',
      },
    });
    await syncPaymentRelations(transaction, payment, actor.username);
    return payment;
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.REJECTION,
    module: 'Payments',
    description: `Rejected payment ${updated.paymentReference}.`,
    status: AuditStatus.WARNING,
    previousValues: { verificationStatus: previous.verificationStatus },
    newValues: {
      verificationStatus: PaymentVerificationStatus.REJECTED,
      reason,
    },
    source: 'payment_management',
  });
  return updated;
}

export async function uploadProofOnly(
  id: string,
  proof: File | null | undefined,
  actor: CurrentAdmin,
) {
  validatePaymentProof(proof);
  const previous = await prisma.paymentRecord.findUnique({ where: { id } });
  if (!previous) throw new PaymentServiceError('Payment record not found.', 404);
  if (previous.verificationStatus === PaymentVerificationStatus.VERIFIED && actor.role !== Role.SUPERADMIN) {
    throw new PaymentServiceError('Only a Super Admin can replace verified payment proof.', 403);
  }
  const storedProof = await uploadPaymentProof({
    file: proof,
    bookingReference: previous.bookingReference,
    paymentReference: previous.paymentReference,
  });

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const payment = await transaction.paymentRecord.update({
        where: { id },
        data: {
          proofPath: storedProof.path,
          proofFileName: storedProof.fileName,
          proofFileType: storedProof.fileType,
          proofUploadedBy: actor.username,
          proofUploadedAt: new Date(),
          updatedBy: actor.username,
        },
      });
      await transaction.paymentHistory.create({
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          action: previous.proofPath ? 'payment_proof_replaced' : 'payment_proof_uploaded',
          description: `${actor.username} ${previous.proofPath ? 'replaced' : 'uploaded'} proof for ${payment.paymentReference}.`,
          oldStatus: previous.status,
          newStatus: payment.status,
          proofPath: storedProof.path,
          proofFileName: storedProof.fileName,
          proofFileType: storedProof.fileType,
          verification: payment.verificationStatus,
          performedBy: actor.username,
          source: 'payment_management',
        },
      });
      return payment;
    });
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.FILE_UPLOAD,
      module: 'Payments',
      description: `Uploaded proof for ${updated.paymentReference}.`,
      status: AuditStatus.SUCCESS,
      newValues: { proofFileName: storedProof.fileName },
      source: 'payment_management',
    });
    return updated;
  } catch (error) {
    await deletePaymentProof(storedProof.path);
    throw error;
  }
}

export async function getPaymentProof(id: string) {
  const payment = await prisma.paymentRecord.findUnique({
    where: { id },
    select: { proofPath: true, proofFileName: true, proofFileType: true },
  });
  if (!payment?.proofPath) throw new PaymentServiceError('Payment proof not found.', 404);
  const response = await downloadPaymentProof(payment.proofPath);
  return {
    response,
    fileName: payment.proofFileName ?? 'payment-proof',
    fileType: payment.proofFileType ?? response.headers.get('content-type') ?? 'application/octet-stream',
  };
}

export async function getMonthlyRevenue(month?: string) {
  const { start, end } = monthRange(month);
  const history = await prisma.paymentHistory.findMany({
    where: {
      action: { in: ['payment_verified', 'payment_override'] },
      createdAt: { gte: start, lt: end },
      paymentAmount: { gt: 0 },
    },
    orderBy: { createdAt: 'asc' },
  });
  return {
    month: start.toISOString().slice(0, 7),
    revenue: history.reduce((sum, item) => sum + (item.paymentAmount ?? 0), 0),
    entries: history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function getOverduePayments() {
  return listPaymentRecords({ status: PaymentSummaryStatus.OVERDUE });
}

export async function getPendingPayments() {
  await syncOverduePayments();
  const records = await prisma.paymentRecord.findMany({
    where: {
      booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
      OR: [
        { status: PaymentSummaryStatus.UNPAID },
        { status: PaymentSummaryStatus.FOR_VERIFICATION },
        { status: PaymentSummaryStatus.PARTIALLY_PAID },
        { status: PaymentSummaryStatus.DOWN_PAYMENT_PAID },
        { status: PaymentSummaryStatus.RESERVATION_PAID },
        { status: PaymentSummaryStatus.OVERDUE },
        { remainingBalance: { gt: 0 } },
      ],
    },
    include: { booking: true },
    orderBy: { dueDate: 'asc' },
  });
  return records.map(serializeRecord);
}

export async function listPaymentHistory(paymentId?: string) {
  const history = await prisma.paymentHistory.findMany({
    where: paymentId ? { paymentId } : undefined,
    include: {
      payment: {
        select: {
          paymentReference: true,
          bookingReference: true,
          clientName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: paymentId ? 200 : 500,
  });
  return history.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  }));
}

export async function readPaymentMutationRequest(request: Request) {
  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await request.formData();
    const rawPayload = form.get('payload');
    let input: MutationInput = {};
    if (typeof rawPayload === 'string' && rawPayload.trim()) {
      try {
        input = JSON.parse(rawPayload) as MutationInput;
      } catch {
        throw new PaymentServiceError('Payment form data is invalid.');
      }
    }
    const proofValue = form.get('proof');
    return {
      input,
      proof: proofValue instanceof File ? proofValue : null,
    };
  }
  return {
    input: await request.json() as MutationInput,
    proof: null,
  };
}

export function paymentErrorResponse(error: unknown) {
  if (error instanceof PaymentServiceError || error instanceof PaymentProofError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return Response.json({ error: 'A payment record already exists for this booking.' }, { status: 409 });
  }
  if (error instanceof Error && (
    error.message.startsWith('Unauthorized') ||
    error.message.startsWith('Forbidden')
  )) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  console.error('Payment request failed:', error);
  return Response.json({ error: 'Unable to process the payment request.' }, { status: 500 });
}
