import { randomUUID } from 'crypto';
import {
  AuditAction,
  AuditStatus,
  BookingStatus,
  ContractSignatureStatus,
  ContractStatus,
  ContractTemplateType,
  ContractWorkflowStatus,
  EmailStatus,
  EmailType,
  N8nWorkflowStatus,
  NotificationPriority,
  NotificationType,
  PaymentSummaryStatus,
  Prisma,
  RelatedModule,
  Role,
  TriggerSource,
  type Booking,
  type Contract,
  type ContractTemplate,
} from '@prisma/client';
import { auditActor, createAuditLog, errorMetadata, systemAuditActor } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const BLOCKED_BOOKING_STATUSES = [
  BookingStatus.CANCELLED,
  BookingStatus.DECLINED,
  BookingStatus.EXPIRED,
] as const;

const SEND_PAYMENT_STATUSES = [
  PaymentSummaryStatus.RESERVATION_PAID,
  PaymentSummaryStatus.DOWN_PAYMENT_PAID,
  PaymentSummaryStatus.PARTIALLY_PAID,
  PaymentSummaryStatus.FULLY_PAID,
] as const;

const LOCKED_TEMPLATE_SECTIONS = [
  'terms_and_conditions',
  'venue_rules',
  'cancellation_policy',
  'advertisement_clause',
  'otd_coordinator_description',
  'client_responsibility',
  'owner_signature_block',
];

const PRODUCTION_EMAIL_STATUSES: readonly EmailStatus[] = Object.values(EmailStatus).filter(
  (status) => status !== EmailStatus.PENDING_DEMO && status !== EmailStatus.SENT_DEMO,
);

const PRODUCTION_CONTRACT_WORKFLOW_STATUSES: readonly ContractWorkflowStatus[] = Object.values(ContractWorkflowStatus).filter(
  (status) => status !== ContractWorkflowStatus.DEMO_MODE,
);

type BookingWithLatestContract = Booking & {
  contracts: Array<Contract & {
    versions: Array<{ versionNumber: number }>;
  }>;
};

type ContractWithRelations = Contract & {
  booking: Booking;
  template: ContractTemplate | null;
  versions: Array<{
    id: string;
    versionNumber: number;
    templateVersion: number;
    changeSummary: string | null;
    createdBy: string | null;
    createdAt: Date;
  }>;
  timeline: Array<{
    id: string;
    action: string;
    description: string;
    source: string;
    performedBy: string | null;
    metadata: unknown;
    createdAt: Date;
  }>;
  sendAttempts: Array<{
    id: string;
    recipientEmail: string;
    status: EmailStatus;
    attemptNumber: number;
    errorMessage: string | null;
    sentAt: Date | null;
    createdAt: Date;
  }>;
};

type LatestEmailLog = {
  id: string;
  status: EmailStatus;
  subject: string;
  recipientEmail: string;
  retryCount: number;
  providerMessageId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
} | null;

type LatestWorkflowLog = {
  id: string;
  workflowName: string;
  workflowExecutionId: string | null;
  status: N8nWorkflowStatus;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
} | null;

export type ContractSummaryDto = {
  totalContracts: number;
  draftContracts: number;
  readyToSend: number;
  sentContracts: number;
  signedContracts: number;
  failedDelivery: number;
  bookingsWithoutContract: number;
  pendingClientSignature: number;
};

export type ContractBookingEventDto = {
  id: string;
  bookingReference: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  packageName: string | null;
  guestCount: number;
  venue: string;
  bookingStatus: string;
  paymentStatus: string;
  contractStatus: string;
  workflowStatus: string;
  assignedCoordinator: string | null;
  lastUpdated: string;
  canGenerate: boolean;
  canSend: boolean;
  eligibilityIssues: string[];
  latestContractId: string | null;
};

export type ContractDto = {
  id: string;
  contractNumber: string;
  bookingId: string;
  bookingReference: string;
  clientName: string;
  clientEmail: string | null;
  eventType: string;
  eventDate: string;
  packageName: string | null;
  templateVersion: number;
  contractStatus: string;
  emailStatus: string;
  workflowStatus: string;
  signatureStatus: string;
  contractAmount: number | null;
  totalPaid: number | null;
  remainingBalance: number | null;
  pdfUrl: string | null;
  htmlPreview: string | null;
  resendAttemptCount: number;
  lastSentAt: string | null;
  lastResendAt: string | null;
  signedAt: string | null;
  viewedAt: string | null;
  generatedBy: string | null;
  sentBy: string | null;
  internalNotes: string | null;
  dynamicFields: {
    startTime: string;
    endTime: string;
    totalPax: number;
    colors: string;
    theme: string;
    packageInclusions: string[];
    itemDescription: string;
    paymentSchedule: string;
    paymentRemarks: string;
  };
  createdAt: string;
  updatedAt: string;
  latestVersion: number;
  booking: {
    status: string;
    paymentStatus: string;
    assignedCoordinator: string | null;
    eventTitle: string;
    guestCount: number;
    venue: string;
    startTime: string | null;
    endTime: string | null;
  };
  latestEmail: {
    id: string;
    status: string;
    subject: string;
    recipientEmail: string;
    retryCount: number;
    providerMessageId: string | null;
    errorMessage: string | null;
    createdAt: string;
    lastAttemptAt: string | null;
    sentAt: string | null;
    deliveredAt: string | null;
    failedAt: string | null;
  } | null;
  latestWorkflow: {
    id: string;
    workflowName: string;
    workflowExecutionId: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  } | null;
  versions: Array<{
    id: string;
    versionNumber: number;
    templateVersion: number;
    changeSummary: string | null;
    createdBy: string | null;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    action: string;
    description: string;
    source: string;
    performedBy: string | null;
    metadata: unknown;
    createdAt: string;
  }>;
  sendAttempts: Array<{
    id: string;
    recipientEmail: string;
    status: string;
    attemptNumber: number;
    errorMessage: string | null;
    sentAt: string | null;
    createdAt: string;
  }>;
};

export type ContractTemplateDto = {
  id: string;
  templateName: string;
  templateType: string;
  templateVersion: number;
  eventType: string | null;
  htmlTemplate: string;
  staticTermsContent: string | null;
  isActive: boolean;
  lockedSections: unknown;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContractPageData = {
  generatedAt: string;
  summary: ContractSummaryDto;
  bookingEvents: ContractBookingEventDto[];
  contracts: ContractDto[];
  failedDelivery: ContractDto[];
  signedContracts: ContractDto[];
  templates: ContractTemplateDto[];
  filters: {
    statuses: string[];
    emailStatuses: string[];
    workflowStatuses: string[];
    signatureStatuses: string[];
    bookingStatuses: string[];
    paymentStatuses: string[];
    eventTypes: string[];
    packages: string[];
    coordinators: string[];
    generators: Array<{ value: string; label: string }>;
    sentStatuses: string[];
  };
};

export type ContractUpdateInput = {
  clientName?: unknown;
  clientEmail?: unknown;
  eventDate?: unknown;
  eventType?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  totalPax?: unknown;
  colors?: unknown;
  theme?: unknown;
  packageName?: unknown;
  packageInclusions?: unknown;
  itemDescription?: unknown;
  contractAmount?: unknown;
  totalPaid?: unknown;
  remainingBalance?: unknown;
  paymentSchedule?: unknown;
  paymentRemarks?: unknown;
  internalNotes?: unknown;
};

export class ContractServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ContractServiceError';
    this.status = status;
  }
}

function actorBookingWhere(actor: CurrentAdmin): Prisma.BookingWhereInput {
  if (actor.role === Role.SUPERADMIN) {
    return {};
  }

  return {
    OR: [
      { assignedCoordinator: actor.id },
      { assignedCoordinator: actor.username },
      { assignedCoordinator: null },
    ],
  };
}

function actorContractWhere(actor: CurrentAdmin): Prisma.ContractWhereInput {
  if (actor.role === Role.SUPERADMIN) {
    return {};
  }

  return {
    booking: actorBookingWhere(actor),
  };
}

function trimText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseOptionalNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));

  if (!Number.isFinite(parsed)) {
    throw new ContractServiceError(`${label} must be a valid number.`);
  }

  return parsed;
}

function parseOptionalDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new ContractServiceError(`${label} must be a valid date.`);
  }

  return parsed;
}

function parseOptionalInteger(value: unknown, label: string) {
  const parsed = parseOptionalNumber(value, label);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ContractServiceError(`${label} must be a non-negative whole number.`);
  }
  return parsed;
}

function snapshotRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function snapshotText(snapshot: Record<string, unknown>, key: string) {
  return typeof snapshot[key] === 'string' ? snapshot[key] as string : null;
}

function snapshotNumber(snapshot: Record<string, unknown>, key: string) {
  return typeof snapshot[key] === 'number' && Number.isFinite(snapshot[key])
    ? snapshot[key] as number
    : null;
}

function snapshotLines(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function formatEnum(value: string | null | undefined) {
  return value ? value.toLowerCase().replaceAll('_', ' ') : 'not sent';
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'PHP 0.00';
  }

  return `PHP ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function publicEmailStatus(status: EmailStatus | null | undefined) {
  if (!status) {
    return 'not_sent';
  }

  if (status === EmailStatus.PENDING_DEMO) {
    return EmailStatus.PENDING.toLowerCase();
  }

  if (status === EmailStatus.SENT_DEMO) {
    return EmailStatus.SENT.toLowerCase();
  }

  return status.toLowerCase();
}

function publicContractWorkflowStatus(status: ContractWorkflowStatus) {
  return status === ContractWorkflowStatus.DEMO_MODE
    ? ContractWorkflowStatus.MANUAL_FALLBACK.toLowerCase()
    : status.toLowerCase();
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeForPdf(value: string) {
  return value
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeContractNumber(sequence: number, year = new Date().getFullYear()) {
  return `ZION-CON-${year}-${String(sequence).padStart(4, '0')}`;
}

function buildPackageInclusions(booking: Booking) {
  const inclusions = [
    booking.packageSelected ? `${booking.packageSelected} package` : `${booking.eventType} event package`,
    `${booking.guestCount || 0} guest allocation`,
    booking.venue ? `${booking.venue} venue use` : 'Venue use',
    booking.startTime && booking.endTime ? `Event time from ${booking.startTime} to ${booking.endTime}` : 'Event schedule coordination',
    'Approved static terms, house rules, cancellation policy, and owner acknowledgment',
  ];

  if (booking.specialRequests) {
    inclusions.push(`Special requests noted: ${booking.specialRequests}`);
  }

  return inclusions;
}

function bookingEligibility(booking: Booking) {
  const issues: string[] = [];

  if (BLOCKED_BOOKING_STATUSES.includes(booking.status as (typeof BLOCKED_BOOKING_STATUSES)[number])) {
    issues.push('Booking status is cancelled, declined, or expired.');
  }

  if (!booking.clientName?.trim()) issues.push('Client name is missing.');
  if (!booking.clientEmail?.trim()) issues.push('Client email is missing.');
  if (!booking.eventDate) issues.push('Event date is missing.');
  if (!booking.packageSelected?.trim()) issues.push('Package selection is missing.');
  if (!booking.bookingReference?.trim()) issues.push('Booking reference is missing.');
  if (booking.paymentTotalAmount === null || booking.paymentTotalAmount === undefined) {
    issues.push('Total contract amount is missing.');
  }

  const canGenerate = issues.length === 0;
  const canSend = canGenerate && SEND_PAYMENT_STATUSES.includes(
    booking.paymentSummaryStatus as (typeof SEND_PAYMENT_STATUSES)[number],
  );

  return { canGenerate, canSend, issues };
}

function defaultContractTemplate() {
  return `
    <article class="zion-contract">
      <section class="contract-page">
        <div class="contract-header">
          <div>
            <h1>Zion Events Place</h1>
            <p>Official Event Contract</p>
          </div>
          <div class="contract-meta">
            <strong>{{event_confirmation_no}}</strong>
            <span>{{payment_status}}</span>
          </div>
        </div>
        <div class="grid two">
          <div><label>Date of Event</label><strong>{{event_date}}</strong></div>
          <div><label>Client / Celebrant</label><strong>{{client_names}}</strong></div>
          <div><label>Total Pax</label><strong>{{total_pax}}</strong></div>
          <div><label>Event Time</label><strong>{{check_in}} - {{check_out}}</strong></div>
          <div><label>Colors</label><strong>{{colors}}</strong></div>
          <div><label>Theme</label><strong>{{theme}}</strong></div>
        </div>
        <h2>Package Details</h2>
        <p class="package-name">{{package_name}}</p>
        <ul>{{package_inclusions}}</ul>
      </section>

      <section class="contract-page">
        <h2>Acknowledgment Receipt</h2>
        <div class="grid two">
          <div><label>Name of Client</label><strong>{{client_name}}</strong></div>
          <div><label>Event Date</label><strong>{{event_date}}</strong></div>
          <div><label>Item Description</label><strong>{{item_description}}</strong></div>
          <div><label>Total Contract Amount</label><strong>{{total_contract_amount}}</strong></div>
        </div>
        <table>
          <thead><tr><th>Payment</th><th>Date</th><th>Method / Reference</th><th>Amount</th></tr></thead>
          <tbody>{{payment_history_rows}}</tbody>
        </table>
        <div class="totals">
          <span>Total Paid: {{total_paid}}</span>
          <span>Remaining Balance: {{remaining_balance}}</span>
        </div>
        <div class="grid two">
          <div><label>Payment Schedule</label><strong>{{payment_schedule}}</strong></div>
          <div><label>Payment Remarks</label><strong>{{payment_remarks}}</strong></div>
        </div>
        <p>Zion Events Place acknowledges receipt of {{payment_acknowledgment_amount}} on {{payment_acknowledgment_date}} through {{payment_method}}.</p>
        <div class="signature-block">
          <span>Owner Acknowledgment</span>
          <strong>Timothy Paul C. Soriano</strong>
          <small>Timothy Soriano</small>
        </div>
      </section>

      <section class="contract-page locked">
        <h2>Terms and Conditions</h2>
        <p>The approved event package, rooms, preparation areas, ingress, egress, and venue rules remain governed by Zion Events Place policies. These terms are locked template content and are not editable from the contract workflow.</p>
        <p>All inclusions, supplier rules, corkage rules, equipment limitations, and venue-use responsibilities remain subject to the approved contract template version.</p>
        <p>Any update to this section requires a Super Admin template-version update.</p>
      </section>

      <section class="contract-page locked">
        <h2>Cancellation, Advertisement, and Client Responsibility</h2>
        <p>Cancellation, postponement, and force majeure handling remain subject to the approved Zion Events Place cancellation policy.</p>
        <p>Advertising, media usage, and on-the-day coordinator responsibilities remain as stated in the approved template.</p>
        <p>The client remains responsible for guest conduct, supplier coordination, final payment settlement, and compliance with venue rules.</p>
        <div class="signature-grid">
          <div><span>Client Signature</span><strong>{{client_name}}</strong></div>
          <div><span>Owner Signature</span><strong>Timothy Soriano</strong></div>
        </div>
      </section>
    </article>
  `;
}

function contractStyles() {
  return `
    <style>
      .zion-contract { color: #1a1f18; font-family: "Segoe UI", Arial, sans-serif; }
      .contract-page { background: #fff; border: 1px solid #e6dec0; border-radius: 18px; box-shadow: 0 12px 40px rgba(26,31,24,0.08); margin: 0 auto 24px; max-width: 820px; min-height: 920px; padding: 48px; }
      .contract-header { align-items: flex-start; border-bottom: 2px solid #d6b53b; display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 22px; }
      .contract-header h1 { color: #1a1f18; font-family: Georgia, serif; font-size: 34px; letter-spacing: 0.08em; margin: 0; text-transform: uppercase; }
      .contract-header p, label, small, .signature-block span, .signature-grid span { color: #7b735f; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
      .contract-meta { background: #fdf5cc; border: 1px solid #d6b53b55; border-radius: 14px; padding: 14px 18px; text-align: right; }
      .contract-meta strong, .contract-meta span { display: block; }
      h2 { color: #1a1f18; font-family: Georgia, serif; font-size: 22px; letter-spacing: 0.05em; margin: 26px 0 14px; text-transform: uppercase; }
      .grid { display: grid; gap: 16px; margin-bottom: 24px; }
      .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid div { background: #faf8ee; border: 1px solid #eee4bd; border-radius: 12px; padding: 14px 16px; }
      .grid strong { display: block; font-size: 15px; margin-top: 7px; }
      .package-name { background: #1a1f18; border-radius: 999px; color: #fdf5cc; display: inline-flex; font-weight: 700; padding: 8px 16px; }
      ul { line-height: 1.7; padding-left: 22px; }
      table { border-collapse: collapse; font-size: 13px; margin: 20px 0; width: 100%; }
      th { background: #f1e6b8; color: #1a1f18; text-align: left; }
      th, td { border: 1px solid #e4d8ad; padding: 11px; }
      .totals { background: #fdf5cc; border-radius: 14px; display: flex; font-weight: 800; justify-content: space-between; margin: 22px 0; padding: 16px; }
      .signature-block, .signature-grid div { border-top: 1px solid #1a1f18; margin-top: 72px; padding-top: 12px; }
      .signature-block strong, .signature-block small, .signature-grid strong { display: block; }
      .signature-grid { display: grid; gap: 48px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 90px; }
      .locked { background: #fffdf5; }
    </style>
  `;
}

async function ensureDefaultTemplate(actor?: CurrentAdmin) {
  const existing = await prisma.contractTemplate.findFirst({
    where: {
      templateType: ContractTemplateType.EVENT_CONTRACT,
      isActive: true,
    },
    orderBy: { templateVersion: 'desc' },
  });

  if (existing) {
    return existing;
  }

  return prisma.contractTemplate.create({
    data: {
      templateName: 'Zion Events Place Approved Contract',
      templateType: ContractTemplateType.EVENT_CONTRACT,
      templateVersion: 1,
      htmlTemplate: defaultContractTemplate(),
      staticTermsContent: 'Locked Zion Events Place terms, venue rules, cancellation policy, advertisement clause, client responsibility, and owner signature block.',
      lockedSections: LOCKED_TEMPLATE_SECTIONS as Prisma.InputJsonValue,
      createdBy: actor?.id ?? 'system',
      updatedBy: actor?.id ?? 'system',
    },
  });
}

type ContractSnapshotOverrides = Partial<Contract> & {
  startTime?: string | null;
  endTime?: string | null;
  totalPax?: number | null;
  colors?: string | null;
  theme?: string | null;
  packageInclusions?: string[];
  itemDescription?: string | null;
  paymentSchedule?: string | null;
  paymentRemarks?: string | null;
};

type BookingWithPackageSnapshot = Booking & {
  packageSnapshot?: {
    snapshotData: Prisma.JsonValue;
  } | null;
};

function packageSnapshotInclusions(snapshot: Record<string, unknown>) {
  const inclusions = snapshot.inclusions;

  if (!Array.isArray(inclusions)) {
    return [];
  }

  return inclusions
    .map((item) => {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return String(record.inclusionName ?? record.name ?? '').trim();
      }

      return String(item).trim();
    })
    .filter(Boolean);
}

function buildSnapshot(
  booking: BookingWithPackageSnapshot,
  template: ContractTemplate,
  overrides?: ContractSnapshotOverrides,
) {
  const previous = snapshotRecord(overrides?.snapshotData);
  const packageSnapshot = snapshotRecord(booking.packageSnapshot?.snapshotData);
  const contractAmount = overrides?.contractAmount
    ?? snapshotNumber(packageSnapshot, 'price')
    ?? booking.paymentTotalAmount
    ?? 0;
  const totalPaid = overrides?.totalPaid ?? booking.paymentAmountPaid ?? 0;
  const remainingBalance = overrides?.remainingBalance ?? booking.paymentRemainingBalance ?? Math.max(contractAmount - totalPaid, 0);
  const packageName = overrides?.packageName
    ?? snapshotText(packageSnapshot, 'packageName')
    ?? booking.packageSelected
    ?? `${booking.eventType} Package`;
  const clientName = overrides?.clientName ?? booking.clientName;
  const clientEmail = overrides?.clientEmail ?? booking.clientEmail;
  const eventType = overrides?.eventType
    ?? snapshotText(packageSnapshot, 'eventCategoryName')
    ?? booking.eventCategoryName
    ?? booking.eventType;
  const eventDate = overrides?.eventDate ?? booking.eventDate;
  const paymentDate = booking.paymentLastDate ?? new Date();
  const packageInclusions = packageSnapshotInclusions(packageSnapshot);
  const inclusions = overrides?.packageInclusions?.length
    ? overrides.packageInclusions
    : packageInclusions.length
      ? packageInclusions
      : snapshotLines(previous.package_inclusions).length
      ? snapshotLines(previous.package_inclusions)
      : buildPackageInclusions(booking);
  const startTime = overrides?.startTime ?? snapshotText(previous, 'check_in') ?? booking.startTime ?? 'TBD';
  const endTime = overrides?.endTime ?? snapshotText(previous, 'check_out') ?? booking.endTime ?? 'TBD';
  const previousTotalPaxText = snapshotText(previous, 'total_pax');
  const previousTotalPax = snapshotNumber(previous, 'total_pax')
    ?? (previousTotalPaxText ? Number(previousTotalPaxText) : Number.NaN);
  const totalPax = overrides?.totalPax
    ?? (Number.isFinite(previousTotalPax) ? previousTotalPax : null)
    ?? booking.guestCount
    ?? 0;
  const colors = overrides?.colors ?? snapshotText(previous, 'colors') ?? booking.colors ?? 'To be confirmed';
  const theme = overrides?.theme ?? snapshotText(previous, 'theme') ?? booking.theme ?? booking.eventTitle;
  const itemDescription = overrides?.itemDescription
    ?? snapshotText(packageSnapshot, 'contractItemDescription')
    ?? snapshotText(previous, 'item_description')
    ?? `${eventType} event package for ${booking.eventTitle}`;
  const paymentSchedule = overrides?.paymentSchedule
    ?? snapshotText(previous, 'payment_schedule')
    ?? (snapshotNumber(packageSnapshot, 'reservationFee') || snapshotNumber(packageSnapshot, 'downPaymentAmount')
      ? `Reservation fee ${formatMoney(snapshotNumber(packageSnapshot, 'reservationFee'))}; down payment ${formatMoney(snapshotNumber(packageSnapshot, 'downPaymentAmount'))}.`
      : null)
    ?? (booking.paymentDueDate ? `Balance due by ${formatDate(booking.paymentDueDate)}` : 'To be confirmed');
  const paymentRemarks = overrides?.paymentRemarks
    ?? snapshotText(previous, 'payment_remarks')
    ?? formatEnum(booking.paymentSummaryStatus);

  return {
    template_id: template.id,
    template_version: template.templateVersion,
    locked_sections: LOCKED_TEMPLATE_SECTIONS,
    event_confirmation_no: booking.bookingReference,
    payment_status: formatEnum(booking.paymentSummaryStatus),
    event_category_id: snapshotText(packageSnapshot, 'eventCategoryId') ?? booking.eventCategoryId,
    event_category_name: eventType,
    package_id: snapshotText(packageSnapshot, 'packageId') ?? booking.packageId,
    package_version: snapshotNumber(packageSnapshot, 'packageVersion') ?? booking.packageVersion,
    event_date: formatDate(eventDate),
    client_names: clientName,
    total_pax: String(totalPax),
    check_in: startTime,
    check_out: endTime,
    colors,
    theme,
    package_name: packageName,
    package_price: snapshotNumber(packageSnapshot, 'price') ?? contractAmount,
    pax_included: snapshotNumber(packageSnapshot, 'paxIncluded') ?? totalPax,
    excess_pax_fee: snapshotNumber(packageSnapshot, 'excessPaxFee') ?? 0,
    reservation_fee: snapshotNumber(packageSnapshot, 'reservationFee') ?? 0,
    down_payment_amount: snapshotNumber(packageSnapshot, 'downPaymentAmount') ?? 0,
    full_payment_amount: snapshotNumber(packageSnapshot, 'fullPaymentAmount') ?? contractAmount,
    package_inclusions: inclusions,
    client_name: clientName,
    client_email: clientEmail,
    item_description: itemDescription,
    total_contract_amount: contractAmount,
    total_paid: totalPaid,
    remaining_balance: remainingBalance,
    payment_history: [
      {
        label: booking.paymentSummaryStatus === PaymentSummaryStatus.UNPAID ? 'No payment recorded' : formatEnum(booking.paymentSummaryStatus),
        date: booking.paymentLastDate ? formatDate(booking.paymentLastDate) : '-',
        method: booking.paymentReference ?? 'Payment record',
        amount: totalPaid,
      },
    ],
    payment_acknowledgment_amount: totalPaid,
    payment_acknowledgment_date: formatDate(paymentDate),
    payment_method: booking.paymentReference ?? 'Recorded payment method',
    payment_schedule: paymentSchedule,
    payment_remarks: paymentRemarks,
    booking_reference: booking.bookingReference,
    assigned_coordinator: booking.assignedCoordinator,
    generated_at: new Date().toISOString(),
  };
}

function renderContractHtml(snapshot: ReturnType<typeof buildSnapshot>, template: string) {
  const paymentRows = snapshot.payment_history.map((payment) => `
    <tr>
      <td>${escapeHtml(payment.label)}</td>
      <td>${escapeHtml(payment.date)}</td>
      <td>${escapeHtml(payment.method)}</td>
      <td>${escapeHtml(formatMoney(payment.amount))}</td>
    </tr>
  `).join('');

  const inclusions = snapshot.package_inclusions
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  const replacements: Record<string, string> = {
    event_confirmation_no: escapeHtml(snapshot.event_confirmation_no),
    payment_status: escapeHtml(snapshot.payment_status),
    event_date: escapeHtml(snapshot.event_date),
    client_names: escapeHtml(snapshot.client_names),
    total_pax: escapeHtml(snapshot.total_pax),
    check_in: escapeHtml(snapshot.check_in),
    check_out: escapeHtml(snapshot.check_out),
    colors: escapeHtml(snapshot.colors),
    theme: escapeHtml(snapshot.theme),
    package_name: escapeHtml(snapshot.package_name),
    package_inclusions: inclusions,
    client_name: escapeHtml(snapshot.client_name),
    item_description: escapeHtml(snapshot.item_description),
    total_contract_amount: escapeHtml(formatMoney(snapshot.total_contract_amount)),
    payment_history_rows: paymentRows,
    remaining_balance: escapeHtml(formatMoney(snapshot.remaining_balance)),
    total_paid: escapeHtml(formatMoney(snapshot.total_paid)),
    payment_acknowledgment_amount: escapeHtml(formatMoney(snapshot.payment_acknowledgment_amount)),
    payment_acknowledgment_date: escapeHtml(snapshot.payment_acknowledgment_date),
    payment_method: escapeHtml(snapshot.payment_method),
    payment_schedule: escapeHtml(snapshot.payment_schedule),
    payment_remarks: escapeHtml(snapshot.payment_remarks),
  };

  return `${contractStyles()}${Object.entries(replacements).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  )}`;
}

function latestVersionNumber(contract: { versions: Array<{ versionNumber: number }> }) {
  return contract.versions.reduce((highest, version) => Math.max(highest, version.versionNumber), 0);
}

function serializeTemplate(template: ContractTemplate): ContractTemplateDto {
  return {
    id: template.id,
    templateName: template.templateName,
    templateType: template.templateType.toLowerCase(),
    templateVersion: template.templateVersion,
    eventType: template.eventType,
    htmlTemplate: template.htmlTemplate,
    staticTermsContent: template.staticTermsContent,
    isActive: template.isActive,
    lockedSections: template.lockedSections,
    createdBy: template.createdBy,
    updatedBy: template.updatedBy,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

function serializeBookingEvent(booking: BookingWithLatestContract): ContractBookingEventDto {
  const latest = booking.contracts[0] ?? null;
  const eligibility = bookingEligibility(booking);

  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientPhone: booking.clientPhone,
    eventTitle: booking.eventTitle,
    eventType: booking.eventType,
    eventDate: booking.eventDate.toISOString(),
    startTime: booking.startTime,
    endTime: booking.endTime,
    packageName: booking.packageSelected,
    guestCount: booking.guestCount,
    venue: booking.venue,
    bookingStatus: booking.status.toLowerCase(),
    paymentStatus: booking.paymentSummaryStatus.toLowerCase(),
    contractStatus: latest?.contractStatus.toLowerCase() ?? 'not_generated',
    workflowStatus: latest?.workflowStatus.toLowerCase() ?? 'not_started',
    assignedCoordinator: booking.assignedCoordinator,
    lastUpdated: booking.updatedAt.toISOString(),
    canGenerate: eligibility.canGenerate,
    canSend: Boolean(latest?.pdfUrl && eligibility.canSend),
    eligibilityIssues: eligibility.issues,
    latestContractId: latest?.id ?? null,
  };
}

async function getLatestLogs(contract: Contract) {
  const [latestEmail, latestWorkflow] = await Promise.all([
    prisma.emailLog.findFirst({
      where: {
        relatedModule: RelatedModule.CONTRACT,
        OR: [
          { relatedRecordId: contract.id },
          { relatedRecordId: contract.contractNumber },
          { relatedRecordId: contract.bookingReference },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        subject: true,
        recipientEmail: true,
        retryCount: true,
        providerMessageId: true,
        errorMessage: true,
        createdAt: true,
        lastAttemptAt: true,
        sentAt: true,
        deliveredAt: true,
        failedAt: true,
      },
    }),
    prisma.n8nWorkflowLog.findFirst({
      where: {
        relatedModule: 'contract',
        OR: [
          { relatedRecordId: contract.id },
          { relatedRecordId: contract.contractNumber },
          { relatedRecordId: contract.bookingReference },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workflowName: true,
        workflowExecutionId: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    }),
  ]);

  return { latestEmail, latestWorkflow };
}

function serializeContract(
  contract: ContractWithRelations,
  latestEmail: LatestEmailLog,
  latestWorkflow: LatestWorkflowLog,
): ContractDto {
  const snapshot = snapshotRecord(contract.snapshotData);

  return {
    id: contract.id,
    contractNumber: contract.contractNumber,
    bookingId: contract.bookingId,
    bookingReference: contract.bookingReference,
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    eventType: contract.eventType,
    eventDate: contract.eventDate.toISOString(),
    packageName: contract.packageName,
    templateVersion: contract.templateVersion,
    contractStatus: contract.contractStatus.toLowerCase(),
    emailStatus: publicEmailStatus(contract.emailStatus),
    workflowStatus: publicContractWorkflowStatus(contract.workflowStatus),
    signatureStatus: contract.signatureStatus.toLowerCase(),
    contractAmount: contract.contractAmount,
    totalPaid: contract.totalPaid,
    remainingBalance: contract.remainingBalance,
    pdfUrl: contract.pdfUrl,
    htmlPreview: contract.htmlPreview,
    resendAttemptCount: contract.resendAttemptCount,
    lastSentAt: contract.lastSentAt?.toISOString() ?? null,
    lastResendAt: contract.lastResendAt?.toISOString() ?? null,
    signedAt: contract.signedAt?.toISOString() ?? null,
    viewedAt: contract.viewedAt?.toISOString() ?? null,
    generatedBy: contract.generatedBy,
    sentBy: contract.sentBy,
    internalNotes: contract.internalNotes,
    dynamicFields: {
      startTime: snapshotText(snapshot, 'check_in') ?? contract.booking.startTime ?? '',
      endTime: snapshotText(snapshot, 'check_out') ?? contract.booking.endTime ?? '',
      totalPax: Number(snapshotText(snapshot, 'total_pax')) || contract.booking.guestCount || 0,
      colors: snapshotText(snapshot, 'colors') ?? 'To be confirmed',
      theme: snapshotText(snapshot, 'theme') ?? contract.booking.eventTitle,
      packageInclusions: snapshotLines(snapshot.package_inclusions),
      itemDescription: snapshotText(snapshot, 'item_description') ?? `${contract.eventType} event package`,
      paymentSchedule: snapshotText(snapshot, 'payment_schedule') ?? '',
      paymentRemarks: snapshotText(snapshot, 'payment_remarks') ?? '',
    },
    createdAt: contract.createdAt.toISOString(),
    updatedAt: contract.updatedAt.toISOString(),
    latestVersion: latestVersionNumber(contract),
    booking: {
      status: contract.booking.status.toLowerCase(),
      paymentStatus: contract.booking.paymentSummaryStatus.toLowerCase(),
      assignedCoordinator: contract.booking.assignedCoordinator,
      eventTitle: contract.booking.eventTitle,
      guestCount: contract.booking.guestCount,
      venue: contract.booking.venue,
      startTime: contract.booking.startTime,
      endTime: contract.booking.endTime,
    },
    latestEmail: latestEmail ? {
      id: latestEmail.id,
      status: publicEmailStatus(latestEmail.status),
      subject: latestEmail.subject,
      recipientEmail: latestEmail.recipientEmail,
      retryCount: latestEmail.retryCount,
      providerMessageId: latestEmail.providerMessageId,
      errorMessage: latestEmail.errorMessage,
      createdAt: latestEmail.createdAt.toISOString(),
      lastAttemptAt: latestEmail.lastAttemptAt?.toISOString() ?? null,
      sentAt: latestEmail.sentAt?.toISOString() ?? null,
      deliveredAt: latestEmail.deliveredAt?.toISOString() ?? null,
      failedAt: latestEmail.failedAt?.toISOString() ?? null,
    } : null,
    latestWorkflow: latestWorkflow ? {
      id: latestWorkflow.id,
      workflowName: latestWorkflow.workflowName,
      workflowExecutionId: latestWorkflow.workflowExecutionId,
      status: latestWorkflow.status.toLowerCase(),
      errorMessage: latestWorkflow.errorMessage,
      createdAt: latestWorkflow.createdAt.toISOString(),
      completedAt: latestWorkflow.completedAt?.toISOString() ?? null,
    } : null,
    versions: contract.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      templateVersion: version.templateVersion,
      changeSummary: version.changeSummary,
      createdBy: version.createdBy,
      createdAt: version.createdAt.toISOString(),
    })),
    timeline: contract.timeline.map((entry) => ({
      id: entry.id,
      action: entry.action,
      description: entry.description,
      source: entry.source,
      performedBy: entry.performedBy,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString(),
    })),
    sendAttempts: contract.sendAttempts.map((attempt) => ({
      id: attempt.id,
      recipientEmail: attempt.recipientEmail,
      status: publicEmailStatus(attempt.status),
      attemptNumber: attempt.attemptNumber,
      errorMessage: attempt.errorMessage,
      sentAt: attempt.sentAt?.toISOString() ?? null,
      createdAt: attempt.createdAt.toISOString(),
    })),
  };
}

async function serializeContracts(contracts: ContractWithRelations[]) {
  return Promise.all(contracts.map(async (contract) => {
    const { latestEmail, latestWorkflow } = await getLatestLogs(contract);
    return serializeContract(contract, latestEmail, latestWorkflow);
  }));
}

function validDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildBookingWhere(
  actor: CurrentAdmin,
  searchParams: URLSearchParams,
  includeSearch = true,
): Prisma.BookingWhereInput {
  const search = includeSearch ? searchParams.get('search')?.trim() : null;
  const bookingStatus = searchParams.get('bookingStatus')?.trim().toUpperCase();
  const paymentStatus = searchParams.get('paymentStatus')?.trim().toUpperCase();
  const eventType = searchParams.get('eventType')?.trim();
  const packageName = searchParams.get('package')?.trim();
  const coordinator = searchParams.get('coordinator')?.trim();
  const dateFrom = validDateParam(searchParams.get('dateFrom'));
  const dateTo = validDateParam(searchParams.get('dateTo'), true);
  const conditions: Prisma.BookingWhereInput[] = [actorBookingWhere(actor)];

  if (search) {
    conditions.push({
      OR: [
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { eventType: { contains: search, mode: 'insensitive' } },
        { packageSelected: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (bookingStatus && Object.values(BookingStatus).includes(bookingStatus as BookingStatus)) {
    conditions.push({ status: bookingStatus as BookingStatus });
  }
  if (paymentStatus && Object.values(PaymentSummaryStatus).includes(paymentStatus as PaymentSummaryStatus)) {
    conditions.push({ paymentSummaryStatus: paymentStatus as PaymentSummaryStatus });
  }
  if (eventType) conditions.push({ eventType: { equals: eventType, mode: 'insensitive' } });
  if (packageName) conditions.push({ packageSelected: { equals: packageName, mode: 'insensitive' } });
  if (coordinator === 'unassigned') {
    conditions.push({ assignedCoordinator: null });
  } else if (coordinator) {
    conditions.push({ assignedCoordinator: coordinator });
  }
  if (dateFrom || dateTo) {
    conditions.push({
      eventDate: {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      },
    });
  }

  return { AND: conditions };
}

function buildContractWhere(actor: CurrentAdmin, searchParams: URLSearchParams): Prisma.ContractWhereInput {
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim().toUpperCase();
  const emailStatus = searchParams.get('emailStatus')?.trim().toUpperCase();
  const workflowStatus = searchParams.get('workflowStatus')?.trim().toUpperCase();
  const signatureStatus = searchParams.get('signatureStatus')?.trim().toUpperCase();
  const generatedBy = searchParams.get('generatedBy')?.trim();
  const sentStatus = searchParams.get('sentStatus')?.trim();
  const conditions: Prisma.ContractWhereInput[] = [
    actorContractWhere(actor),
    { booking: buildBookingWhere(actor, searchParams, false) },
  ];

  if (search) {
    conditions.push({
      OR: [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { eventType: { contains: search, mode: 'insensitive' } },
        { packageName: { contains: search, mode: 'insensitive' } },
      ],
    });
  }
  if (status && Object.values(ContractStatus).includes(status as ContractStatus)) {
    conditions.push({ contractStatus: status as ContractStatus });
  }
  if (emailStatus === 'NOT_SENT') {
    conditions.push({ emailStatus: null });
  } else if (emailStatus && PRODUCTION_EMAIL_STATUSES.includes(emailStatus as EmailStatus)) {
    conditions.push({ emailStatus: emailStatus as EmailStatus });
  }
  if (workflowStatus && PRODUCTION_CONTRACT_WORKFLOW_STATUSES.includes(workflowStatus as ContractWorkflowStatus)) {
    conditions.push({ workflowStatus: workflowStatus as ContractWorkflowStatus });
  }
  if (signatureStatus && Object.values(ContractSignatureStatus).includes(signatureStatus as ContractSignatureStatus)) {
    conditions.push({ signatureStatus: signatureStatus as ContractSignatureStatus });
  }
  if (generatedBy) conditions.push({ generatedBy });
  if (sentStatus === 'sent') conditions.push({ lastSentAt: { not: null } });
  if (sentStatus === 'not_sent') conditions.push({ lastSentAt: null });

  return { AND: conditions };
}

async function getContractRows(where: Prisma.ContractWhereInput, take = 40) {
  return prisma.contract.findMany({
    where,
    include: {
      booking: true,
      template: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 5,
        select: {
          id: true,
          versionNumber: true,
          templateVersion: true,
          changeSummary: true,
          createdBy: true,
          createdAt: true,
        },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
        take: 8,
      },
      sendAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take,
  });
}

export class ContractService {
  static async getSummary(actor: CurrentAdmin): Promise<ContractSummaryDto> {
    const baseWhere = actorContractWhere(actor);
    const bookingBase = {
      ...actorBookingWhere(actor),
      status: { notIn: [...BLOCKED_BOOKING_STATUSES] },
    } satisfies Prisma.BookingWhereInput;

    const [
      totalContracts,
      draftContracts,
      readyToSend,
      sentContracts,
      signedContracts,
      failedDelivery,
      bookingsWithoutContract,
      pendingClientSignature,
    ] = await Promise.all([
      prisma.contract.count({ where: baseWhere }),
      prisma.contract.count({ where: { ...baseWhere, contractStatus: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { ...baseWhere, contractStatus: ContractStatus.READY_TO_SEND } }),
      prisma.contract.count({ where: { ...baseWhere, contractStatus: { in: [ContractStatus.SENT, ContractStatus.VIEWED] } } }),
      prisma.contract.count({ where: { ...baseWhere, contractStatus: ContractStatus.SIGNED } }),
      prisma.contract.count({
        where: {
          ...baseWhere,
          OR: [
            { contractStatus: ContractStatus.DELIVERY_FAILED },
            { emailStatus: { in: [EmailStatus.FAILED, EmailStatus.BOUNCED] } },
            { workflowStatus: ContractWorkflowStatus.FAILED },
          ],
        },
      }),
      prisma.booking.count({ where: { ...bookingBase, contracts: { none: {} } } }),
      prisma.contract.count({
        where: {
          ...baseWhere,
          contractStatus: { in: [ContractStatus.SENT, ContractStatus.VIEWED] },
          signatureStatus: { in: [ContractSignatureStatus.PENDING, ContractSignatureStatus.VIEWED] },
        },
      }),
    ]);

    return {
      totalContracts,
      draftContracts,
      readyToSend,
      sentContracts,
      signedContracts,
      failedDelivery,
      bookingsWithoutContract,
      pendingClientSignature,
    };
  }

  static async getPageData(actor: CurrentAdmin, searchParams = new URLSearchParams()): Promise<ContractPageData> {
    await ensureDefaultTemplate(actor);
    const contractWhere = buildContractWhere(actor, searchParams);
    const bookingWhere: Prisma.BookingWhereInput = {
      AND: [
        buildBookingWhere(actor, searchParams),
        { status: { notIn: [...BLOCKED_BOOKING_STATUSES] } },
      ],
    };

    const [summary, bookings, contracts, failed, signed, templates, filterBookings, generators] = await Promise.all([
      this.getSummary(actor),
      prisma.booking.findMany({
        where: bookingWhere,
        include: {
          contracts: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            include: {
              versions: {
                select: { versionNumber: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 40,
      }),
      getContractRows(contractWhere),
      getContractRows({
        AND: [
          contractWhere,
          {
            OR: [
              { contractStatus: ContractStatus.DELIVERY_FAILED },
              { emailStatus: { in: [EmailStatus.FAILED, EmailStatus.BOUNCED, EmailStatus.PENDING] } },
              { workflowStatus: { in: [ContractWorkflowStatus.FAILED, ContractWorkflowStatus.RETRYING, ContractWorkflowStatus.MANUAL_FALLBACK] } },
            ],
          },
        ],
      }, 25),
      getContractRows({
        AND: [
          contractWhere,
          {
            OR: [
              { contractStatus: ContractStatus.SIGNED },
              { signatureStatus: ContractSignatureStatus.SIGNED },
            ],
          },
        ],
      }, 25),
      prisma.contractTemplate.findMany({
        orderBy: [{ isActive: 'desc' }, { templateVersion: 'desc' }],
      }),
      prisma.booking.findMany({
        where: actorBookingWhere(actor),
        select: {
          eventType: true,
          packageSelected: true,
          assignedCoordinator: true,
        },
      }),
      prisma.user.findMany({
        where: { role: { in: [Role.SUPERADMIN, Role.ADMIN] } },
        select: { id: true, username: true, fullName: true },
        orderBy: { username: 'asc' },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary,
      bookingEvents: bookings.map((booking) => serializeBookingEvent(booking as BookingWithLatestContract)),
      contracts: await serializeContracts(contracts as ContractWithRelations[]),
      failedDelivery: await serializeContracts(failed as ContractWithRelations[]),
      signedContracts: await serializeContracts(signed as ContractWithRelations[]),
      templates: templates.map(serializeTemplate),
      filters: {
        statuses: ['not_generated', ...Object.values(ContractStatus).map((status) => status.toLowerCase())],
        emailStatuses: ['not_sent', ...PRODUCTION_EMAIL_STATUSES.map((status) => status.toLowerCase())],
        workflowStatuses: PRODUCTION_CONTRACT_WORKFLOW_STATUSES.map((status) => status.toLowerCase()),
        signatureStatuses: Object.values(ContractSignatureStatus).map((status) => status.toLowerCase()),
        bookingStatuses: Object.values(BookingStatus).map((status) => status.toLowerCase()),
        paymentStatuses: Object.values(PaymentSummaryStatus).map((status) => status.toLowerCase()),
        eventTypes: [...new Set(filterBookings.map((booking) => booking.eventType).filter(Boolean))].sort(),
        packages: [...new Set(filterBookings.map((booking) => booking.packageSelected).filter((value): value is string => Boolean(value)))].sort(),
        coordinators: [...new Set(filterBookings.map((booking) => booking.assignedCoordinator).filter((value): value is string => Boolean(value)))].sort(),
        generators: generators.map((user) => ({
          value: user.id,
          label: user.fullName || `@${user.username}`,
        })),
        sentStatuses: ['not_sent', 'sent'],
      },
    };
  }

  static async getBookingEvents(actor: CurrentAdmin, searchParams = new URLSearchParams()) {
    const data = await this.getPageData(actor, searchParams);
    return data.bookingEvents;
  }

  static async getTemplates(actor: CurrentAdmin) {
    await ensureDefaultTemplate(actor);
    const templates = await prisma.contractTemplate.findMany({
      orderBy: [{ isActive: 'desc' }, { templateVersion: 'desc' }],
    });
    return templates.map(serializeTemplate);
  }

  static async getContract(id: string, actor: CurrentAdmin) {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...actorContractWhere(actor),
      },
      include: {
        booking: true,
        template: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          select: {
            id: true,
            versionNumber: true,
            templateVersion: true,
            changeSummary: true,
            createdBy: true,
            createdAt: true,
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        sendAttempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    const { latestEmail, latestWorkflow } = await getLatestLogs(contract);
    return serializeContract(contract as ContractWithRelations, latestEmail, latestWorkflow);
  }

  static async generateContract(bookingId: string, actor: CurrentAdmin) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        ...actorBookingWhere(actor),
      },
      include: {
        packageSnapshot: true,
        contracts: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            versions: {
              select: { versionNumber: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new ContractServiceError('Booking not found.', 404);
    }

    const eligibility = bookingEligibility(booking);
    if (!eligibility.canGenerate) {
      throw new ContractServiceError(`Booking cannot generate a contract: ${eligibility.issues.join(' ')}`);
    }

    const template = await ensureDefaultTemplate(actor);
    const existing = booking.contracts[0] ?? null;
    const snapshot = buildSnapshot(booking, template, existing ?? undefined);
    const htmlPreview = renderContractHtml(snapshot, template.htmlTemplate);
    const status = eligibility.canSend ? ContractStatus.READY_TO_SEND : ContractStatus.GENERATED;
    const id = existing?.id ?? randomUUID();
    const currentYear = new Date().getFullYear();
    const contractNumber = existing?.contractNumber ?? makeContractNumber(
      await prisma.contract.count({
        where: {
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
      }) + 1,
      currentYear,
    );
    const nextVersion = existing ? latestVersionNumber(existing) + 1 : 1;

    const contract = existing
      ? await prisma.contract.update({
          where: { id: existing.id },
          data: {
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            eventType: booking.eventType,
            eventDate: booking.eventDate,
            packageName: booking.packageSelected,
            templateId: template.id,
            templateVersion: template.templateVersion,
            contractStatus: status,
            workflowStatus: ContractWorkflowStatus.COMPLETED,
            signatureStatus: ContractSignatureStatus.NOT_SENT,
            contractAmount: booking.paymentTotalAmount,
            totalPaid: booking.paymentAmountPaid,
            remainingBalance: booking.paymentRemainingBalance,
            pdfUrl: `/api/contracts/${existing.id}/download`,
            htmlPreview,
            snapshotData: snapshot as Prisma.InputJsonValue,
            generatedBy: actor.id,
          },
        })
      : await prisma.contract.create({
          data: {
            id,
            contractNumber,
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            eventType: booking.eventType,
            eventDate: booking.eventDate,
            packageName: booking.packageSelected,
            templateId: template.id,
            templateVersion: template.templateVersion,
            contractStatus: status,
            workflowStatus: ContractWorkflowStatus.COMPLETED,
            signatureStatus: ContractSignatureStatus.NOT_SENT,
            contractAmount: booking.paymentTotalAmount,
            totalPaid: booking.paymentAmountPaid,
            remainingBalance: booking.paymentRemainingBalance,
            pdfUrl: `/api/contracts/${id}/download`,
            htmlPreview,
            snapshotData: snapshot as Prisma.InputJsonValue,
            generatedBy: actor.id,
          },
        });

    await prisma.$transaction([
      prisma.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNumber: nextVersion,
          templateVersion: template.templateVersion,
          snapshotData: snapshot as Prisma.InputJsonValue,
          pdfUrl: contract.pdfUrl,
          htmlPreview,
          changeSummary: existing ? 'Regenerated contract from current booking data.' : 'Initial contract generation.',
          createdBy: actor.id,
        },
      }),
      prisma.contractTimeline.create({
        data: {
          contractId: contract.id,
          action: existing ? 'contract_regenerated' : 'contract_generated',
          description: `Generated ${contract.contractNumber} from booking ${booking.bookingReference}.`,
          source: actor.role === Role.SUPERADMIN ? 'super_admin' : 'admin',
          performedBy: actor.username,
          metadata: {
            bookingId: booking.id,
            status,
            version: nextVersion,
          } as Prisma.InputJsonValue,
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          contractRecordId: contract.id,
          contractStatus: status.toLowerCase(),
        },
      }),
    ]);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.CREATE,
      module: 'Contracts',
      description: `Generated contract ${contract.contractNumber} for ${booking.clientName}.`,
      status: AuditStatus.SUCCESS,
      newValues: {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        bookingReference: booking.bookingReference,
        version: nextVersion,
      },
    });

    if (status === ContractStatus.READY_TO_SEND) {
      await prisma.notification.create({
        data: {
          title: 'Contract ready to send',
          message: `${contract.contractNumber} is ready for ${contract.clientName}.`,
          type: NotificationType.CONTRACT,
          priority: NotificationPriority.MEDIUM,
          relatedModule: 'contracts',
          relatedRecordId: contract.id,
          createdFor: actor.id,
          createdBy: actor.id,
        },
      });
    }

    return this.getContract(contract.id, actor);
  }

  static async updateContract(id: string, input: ContractUpdateInput, actor: CurrentAdmin) {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...actorContractWhere(actor),
      },
      include: {
        booking: true,
        template: true,
        versions: {
          select: { versionNumber: true },
        },
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    const eventDate = parseOptionalDate(input.eventDate, 'eventDate');
    const contractAmount = parseOptionalNumber(input.contractAmount, 'contractAmount');
    const totalPaid = parseOptionalNumber(input.totalPaid, 'totalPaid');
    const remainingBalance = parseOptionalNumber(input.remainingBalance, 'remainingBalance');
    const totalPax = parseOptionalInteger(input.totalPax, 'totalPax');
    const clientName = 'clientName' in input
      ? trimText(input.clientName) ?? contract.clientName
      : contract.clientName;
    const clientEmail = 'clientEmail' in input
      ? trimText(input.clientEmail)
      : contract.clientEmail;
    const packageName = 'packageName' in input
      ? trimText(input.packageName)
      : contract.packageName;
    const data: Prisma.ContractUpdateInput = {};

    if ('clientName' in input) data.clientName = clientName;
    if ('clientEmail' in input) data.clientEmail = clientEmail;
    if (eventDate) data.eventDate = eventDate;
    if ('eventType' in input) data.eventType = trimText(input.eventType) ?? contract.eventType;
    if ('packageName' in input) data.packageName = packageName;
    if (contractAmount !== null) data.contractAmount = contractAmount;
    if (totalPaid !== null) data.totalPaid = totalPaid;
    if (remainingBalance !== null) data.remainingBalance = remainingBalance;
    if ('internalNotes' in input) data.internalNotes = trimText(input.internalNotes);

    const template = contract.template ?? await ensureDefaultTemplate(actor);
    const snapshot = buildSnapshot(contract.booking, template, {
      ...contract,
      snapshotData: contract.snapshotData,
      clientName,
      clientEmail,
      eventDate: eventDate ?? contract.eventDate,
      eventType: 'eventType' in input ? trimText(input.eventType) ?? contract.eventType : contract.eventType,
      packageName,
      contractAmount: contractAmount ?? contract.contractAmount,
      totalPaid: totalPaid ?? contract.totalPaid,
      remainingBalance: remainingBalance ?? contract.remainingBalance,
      startTime: 'startTime' in input ? trimText(input.startTime) : undefined,
      endTime: 'endTime' in input ? trimText(input.endTime) : undefined,
      totalPax,
      colors: 'colors' in input ? trimText(input.colors) : undefined,
      theme: 'theme' in input ? trimText(input.theme) : undefined,
      packageInclusions: 'packageInclusions' in input ? snapshotLines(input.packageInclusions) : undefined,
      itemDescription: 'itemDescription' in input ? trimText(input.itemDescription) : undefined,
      paymentSchedule: 'paymentSchedule' in input ? trimText(input.paymentSchedule) : undefined,
      paymentRemarks: 'paymentRemarks' in input ? trimText(input.paymentRemarks) : undefined,
    });
    const htmlPreview = renderContractHtml(snapshot, template.htmlTemplate);
    data.htmlPreview = htmlPreview;
    data.snapshotData = snapshot as Prisma.InputJsonValue;

    const versionedStatuses: ContractStatus[] = [
      ContractStatus.SENT,
      ContractStatus.VIEWED,
      ContractStatus.SIGNED,
    ];
    const versionRequired = versionedStatuses.includes(contract.contractStatus);

    if (versionRequired) {
      data.contractStatus = ContractStatus.READY_TO_SEND;
      data.emailStatus = null;
      data.signatureStatus = ContractSignatureStatus.NOT_SENT;
    }

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data,
    });

    if (versionRequired) {
      await prisma.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNumber: latestVersionNumber(contract) + 1,
          templateVersion: template.templateVersion,
          snapshotData: snapshot as Prisma.InputJsonValue,
          pdfUrl: updated.pdfUrl,
          htmlPreview,
          changeSummary: 'Edited dynamic contract fields after sending.',
          createdBy: actor.id,
        },
      });
    }

    await prisma.contractTimeline.create({
      data: {
        contractId: contract.id,
        action: versionRequired ? 'contract_version_created' : 'contract_edited',
        description: versionRequired
          ? 'Edited a sent contract and created a new version.'
          : 'Edited allowed dynamic contract fields.',
        source: actor.role === Role.SUPERADMIN ? 'super_admin' : 'admin',
        performedBy: actor.username,
      },
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Contracts',
      description: `Updated contract ${contract.contractNumber}.`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        contractId: contract.id,
        contractStatus: contract.contractStatus,
      },
      newValues: {
        contractId: updated.id,
        contractStatus: updated.contractStatus,
      },
    });

    return this.getContract(contract.id, actor);
  }

  static async createVersion(id: string, actor: CurrentAdmin, changeSummary = 'Manual contract version snapshot.') {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...actorContractWhere(actor),
      },
      include: {
        versions: {
          select: { versionNumber: true },
        },
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    const version = await prisma.contractVersion.create({
      data: {
        contractId: contract.id,
        versionNumber: latestVersionNumber(contract) + 1,
        templateVersion: contract.templateVersion,
        snapshotData: (contract.snapshotData ?? {}) as Prisma.InputJsonValue,
        pdfUrl: contract.pdfUrl,
        htmlPreview: contract.htmlPreview,
        changeSummary,
        createdBy: actor.id,
      },
    });

    await prisma.contractTimeline.create({
      data: {
        contractId: contract.id,
        action: 'contract_version_created',
        description: changeSummary,
        source: actor.role === Role.SUPERADMIN ? 'super_admin' : 'admin',
        performedBy: actor.username,
      },
    });

    return version;
  }

  static async sendContract(id: string, actor: CurrentAdmin, resend = false) {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...actorContractWhere(actor),
      },
      include: {
        booking: true,
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    if (!contract.pdfUrl) {
      throw new ContractServiceError('Generate the contract PDF before sending.');
    }

    if (!contract.clientEmail) {
      throw new ContractServiceError('Client email is required before sending.');
    }

    if (BLOCKED_BOOKING_STATUSES.includes(contract.booking.status as (typeof BLOCKED_BOOKING_STATUSES)[number])) {
      throw new ContractServiceError('Cancelled, declined, or expired bookings cannot receive contracts.');
    }

    if (contract.contractStatus === ContractStatus.SIGNED) {
      throw new ContractServiceError('Signed contracts cannot be sent again.');
    }

    if (!SEND_PAYMENT_STATUSES.includes(contract.booking.paymentSummaryStatus as (typeof SEND_PAYMENT_STATUSES)[number])) {
      throw new ContractServiceError('Contract sending requires reservation, down, partial, or full payment.');
    }

    const webhookUrl = resend
      ? process.env.N8N_CONTRACT_RESEND_WEBHOOK_URL
      : process.env.N8N_CONTRACT_DELIVERY_WEBHOOK_URL;
    const attemptNumber = contract.resendAttemptCount + (resend ? 1 : 0) + 1;
    const workflow = await prisma.n8nWorkflowLog.create({
      data: {
        workflowName: resend ? 'contract-resend-flow' : 'contract-delivery-flow',
        relatedModule: 'contract',
        relatedRecordId: contract.id,
        triggerSource: resend ? 'manual_resend' : 'admin_send',
        requestPayload: {
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          bookingReference: contract.bookingReference,
          recipientEmail: contract.clientEmail,
          pdfUrl: contract.pdfUrl,
        } as Prisma.InputJsonValue,
        status: webhookUrl ? N8nWorkflowStatus.PROCESSING : N8nWorkflowStatus.RETRYING,
        startedAt: new Date(),
      },
    });
    const email = await prisma.emailLog.create({
      data: {
        recipientEmail: contract.clientEmail,
        recipientName: contract.clientName,
        emailType: EmailType.CONTRACT_LINK,
        relatedModule: RelatedModule.CONTRACT,
        relatedRecordId: contract.id,
        subject: `Zion Events Place Contract ${contract.contractNumber}`,
        triggerSource: resend ? TriggerSource.MANUAL_RESEND : TriggerSource.N8N_WORKFLOW,
        workflowName: workflow.workflowName,
        workflowExecutionId: workflow.workflowExecutionId,
        status: webhookUrl ? EmailStatus.QUEUED : EmailStatus.PENDING,
        retryCount: resend ? contract.resendAttemptCount + 1 : contract.resendAttemptCount,
        lastAttemptAt: new Date(),
        emailPreview: `Contract link for ${contract.clientName}: ${contract.pdfUrl}`,
        payloadSummary: {
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          bookingReference: contract.bookingReference,
        } as Prisma.InputJsonValue,
        resentBy: resend ? actor.id : null,
      },
    });

    await prisma.contractSendAttempt.create({
      data: {
        contractId: contract.id,
        emailLogId: email.id,
        workflowLogId: workflow.id,
        recipientEmail: contract.clientEmail,
        status: webhookUrl ? EmailStatus.QUEUED : EmailStatus.PENDING,
        attemptNumber,
      },
    });

    if (!webhookUrl && !resend) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          emailStatus: EmailStatus.PENDING,
          workflowStatus: ContractWorkflowStatus.MANUAL_FALLBACK,
          contractStatus: ContractStatus.READY_TO_SEND,
        },
      });
      throw new ContractServiceError('N8N_CONTRACT_DELIVERY_WEBHOOK_URL is not configured. Contract was not sent.');
    }

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            bookingReference: contract.bookingReference,
            recipientEmail: contract.clientEmail,
            clientName: contract.clientName,
            pdfUrl: contract.pdfUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`n8n webhook returned ${response.status}.`);
        }
      } catch (error) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            contractStatus: ContractStatus.DELIVERY_FAILED,
            emailStatus: EmailStatus.FAILED,
            workflowStatus: ContractWorkflowStatus.FAILED,
            resendAttemptCount: resend ? { increment: 1 } : undefined,
            lastResendAt: resend ? new Date() : undefined,
          },
        });
        await prisma.contractTimeline.create({
          data: {
            contractId: contract.id,
            action: resend ? 'contract_resend_failed' : 'contract_delivery_failed',
            description: error instanceof Error ? error.message : 'Contract delivery webhook failed.',
            source: 'n8n_workflow',
            performedBy: actor.username,
          },
        });
        throw new ContractServiceError(error instanceof Error ? error.message : 'Contract delivery failed.');
      }
    }

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        contractStatus: ContractStatus.SENT,
        emailStatus: webhookUrl ? EmailStatus.QUEUED : EmailStatus.PENDING,
        workflowStatus: webhookUrl ? ContractWorkflowStatus.TRIGGERED : ContractWorkflowStatus.RETRYING,
        signatureStatus: ContractSignatureStatus.PENDING,
        lastSentAt: resend ? contract.lastSentAt : new Date(),
        lastResendAt: resend ? new Date() : contract.lastResendAt,
        resendAttemptCount: resend ? { increment: 1 } : undefined,
        sentBy: actor.id,
      },
    });

    await prisma.contractTimeline.create({
      data: {
        contractId: contract.id,
        action: resend ? 'contract_resent' : 'contract_sent',
        description: webhookUrl
          ? 'Contract delivery workflow triggered.'
          : 'Contract delivery recorded locally while n8n is not configured.',
        source: resend ? 'admin' : 'n8n_workflow',
        performedBy: actor.username,
      },
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.SUBMISSION,
      module: 'Contracts',
      description: `${resend ? 'Resent' : 'Sent'} contract ${contract.contractNumber}.`,
      status: AuditStatus.SUCCESS,
      metadata: {
        contractId: contract.id,
        workflowLogId: workflow.id,
        emailLogId: email.id,
        localFallback: !webhookUrl,
      },
    });

    return this.getContract(updated.id, actor);
  }

  static async resolveDeliveryIssue(id: string, actor: CurrentAdmin) {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...actorContractWhere(actor),
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        contractStatus: ContractStatus.READY_TO_SEND,
        emailStatus: null,
        workflowStatus: ContractWorkflowStatus.NOT_STARTED,
      },
    });

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: contract.bookingId },
        data: { contractStatus: ContractStatus.READY_TO_SEND.toLowerCase() },
      }),
      prisma.contractTimeline.create({
        data: {
          contractId: contract.id,
          action: 'delivery_issue_resolved',
          description: 'An administrator resolved the delivery issue and returned the contract to ready-to-send.',
          source: actor.role === Role.SUPERADMIN ? 'super_admin' : 'admin',
          performedBy: actor.username,
        },
      }),
    ]);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Contracts',
      description: `Resolved the delivery issue for ${contract.contractNumber}.`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        contractStatus: contract.contractStatus,
        emailStatus: contract.emailStatus,
        workflowStatus: contract.workflowStatus,
      },
      newValues: {
        contractStatus: updated.contractStatus,
        emailStatus: updated.emailStatus,
        workflowStatus: updated.workflowStatus,
      },
    });

    return this.getContract(updated.id, actor);
  }

  static async recordDeliveryResult(input: Record<string, unknown>) {
    const relatedRecordId = trimText(input.contractId) ?? trimText(input.relatedRecordId);
    if (!relatedRecordId) {
      throw new ContractServiceError('contractId is required.');
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [
          { id: relatedRecordId },
          { contractNumber: relatedRecordId },
        ],
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    const rawStatus = String(input.status ?? '').toUpperCase();
    const deliveryFailed = rawStatus === 'FAILED' || rawStatus === 'BOUNCED';
    const emailStatus = rawStatus === 'DELIVERED'
      ? EmailStatus.DELIVERED
      : rawStatus === 'SENT'
        ? EmailStatus.SENT
        : rawStatus === 'BOUNCED'
          ? EmailStatus.BOUNCED
          : deliveryFailed
            ? EmailStatus.FAILED
            : EmailStatus.PENDING;

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        contractStatus: deliveryFailed ? ContractStatus.DELIVERY_FAILED : ContractStatus.SENT,
        emailStatus,
        workflowStatus: deliveryFailed ? ContractWorkflowStatus.FAILED : ContractWorkflowStatus.COMPLETED,
        lastSentAt: emailStatus === EmailStatus.SENT || emailStatus === EmailStatus.DELIVERED ? new Date() : contract.lastSentAt,
      },
    });

    await prisma.booking.update({
      where: { id: contract.bookingId },
      data: {
        contractStatus: updated.contractStatus.toLowerCase(),
      },
    });

    await prisma.contractTimeline.create({
      data: {
        contractId: contract.id,
        action: deliveryFailed ? 'contract_delivery_failed' : 'contract_delivery_updated',
        description: deliveryFailed
          ? String(input.errorMessage ?? 'Contract delivery failed.')
          : `Contract delivery marked ${emailStatus.toLowerCase()}.`,
        source: 'n8n_workflow',
        performedBy: 'n8n',
        metadata: input as Prisma.InputJsonValue,
      },
    });

    await createAuditLog({
      ...systemAuditActor(),
      action: deliveryFailed ? AuditAction.ERROR : AuditAction.UPDATE,
      module: 'Contracts',
      description: `Recorded contract delivery result for ${contract.contractNumber}.`,
      status: deliveryFailed ? AuditStatus.FAILED : AuditStatus.SUCCESS,
      metadata: {
        contractId: contract.id,
        emailStatus,
      },
    });

    return updated;
  }

  static async recordSigningStatus(input: Record<string, unknown>) {
    const relatedRecordId = trimText(input.contractId) ?? trimText(input.relatedRecordId);
    if (!relatedRecordId) {
      throw new ContractServiceError('contractId is required.');
    }

    const contract = await prisma.contract.findFirst({
      where: {
        OR: [
          { id: relatedRecordId },
          { contractNumber: relatedRecordId },
        ],
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    const status = String(input.signatureStatus ?? input.status ?? '').toUpperCase();
    const signed = status === 'SIGNED';
    const viewed = status === 'VIEWED';
    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        contractStatus: signed ? ContractStatus.SIGNED : viewed ? ContractStatus.VIEWED : contract.contractStatus,
        signatureStatus: signed ? ContractSignatureStatus.SIGNED : viewed ? ContractSignatureStatus.VIEWED : ContractSignatureStatus.PENDING,
        signedAt: signed ? new Date() : contract.signedAt,
        viewedAt: viewed ? new Date() : contract.viewedAt,
      },
    });

    await prisma.booking.update({
      where: { id: contract.bookingId },
      data: {
        contractStatus: updated.contractStatus.toLowerCase(),
      },
    });

    await prisma.contractTimeline.create({
      data: {
        contractId: contract.id,
        action: signed ? 'contract_signed' : viewed ? 'contract_viewed' : 'signature_status_updated',
        description: signed ? 'Client signed the contract.' : viewed ? 'Client viewed the contract.' : 'Contract signature status changed.',
        source: 'client',
        performedBy: trimText(input.performedBy) ?? 'client',
        metadata: input as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  static async buildDownload(contractId: string, actor: CurrentAdmin, recordDownload = true) {
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        ...actorContractWhere(actor),
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          select: { versionNumber: true },
        },
      },
    });

    if (!contract) {
      throw new ContractServiceError('Contract not found.', 404);
    }

    if (recordDownload) {
      await prisma.contractTimeline.create({
        data: {
          contractId: contract.id,
          action: 'contract_downloaded',
          description: 'Admin downloaded the generated contract PDF.',
          source: actor.role === Role.SUPERADMIN ? 'super_admin' : 'admin',
          performedBy: actor.username,
        },
      });
    }

    const pages = stripHtmlToPages(contract.htmlPreview ?? '');
    const pdf = createPdfBuffer(`${contract.contractNumber} ${contract.clientName}`, pages);
    const version = contract.versions[0]?.versionNumber ?? 1;
    const filename = `ZION-CONTRACT-${contract.bookingReference}-${contract.clientName.replace(/[^a-z0-9]+/gi, '-')}-v${version}.pdf`;

    return { pdf, filename };
  }
}

function stripHtmlToLines(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(h1|h2|h3|p|div|li|tr|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => normalizeForPdf(line))
    .filter(Boolean);
}

function stripHtmlToPages(html: string) {
  const sections = [...html.matchAll(/<section class="contract-page[^"]*">([\s\S]*?)<\/section>/gi)]
    .map((match) => stripHtmlToLines(match[1]));

  return sections.length
    ? sections.slice(0, 4)
    : [stripHtmlToLines(html)];
}

function escapePdfText(value: string) {
  return normalizeForPdf(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function createPdfBuffer(title: string, sourcePages: string[][]) {
  const pageCount = sourcePages.length;
  const pages = sourcePages.map((lines, index) => [
    title,
    `Page ${index + 1} of ${pageCount}`,
    '',
    ...lines,
  ].slice(0, 42));

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  for (const pageLines of pages) {
    const content = [
      'BT',
      '/F1 10 Tf',
      '50 750 Td',
      '14 TL',
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      'ET',
    ].join('\n');
    const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    const contentId = addObject(stream);
    contentIds.push(contentId);
    pageIds.push(0);
  }

  const pagesId = objects.length + pages.length + 1;
  for (let index = 0; index < pages.length; index += 1) {
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`);
    pageIds[index] = pageId;
  }

  addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'ascii');
}

export function contractErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ContractServiceError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json({
    error: fallback,
    details: process.env.NODE_ENV === 'development' ? errorMetadata(error) : undefined,
  }, { status: 500 });
}
