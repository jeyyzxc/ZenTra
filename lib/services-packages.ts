import {
  AuditAction,
  AuditStatus,
  BookingStatus,
  EventCategoryStatus,
  NotificationPriority,
  NotificationType,
  PackageStatus,
  Prisma,
} from '@prisma/client';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const SERVICES_MODULE = 'services_packages';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.RESCHEDULED,
  BookingStatus.ON_HOLD,
];

const VERSIONED_PACKAGE_FIELDS = [
  'price',
  'paxIncluded',
  'excessPaxFee',
  'reservationFee',
  'downPaymentAmount',
  'fullPaymentAmount',
  'contractItemDescription',
  'contractInclusionDescription',
] as const;

type ServicesDb = typeof prisma | Prisma.TransactionClient;

export class ServicesPackagesError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ServicesPackagesError';
    this.status = status;
  }
}

export type CategoryInput = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  coverImageUrl?: unknown;
  displayOrder?: unknown;
  status?: unknown;
  clientVisible?: unknown;
};

export type PackageInclusionInput = {
  id?: unknown;
  inclusionName?: unknown;
  name?: unknown;
  description?: unknown;
  isFree?: unknown;
  isOptional?: unknown;
  displayOrder?: unknown;
};

export type PackageInput = {
  packageName?: unknown;
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  price?: unknown;
  currency?: unknown;
  paxIncluded?: unknown;
  excessPaxFee?: unknown;
  reservationFee?: unknown;
  downPaymentAmount?: unknown;
  fullPaymentAmount?: unknown;
  checkInTime?: unknown;
  checkOutTime?: unknown;
  packageImageUrl?: unknown;
  contractItemDescription?: unknown;
  contractInclusionDescription?: unknown;
  status?: unknown;
  clientVisible?: unknown;
  internalNotes?: unknown;
  inclusions?: unknown;
};

type RequestAuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown) {
  const normalized = text(value);
  return normalized ? normalized : null;
}

function requiredText(value: unknown, label: string) {
  const normalized = text(value);

  if (!normalized) {
    throw new ServicesPackagesError(`${label} is required.`);
  }

  return normalized;
}

function nonNegativeNumber(value: unknown, label: string, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ServicesPackagesError(`${label} must be a non-negative number.`);
  }

  return parsed;
}

function nonNegativeInteger(value: unknown, label: string, fallback = 0) {
  const parsed = nonNegativeNumber(value, label, fallback);

  if (!Number.isInteger(parsed)) {
    throw new ServicesPackagesError(`${label} must be a whole number.`);
  }

  return parsed;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseEventCategoryStatus(
  value: unknown,
  fallback: EventCategoryStatus = EventCategoryStatus.ACTIVE,
): EventCategoryStatus {
  if (value === undefined || value === null || value === '') return fallback;
  const key = String(value).trim().toUpperCase().replace(/-/g, '_');

  if (key in EventCategoryStatus) {
    return EventCategoryStatus[key as keyof typeof EventCategoryStatus];
  }

  throw new ServicesPackagesError('Event category status is not supported.');
}

function parsePackageStatus(
  value: unknown,
  fallback: PackageStatus = PackageStatus.ACTIVE,
): PackageStatus {
  if (value === undefined || value === null || value === '') return fallback;
  const key = String(value).trim().toUpperCase().replace(/-/g, '_');

  if (key in PackageStatus) {
    return PackageStatus[key as keyof typeof PackageStatus];
  }

  throw new ServicesPackagesError('Package status is not supported.');
}

function externalStatus(status: string) {
  return status.toLowerCase();
}

function normalizeCategoryInput(input: CategoryInput, existing?: {
  name: string;
  slug: string;
  displayOrder: number;
  status: EventCategoryStatus;
  clientVisible: boolean;
}) {
  const name = input.name === undefined
    ? existing?.name
    : requiredText(input.name, 'Event category name');
  const resolvedName = name ?? requiredText(input.name, 'Event category name');
  const rawSlug = input.slug === undefined ? existing?.slug : optionalText(input.slug);
  const slug = slugify(rawSlug || resolvedName);

  if (!slug) {
    throw new ServicesPackagesError('Slug is required.');
  }

  return {
    name: resolvedName,
    slug,
    description: input.description === undefined ? undefined : optionalText(input.description),
    coverImageUrl: input.coverImageUrl === undefined ? undefined : optionalText(input.coverImageUrl),
    displayOrder: input.displayOrder === undefined
      ? existing?.displayOrder ?? 0
      : nonNegativeInteger(input.displayOrder, 'Display order'),
    status: parseEventCategoryStatus(input.status, existing?.status ?? EventCategoryStatus.ACTIVE),
    clientVisible: booleanValue(input.clientVisible, existing?.clientVisible ?? true),
  };
}

function normalizeInclusions(input: unknown): PackageInclusionInput[] | undefined {
  if (input === undefined) return undefined;

  if (!Array.isArray(input)) {
    throw new ServicesPackagesError('Package inclusions must be an array.');
  }

  return input.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new ServicesPackagesError('Each package inclusion must be an object.');
    }

    const inclusion = item as PackageInclusionInput;
    const inclusionName = inclusion.inclusionName ?? inclusion.name;

    return {
      id: optionalText(inclusion.id),
      inclusionName: requiredText(inclusionName, 'Inclusion name'),
      description: optionalText(inclusion.description),
      isFree: booleanValue(inclusion.isFree, true),
      isOptional: booleanValue(inclusion.isOptional, false),
      displayOrder: nonNegativeInteger(inclusion.displayOrder, 'Inclusion display order', (index + 1) * 10),
    };
  });
}

function normalizePackageInput(input: PackageInput, existing?: {
  packageName: string;
  slug: string;
  price: number;
  currency: string;
  paxIncluded: number;
  excessPaxFee: number;
  reservationFee: number;
  downPaymentAmount: number;
  fullPaymentAmount: number;
  status: PackageStatus;
  clientVisible: boolean;
}) {
  const packageName = input.packageName === undefined && input.name === undefined
    ? existing?.packageName
    : requiredText(input.packageName ?? input.name, 'Package name');
  const resolvedName = packageName ?? requiredText(input.packageName ?? input.name, 'Package name');
  const rawSlug = input.slug === undefined ? existing?.slug : optionalText(input.slug);
  const slug = slugify(rawSlug || resolvedName);

  if (!slug) {
    throw new ServicesPackagesError('Package slug is required.');
  }

  const price = nonNegativeNumber(input.price, 'Package price', existing?.price ?? 0);

  return {
    packageName: resolvedName,
    slug,
    description: input.description === undefined ? undefined : optionalText(input.description),
    price,
    currency: optionalText(input.currency) ?? existing?.currency ?? 'PHP',
    paxIncluded: nonNegativeInteger(input.paxIncluded, 'Pax included', existing?.paxIncluded ?? 0),
    excessPaxFee: nonNegativeNumber(input.excessPaxFee, 'Excess pax fee', existing?.excessPaxFee ?? 0),
    reservationFee: nonNegativeNumber(input.reservationFee, 'Reservation fee', existing?.reservationFee ?? 0),
    downPaymentAmount: nonNegativeNumber(input.downPaymentAmount, 'Down payment amount', existing?.downPaymentAmount ?? 0),
    fullPaymentAmount: nonNegativeNumber(input.fullPaymentAmount, 'Full payment amount', existing?.fullPaymentAmount ?? price),
    checkInTime: input.checkInTime === undefined ? undefined : optionalText(input.checkInTime),
    checkOutTime: input.checkOutTime === undefined ? undefined : optionalText(input.checkOutTime),
    packageImageUrl: input.packageImageUrl === undefined ? undefined : optionalText(input.packageImageUrl),
    contractItemDescription: input.contractItemDescription === undefined ? undefined : optionalText(input.contractItemDescription),
    contractInclusionDescription: input.contractInclusionDescription === undefined ? undefined : optionalText(input.contractInclusionDescription),
    status: parsePackageStatus(input.status, existing?.status ?? PackageStatus.ACTIVE),
    clientVisible: booleanValue(input.clientVisible, existing?.clientVisible ?? true),
    internalNotes: input.internalNotes === undefined ? undefined : optionalText(input.internalNotes),
    inclusions: normalizeInclusions(input.inclusions),
  };
}

function categoryPayload(category: Awaited<ReturnType<typeof prisma.eventCategory.findFirst>> & {
  packages?: Array<{ id: string; status: PackageStatus; clientVisible: boolean }>;
}) {
  if (!category) return null;
  const packages = category.packages ?? [];
  const activePackageCount = packages.filter(
    (item) => item.status === PackageStatus.ACTIVE && item.clientVisible,
  ).length;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    coverImageUrl: category.coverImageUrl,
    displayOrder: category.displayOrder,
    status: externalStatus(category.status),
    clientVisible: category.clientVisible,
    packageCount: packages.length,
    activePackageCount,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function packagePayload(packageRecord: Prisma.PackageGetPayload<{
  include: {
    eventCategory: true;
    inclusions: true;
    versions: { orderBy: { versionNumber: 'desc' }; take: 5 };
  };
}>) {
  return {
    id: packageRecord.id,
    eventCategoryId: packageRecord.eventCategoryId,
    eventCategoryName: packageRecord.eventCategory.name,
    eventCategorySlug: packageRecord.eventCategory.slug,
    packageName: packageRecord.packageName,
    slug: packageRecord.slug,
    description: packageRecord.description,
    price: packageRecord.price,
    currency: packageRecord.currency,
    paxIncluded: packageRecord.paxIncluded,
    excessPaxFee: packageRecord.excessPaxFee,
    reservationFee: packageRecord.reservationFee,
    downPaymentAmount: packageRecord.downPaymentAmount,
    fullPaymentAmount: packageRecord.fullPaymentAmount,
    checkInTime: packageRecord.checkInTime,
    checkOutTime: packageRecord.checkOutTime,
    packageImageUrl: packageRecord.packageImageUrl,
    contractItemDescription: packageRecord.contractItemDescription,
    contractInclusionDescription: packageRecord.contractInclusionDescription,
    status: externalStatus(packageRecord.status),
    clientVisible: packageRecord.clientVisible,
    currentVersion: packageRecord.currentVersion,
    internalNotes: packageRecord.internalNotes,
    inclusionCount: packageRecord.inclusions.length,
    inclusions: packageRecord.inclusions.map((inclusion) => ({
      id: inclusion.id,
      inclusionName: inclusion.inclusionName,
      description: inclusion.description,
      isFree: inclusion.isFree,
      isOptional: inclusion.isOptional,
      displayOrder: inclusion.displayOrder,
    })),
    versions: packageRecord.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      changeSummary: version.changeSummary,
      createdBy: version.createdBy,
      createdAt: version.createdAt.toISOString(),
    })),
    createdAt: packageRecord.createdAt.toISOString(),
    updatedAt: packageRecord.updatedAt.toISOString(),
  };
}

async function auditServicesChange(input: {
  actor: CurrentAdmin;
  action: AuditAction;
  description: string;
  request?: Request | RequestAuditContext;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  status?: AuditStatus;
}) {
  const requestContext = input.request instanceof Request
    ? getRequestContext(input.request)
    : input.request ?? {};

  await createAuditLog({
    ...auditActor(input.actor),
    action: input.action,
    module: SERVICES_MODULE,
    description: input.description,
    status: input.status ?? AuditStatus.SUCCESS,
    previousValues: input.previousValues,
    newValues: input.newValues,
    metadata: input.metadata,
    ...requestContext,
  });
}

async function createServicesNotification(input: {
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedRecordId?: string | null;
  actor?: CurrentAdmin;
}) {
  try {
    await prisma.notification.create({
      data: {
        title: input.title,
        message: input.message,
        type: NotificationType.SYSTEM,
        priority: input.priority ?? NotificationPriority.MEDIUM,
        relatedModule: SERVICES_MODULE,
        relatedRecordId: input.relatedRecordId ?? null,
        createdBy: input.actor?.username ?? 'system',
        source: SERVICES_MODULE,
      },
    });
  } catch (error) {
    console.error('Services notification failed:', error);
  }
}

async function findCategoryOrThrow(idOrSlug: string) {
  const category = await prisma.eventCategory.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug },
      ],
    },
    include: {
      packages: {
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  if (!category) {
    throw new ServicesPackagesError('Event category not found.', 404);
  }

  return category;
}

async function findPackageOrThrow(id: string) {
  const packageRecord = await prisma.package.findUnique({
    where: { id },
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 5,
      },
    },
  });

  if (!packageRecord) {
    throw new ServicesPackagesError('Package not found.', 404);
  }

  return packageRecord;
}

async function assertUniqueCategorySlug(slug: string, excludeId?: string) {
  const existing = await prisma.eventCategory.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== excludeId) {
    throw new ServicesPackagesError('An event category already uses this slug.');
  }
}

async function assertUniquePackageSlug(eventCategoryId: string, slug: string, excludeId?: string) {
  const existing = await prisma.package.findUnique({
    where: {
      eventCategoryId_slug: {
        eventCategoryId,
        slug,
      },
    },
    select: { id: true },
  });

  if (existing && existing.id !== excludeId) {
    throw new ServicesPackagesError('A package in this event category already uses this slug.');
  }
}

async function countActiveBookingsForPackage(packageId: string) {
  return prisma.booking.count({
    where: {
      packageId,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
  });
}

async function createVersionSnapshot(
  db: ServicesDb,
  packageId: string,
  changeSummary: string,
  createdBy: string,
) {
  const packageRecord = await db.package.findUnique({
    where: { id: packageId },
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  if (!packageRecord) {
    throw new ServicesPackagesError('Package not found.', 404);
  }

  const snapshot = buildSnapshotFromPackage(packageRecord);

  await db.packageVersion.create({
    data: {
      packageId: packageRecord.id,
      versionNumber: packageRecord.currentVersion,
      snapshotData: snapshot as Prisma.InputJsonValue,
      changeSummary,
      createdBy,
    },
  });

  return snapshot;
}

function buildSnapshotFromPackage(packageRecord: Prisma.PackageGetPayload<{
  include: {
    eventCategory: true;
    inclusions: true;
  };
}>) {
  return {
    eventCategoryId: packageRecord.eventCategoryId,
    eventCategoryName: packageRecord.eventCategory.name,
    eventCategorySlug: packageRecord.eventCategory.slug,
    packageId: packageRecord.id,
    packageVersion: packageRecord.currentVersion,
    packageName: packageRecord.packageName,
    slug: packageRecord.slug,
    description: packageRecord.description,
    price: packageRecord.price,
    currency: packageRecord.currency,
    paxIncluded: packageRecord.paxIncluded,
    excessPaxFee: packageRecord.excessPaxFee,
    reservationFee: packageRecord.reservationFee,
    downPaymentAmount: packageRecord.downPaymentAmount,
    fullPaymentAmount: packageRecord.fullPaymentAmount,
    checkInTime: packageRecord.checkInTime,
    checkOutTime: packageRecord.checkOutTime,
    packageImageUrl: packageRecord.packageImageUrl,
    contractItemDescription: packageRecord.contractItemDescription,
    contractInclusionDescription: packageRecord.contractInclusionDescription,
    status: externalStatus(packageRecord.status),
    clientVisible: packageRecord.clientVisible,
    inclusions: packageRecord.inclusions.map((inclusion) => ({
      id: inclusion.id,
      inclusionName: inclusion.inclusionName,
      description: inclusion.description,
      isFree: inclusion.isFree,
      isOptional: inclusion.isOptional,
      displayOrder: inclusion.displayOrder,
    })),
    capturedAt: new Date().toISOString(),
  };
}

async function maybeNotifyVisibleCategoryWithoutOffers(eventCategoryId: string, actor: CurrentAdmin) {
  const category = await prisma.eventCategory.findUnique({
    where: { id: eventCategoryId },
    include: {
      packages: {
        where: {
          status: PackageStatus.ACTIVE,
          clientVisible: true,
        },
        select: { id: true },
      },
    },
  });

  if (
    category &&
    category.status === EventCategoryStatus.ACTIVE &&
    category.clientVisible &&
    category.packages.length === 0
  ) {
    await createServicesNotification({
      title: 'Visible category has no active package',
      message: `${category.name} is visible to clients but has no active package offers.`,
      priority: NotificationPriority.HIGH,
      relatedRecordId: category.id,
      actor,
    });
  }
}

export async function getAdminEventCategories() {
  const categories = await prisma.eventCategory.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      packages: {
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  return categories.map(categoryPayload);
}

export async function getAdminEventCategory(idOrSlug: string) {
  const category = await findCategoryOrThrow(idOrSlug);
  return categoryPayload(category);
}

export async function createEventCategory(input: CategoryInput, actor: CurrentAdmin, request?: Request) {
  const normalized = normalizeCategoryInput(input);
  await assertUniqueCategorySlug(normalized.slug);

  const category = await prisma.eventCategory.create({
    data: {
      name: normalized.name,
      slug: normalized.slug,
      description: normalized.description,
      coverImageUrl: normalized.coverImageUrl,
      displayOrder: normalized.displayOrder,
      status: normalized.status,
      clientVisible: normalized.clientVisible,
      createdBy: actor.username,
      updatedBy: actor.username,
    },
    include: {
      packages: {
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.CREATE,
    description: `Event category created: ${category.name}.`,
    newValues: category as unknown as Record<string, unknown>,
    metadata: { eventCategoryId: category.id },
  });

  await maybeNotifyVisibleCategoryWithoutOffers(category.id, actor);
  return categoryPayload(category);
}

export async function updateEventCategory(
  idOrSlug: string,
  input: CategoryInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await findCategoryOrThrow(idOrSlug);
  const normalized = normalizeCategoryInput(input, previous);
  await assertUniqueCategorySlug(normalized.slug, previous.id);

  const updated = await prisma.eventCategory.update({
    where: { id: previous.id },
    data: {
      name: normalized.name,
      slug: normalized.slug,
      ...(normalized.description !== undefined ? { description: normalized.description } : {}),
      ...(normalized.coverImageUrl !== undefined ? { coverImageUrl: normalized.coverImageUrl } : {}),
      displayOrder: normalized.displayOrder,
      status: normalized.status,
      clientVisible: normalized.clientVisible,
      updatedBy: actor.username,
    },
    include: {
      packages: {
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Event category updated: ${updated.name}.`,
    previousValues: previous as unknown as Record<string, unknown>,
    newValues: updated as unknown as Record<string, unknown>,
    metadata: { eventCategoryId: updated.id },
  });

  await maybeNotifyVisibleCategoryWithoutOffers(updated.id, actor);
  return categoryPayload(updated);
}

export async function archiveEventCategory(idOrSlug: string, actor: CurrentAdmin, request?: Request) {
  const previous = await findCategoryOrThrow(idOrSlug);
  const updated = await prisma.eventCategory.update({
    where: { id: previous.id },
    data: {
      status: EventCategoryStatus.ARCHIVED,
      clientVisible: false,
      updatedBy: actor.username,
    },
    include: {
      packages: {
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Event category archived: ${updated.name}.`,
    previousValues: previous as unknown as Record<string, unknown>,
    newValues: updated as unknown as Record<string, unknown>,
    metadata: { eventCategoryId: updated.id, categoryStatus: 'archived' },
  });

  return categoryPayload(updated);
}

export async function setEventCategoryVisibility(
  idOrSlug: string,
  clientVisible: boolean,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await findCategoryOrThrow(idOrSlug);
  const updated = await prisma.eventCategory.update({
    where: { id: previous.id },
    data: {
      clientVisible,
      updatedBy: actor.username,
    },
    include: {
      packages: {
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Event category client visibility changed: ${updated.name}.`,
    previousValues: { clientVisible: previous.clientVisible },
    newValues: { clientVisible: updated.clientVisible },
    metadata: { eventCategoryId: updated.id },
  });

  await maybeNotifyVisibleCategoryWithoutOffers(updated.id, actor);
  return categoryPayload(updated);
}

export async function getAdminPackagesForCategory(idOrSlug: string) {
  const category = await findCategoryOrThrow(idOrSlug);
  const packages = await prisma.package.findMany({
    where: { eventCategoryId: category.id },
    orderBy: [{ updatedAt: 'desc' }, { packageName: 'asc' }],
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 5,
      },
    },
  });

  return {
    category: categoryPayload(category),
    packages: packages.map(packagePayload),
  };
}

export async function getAdminPackage(id: string) {
  return packagePayload(await findPackageOrThrow(id));
}

export async function createPackage(
  eventCategoryIdOrSlug: string,
  input: PackageInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const category = await findCategoryOrThrow(eventCategoryIdOrSlug);

  if (category.status === EventCategoryStatus.ARCHIVED) {
    throw new ServicesPackagesError('Archived event categories cannot receive new packages.', 409);
  }

  const normalized = normalizePackageInput(input);
  await assertUniquePackageSlug(category.id, normalized.slug);

  const created = await prisma.$transaction(async (transaction) => {
    const packageRecord = await transaction.package.create({
      data: {
        eventCategoryId: category.id,
        packageName: normalized.packageName,
        slug: normalized.slug,
        description: normalized.description,
        price: normalized.price,
        currency: normalized.currency,
        paxIncluded: normalized.paxIncluded,
        excessPaxFee: normalized.excessPaxFee,
        reservationFee: normalized.reservationFee,
        downPaymentAmount: normalized.downPaymentAmount,
        fullPaymentAmount: normalized.fullPaymentAmount,
        checkInTime: normalized.checkInTime,
        checkOutTime: normalized.checkOutTime,
        packageImageUrl: normalized.packageImageUrl,
        contractItemDescription: normalized.contractItemDescription,
        contractInclusionDescription: normalized.contractInclusionDescription,
        status: normalized.status,
        clientVisible: normalized.clientVisible,
        currentVersion: 1,
        internalNotes: normalized.internalNotes,
        createdBy: actor.username,
        updatedBy: actor.username,
        inclusions: normalized.inclusions
          ? {
              create: normalized.inclusions.map((inclusion) => ({
                inclusionName: inclusion.inclusionName as string,
                description: inclusion.description as string | null,
                isFree: inclusion.isFree as boolean,
                isOptional: inclusion.isOptional as boolean,
                displayOrder: inclusion.displayOrder as number,
              })),
            }
          : undefined,
      },
    });

    await createVersionSnapshot(
      transaction,
      packageRecord.id,
      'Initial package version created.',
      actor.username,
    );

    return transaction.package.findUniqueOrThrow({
      where: { id: packageRecord.id },
      include: {
        eventCategory: true,
        inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.CREATE,
    description: `Package created: ${created.packageName}.`,
    newValues: created as unknown as Record<string, unknown>,
    metadata: { eventCategoryId: category.id, packageId: created.id },
  });

  await createServicesNotification({
    title: 'New package added',
    message: `${created.packageName} was added under ${created.eventCategory.name}.`,
    relatedRecordId: created.id,
    actor,
  });

  return packagePayload(created);
}

export async function updatePackage(
  id: string,
  input: PackageInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await findPackageOrThrow(id);
  const normalized = normalizePackageInput(input, previous);
  await assertUniquePackageSlug(previous.eventCategoryId, normalized.slug, previous.id);

  const previousData = previous as unknown as Record<string, unknown>;
  const versionedFieldChanged = VERSIONED_PACKAGE_FIELDS.some((field) => {
    if (!(field in normalized)) return false;
    return previous[field] !== normalized[field];
  });
  const inclusionsChanged = normalized.inclusions !== undefined;
  const shouldCreateVersion = versionedFieldChanged || inclusionsChanged;
  const activeBookingCount = await countActiveBookingsForPackage(previous.id);

  const updated = await prisma.$transaction(async (transaction) => {
    const nextVersion = shouldCreateVersion ? previous.currentVersion + 1 : previous.currentVersion;
    await transaction.package.update({
      where: { id: previous.id },
      data: {
        packageName: normalized.packageName,
        slug: normalized.slug,
        ...(normalized.description !== undefined ? { description: normalized.description } : {}),
        price: normalized.price,
        currency: normalized.currency,
        paxIncluded: normalized.paxIncluded,
        excessPaxFee: normalized.excessPaxFee,
        reservationFee: normalized.reservationFee,
        downPaymentAmount: normalized.downPaymentAmount,
        fullPaymentAmount: normalized.fullPaymentAmount,
        ...(normalized.checkInTime !== undefined ? { checkInTime: normalized.checkInTime } : {}),
        ...(normalized.checkOutTime !== undefined ? { checkOutTime: normalized.checkOutTime } : {}),
        ...(normalized.packageImageUrl !== undefined ? { packageImageUrl: normalized.packageImageUrl } : {}),
        ...(normalized.contractItemDescription !== undefined ? { contractItemDescription: normalized.contractItemDescription } : {}),
        ...(normalized.contractInclusionDescription !== undefined ? { contractInclusionDescription: normalized.contractInclusionDescription } : {}),
        status: normalized.status,
        clientVisible: normalized.clientVisible,
        currentVersion: nextVersion,
        ...(normalized.internalNotes !== undefined ? { internalNotes: normalized.internalNotes } : {}),
        updatedBy: actor.username,
      },
    });

    if (normalized.inclusions) {
      await transaction.packageInclusion.deleteMany({
        where: { packageId: previous.id },
      });

      if (normalized.inclusions.length > 0) {
        await transaction.packageInclusion.createMany({
          data: normalized.inclusions.map((inclusion) => ({
            packageId: previous.id,
            inclusionName: inclusion.inclusionName as string,
            description: inclusion.description as string | null,
            isFree: inclusion.isFree as boolean,
            isOptional: inclusion.isOptional as boolean,
            displayOrder: inclusion.displayOrder as number,
          })),
        });
      }
    }

    if (shouldCreateVersion) {
      await createVersionSnapshot(
        transaction,
        previous.id,
        activeBookingCount > 0
          ? 'Package version created after editing fields used by active bookings.'
          : 'Package version created after package details changed.',
        actor.username,
      );
    }

    return transaction.package.findUniqueOrThrow({
      where: { id: previous.id },
      include: {
        eventCategory: true,
        inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: shouldCreateVersion
      ? `Package updated and versioned: ${updated.packageName}.`
      : `Package updated: ${updated.packageName}.`,
    previousValues: previousData,
    newValues: updated as unknown as Record<string, unknown>,
    metadata: {
      packageId: updated.id,
      eventCategoryId: updated.eventCategoryId,
      packageVersion: updated.currentVersion,
      versionCreated: shouldCreateVersion,
      activeBookingCount,
    },
    status: activeBookingCount > 0 && shouldCreateVersion ? AuditStatus.WARNING : AuditStatus.SUCCESS,
  });

  await createServicesNotification({
    title: activeBookingCount > 0 && shouldCreateVersion
      ? 'Package used in active booking was edited'
      : 'Package updated',
    message: activeBookingCount > 0 && shouldCreateVersion
      ? `${updated.packageName} was edited while ${activeBookingCount} active booking(s) still use previous snapshots.`
      : `${updated.packageName} was updated.`,
    priority: activeBookingCount > 0 && shouldCreateVersion
      ? NotificationPriority.HIGH
      : NotificationPriority.MEDIUM,
    relatedRecordId: updated.id,
    actor,
  });

  if (updated.status !== PackageStatus.ACTIVE || !updated.clientVisible) {
    await maybeNotifyVisibleCategoryWithoutOffers(updated.eventCategoryId, actor);
  }

  return packagePayload(updated);
}

export async function archivePackage(id: string, actor: CurrentAdmin, request?: Request) {
  const previous = await findPackageOrThrow(id);
  const updated = await prisma.package.update({
    where: { id: previous.id },
    data: {
      status: PackageStatus.ARCHIVED,
      clientVisible: false,
      updatedBy: actor.username,
    },
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
      versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
    },
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Package archived: ${updated.packageName}.`,
    previousValues: previous as unknown as Record<string, unknown>,
    newValues: updated as unknown as Record<string, unknown>,
    metadata: { packageId: updated.id, packageStatus: 'archived' },
  });

  await createServicesNotification({
    title: 'Package archived',
    message: `${updated.packageName} was archived and removed from the Client Panel.`,
    priority: NotificationPriority.HIGH,
    relatedRecordId: updated.id,
    actor,
  });
  await maybeNotifyVisibleCategoryWithoutOffers(updated.eventCategoryId, actor);
  return packagePayload(updated);
}

export async function setPackageVisibility(
  id: string,
  clientVisible: boolean,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await findPackageOrThrow(id);
  const updated = await prisma.package.update({
    where: { id: previous.id },
    data: {
      clientVisible,
      updatedBy: actor.username,
    },
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
      versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
    },
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Package client visibility changed: ${updated.packageName}.`,
    previousValues: { clientVisible: previous.clientVisible },
    newValues: { clientVisible: updated.clientVisible },
    metadata: { packageId: updated.id },
  });

  await createServicesNotification({
    title: clientVisible ? 'Package shown on Client Panel' : 'Package hidden from Client Panel',
    message: `${updated.packageName} is now ${clientVisible ? 'visible' : 'hidden'} to clients.`,
    relatedRecordId: updated.id,
    actor,
  });

  if (!clientVisible) {
    await maybeNotifyVisibleCategoryWithoutOffers(updated.eventCategoryId, actor);
  }

  return packagePayload(updated);
}

export async function deletePackageWhenAllowed(id: string, actor: CurrentAdmin, request?: Request) {
  const previous = await findPackageOrThrow(id);
  const bookingCount = await prisma.booking.count({ where: { packageId: id } });
  const snapshotCount = await prisma.bookingPackageSnapshot.count({ where: { packageId: id } });

  if (bookingCount > 0 || snapshotCount > 0) {
    throw new ServicesPackagesError(
      'This package is already used by bookings. Archive it instead of deleting it.',
      409,
    );
  }

  await prisma.package.delete({ where: { id } });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.DELETE,
    description: `Package removed: ${previous.packageName}.`,
    previousValues: previous as unknown as Record<string, unknown>,
    metadata: { packageId: id },
  });

  return { deleted: true };
}

export async function createPackageInclusion(
  packageId: string,
  input: PackageInclusionInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const packageRecord = await findPackageOrThrow(packageId);
  const normalized = normalizeInclusions([input])?.[0];

  if (!normalized) {
    throw new ServicesPackagesError('Inclusion data is required.');
  }

  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.packageInclusion.create({
      data: {
        packageId,
        inclusionName: normalized.inclusionName as string,
        description: normalized.description as string | null,
        isFree: normalized.isFree as boolean,
        isOptional: normalized.isOptional as boolean,
        displayOrder: normalized.displayOrder as number,
      },
    });

    await transaction.package.update({
      where: { id: packageId },
      data: {
        currentVersion: packageRecord.currentVersion + 1,
        updatedBy: actor.username,
      },
    });

    await createVersionSnapshot(
      transaction,
      packageId,
      `Package inclusion added: ${normalized.inclusionName}.`,
      actor.username,
    );

    return transaction.package.findUniqueOrThrow({
      where: { id: packageId },
      include: {
        eventCategory: true,
        inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Package inclusion added: ${normalized.inclusionName}.`,
    newValues: normalized as Record<string, unknown>,
    metadata: { packageId },
  });

  return packagePayload(updated);
}

export async function updatePackageInclusion(
  inclusionId: string,
  input: PackageInclusionInput,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await prisma.packageInclusion.findUnique({
    where: { id: inclusionId },
    include: { package: true },
  });

  if (!previous) {
    throw new ServicesPackagesError('Package inclusion not found.', 404);
  }

  const normalized = normalizeInclusions([{
    inclusionName: input.inclusionName ?? input.name ?? previous.inclusionName,
    description: input.description ?? previous.description,
    isFree: input.isFree ?? previous.isFree,
    isOptional: input.isOptional ?? previous.isOptional,
    displayOrder: input.displayOrder ?? previous.displayOrder,
  }])?.[0];

  if (!normalized) {
    throw new ServicesPackagesError('Inclusion data is required.');
  }

  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.packageInclusion.update({
      where: { id: inclusionId },
      data: {
        inclusionName: normalized.inclusionName as string,
        description: normalized.description as string | null,
        isFree: normalized.isFree as boolean,
        isOptional: normalized.isOptional as boolean,
        displayOrder: normalized.displayOrder as number,
      },
    });

    await transaction.package.update({
      where: { id: previous.packageId },
      data: {
        currentVersion: previous.package.currentVersion + 1,
        updatedBy: actor.username,
      },
    });

    await createVersionSnapshot(
      transaction,
      previous.packageId,
      `Package inclusion edited: ${normalized.inclusionName}.`,
      actor.username,
    );

    return transaction.package.findUniqueOrThrow({
      where: { id: previous.packageId },
      include: {
        eventCategory: true,
        inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Package inclusion edited: ${normalized.inclusionName}.`,
    previousValues: previous as unknown as Record<string, unknown>,
    newValues: normalized as Record<string, unknown>,
    metadata: { packageId: previous.packageId, inclusionId },
  });

  return packagePayload(updated);
}

export async function deletePackageInclusion(
  inclusionId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const previous = await prisma.packageInclusion.findUnique({
    where: { id: inclusionId },
    include: { package: true },
  });

  if (!previous) {
    throw new ServicesPackagesError('Package inclusion not found.', 404);
  }

  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.packageInclusion.delete({ where: { id: inclusionId } });
    await transaction.package.update({
      where: { id: previous.packageId },
      data: {
        currentVersion: previous.package.currentVersion + 1,
        updatedBy: actor.username,
      },
    });

    await createVersionSnapshot(
      transaction,
      previous.packageId,
      `Package inclusion removed: ${previous.inclusionName}.`,
      actor.username,
    );

    return transaction.package.findUniqueOrThrow({
      where: { id: previous.packageId },
      include: {
        eventCategory: true,
        inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.DELETE,
    description: `Package inclusion removed: ${previous.inclusionName}.`,
    previousValues: previous as unknown as Record<string, unknown>,
    metadata: { packageId: previous.packageId, inclusionId },
  });

  return packagePayload(updated);
}

export async function reorderPackageInclusions(
  packageId: string,
  inclusionIds: string[],
  actor: CurrentAdmin,
  request?: Request,
) {
  if (!Array.isArray(inclusionIds) || inclusionIds.some((id) => typeof id !== 'string')) {
    throw new ServicesPackagesError('inclusionIds must be an array of IDs.');
  }

  const packageRecord = await findPackageOrThrow(packageId);
  const existingIds = new Set(packageRecord.inclusions.map((inclusion) => inclusion.id));

  if (inclusionIds.some((id) => !existingIds.has(id))) {
    throw new ServicesPackagesError('All reordered inclusions must belong to the package.');
  }

  const updated = await prisma.$transaction(async (transaction) => {
    for (const [index, inclusionId] of inclusionIds.entries()) {
      await transaction.packageInclusion.update({
        where: { id: inclusionId },
        data: { displayOrder: (index + 1) * 10 },
      });
    }

    await transaction.package.update({
      where: { id: packageId },
      data: {
        currentVersion: packageRecord.currentVersion + 1,
        updatedBy: actor.username,
      },
    });

    await createVersionSnapshot(
      transaction,
      packageId,
      'Package inclusions reordered.',
      actor.username,
    );

    return transaction.package.findUniqueOrThrow({
      where: { id: packageId },
      include: {
        eventCategory: true,
        inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
  });

  await auditServicesChange({
    actor,
    request,
    action: AuditAction.UPDATE,
    description: `Package inclusions reordered: ${packageRecord.packageName}.`,
    metadata: { packageId, inclusionIds },
  });

  return packagePayload(updated);
}

export async function getPublicEventCategories() {
  const categories = await prisma.eventCategory.findMany({
    where: {
      status: EventCategoryStatus.ACTIVE,
      clientVisible: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      packages: {
        where: {
          status: PackageStatus.ACTIVE,
          clientVisible: true,
        },
        select: {
          id: true,
          status: true,
          clientVisible: true,
        },
      },
    },
  });

  return categories.map(categoryPayload);
}

export async function getPublicPackagesForCategory(slug: string) {
  const category = await prisma.eventCategory.findUnique({
    where: { slug },
    include: {
      packages: {
        where: {
          status: PackageStatus.ACTIVE,
          clientVisible: true,
        },
        orderBy: [{ updatedAt: 'desc' }, { packageName: 'asc' }],
        include: {
          eventCategory: true,
          inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
      },
    },
  });

  if (!category || category.status !== EventCategoryStatus.ACTIVE || !category.clientVisible) {
    throw new ServicesPackagesError('Event category not found.', 404);
  }

  return {
    category: categoryPayload(category),
    packages: category.packages.map(packagePayload),
  };
}

export async function getPublicPackageBySlug(slug: string) {
  const packageRecord = await prisma.package.findFirst({
    where: {
      slug,
      status: PackageStatus.ACTIVE,
      clientVisible: true,
      eventCategory: {
        status: EventCategoryStatus.ACTIVE,
        clientVisible: true,
      },
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
    },
  });

  if (!packageRecord) {
    throw new ServicesPackagesError('Package not found.', 404);
  }

  return packagePayload(packageRecord);
}

export async function getBookablePackageSnapshot(
  packageId: string,
  requestedVersion?: number | null,
  db: ServicesDb = prisma,
) {
  const packageRecord = await db.package.findUnique({
    where: { id: packageId },
    include: {
      eventCategory: true,
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  if (
    !packageRecord ||
    packageRecord.status !== PackageStatus.ACTIVE ||
    !packageRecord.clientVisible ||
    packageRecord.eventCategory.status !== EventCategoryStatus.ACTIVE ||
    !packageRecord.eventCategory.clientVisible
  ) {
    throw new ServicesPackagesError('Selected package is not available for booking.', 409);
  }

  if (requestedVersion && requestedVersion !== packageRecord.currentVersion) {
    throw new ServicesPackagesError('Selected package changed. Please refresh and choose the package again.', 409);
  }

  return buildSnapshotFromPackage(packageRecord);
}

export async function attachPackageSnapshotToBooking(input: {
  bookingId: string;
  packageId: string;
  packageVersion?: number | null;
  db?: ServicesDb;
}) {
  const db = input.db ?? prisma;
  const snapshot = await getBookablePackageSnapshot(input.packageId, input.packageVersion, db);

  await db.booking.update({
    where: { id: input.bookingId },
    data: {
      eventCategoryId: snapshot.eventCategoryId,
      eventCategoryName: snapshot.eventCategoryName,
      packageId: snapshot.packageId,
      packageVersion: snapshot.packageVersion,
      packageSelected: snapshot.packageName,
      paymentTotalAmount: snapshot.price,
      paymentRemainingBalance: snapshot.price,
    },
  });

  await db.bookingPackageSnapshot.upsert({
    where: { bookingId: input.bookingId },
    create: {
      bookingId: input.bookingId,
      eventCategoryId: snapshot.eventCategoryId,
      packageId: snapshot.packageId,
      packageVersion: snapshot.packageVersion,
      snapshotData: snapshot as Prisma.InputJsonValue,
    },
    update: {
      eventCategoryId: snapshot.eventCategoryId,
      packageId: snapshot.packageId,
      packageVersion: snapshot.packageVersion,
      snapshotData: snapshot as Prisma.InputJsonValue,
    },
  });

  return snapshot;
}

export function handleServicesError(error: unknown) {
  if (error instanceof ServicesPackagesError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (error instanceof Error && error.message.startsWith('Forbidden')) {
    return Response.json({ error: error.message }, { status: 403 });
  }

  console.error('Services and packages operation failed:', error);
  return Response.json({
    error: 'Unable to process services and packages request.',
    details: process.env.NODE_ENV === 'development' ? errorMetadata(error) : undefined,
  }, { status: 500 });
}
