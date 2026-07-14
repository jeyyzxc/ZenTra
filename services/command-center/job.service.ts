import {
  AuditAction,
  AuditStatus,
  CommandCenterJobStatus,
  CommandCenterJobType,
  KnowledgeIndexStatus,
  Prisma,
  PublicationStatus,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createAuditLog, errorMetadata, systemAuditActor } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { CommandCenterError, prepareContentPublicationPayload } from './content.service';
import { buildKnowledgeIndex } from '@/services/smart-assistant/knowledge.service';

const RETRY_MINUTES = [1, 5, 15, 15, 15] as const;
const CANCELLABLE_JOB_STATUSES = new Set<CommandCenterJobStatus>([
  CommandCenterJobStatus.QUEUED,
  CommandCenterJobStatus.RETRYING,
]);
const CONTENT_PATHS = {
  GALLERY_ITEM: '/gallery',
  FACILITY: '/facilities',
  RULES: '/rules',
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-and-conditions',
} as const;

function safeWorker(value: unknown) {
  const worker = typeof value === 'string' ? value.trim() : '';
  if (!worker || worker.length > 120) throw new CommandCenterError('Worker ID is invalid.', 400);
  return worker;
}

export async function listCommandCenterJobs(input?: {
  status?: CommandCenterJobStatus;
  take?: number;
}) {
  const take = Math.min(Math.max(input?.take ?? 100, 1), 250);
  const jobs = await prisma.commandCenterJob.findMany({
    where: input?.status ? { status: input.status } : undefined,
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    take,
  });

  return jobs.map((job) => ({
    ...job,
    scheduledAt: job.scheduledAt.toISOString(),
    leaseExpiresAt: job.leaseExpiresAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }));
}

export async function claimCommandCenterJobs(input: {
  workerId: unknown;
  limit?: unknown;
  leaseSeconds?: unknown;
}) {
  const workerId = safeWorker(input.workerId);
  const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 50);
  const leaseSeconds = Math.min(Math.max(Number(input.leaseSeconds) || 120, 30), 600);

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "command_center_jobs"
      WHERE (
        "status" IN ('QUEUED', 'RETRYING')
        OR (
          "status" = 'PROCESSING'
          AND "lease_expires_at" IS NOT NULL
          AND "lease_expires_at" <= NOW()
        )
      )
      AND "scheduled_at" <= NOW()
      ORDER BY "scheduled_at" ASC, "created_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    `);

    if (claimed.length === 0) return [];
    const ids = claimed.map((job) => job.id);
    const leaseExpiresAt = new Date(Date.now() + leaseSeconds * 1_000);

    await transaction.commandCenterJob.updateMany({
      where: { id: { in: ids } },
      data: {
        status: CommandCenterJobStatus.PROCESSING,
        leaseOwner: workerId,
        leaseExpiresAt,
        attemptCount: { increment: 1 },
      },
    });

    return transaction.commandCenterJob.findMany({
      where: { id: { in: ids }, leaseOwner: workerId },
      select: {
        id: true,
        type: true,
        resourceType: true,
        resourceId: true,
        attemptCount: true,
        maxAttempts: true,
        scheduledAt: true,
        leaseExpiresAt: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  });
}

async function publishScheduledContent(job: {
  id: string;
  resourceId: string;
}) {
  const now = new Date();
  const candidate = await prisma.contentVersion.findUnique({
    where: { id: job.resourceId },
    include: { contentItem: true },
  });
  if (!candidate) throw new CommandCenterError('Scheduled content version no longer exists.', 404);
  if (candidate.status === PublicationStatus.PUBLISHED) {
    return { publishedVersionId: candidate.id, publishedAt: candidate.publishedAt?.toISOString() ?? now.toISOString() };
  }
  if (candidate.status !== PublicationStatus.SCHEDULED) {
    throw new CommandCenterError('Scheduled content is no longer publishable.', 409);
  }
  if (candidate.publishAt && candidate.publishAt > now) {
    throw new CommandCenterError('Scheduled content is not due yet.', 409);
  }
  const promotedPayload = await prepareContentPublicationPayload(
    candidate.contentItem.type,
    candidate.payload,
  );
  const published = await prisma.$transaction(async (transaction) => {
    const version = await transaction.contentVersion.findUnique({
      where: { id: job.resourceId },
      include: { contentItem: true },
    });
    if (!version) throw new CommandCenterError('Scheduled content version no longer exists.', 404);
    if (version.status !== PublicationStatus.SCHEDULED) {
      if (version.status === PublicationStatus.PUBLISHED) return version;
      throw new CommandCenterError('Scheduled content is no longer publishable.', 409);
    }
    if (version.publishAt && version.publishAt > now) {
      throw new CommandCenterError('Scheduled content is not due yet.', 409);
    }
    await transaction.contentVersion.updateMany({
      where: {
        contentItemId: version.contentItemId,
        status: PublicationStatus.PUBLISHED,
        id: { not: version.id },
      },
      data: { status: PublicationStatus.ARCHIVED, archivedAt: now },
    });
    const next = await transaction.contentVersion.update({
      where: { id: version.id },
      data: {
        status: PublicationStatus.PUBLISHED,
        publishedAt: now,
        publishedBy: version.publishedBy || 'SYSTEM_N8N',
        payload: promotedPayload,
      },
      include: { contentItem: true },
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
    await transaction.commandCenterJob.upsert({
      where: { idempotencyKey: `index:content:${version.id}` },
      create: {
        type: CommandCenterJobType.INDEX_KNOWLEDGE,
        resourceType: 'knowledge_generation',
        resourceId: indexGeneration.id,
        idempotencyKey: `index:content:${version.id}`,
      },
      update: {},
    });
    if (version.expiresAt) {
      await transaction.commandCenterJob.upsert({
        where: { idempotencyKey: `expire:content:${version.id}:${version.expiresAt.toISOString()}` },
        create: {
          type: CommandCenterJobType.EXPIRE_VERSION,
          resourceType: 'content_version',
          resourceId: version.id,
          scheduledAt: version.expiresAt,
          idempotencyKey: `expire:content:${version.id}:${version.expiresAt.toISOString()}`,
        },
        update: {},
      });
    }
    return next;
  });

  revalidatePath(CONTENT_PATHS[published.contentItem.type]);
  return { publishedVersionId: published.id, publishedAt: now.toISOString() };
}

async function expireContent(job: { resourceId: string }) {
  const version = await prisma.contentVersion.findUnique({
    where: { id: job.resourceId },
    include: { contentItem: true },
  });
  if (!version) return { skipped: true, reason: 'version_missing' };
  if (version.status !== PublicationStatus.PUBLISHED) {
    return { skipped: true, reason: `status_${version.status.toLowerCase()}` };
  }
  if (!version.expiresAt || version.expiresAt > new Date()) {
    throw new CommandCenterError('Content is not due for expiration.', 409);
  }
  await prisma.contentVersion.update({
    where: { id: version.id },
    data: { status: PublicationStatus.EXPIRED },
  });
  revalidatePath(CONTENT_PATHS[version.contentItem.type]);
  return { expiredVersionId: version.id, expiredAt: new Date().toISOString() };
}

async function projectIndexJob(job: { resourceType: string; resourceId: string }) {
  if (job.resourceType === 'content_version') {
    const version = await prisma.contentVersion.findUnique({
      where: { id: job.resourceId },
      include: { contentItem: true },
    });
    if (!version || version.status !== PublicationStatus.PUBLISHED) {
      return { skipped: true, reason: 'not_published' };
    }
    return { queuedForKnowledgeProjection: true, contentVersionId: version.id };
  }

  if (job.resourceType === 'knowledge_generation') {
    return buildKnowledgeIndex(job.resourceId);
  }

  return { skipped: true, reason: 'unsupported_resource_type' };
}

async function performJob(job: {
  id: string;
  type: CommandCenterJobType;
  resourceType: string;
  resourceId: string;
}) {
  switch (job.type) {
    case CommandCenterJobType.PUBLISH_VERSION:
      if (job.resourceType !== 'content_version') {
        throw new CommandCenterError('Unsupported publication resource.', 422);
      }
      return publishScheduledContent(job);
    case CommandCenterJobType.EXPIRE_VERSION:
      if (job.resourceType !== 'content_version') {
        throw new CommandCenterError('Unsupported expiration resource.', 422);
      }
      return expireContent(job);
    case CommandCenterJobType.INDEX_KNOWLEDGE:
      return projectIndexJob(job);
    case CommandCenterJobType.DELETE_MEDIA:
      return { deferredToStorageCleanup: true, mediaAssetId: job.resourceId };
    case CommandCenterJobType.TASK_MIGRATION:
      return { deferredToMigrationService: true, migrationRunId: job.resourceId };
  }
}

export async function executeCommandCenterJob(input: {
  jobId: string;
  workerId: unknown;
}) {
  const workerId = safeWorker(input.workerId);
  const job = await prisma.commandCenterJob.findUnique({ where: { id: input.jobId } });
  if (!job) throw new CommandCenterError('Command Center job not found.', 404);
  if (
    job.status !== CommandCenterJobStatus.PROCESSING ||
    job.leaseOwner !== workerId ||
    !job.leaseExpiresAt ||
    job.leaseExpiresAt <= new Date()
  ) {
    throw new CommandCenterError('Job lease is missing, expired, or owned by another worker.', 409);
  }

  try {
    const result = await performJob(job);
    const completed = await prisma.commandCenterJob.update({
      where: { id: job.id },
      data: {
        status: CommandCenterJobStatus.SUCCESS,
        result: result as Prisma.InputJsonValue,
        safeError: null,
        completedAt: new Date(),
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.UPDATE,
      module: 'ZENTRA Command Center',
      description: `Completed Command Center job ${job.id}.`,
      status: AuditStatus.SUCCESS,
      source: 'n8n',
      metadata: { event: 'COMMAND_CENTER_JOB_COMPLETED', jobId: job.id, type: job.type },
    });
    return completed;
  } catch (error) {
    const attemptsExhausted = job.attemptCount >= job.maxAttempts;
    const retryIndex = Math.min(Math.max(job.attemptCount - 1, 0), RETRY_MINUTES.length - 1);
    const retryAt = new Date(Date.now() + RETRY_MINUTES[retryIndex] * 60_000);
    const safeError = error instanceof Error ? error.message.slice(0, 1_000) : 'Job execution failed.';
    await prisma.commandCenterJob.update({
      where: { id: job.id },
      data: {
        status: attemptsExhausted ? CommandCenterJobStatus.FAILED : CommandCenterJobStatus.RETRYING,
        scheduledAt: attemptsExhausted ? job.scheduledAt : retryAt,
        safeError,
        completedAt: attemptsExhausted ? new Date() : null,
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.ERROR,
      module: 'ZENTRA Command Center',
      description: `Command Center job ${job.id} failed${attemptsExhausted ? ' permanently' : ' and will retry'}.`,
      status: attemptsExhausted ? AuditStatus.FAILED : AuditStatus.WARNING,
      source: 'n8n',
      metadata: {
        event: attemptsExhausted ? 'COMMAND_CENTER_JOB_FAILED' : 'COMMAND_CENTER_JOB_RETRYING',
        jobId: job.id,
        type: job.type,
        attemptCount: job.attemptCount,
        ...errorMetadata(error),
      },
    });
    throw error;
  }
}

export async function retryCommandCenterJob(jobId: string, actorId: string) {
  const job = await prisma.commandCenterJob.findUnique({ where: { id: jobId } });
  if (!job) throw new CommandCenterError('Command Center job not found.', 404);
  if (job.status !== CommandCenterJobStatus.FAILED) {
    throw new CommandCenterError('Only failed jobs can be retried.', 409);
  }
  return prisma.commandCenterJob.update({
    where: { id: job.id },
    data: {
      status: CommandCenterJobStatus.RETRYING,
      scheduledAt: new Date(),
      attemptCount: 0,
      safeError: null,
      completedAt: null,
      createdBy: actorId,
    },
  });
}

export async function cancelCommandCenterJob(jobId: string) {
  const job = await prisma.commandCenterJob.findUnique({ where: { id: jobId } });
  if (!job) throw new CommandCenterError('Command Center job not found.', 404);
  if (!CANCELLABLE_JOB_STATUSES.has(job.status)) {
    throw new CommandCenterError('Only queued or retrying jobs can be cancelled.', 409);
  }
  return prisma.commandCenterJob.update({
    where: { id: job.id },
    data: { status: CommandCenterJobStatus.CANCELLED, completedAt: new Date() },
  });
}
