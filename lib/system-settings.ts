import { AuditAction, AuditStatus, NotificationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auditActor, createAuditLog, getRequestContext } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import {
  DATE_FORMAT_OPTIONS,
  DEFAULT_SYSTEM_SETTINGS,
  LANGUAGE_OPTIONS,
  SESSION_TIMEOUT_OPTIONS,
  TIMEZONE_OPTIONS,
  type PublicSystemSettings,
  type SystemSettings,
  type ThemePreference,
} from '@/lib/system-settings-types';

const SETTINGS_ROW_ID = 'singleton';

type SettingsRow = {
  settings: unknown;
  updated_by: string | null;
  updated_at: Date;
};

export class SystemSettingsError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'SystemSettingsError';
    this.status = status;
  }
}

export class ClientFeatureDisabledError extends SystemSettingsError {
  constructor(message: string) {
    super(message, 503);
    this.name = 'ClientFeatureDisabledError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function stringOption(value: unknown, options: readonly string[], fallback: string) {
  return typeof value === 'string' && options.includes(value) ? value : fallback;
}

function timezoneOption(value: unknown, fallback: string) {
  return typeof value === 'string' && TIMEZONE_OPTIONS.some((option) => option.value === value)
    ? value
    : fallback;
}

function sessionTimeout(value: unknown, fallback: number) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return SESSION_TIMEOUT_OPTIONS.includes(numericValue as (typeof SESSION_TIMEOUT_OPTIONS)[number])
    ? numericValue
    : fallback;
}

function textValue(value: unknown, fallback: string, maxLength = 300) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function themeValue(value: unknown, fallback: ThemePreference): ThemePreference {
  return value === 'dark' || value === 'light' ? value : fallback;
}

function mergeSettings(current: unknown, incoming: unknown): Record<string, unknown> {
  if (!isRecord(current)) {
    return isRecord(incoming) ? incoming : {};
  }

  if (!isRecord(incoming)) {
    return current;
  }

  const merged: Record<string, unknown> = { ...current };

  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = isRecord(value) && isRecord(merged[key])
      ? mergeSettings(merged[key], value)
      : value;
  }

  return merged;
}

export function normalizeSystemSettings(input: unknown): SystemSettings {
  const root = isRecord(input) ? input : {};
  const appearance = isRecord(root.appearance) ? root.appearance : {};
  const admin = isRecord(root.admin) ? root.admin : {};
  const notifications = isRecord(admin.notifications) ? admin.notifications : {};
  const security = isRecord(admin.security) ? admin.security : {};
  const localization = isRecord(admin.localization) ? admin.localization : {};
  const client = isRecord(root.client) ? root.client : {};
  const defaults = DEFAULT_SYSTEM_SETTINGS;

  return {
    appearance: {
      defaultTheme: themeValue(appearance.defaultTheme, defaults.appearance.defaultTheme),
    },
    admin: {
      notifications: {
        newBookingRequests: booleanValue(notifications.newBookingRequests, defaults.admin.notifications.newBookingRequests),
        bookingConfirmations: booleanValue(notifications.bookingConfirmations, defaults.admin.notifications.bookingConfirmations),
        bookingCancellations: booleanValue(notifications.bookingCancellations, defaults.admin.notifications.bookingCancellations),
        customerInquiries: booleanValue(notifications.customerInquiries, defaults.admin.notifications.customerInquiries),
        paymentUpdates: booleanValue(notifications.paymentUpdates, defaults.admin.notifications.paymentUpdates),
        contractUpdates: booleanValue(notifications.contractUpdates, defaults.admin.notifications.contractUpdates),
        testimonyUpdates: booleanValue(notifications.testimonyUpdates, defaults.admin.notifications.testimonyUpdates),
        supportUpdates: booleanValue(notifications.supportUpdates, defaults.admin.notifications.supportUpdates),
        weeklySummary: booleanValue(notifications.weeklySummary, defaults.admin.notifications.weeklySummary),
        marketingEmails: booleanValue(notifications.marketingEmails, defaults.admin.notifications.marketingEmails),
        systemAlerts: booleanValue(notifications.systemAlerts, defaults.admin.notifications.systemAlerts),
      },
      security: {
        sessionTimeoutMinutes: sessionTimeout(security.sessionTimeoutMinutes, defaults.admin.security.sessionTimeoutMinutes),
        twoFactorAuthEnabled: false,
        requirePasswordForDeletes: booleanValue(security.requirePasswordForDeletes, defaults.admin.security.requirePasswordForDeletes),
        requirePasswordForBookingCancellations: booleanValue(security.requirePasswordForBookingCancellations, defaults.admin.security.requirePasswordForBookingCancellations),
        requirePasswordForBillingChanges: booleanValue(security.requirePasswordForBillingChanges, defaults.admin.security.requirePasswordForBillingChanges),
      },
      localization: {
        language: stringOption(localization.language, LANGUAGE_OPTIONS, defaults.admin.localization.language),
        timezone: timezoneOption(localization.timezone, defaults.admin.localization.timezone),
        dateFormat: stringOption(localization.dateFormat, DATE_FORMAT_OPTIONS, defaults.admin.localization.dateFormat),
      },
    },
    client: {
      maintenanceMode: booleanValue(client.maintenanceMode, defaults.client.maintenanceMode),
      bookingRequestsEnabled: booleanValue(client.bookingRequestsEnabled, defaults.client.bookingRequestsEnabled),
      inquirySubmissionsEnabled: booleanValue(client.inquirySubmissionsEnabled, defaults.client.inquirySubmissionsEnabled),
      packagesVisible: booleanValue(client.packagesVisible, defaults.client.packagesVisible),
      faqVisible: booleanValue(client.faqVisible, defaults.client.faqVisible),
      assistantEnabled: booleanValue(client.assistantEnabled, defaults.client.assistantEnabled),
      publicTestimoniesVisible: booleanValue(client.publicTestimoniesVisible, defaults.client.publicTestimoniesVisible),
      testimonySubmissionsEnabled: booleanValue(client.testimonySubmissionsEnabled, defaults.client.testimonySubmissionsEnabled),
      disabledMessage: textValue(client.disabledMessage, defaults.client.disabledMessage),
    },
  };
}

async function readSettingsRow(): Promise<SettingsRow | null> {
  const rows = await prisma.$queryRaw<SettingsRow[]>`
    SELECT "settings", "updated_by", "updated_at"
    FROM "system_settings"
    WHERE "id" = ${SETTINGS_ROW_ID}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getSystemSettings() {
  const row = await readSettingsRow();
  const settings = normalizeSystemSettings(row?.settings ?? DEFAULT_SYSTEM_SETTINGS);

  return {
    settings,
    updatedBy: row?.updated_by ?? null,
    updatedAt: row?.updated_at?.toISOString?.() ?? null,
  };
}

export function toPublicSystemSettings(settings: SystemSettings): PublicSystemSettings {
  return {
    appearance: settings.appearance,
    client: settings.client,
    localization: settings.admin.localization,
  };
}

export async function getPublicSystemSettings() {
  const { settings } = await getSystemSettings();
  return toPublicSystemSettings(settings);
}

export async function updateSystemSettings(input: unknown, actor: CurrentAdmin, request?: Request) {
  const previous = await getSystemSettings();
  const merged = mergeSettings(previous.settings, input);
  const nextSettings = normalizeSystemSettings(merged);

  await prisma.$executeRaw`
    UPDATE "system_settings"
    SET
      "settings" = ${JSON.stringify(nextSettings)}::jsonb,
      "updated_by" = ${actor.username},
      "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${SETTINGS_ROW_ID}
  `;

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.SETTINGS_CHANGE,
    module: 'Settings',
    description: `${actor.username} updated system settings.`,
    status: AuditStatus.SUCCESS,
    ...(request ? getRequestContext(request) : {}),
    previousValues: previous.settings,
    newValues: nextSettings,
    metadata: {
      requestPath: request ? new URL(request.url).pathname : '/admin/settings',
    },
  });

  [
    '/admin/settings',
    '/admin/dashboard',
    '/',
    '/book',
    '/contact',
    '/faq',
    '/testimonies',
    '/events/weddings',
    '/events/debuts',
    '/events/birthdays',
    '/events/christening',
    '/events/gender-reveal',
    '/events/christmas-party',
  ].forEach((path) => revalidatePath(path));

  return {
    settings: nextSettings,
    updatedBy: actor.username,
    updatedAt: new Date().toISOString(),
  };
}

export type ClientFeature =
  | 'bookingRequests'
  | 'inquirySubmissions'
  | 'packages'
  | 'faq'
  | 'assistant'
  | 'publicTestimonies'
  | 'testimonySubmissions';

const FEATURE_LABELS: Record<ClientFeature, string> = {
  bookingRequests: 'Online booking requests',
  inquirySubmissions: 'Client inquiries',
  packages: 'Public packages',
  faq: 'Client FAQ',
  assistant: 'Smart Assistant',
  publicTestimonies: 'Public testimonies',
  testimonySubmissions: 'Testimony submissions',
};

function isClientFeatureEnabled(settings: SystemSettings, feature: ClientFeature) {
  if (settings.client.maintenanceMode) {
    return false;
  }

  switch (feature) {
    case 'bookingRequests':
      return settings.client.bookingRequestsEnabled;
    case 'inquirySubmissions':
      return settings.client.inquirySubmissionsEnabled;
    case 'packages':
      return settings.client.packagesVisible;
    case 'faq':
      return settings.client.faqVisible;
    case 'assistant':
      return settings.client.assistantEnabled && settings.client.faqVisible;
    case 'publicTestimonies':
      return settings.client.publicTestimoniesVisible;
    case 'testimonySubmissions':
      return settings.client.testimonySubmissionsEnabled && settings.client.publicTestimoniesVisible;
  }
}

export async function getClientFeatureAvailability(feature: ClientFeature) {
  const { settings } = await getSystemSettings();
  const enabled = isClientFeatureEnabled(settings, feature);
  const message = settings.client.maintenanceMode
    ? settings.client.disabledMessage
    : `${FEATURE_LABELS[feature]} are temporarily unavailable. Please contact Zion Events Place directly for assistance.`;

  return {
    enabled,
    message,
    settings: toPublicSystemSettings(settings),
  };
}

export async function requireClientFeature(feature: ClientFeature) {
  const availability = await getClientFeatureAvailability(feature);

  if (!availability.enabled) {
    throw new ClientFeatureDisabledError(availability.message);
  }

  return availability.settings;
}

export function settingsErrorResponse(error: unknown, fallback = 'Unable to load system settings.') {
  if (error instanceof SystemSettingsError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json({
    error: fallback,
    details: error instanceof Error ? error.message : undefined,
  }, { status: 500 });
}

export function enabledNotificationTypes(settings: SystemSettings): NotificationType[] {
  const output = new Set<NotificationType>();
  const notifications = settings.admin.notifications;

  if (
    notifications.newBookingRequests ||
    notifications.bookingConfirmations ||
    notifications.bookingCancellations
  ) {
    output.add(NotificationType.BOOKING);
    output.add(NotificationType.CALENDAR);
  }

  if (notifications.paymentUpdates) output.add(NotificationType.PAYMENT);
  if (notifications.customerInquiries) output.add(NotificationType.INQUIRY);
  if (notifications.contractUpdates) output.add(NotificationType.CONTRACT);
  if (notifications.testimonyUpdates) output.add(NotificationType.TESTIMONY);
  if (notifications.supportUpdates) output.add(NotificationType.SYSTEM);

  if (notifications.systemAlerts) {
    output.add(NotificationType.SYSTEM);
    output.add(NotificationType.TASK);
    output.add(NotificationType.WORKFLOW);
    output.add(NotificationType.EMAIL);
  }

  return [...output];
}

export async function getEnabledNotificationTypes() {
  const { settings } = await getSystemSettings();
  return enabledNotificationTypes(settings);
}
