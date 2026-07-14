import {
  AuditAction,
  AuditStatus,
  CommandCenterJobStatus,
  CommandCenterJobType,
  ContentType,
  KnowledgeIndexStatus,
  Prisma,
  PublicationStatus,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auditActor, createAuditLog, getRequestContext } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import {
  commandCenterSlug,
  ContentValidationError,
  parseContentType,
  validateContentPayload,
} from './content-schema';

const POLICY_TYPES = new Set<ContentType>([
  ContentType.RULES,
  ContentType.PRIVACY,
  ContentType.TERMS,
]);

const EDITABLE_CONTENT_STATUSES = new Set<PublicationStatus>([
  PublicationStatus.DRAFT,
  PublicationStatus.IN_REVIEW,
  PublicationStatus.APPROVED,
  PublicationStatus.REJECTED,
]);

const DIRECTLY_EDITABLE_CONTENT_STATUSES = new Set<PublicationStatus>([
  PublicationStatus.DRAFT,
  PublicationStatus.REJECTED,
]);

const DELETABLE_CONTENT_STATUSES = new Set<PublicationStatus>([
  PublicationStatus.DRAFT,
  PublicationStatus.REJECTED,
  PublicationStatus.CANCELLED,
]);

const PUBLIC_PATHS: Record<ContentType, string> = {
  GALLERY_ITEM: '/gallery',
  FACILITY: '/facilities',
  RULES: '/rules',
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-and-conditions',
};

type DbClient = typeof prisma | Prisma.TransactionClient;

export class CommandCenterError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CommandCenterError';
    this.status = status;
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown) {
  return text(value) || null;
}

function requiredText(value: unknown, label: string) {
  const result = text(value);
  if (!result) throw new CommandCenterError(`${label} is required.`);
  return result;
}

function optionalDate(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') return null;
  const result = new Date(String(value));

  if (Number.isNaN(result.getTime())) throw new CommandCenterError(`${label} must be a valid date.`);
  return result;
}

function versionDto(version: {
  id: string;
  versionNumber: number;
  status: PublicationStatus;
  payload: Prisma.JsonValue;
  changeSummary: string | null;
  internalNotes: string | null;
  publishAt: Date | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  publishedBy: string | null;
  archivedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...version,
    publishAt: version.publishAt?.toISOString() ?? null,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    expiresAt: version.expiresAt?.toISOString() ?? null,
    approvedAt: version.approvedAt?.toISOString() ?? null,
    archivedAt: version.archivedAt?.toISOString() ?? null,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}

const contentInclude = {
  collection: { select: { id: true, name: true, slug: true } },
  versions: { orderBy: { versionNumber: 'desc' as const } },
} satisfies Prisma.ContentItemInclude;

type ContentRecord = Prisma.ContentItemGetPayload<{ include: typeof contentInclude }>;

function contentDto(item: ContentRecord, includeRestricted = true) {
  const now = Date.now();
  const visibleVersions = includeRestricted
    ? item.versions
    : item.versions.filter((version) => (
      version.status === PublicationStatus.PUBLISHED &&
      (!version.expiresAt || version.expiresAt.getTime() > now)
    ));
  const published = visibleVersions.find((version) => (
    version.status === PublicationStatus.PUBLISHED &&
    (!version.expiresAt || version.expiresAt.getTime() > now)
  ));
  const draft = includeRestricted
    ? visibleVersions.find((version) => EDITABLE_CONTENT_STATUSES.has(version.status))
    : undefined;
  const scheduled = includeRestricted
    ? visibleVersions.find((version) => version.status === PublicationStatus.SCHEDULED)
    : undefined;

  return {
    id: item.id,
    type: item.type,
    slug: item.slug,
    title: item.title,
    collection: item.collection,
    collectionId: item.collectionId,
    eventCategoryId: item.eventCategoryId,
    displayOrder: item.displayOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    currentPublishedVersion: published ? versionDto(published) : null,
    currentDraftVersion: draft ? versionDto(draft) : null,
    scheduledVersion: scheduled ? versionDto(scheduled) : null,
    versions: visibleVersions.map(versionDto),
  };
}

async function itemOrThrow(id: string, db: DbClient = prisma) {
  const item = await db.contentItem.findUnique({ where: { id }, include: contentInclude });
  if (!item) throw new CommandCenterError('Content item not found.', 404);
  return item;
}

async function versionOrThrow(id: string, db: DbClient = prisma) {
  const version = await db.contentVersion.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!version) throw new CommandCenterError('Content version not found.', 404);
  return version;
}

async function auditContent(input: {
  actor: CurrentAdmin;
  request?: Request;
  action: AuditAction;
  event: string;
  description: string;
  contentItemId: string;
  contentVersionId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  const context = input.request ? getRequestContext(input.request) : {};
  await createAuditLog({
    ...auditActor(input.actor),
    ...context,
    action: input.action,
    module: 'ZENTRA Command Center',
    description: input.description,
    status: AuditStatus.SUCCESS,
    previousValues: input.previousValues,
    newValues: input.newValues,
    metadata: {
      event: input.event,
      contentItemId: input.contentItemId,
      contentVersionId: input.contentVersionId,
    },
  });
}

export async function listContentItems(type?: ContentType, includeRestricted = true) {
  const items = await prisma.contentItem.findMany({
    where: type ? { type } : undefined,
    include: contentInclude,
    orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  return items
    .map((item) => contentDto(item, includeRestricted))
    .filter((item) => includeRestricted || item.currentPublishedVersion);
}

export async function getContentItem(id: string, includeRestricted = true) {
  return contentDto(await itemOrThrow(id), includeRestricted);
}

export async function createContentItem(
  input: Record<string, unknown>,
  actor: CurrentAdmin,
  request?: Request,
) {
  const type = parseContentType(input.type);
  const title = requiredText(input.title, 'Title');
  const slug = commandCenterSlug(input.slug || title);
  const payload = validateContentPayload(type, input.payload);
  const displayOrder = Number.isInteger(Number(input.displayOrder)) ? Number(input.displayOrder) : 0;

  const item = await prisma.contentItem.create({
    data: {
      type,
      title,
      slug,
      collectionId: optionalText(input.collectionId),
      eventCategoryId: optionalText(input.eventCategoryId),
      displayOrder,
      createdBy: actor.id,
      updatedBy: actor.id,
      versions: {
        create: {
          versionNumber: 1,
          status: PublicationStatus.DRAFT,
          payload,
          changeSummary: optionalText(input.changeSummary) || 'Initial draft.',
          internalNotes: optionalText(input.internalNotes),
          createdBy: actor.id,
        },
      },
    },
    include: contentInclude,
  });

  await auditContent({
    actor,
    request,
    action: AuditAction.CREATE,
    event: 'CONTENT_ITEM_CREATED',
    description: `Created ${type} draft “${title}”.`,
    contentItemId: item.id,
    contentVersionId: item.versions[0]?.id,
    newValues: { type, title, slug, displayOrder },
  });
  return contentDto(item);
}

export async function createDraftVersion(
  itemId: string,
  input: Record<string, unknown>,
  actor: CurrentAdmin,
  request?: Request,
) {
  const current = await itemOrThrow(itemId);
  const existingEditable = current.versions.find((version) => EDITABLE_CONTENT_STATUSES.has(version.status));

  if (existingEditable) {
    throw new CommandCenterError('This item already has an editable draft version.', 409);
  }

  const source = current.versions.find((version) => version.status === PublicationStatus.PUBLISHED) ??
    current.versions[0];
  if (!source && input.payload === undefined) {
    throw new CommandCenterError('Draft payload is required.', 422);
  }

  const payload = validateContentPayload(current.type, input.payload ?? source?.payload);
  const nextVersion = (current.versions[0]?.versionNumber ?? 0) + 1;
  const created = await prisma.contentVersion.create({
    data: {
      contentItemId: current.id,
      versionNumber: nextVersion,
      status: PublicationStatus.DRAFT,
      payload,
      changeSummary: optionalText(input.changeSummary) || `Draft version ${nextVersion}.`,
      internalNotes: optionalText(input.internalNotes),
      createdBy: actor.id,
    },
  });

  await auditContent({
    actor,
    request,
    action: AuditAction.CREATE,
    event: 'CONTENT_VERSION_CREATED',
    description: `Created ${current.type} draft version ${nextVersion}.`,
    contentItemId: current.id,
    contentVersionId: created.id,
  });
  return getContentItem(current.id);
}

export async function updateDraftVersion(
  itemId: string,
  versionId: string,
  input: Record<string, unknown>,
  actor: CurrentAdmin,
  request?: Request,
) {
  const version = await versionOrThrow(versionId);
  if (version.contentItemId !== itemId) throw new CommandCenterError('Version does not belong to this item.', 409);
  if (!DIRECTLY_EDITABLE_CONTENT_STATUSES.has(version.status)) {
    throw new CommandCenterError('Only draft or rejected versions can be edited.', 409);
  }

  const payload = input.payload === undefined
    ? version.payload === null ? Prisma.JsonNull : version.payload as Prisma.InputJsonValue
    : validateContentPayload(version.contentItem.type, input.payload);
  await prisma.$transaction([
    prisma.contentVersion.update({
      where: { id: version.id },
      data: {
        payload,
        status: PublicationStatus.DRAFT,
        changeSummary: input.changeSummary === undefined
          ? version.changeSummary
          : optionalText(input.changeSummary),
        internalNotes: input.internalNotes === undefined
          ? version.internalNotes
          : optionalText(input.internalNotes),
      },
    }),
    prisma.contentItem.update({
      where: { id: itemId },
      data: {
        title: input.title ? requiredText(input.title, 'Title') : undefined,
        displayOrder: input.displayOrder === undefined ? undefined : Number(input.displayOrder),
        collectionId: input.collectionId === undefined ? undefined : optionalText(input.collectionId),
        eventCategoryId: input.eventCategoryId === undefined ? undefined : optionalText(input.eventCategoryId),
        updatedBy: actor.id,
      },
    }),
  ]);

  await auditContent({
    actor,
    request,
    action: AuditAction.UPDATE,
    event: 'CONTENT_DRAFT_UPDATED',
    description: `Updated ${version.contentItem.type} draft version ${version.versionNumber}.`,
    contentItemId: itemId,
    contentVersionId: version.id,
  });
  return getContentItem(itemId);
}

export async function changeContentReviewStatus(input: {
  itemId: string;
  versionId: string;
  action: 'submit' | 'approve' | 'reject';
  changeSummary?: unknown;
  actor: CurrentAdmin;
  request?: Request;
}) {
  const version = await versionOrThrow(input.versionId);
  if (version.contentItemId !== input.itemId) throw new CommandCenterError('Version does not belong to this item.', 409);

  const transitions: Record<typeof input.action, { from: PublicationStatus[]; to: PublicationStatus }> = {
    submit: { from: [PublicationStatus.DRAFT, PublicationStatus.REJECTED], to: PublicationStatus.IN_REVIEW },
    approve: { from: [PublicationStatus.IN_REVIEW], to: PublicationStatus.APPROVED },
    reject: { from: [PublicationStatus.IN_REVIEW], to: PublicationStatus.REJECTED },
  };
  const transition = transitions[input.action];
  if (!transition.from.includes(version.status)) {
    throw new CommandCenterError(`Cannot ${input.action} a ${version.status.toLowerCase()} version.`, 409);
  }

  await prisma.contentVersion.update({
    where: { id: version.id },
    data: {
      status: transition.to,
      changeSummary: optionalText(input.changeSummary) || version.changeSummary,
      approvedAt: input.action === 'approve' ? new Date() : null,
      approvedBy: input.action === 'approve' ? input.actor.id : null,
    },
  });
  await auditContent({
    actor: input.actor,
    request: input.request,
    action: input.action === 'approve' ? AuditAction.APPROVAL : input.action === 'reject'
      ? AuditAction.REJECTION
      : AuditAction.SUBMISSION,
    event: `CONTENT_${input.action.toUpperCase()}`,
    description: `${input.action} ${version.contentItem.type} version ${version.versionNumber}.`,
    contentItemId: input.itemId,
    contentVersionId: version.id,
  });
  return getContentItem(input.itemId);
}

async function ensurePolicyExpiryReplacement(
  db: DbClient,
  contentItemId: string,
  type: ContentType,
  expiresAt: Date | null,
  excludeVersionId: string,
) {
  if (!expiresAt || !POLICY_TYPES.has(type)) return;
  const replacement = await db.contentVersion.findFirst({
    where: {
      contentItemId,
      id: { not: excludeVersionId },
      status: PublicationStatus.SCHEDULED,
      publishAt: { lte: expiresAt },
    },
    select: { id: true },
  });
  if (!replacement) {
    throw new CommandCenterError(
      'Rules, Privacy, and Terms cannot expire without a replacement scheduled before expiry.',
      409,
    );
  }
}

export async function prepareContentPublicationPayload(type: ContentType, payload: Prisma.JsonValue) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new CommandCenterError('Published content payload is invalid.', 422);
  }
  const next = { ...(payload as Record<string, unknown>) };
  const { promoteMediaAsset } = await import('./media.service');
  if (type === ContentType.GALLERY_ITEM && typeof next.mediaAssetId === 'string' && next.mediaAssetId) {
    const asset = await promoteMediaAsset(next.mediaAssetId);
    next.imageUrl = asset.publicUrl;
  }
  if (type === ContentType.FACILITY && Array.isArray(next.mediaAssetIds) && next.mediaAssetIds.length) {
    const assets = await Promise.all(next.mediaAssetIds
      .filter((id): id is string => typeof id === 'string' && Boolean(id))
      .map((id) => promoteMediaAsset(id)));
    next.imageUrls = assets.map((asset) => asset.publicUrl).filter(Boolean);
  }
  return validateContentPayload(type, next);
}

export async function publishContentVersion(input: {
  itemId: string;
  versionId: string;
  expiresAt?: unknown;
  actor: CurrentAdmin;
  request?: Request;
}) {
  const version = await versionOrThrow(input.versionId);
  if (version.contentItemId !== input.itemId) throw new CommandCenterError('Version does not belong to this item.', 409);
  if (version.status !== PublicationStatus.APPROVED) {
    throw new CommandCenterError('Only approved versions can be published.', 409);
  }

  const expiresAt = optionalDate(input.expiresAt, 'Expiration');
  if (expiresAt && expiresAt <= new Date()) throw new CommandCenterError('Expiration must be in the future.');
  const now = new Date();
  const promotedPayload = await prepareContentPublicationPayload(version.contentItem.type, version.payload);
  const context = input.request ? getRequestContext(input.request) : {};
  const actor = auditActor(input.actor);

  await prisma.$transaction(async (transaction) => {
    await ensurePolicyExpiryReplacement(
      transaction,
      version.contentItemId,
      version.contentItem.type,
      expiresAt,
      version.id,
    );
    await transaction.contentVersion.updateMany({
      where: {
        contentItemId: version.contentItemId,
        status: PublicationStatus.PUBLISHED,
        id: { not: version.id },
      },
      data: { status: PublicationStatus.ARCHIVED, archivedAt: now },
    });
    await transaction.contentVersion.update({
      where: { id: version.id },
      data: {
        status: PublicationStatus.PUBLISHED,
        publishAt: null,
        publishedAt: now,
        publishedBy: input.actor.id,
        expiresAt,
        payload: promotedPayload,
      },
    });
    const latestGeneration = await transaction.knowledgeIndexGeneration.aggregate({
      _max: { generation: true },
    });
    const indexGeneration = await transaction.knowledgeIndexGeneration.create({
      data: {
        generation: (latestGeneration._max.generation ?? 0) + 1,
        modelIdentifier: process.env.GEMINI_EMBEDDING_MODEL?.trim() || 'gemini-embedding-001',
        embeddingDimension: 768,
        status: KnowledgeIndexStatus.PENDING,
      },
    });
    await transaction.commandCenterJob.create({
      data: {
        type: CommandCenterJobType.INDEX_KNOWLEDGE,
        resourceType: 'knowledge_generation',
        resourceId: indexGeneration.id,
        status: CommandCenterJobStatus.QUEUED,
        scheduledAt: now,
        idempotencyKey: `index:content:${version.id}`,
        createdBy: input.actor.id,
      },
    });
    if (expiresAt) {
      await transaction.commandCenterJob.create({
        data: {
          type: CommandCenterJobType.EXPIRE_VERSION,
          resourceType: 'content_version',
          resourceId: version.id,
          status: CommandCenterJobStatus.QUEUED,
          scheduledAt: expiresAt,
          idempotencyKey: `expire:content:${version.id}:${expiresAt.toISOString()}`,
          createdBy: input.actor.id,
        },
      });
    }
    await transaction.auditLog.create({
      data: {
        ...actor,
        ...context,
        action: AuditAction.APPROVAL,
        module: 'ZENTRA Command Center',
        description: `Published ${version.contentItem.type} version ${version.versionNumber}.`,
        status: AuditStatus.SUCCESS,
        metadata: {
          event: 'CONTENT_PUBLISHED',
          contentItemId: version.contentItemId,
          contentVersionId: version.id,
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      },
    });
  });

  revalidatePath(PUBLIC_PATHS[version.contentItem.type]);
  return getContentItem(version.contentItemId);
}

export async function scheduleContentVersion(input: {
  itemId: string;
  versionId: string;
  publishAt: unknown;
  expiresAt?: unknown;
  changeSummary?: unknown;
  actor: CurrentAdmin;
  request?: Request;
}) {
  const version = await versionOrThrow(input.versionId);
  if (version.contentItemId !== input.itemId) throw new CommandCenterError('Version does not belong to this item.', 409);
  if (version.status !== PublicationStatus.APPROVED) {
    throw new CommandCenterError('Only approved versions can be scheduled.', 409);
  }
  const publishAt = optionalDate(input.publishAt, 'Publication time');
  if (!publishAt || publishAt <= new Date()) throw new CommandCenterError('Publication time must be in the future.');
  const expiresAt = optionalDate(input.expiresAt, 'Expiration');
  if (expiresAt && expiresAt <= publishAt) {
    throw new CommandCenterError('Expiration must be later than publication time.');
  }

  const scheduled = await prisma.contentVersion.findFirst({
    where: {
      contentItemId: version.contentItemId,
      status: PublicationStatus.SCHEDULED,
      id: { not: version.id },
    },
    select: { id: true },
  });
  if (scheduled) throw new CommandCenterError('This item already has a scheduled version.', 409);

  await prisma.$transaction([
    prisma.contentVersion.update({
      where: { id: version.id },
      data: {
        status: PublicationStatus.SCHEDULED,
        publishAt,
        expiresAt,
        changeSummary: optionalText(input.changeSummary) || version.changeSummary,
      },
    }),
    prisma.commandCenterJob.create({
      data: {
        type: CommandCenterJobType.PUBLISH_VERSION,
        resourceType: 'content_version',
        resourceId: version.id,
        status: CommandCenterJobStatus.QUEUED,
        scheduledAt: publishAt,
        idempotencyKey: `publish:content:${version.id}:${publishAt.toISOString()}`,
        payload: expiresAt ? { expiresAt: expiresAt.toISOString() } : Prisma.JsonNull,
        createdBy: input.actor.id,
      },
    }),
  ]);

  await auditContent({
    actor: input.actor,
    request: input.request,
    action: AuditAction.APPROVAL,
    event: 'CONTENT_SCHEDULED',
    description: `Scheduled ${version.contentItem.type} version ${version.versionNumber}.`,
    contentItemId: version.contentItemId,
    contentVersionId: version.id,
    newValues: { publishAt: publishAt.toISOString(), expiresAt: expiresAt?.toISOString() ?? null },
  });
  return getContentItem(version.contentItemId);
}

export async function archiveContentItem(
  itemId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const item = await itemOrThrow(itemId);
  const now = new Date();
  await prisma.$transaction([
    prisma.contentVersion.updateMany({
      where: {
        contentItemId: item.id,
        status: { in: [PublicationStatus.PUBLISHED, PublicationStatus.SCHEDULED] },
      },
      data: { status: PublicationStatus.ARCHIVED, archivedAt: now },
    }),
    prisma.commandCenterJob.updateMany({
      where: {
        resourceId: { in: item.versions.map((version) => version.id) },
        status: { in: [CommandCenterJobStatus.QUEUED, CommandCenterJobStatus.RETRYING] },
      },
      data: { status: CommandCenterJobStatus.CANCELLED, completedAt: now },
    }),
  ]);
  await auditContent({
    actor,
    request,
    action: AuditAction.DELETE,
    event: 'CONTENT_ARCHIVED',
    description: `Archived ${item.type} “${item.title}”.`,
    contentItemId: item.id,
  });
  revalidatePath(PUBLIC_PATHS[item.type]);
  return getContentItem(item.id);
}

export async function rollbackContentVersion(
  itemId: string,
  historicalVersionId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const item = await itemOrThrow(itemId);
  const historical = item.versions.find((version) => version.id === historicalVersionId);
  if (!historical) throw new CommandCenterError('Historical version not found.', 404);
  const editable = item.versions.find((version) => EDITABLE_CONTENT_STATUSES.has(version.status));
  if (editable) throw new CommandCenterError('Resolve the current draft before starting a rollback.', 409);

  const nextVersion = (item.versions[0]?.versionNumber ?? 0) + 1;
  const created = await prisma.contentVersion.create({
    data: {
      contentItemId: item.id,
      versionNumber: nextVersion,
      status: PublicationStatus.DRAFT,
      payload: historical.payload as Prisma.InputJsonValue,
      changeSummary: `Rollback draft copied from version ${historical.versionNumber}.`,
      createdBy: actor.id,
    },
  });
  await auditContent({
    actor,
    request,
    action: AuditAction.CREATE,
    event: 'CONTENT_ROLLBACK_DRAFT_CREATED',
    description: `Created rollback draft ${nextVersion} from version ${historical.versionNumber}.`,
    contentItemId: item.id,
    contentVersionId: created.id,
  });
  return getContentItem(item.id);
}

export async function deleteDraftVersion(
  itemId: string,
  versionId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const version = await versionOrThrow(versionId);
  if (version.contentItemId !== itemId) throw new CommandCenterError('Version does not belong to this item.', 409);
  if (!DELETABLE_CONTENT_STATUSES.has(version.status)) {
    throw new CommandCenterError('Only unreferenced draft, rejected, or cancelled versions can be deleted.', 409);
  }
  await prisma.contentVersion.delete({ where: { id: version.id } });
  await auditContent({
    actor,
    request,
    action: AuditAction.DELETE,
    event: 'CONTENT_DRAFT_DELETED',
    description: `Deleted ${version.contentItem.type} draft version ${version.versionNumber}.`,
    contentItemId: itemId,
    contentVersionId: version.id,
  });
  return getContentItem(itemId);
}

export async function listPublishedContent(type: ContentType) {
  const now = new Date();
  const items = await prisma.contentItem.findMany({
    where: {
      type,
      versions: {
        some: {
          status: PublicationStatus.PUBLISHED,
          publishedAt: { lte: now },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
    },
    include: {
      collection: { select: { id: true, name: true, slug: true } },
      versions: {
        where: {
          status: PublicationStatus.PUBLISHED,
          publishedAt: { lte: now },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
  });

  return items.map((item) => ({
    id: item.id,
    type: item.type,
    slug: item.slug,
    title: item.title,
    collection: item.collection,
    eventCategoryId: item.eventCategoryId,
    displayOrder: item.displayOrder,
    version: item.versions[0] ? versionDto(item.versions[0]) : null,
  }));
}

export function handleCommandCenterError(error: unknown) {
  if (error instanceof CommandCenterError || error instanceof ContentValidationError) {
    const status = error instanceof CommandCenterError ? error.status : 422;
    return Response.json({ success: false, error: error.message }, { status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return Response.json({ success: false, error: 'A conflicting record already exists.' }, { status: 409 });
  }

  console.error('Command Center request failed:', error);
  return Response.json({ success: false, error: 'Command Center request failed.' }, { status: 500 });
}
