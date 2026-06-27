import { AuditAction, AuditStatus, Prisma } from '@prisma/client';
import { AUDIT_MODULES } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export const AUDIT_ACTIONS = Object.values(AuditAction);
export const AUDIT_STATUSES = Object.values(AuditStatus);
export const AUDIT_ROLES = ['SUPERADMIN', 'ADMIN', 'CLIENT', 'SYSTEM'] as const;
export const ADMIN_ALLOWED_AUDIT_ACTIONS = [
  AuditAction.CREATE,
  AuditAction.READ,
  AuditAction.UPDATE,
  AuditAction.DELETE,
  AuditAction.LOGIN,
  AuditAction.LOGOUT,
  AuditAction.LOGIN_FAILED,
  AuditAction.PASSWORD_CHANGE,
  AuditAction.PROFILE_UPDATE,
  AuditAction.FILE_UPLOAD,
  AuditAction.FILE_DELETE,
  AuditAction.APPROVAL,
  AuditAction.REJECTION,
  AuditAction.SUBMISSION,
  AuditAction.EXPORT,
] as const satisfies readonly AuditAction[];

const ADMIN_ALLOWED_AUDIT_ACTION_SET = new Set<AuditAction>(ADMIN_ALLOWED_AUDIT_ACTIONS);

const SORT_FIELDS = [
  'timestamp',
  'userName',
  'userRole',
  'action',
  'module',
  'description',
  'status',
  'ipAddress',
] as const;

export type AuditSortField = (typeof SORT_FIELDS)[number];

export type AuditLogDto = {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: string;
  description: string;
  status: AuditStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
};

export type AuditPaginationDto = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export class AuditQueryError extends Error {
  status = 400;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    throw new AuditQueryError(`${label} must be a valid ISO 8601 timestamp.`);
  }

  return parsed;
}

function isAuditAction(value: string): value is AuditAction {
  return AUDIT_ACTIONS.includes(value as AuditAction);
}

function isAuditStatus(value: string): value is AuditStatus {
  return AUDIT_STATUSES.includes(value as AuditStatus);
}

function isAuditRole(value: string): value is (typeof AUDIT_ROLES)[number] {
  return AUDIT_ROLES.includes(value as (typeof AUDIT_ROLES)[number]);
}

function isSortField(value: string): value is AuditSortField {
  return SORT_FIELDS.includes(value as AuditSortField);
}

export function serializeAuditLog(log: {
  id: string;
  timestamp: Date;
  userId: string | null;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: string;
  description: string;
  status: AuditStatus;
  ipAddress: string | null;
  userAgent: string | null;
  previousValues?: Prisma.JsonValue | null;
  newValues?: Prisma.JsonValue | null;
  metadata?: Prisma.JsonValue | null;
}): AuditLogDto {
  return {
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    userId: log.userId,
    userName: log.userName,
    userRole: log.userRole,
    action: log.action,
    module: log.module,
    description: log.description,
    status: log.status,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    previousValues: log.previousValues ?? null,
    newValues: log.newValues ?? null,
    metadata: log.metadata ?? null,
  };
}

function sanitizeMetadataForAdmin(metadata: unknown) {
  if (!isRecord(metadata) || typeof metadata.requestPath !== 'string') {
    return null;
  }

  return {
    requestPath: metadata.requestPath,
  };
}

export function sanitizeAuditLogForRole(
  log: AuditLogDto,
  role: CurrentAdmin['role'],
): AuditLogDto {
  if (role === 'SUPERADMIN') {
    return log;
  }

  const safeLog = { ...log };
  const metadata = safeLog.metadata;
  delete safeLog.ipAddress;
  delete safeLog.userAgent;

  return {
    ...safeLog,
    metadata: sanitizeMetadataForAdmin(metadata),
  };
}

export function canReadAuditLog(
  admin: CurrentAdmin,
  log: { userId: string | null; action: AuditAction },
) {
  if (admin.role === 'SUPERADMIN') {
    return true;
  }

  return log.userId === admin.id && ADMIN_ALLOWED_AUDIT_ACTION_SET.has(log.action);
}

export function buildAuditQuery(searchParams: URLSearchParams) {
  const search = readParam(searchParams, 'search');
  const startDate = parseDate(readParam(searchParams, 'startDate'), 'startDate');
  const endDate = parseDate(readParam(searchParams, 'endDate'), 'endDate');
  const userId = readParam(searchParams, 'userId');
  const userRole = readParam(searchParams, 'userRole');
  const actionParam = readParam(searchParams, 'action');
  const moduleName = readParam(searchParams, 'module');
  const statusParam = readParam(searchParams, 'status');
  const sortByParam = readParam(searchParams, 'sortBy');
  const sortOrderParam = readParam(searchParams, 'sortOrder');

  if (startDate && endDate && startDate > endDate) {
    throw new AuditQueryError('startDate must be earlier than or equal to endDate.');
  }

  if (userRole && !isAuditRole(userRole)) {
    throw new AuditQueryError('userRole is not supported.');
  }

  let action: AuditAction | undefined;
  if (actionParam) {
    if (!isAuditAction(actionParam)) {
      throw new AuditQueryError('action is not supported.');
    }

    action = actionParam;
  }

  if (moduleName && !AUDIT_MODULES.includes(moduleName as (typeof AUDIT_MODULES)[number])) {
    throw new AuditQueryError('module is not supported.');
  }

  let status: AuditStatus | undefined;
  if (statusParam) {
    if (!isAuditStatus(statusParam)) {
      throw new AuditQueryError('status is not supported.');
    }

    status = statusParam;
  }

  const sortBy = sortByParam && isSortField(sortByParam) ? sortByParam : 'timestamp';
  const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';

  const where: Prisma.AuditLogWhereInput = {
    ...(search
      ? {
          OR: [
            { userName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { module: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(startDate || endDate
      ? {
          timestamp: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
    ...(userId ? { userId } : {}),
    ...(userRole ? { userRole } : {}),
    ...(action ? { action } : {}),
    ...(moduleName ? { module: moduleName } : {}),
    ...(status ? { status } : {}),
  };

  return {
    where,
    orderBy: { [sortBy]: sortOrder } as Prisma.AuditLogOrderByWithRelationInput,
    filters: {
      search,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      userId,
      userRole,
      action,
      module: moduleName,
      status,
      sortBy,
      sortOrder,
    },
  };
}

export function applyAuditScope(
  admin: CurrentAdmin,
  query: ReturnType<typeof buildAuditQuery>,
): Prisma.AuditLogWhereInput {
  if (admin.role === 'SUPERADMIN') {
    return query.where;
  }

  const adminSafeWhere = { ...query.where };
  delete adminSafeWhere.action;
  delete adminSafeWhere.userId;
  delete adminSafeWhere.userRole;

  const requestedAction = query.filters.action;

  return {
    ...adminSafeWhere,
    userId: admin.id,
    action: requestedAction
      ? {
          in: ADMIN_ALLOWED_AUDIT_ACTION_SET.has(requestedAction)
            ? [requestedAction]
            : [],
        }
      : { in: [...ADMIN_ALLOWED_AUDIT_ACTIONS] },
  };
}

export async function getAuditLogPage(searchParams: URLSearchParams, admin: CurrentAdmin) {
  const page = parsePositiveInt(readParam(searchParams, 'page'), 1);
  const limit = Math.min(parsePositiveInt(readParam(searchParams, 'limit'), 20), 100);
  const query = buildAuditQuery(searchParams);
  const where = applyAuditScope(admin, query);

  const [logs, totalRecords] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: query.orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs
      .map(serializeAuditLog)
      .map((log) => sanitizeAuditLogForRole(log, admin.role)),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    } satisfies AuditPaginationDto,
  };
}

export async function getAuditLogsForExport(searchParams: URLSearchParams, admin: CurrentAdmin) {
  const query = buildAuditQuery(searchParams);
  const where = applyAuditScope(admin, query);
  const totalRecords = await prisma.auditLog.count({ where });
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: query.orderBy,
    take: 10_000,
  });

  return {
    logs: logs
      .map(serializeAuditLog)
      .map((log) => sanitizeAuditLogForRole(log, admin.role)),
    filters: query.filters,
    totalRecords,
    limitApplied: totalRecords > 10_000,
  };
}
