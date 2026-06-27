import {
  EmailStatus,
  EmailType,
  Prisma,
  RelatedModule,
  TriggerSource,
} from '@prisma/client';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export const EMAIL_TYPES = Object.values(EmailType);
export const EMAIL_STATUSES = Object.values(EmailStatus);
export const TRIGGER_SOURCES = Object.values(TriggerSource);
export const RELATED_MODULES = Object.values(RelatedModule);

const SORT_FIELDS = [
  'createdAt',
  'recipientEmail',
  'emailType',
  'subject',
  'triggerSource',
  'status',
  'retryCount',
  'lastAttemptAt',
] as const;

export type EmailLogSortField = (typeof SORT_FIELDS)[number];

export type EmailLogDto = {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  emailType: EmailType;
  relatedModule: RelatedModule | null;
  relatedRecordId: string | null;
  subject: string;
  triggerSource: TriggerSource;
  workflowName: string | null;
  workflowExecutionId: string | null;
  providerMessageId: string | null;
  status: EmailStatus;
  retryCount: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  failureReason: string | null;
  emailPreview: string | null;
  payloadSummary?: unknown;
  resentBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailLogPaginationDto = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export class EmailLogQueryError extends Error {
  status = 400;
}

function readParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();
  return value || undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDate(value: string | undefined, label: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new EmailLogQueryError(`${label} must be a valid ISO 8601 timestamp.`);
  }

  return parsed;
}

function isEmailType(value: string): value is EmailType {
  return EMAIL_TYPES.includes(value as EmailType);
}

function isEmailStatus(value: string): value is EmailStatus {
  return EMAIL_STATUSES.includes(value as EmailStatus);
}

function isTriggerSource(value: string): value is TriggerSource {
  return TRIGGER_SOURCES.includes(value as TriggerSource);
}

function isRelatedModule(value: string): value is RelatedModule {
  return RELATED_MODULES.includes(value as RelatedModule);
}

function isSortField(value: string): value is EmailLogSortField {
  return SORT_FIELDS.includes(value as EmailLogSortField);
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function serializeEmailLog(log: {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  emailType: EmailType;
  relatedModule: RelatedModule | null;
  relatedRecordId: string | null;
  subject: string;
  triggerSource: TriggerSource;
  workflowName: string | null;
  workflowExecutionId: string | null;
  providerMessageId: string | null;
  status: EmailStatus;
  retryCount: number;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  errorMessage: string | null;
  failureReason: string | null;
  emailPreview: string | null;
  payloadSummary?: Prisma.JsonValue | null;
  resentBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): EmailLogDto {
  return {
    id: log.id,
    recipientEmail: log.recipientEmail,
    recipientName: log.recipientName,
    emailType: log.emailType,
    relatedModule: log.relatedModule,
    relatedRecordId: log.relatedRecordId,
    subject: log.subject,
    triggerSource: log.triggerSource,
    workflowName: log.workflowName,
    workflowExecutionId: log.workflowExecutionId,
    providerMessageId: log.providerMessageId,
    status: log.status,
    retryCount: log.retryCount,
    lastAttemptAt: toIso(log.lastAttemptAt),
    sentAt: toIso(log.sentAt),
    deliveredAt: toIso(log.deliveredAt),
    failedAt: toIso(log.failedAt),
    errorMessage: log.errorMessage,
    failureReason: log.failureReason,
    emailPreview: log.emailPreview,
    payloadSummary: log.payloadSummary ?? null,
    resentBy: log.resentBy,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}

export function sanitizeEmailLogForRole(
  log: EmailLogDto,
  role: CurrentAdmin['role'],
): EmailLogDto {
  if (role === 'SUPERADMIN') {
    return log;
  }

  const safeLog = { ...log };
  delete safeLog.payloadSummary;
  return safeLog;
}

export function buildEmailLogQuery(searchParams: URLSearchParams) {
  const search = readParam(searchParams, 'search');
  const startDate = parseDate(readParam(searchParams, 'startDate'), 'startDate');
  const endDate = parseDate(readParam(searchParams, 'endDate'), 'endDate');
  const emailTypeParam = readParam(searchParams, 'emailType');
  const statusParam = readParam(searchParams, 'status');
  const triggerSourceParam = readParam(searchParams, 'triggerSource');
  const workflowName = readParam(searchParams, 'workflowName');
  const relatedModuleParam = readParam(searchParams, 'relatedModule');
  const sortByParam = readParam(searchParams, 'sortBy');
  const sortOrderParam = readParam(searchParams, 'sortOrder');

  if (startDate && endDate && startDate > endDate) {
    throw new EmailLogQueryError('startDate must be earlier than or equal to endDate.');
  }

  let emailType: EmailType | undefined;
  if (emailTypeParam) {
    if (!isEmailType(emailTypeParam)) {
      throw new EmailLogQueryError('emailType is not supported.');
    }
    emailType = emailTypeParam;
  }

  let status: EmailStatus | undefined;
  if (statusParam) {
    if (!isEmailStatus(statusParam)) {
      throw new EmailLogQueryError('status is not supported.');
    }
    status = statusParam;
  }

  let triggerSource: TriggerSource | undefined;
  if (triggerSourceParam) {
    if (!isTriggerSource(triggerSourceParam)) {
      throw new EmailLogQueryError('triggerSource is not supported.');
    }
    triggerSource = triggerSourceParam;
  }

  let relatedModule: RelatedModule | undefined;
  if (relatedModuleParam) {
    if (!isRelatedModule(relatedModuleParam)) {
      throw new EmailLogQueryError('relatedModule is not supported.');
    }
    relatedModule = relatedModuleParam;
  }

  const sortBy = sortByParam && isSortField(sortByParam) ? sortByParam : 'createdAt';
  const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';

  const where: Prisma.EmailLogWhereInput = {
    ...(search
      ? {
          OR: [
            { recipientEmail: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
            { workflowName: { contains: search, mode: 'insensitive' } },
            { relatedRecordId: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
    ...(emailType ? { emailType } : {}),
    ...(status ? { status } : {}),
    ...(triggerSource ? { triggerSource } : {}),
    ...(workflowName ? { workflowName } : {}),
    ...(relatedModule ? { relatedModule } : {}),
  };

  return {
    where,
    orderBy: { [sortBy]: sortOrder } as Prisma.EmailLogOrderByWithRelationInput,
    filters: {
      search,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      emailType,
      status,
      triggerSource,
      workflowName,
      relatedModule,
      sortBy,
      sortOrder,
    },
  };
}

export async function getEmailLogPage(searchParams: URLSearchParams, admin: CurrentAdmin) {
  const page = parsePositiveInt(readParam(searchParams, 'page'), 1);
  const limit = Math.min(parsePositiveInt(readParam(searchParams, 'limit'), 20), 100);
  const query = buildEmailLogQuery(searchParams);

  const [logs, totalRecords] = await prisma.$transaction([
    prisma.emailLog.findMany({
      where: query.where,
      orderBy: query.orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emailLog.count({ where: query.where }),
  ]);

  return {
    logs: logs
      .map(serializeEmailLog)
      .map((log) => sanitizeEmailLogForRole(log, admin.role)),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    } satisfies EmailLogPaginationDto,
  };
}

export async function getEmailLogsForExport(searchParams: URLSearchParams, admin: CurrentAdmin) {
  const query = buildEmailLogQuery(searchParams);
  const totalRecords = await prisma.emailLog.count({ where: query.where });
  const logs = await prisma.emailLog.findMany({
    where: query.where,
    orderBy: query.orderBy,
    take: 10_000,
  });

  return {
    logs: logs
      .map(serializeEmailLog)
      .map((log) => sanitizeEmailLogForRole(log, admin.role)),
    filters: query.filters,
    totalRecords,
    limitApplied: totalRecords > 10_000,
  };
}

export async function getEmailWorkflowOptions() {
  const workflows = await prisma.emailLog.findMany({
    distinct: ['workflowName'],
    where: {
      workflowName: {
        not: null,
      },
    },
    orderBy: {
      workflowName: 'asc',
    },
    select: {
      workflowName: true,
    },
  });

  return workflows
    .map((workflow) => workflow.workflowName)
    .filter((workflow): workflow is string => Boolean(workflow));
}
