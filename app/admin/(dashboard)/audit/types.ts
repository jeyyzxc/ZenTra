import type {
  AuditAction,
  AuditStatus,
  EmailStatus,
  EmailType,
  RelatedModule,
  TriggerSource,
} from '@prisma/client';

export type AuditLogListItem = {
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

export type AuditPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type AuditFilters = {
  search: string;
  startDate: string;
  endDate: string;
  userId: string;
  userRole: string;
  action: string;
  module: string;
  status: string;
};

export type AuditUserOption = {
  id: string;
  label: string;
  role: string;
};

export type AuditSort = {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export type AuditListResponse = {
  logs: AuditLogListItem[];
  pagination: AuditPagination;
};

export type EmailLogListItem = {
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

export type EmailLogFilters = {
  search: string;
  startDate: string;
  endDate: string;
  emailType: string;
  status: string;
  triggerSource: string;
  workflowName: string;
  relatedModule: string;
};

export type EmailLogSort = {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export type EmailLogListResponse = {
  logs: EmailLogListItem[];
  pagination: AuditPagination;
};
