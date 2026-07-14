import {
  AssistantResponseStatus,
  CommandCenterJobStatus,
  KnowledgeIndexStatus,
  PublicationStatus,
  TaskTemplateStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getCommandCenterOverview() {
  const now = new Date();
  const [
    failedJobs,
    queuedJobs,
    scheduledPublications,
    expiredPublishedContent,
    activeIndex,
    pendingKnowledge,
    unansweredQuestions,
    assistantUnableToVerify,
    activeGeneralTemplate,
    eventCategories,
    activeEventTemplates,
    recentChanges,
  ] = await Promise.all([
    prisma.commandCenterJob.count({ where: { status: CommandCenterJobStatus.FAILED } }),
    prisma.commandCenterJob.count({
      where: { status: { in: [CommandCenterJobStatus.QUEUED, CommandCenterJobStatus.RETRYING] } },
    }),
    prisma.contentVersion.count({ where: { status: PublicationStatus.SCHEDULED, publishAt: { gt: now } } }),
    prisma.contentVersion.count({
      where: { status: PublicationStatus.PUBLISHED, expiresAt: { lte: now } },
    }),
    prisma.knowledgeIndexGeneration.findFirst({
      where: { status: KnowledgeIndexStatus.READY, isActive: true },
      orderBy: { generation: 'desc' },
    }),
    prisma.knowledgeDocumentVersion.count({
      where: { status: { in: [PublicationStatus.DRAFT, PublicationStatus.IN_REVIEW, PublicationStatus.APPROVED] } },
    }),
    prisma.assistantUnansweredQuestion.count({ where: { status: 'NEW' } }),
    prisma.assistantInteraction.count({
      where: { status: AssistantResponseStatus.UNABLE_TO_VERIFY, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    }),
    prisma.taskTemplate.findFirst({
      where: {
        templateKey: 'general_event_standard',
        status: TaskTemplateStatus.PUBLISHED,
        isActive: true,
      },
      select: { id: true, version: true, updatedAt: true },
    }),
    prisma.eventCategory.count({ where: { status: 'ACTIVE' } }),
    prisma.taskTemplate.count({
      where: {
        eventCategoryId: { not: null },
        status: TaskTemplateStatus.PUBLISHED,
        isActive: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { module: 'ZENTRA Command Center' },
      orderBy: { timestamp: 'desc' },
      take: 8,
      select: {
        id: true,
        timestamp: true,
        userName: true,
        action: true,
        description: true,
        status: true,
      },
    }),
  ]);

  return {
    jobs: { failed: failedJobs, queued: queuedJobs },
    publishing: { scheduled: scheduledPublications, overdueExpirations: expiredPublishedContent },
    knowledge: {
      activeGeneration: activeIndex ? {
        generation: activeIndex.generation,
        modelIdentifier: activeIndex.modelIdentifier,
        embeddingDimension: activeIndex.embeddingDimension,
        activatedAt: activeIndex.activatedAt?.toISOString() ?? null,
      } : null,
      pendingSources: pendingKnowledge,
    },
    assistant: { unansweredQuestions, unableToVerifyLast30Days: assistantUnableToVerify },
    taskTemplates: {
      generalFallbackReady: Boolean(activeGeneralTemplate),
      generalVersion: activeGeneralTemplate?.version ?? null,
      eventCategoryCoverage: eventCategories === 0 ? 1 : activeEventTemplates / eventCategories,
      activeEventTemplates,
      eventCategories,
    },
    recentChanges: recentChanges.map((change) => ({
      ...change,
      timestamp: change.timestamp.toISOString(),
    })),
  };
}

