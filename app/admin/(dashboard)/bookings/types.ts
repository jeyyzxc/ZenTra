import type {
  AutomationStatus,
  BookingSource,
  BookingStatus,
  PaymentSummaryStatus,
  SyncStatus,
} from '@prisma/client';

export type BookingTimelineItem = {
  id: string;
  action: string;
  source: string;
  performedBy: string;
  description: string;
  metadata: unknown;
  createdAt: string;
};

export type BookingConflictItem = {
  id: string;
  bookingReference: string;
  clientName: string;
  eventTitle: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string;
  status: BookingStatus;
};

export type BookingListItem = {
  id: string;
  bookingReference: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string;
  guestCount: number;
  packageSelected: string | null;
  theme: string | null;
  colors: string | null;
  specialRequests: string | null;
  status: BookingStatus;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  statusChangeReason: string | null;
  assignedCoordinator: string | null;
  paymentRecordId: string | null;
  paymentSummaryStatus: PaymentSummaryStatus;
  paymentTotalAmount: number | null;
  paymentAmountPaid: number | null;
  paymentRemainingBalance: number | null;
  paymentDueDate: string | null;
  paymentLastDate: string | null;
  paymentReference: string | null;
  contractRecordId: string | null;
  contractStatus: string | null;
  bookingSource: BookingSource;
  syncStatus: SyncStatus;
  automationStatus: AutomationStatus;
  lastSyncedAt: string | null;
  n8nWorkflowId: string | null;
  n8nExecutionId: string | null;
  lastWorkflowResult: string | null;
  emailLogReferenceId: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingDetailItem = BookingListItem & {
  timeline: BookingTimelineItem[];
  conflicts: BookingConflictItem[];
  latestEmail: {
    id: string;
    emailType: string;
    status: string;
    relatedRecordId: string | null;
    lastAttemptAt: string | null;
    createdAt: string;
  } | null;
};

export type BookingPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type BookingFilters = {
  search: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  source: string;
  syncStatus: string;
  automationStatus: string;
  coordinator: string;
  eventType: string;
};

export type BookingSort = {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export type BookingListResponse = {
  bookings: BookingListItem[];
  pagination: BookingPagination;
};

export type BookingFormValues = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  guestCount: string;
  packageSelected: string;
  theme: string;
  colors: string;
  specialRequests: string;
  assignedCoordinator: string;
  internalNotes: string;
  conflictOverrideReason: string;
};
