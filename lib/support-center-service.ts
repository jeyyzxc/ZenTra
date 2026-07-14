import {
  AssistantQuestionStatus,
  AuditAction,
  AuditStatus,
  CommandCenterJobType,
  KnowledgeIndexStatus,
  NotificationPriority,
  NotificationType,
  Prisma,
  PublicationStatus,
  SupportCategoryStatus,
  SupportFaqStatus,
  SupportRelatedModule,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import {
  auditActor,
  createAuditLog,
  errorMetadata,
  getRequestContext,
  systemAuditActor,
} from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const SUPPORT_MODULE = 'support_center';
const FALLBACK_RESPONSE = "I'm not fully sure about that yet. Please contact Zion Events Place directly or send an inquiry so the team can assist you properly.";
const ASSISTANT_MATCH_THRESHOLD = 0.22;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'the',
  'to',
  'we',
  'what',
  'when',
  'where',
  'with',
  'you',
  'your',
]);

type SupportCategoryShape = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  status: SupportCategoryStatus;
  clientVisible: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { entries?: number };
};

type SupportFaqShape = {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  category?: SupportCategoryShape | null;
  tags: string[];
  relatedModule: SupportRelatedModule;
  status: SupportFaqStatus;
  clientVisible: boolean;
  assistantEnabled: boolean;
  priority: number;
  viewCount: number;
  lastUsedByAssistantAt: Date | null;
  internalNotes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions?: Array<{
    id: string;
    oldQuestion: string | null;
    oldAnswer: string | null;
    newQuestion: string | null;
    newAnswer: string | null;
    changeSummary: string | null;
    changedBy: string | null;
    createdAt: Date;
  }>;
  _count?: { versions?: number };
  currentPublishedVersion?: {
    question: string | null;
    answer: string | null;
    tags: string[];
    relatedModule: SupportRelatedModule | null;
    clientVisible: boolean | null;
    assistantEnabled: boolean | null;
    priority: number | null;
    publicationStatus: PublicationStatus;
    publishedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  } | null;
};

type AssistantMatch = {
  entry: SupportFaqShape | null;
  confidence: number;
  response: string;
  fallback: boolean;
};

export class SupportCenterError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'SupportCenterError';
    this.status = status;
  }
}

function text(value: unknown, maxLength = 255) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function requiredText(value: unknown, label: string, maxLength = 255) {
  const normalized = text(value, maxLength);
  if (!normalized) throw new SupportCenterError(`${label} is required.`);
  return normalized;
}

function optionalText(value: unknown, maxLength = 255) {
  const normalized = text(value, maxLength);
  return normalized || null;
}

function booleanValue(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function intValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
  fallback?: T,
) {
  if ((value === undefined || value === null || value === '') && fallback) return fallback;
  const normalized = typeof value === 'string'
    ? value.trim().replaceAll('-', '_').toUpperCase()
    : value;
  if (!values.includes(normalized as T)) {
    throw new SupportCenterError(`${label} is not supported.`);
  }
  return normalized as T;
}

function dateBoundary(value: string | null, boundary: 'start' | 'end') {
  if (!value) return null;
  const parsed = new Date(`${value}${boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'}`);
  if (Number.isNaN(parsed.getTime())) throw new SupportCenterError('Date filters must be valid dates.');
  return parsed;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `category-${randomUUID().slice(0, 8)}`;
}

async function uniqueCategorySlug(name: string, currentId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (await prisma.supportCategory.findFirst({
    where: {
      slug,
      ...(currentId ? { id: { not: currentId } } : {}),
    },
    select: { id: true },
  })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => typeof item === 'string' ? item.split(',') : [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20);
  }

  return [];
}

function enumLabel(value: string) {
  return value.toLowerCase();
}

function adminLabel(actor: CurrentAdmin) {
  return actor.fullName?.trim() || actor.email;
}

function revalidateSupportSurfaces() {
  revalidatePath('/admin/support');
  revalidatePath('/faq');
  revalidatePath('/contact');
  revalidatePath('/');
}

function categoryToDto(category: SupportCategoryShape) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    displayOrder: category.displayOrder,
    status: enumLabel(category.status),
    clientVisible: category.clientVisible,
    createdBy: category.createdBy,
    updatedBy: category.updatedBy,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    entryCount: category._count?.entries ?? 0,
  };
}

function faqToDto(faq: SupportFaqShape, includePrivate = true) {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    categoryId: faq.categoryId,
    categoryName: faq.category?.name ?? null,
    categorySlug: faq.category?.slug ?? null,
    tags: faq.tags,
    relatedModule: enumLabel(faq.relatedModule),
    status: includePrivate ? enumLabel(faq.status) : undefined,
    clientVisible: includePrivate ? faq.clientVisible : undefined,
    assistantEnabled: includePrivate ? faq.assistantEnabled : undefined,
    priority: faq.priority,
    viewCount: includePrivate ? faq.viewCount : undefined,
    lastUsedByAssistantAt: includePrivate ? faq.lastUsedByAssistantAt?.toISOString() ?? null : undefined,
    internalNotes: includePrivate ? faq.internalNotes : undefined,
    createdBy: includePrivate ? faq.createdBy : undefined,
    updatedBy: includePrivate ? faq.updatedBy : undefined,
    createdAt: faq.createdAt.toISOString(),
    updatedAt: faq.updatedAt.toISOString(),
    versionCount: includePrivate ? faq._count?.versions ?? faq.versions?.length ?? 0 : undefined,
    versions: includePrivate && faq.versions
      ? faq.versions.map((version) => ({
          id: version.id,
          oldQuestion: version.oldQuestion,
          oldAnswer: version.oldAnswer,
          newQuestion: version.newQuestion,
          newAnswer: version.newAnswer,
          changeSummary: version.changeSummary,
          changedBy: version.changedBy,
          createdAt: version.createdAt.toISOString(),
        }))
      : undefined,
  };
}

function publishedFaqToDto(faq: SupportFaqShape) {
  const version = faq.currentPublishedVersion;
  if (!version) return faqToDto(faq, false);
  return faqToDto({
    ...faq,
    question: version.question ?? faq.question,
    answer: version.answer ?? faq.answer,
    tags: version.tags,
    relatedModule: version.relatedModule ?? faq.relatedModule,
    clientVisible: version.clientVisible ?? faq.clientVisible,
    assistantEnabled: version.assistantEnabled ?? faq.assistantEnabled,
    priority: version.priority ?? faq.priority,
    updatedAt: version.publishedAt ?? version.createdAt,
  }, false);
}

function publicFaqWhere(search?: string, category?: string): Prisma.SupportFaqEntryWhereInput {
  return {
    status: { notIn: [SupportFaqStatus.HIDDEN, SupportFaqStatus.ARCHIVED] },
    currentPublishedVersion: {
      is: {
        publicationStatus: PublicationStatus.PUBLISHED,
        clientVisible: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
    OR: [
      { categoryId: null },
      {
        category: {
          status: SupportCategoryStatus.ACTIVE,
          clientVisible: true,
        },
      },
    ],
    ...(category
      ? {
          category: {
            status: SupportCategoryStatus.ACTIVE,
            clientVisible: true,
            OR: [{ id: category }, { slug: category }],
          },
        }
      : {}),
    ...(search
      ? {
          AND: [
            {
              OR: [
                { currentPublishedVersion: { is: { question: { contains: search, mode: 'insensitive' } } } },
                { currentPublishedVersion: { is: { answer: { contains: search, mode: 'insensitive' } } } },
                { currentPublishedVersion: { is: { tags: { has: search } } } },
              ],
            },
          ],
        }
      : {}),
  };
}

function buildAdminFaqWhere(url: URL): Prisma.SupportFaqEntryWhereInput {
  const search = optionalText(url.searchParams.get('search'), 200);
  const categoryId = optionalText(url.searchParams.get('categoryId'), 255);
  const statusParam = optionalText(url.searchParams.get('status'), 80);
  const relatedModuleParam = optionalText(url.searchParams.get('relatedModule'), 80);
  const updatedBy = optionalText(url.searchParams.get('updatedBy'), 180);
  const startDate = dateBoundary(url.searchParams.get('startDate'), 'start');
  const endDate = dateBoundary(url.searchParams.get('endDate'), 'end');
  const clientVisible = url.searchParams.get('clientVisible');
  const assistantEnabled = url.searchParams.get('assistantEnabled');
  const where: Prisma.SupportFaqEntryWhereInput = {};

  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { answer: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (statusParam) {
    where.status = enumValue(statusParam, Object.values(SupportFaqStatus), 'status');
  }
  if (relatedModuleParam) {
    where.relatedModule = enumValue(
      relatedModuleParam,
      Object.values(SupportRelatedModule),
      'relatedModule',
    );
  }
  if (clientVisible === 'true' || clientVisible === 'false') {
    where.clientVisible = clientVisible === 'true';
  }
  if (assistantEnabled === 'true' || assistantEnabled === 'false') {
    where.assistantEnabled = assistantEnabled === 'true';
  }
  if (updatedBy) where.updatedBy = { contains: updatedBy, mode: 'insensitive' };
  if (startDate || endDate) {
    where.updatedAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  return where;
}

async function ensureCategory(categoryId: string | null) {
  if (!categoryId) return null;
  const category = await prisma.supportCategory.findUnique({ where: { id: categoryId } });
  if (!category || category.status === SupportCategoryStatus.ARCHIVED) {
    throw new SupportCenterError('Selected category was not found or is archived.', 404);
  }
  return category;
}

export async function getAdminFaqPage(url: URL, includeRestricted = true) {
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 10, 5), 50);
  const requestedWhere = buildAdminFaqWhere(url);
  const where: Prisma.SupportFaqEntryWhereInput = includeRestricted
    ? requestedWhere
    : { AND: [requestedWhere, publicFaqWhere()] };
  const [
    faqs,
    totalRecords,
    categories,
    updatedByOptions,
    total,
    published,
    drafts,
    hidden,
    archived,
    assistantEnabled,
    clientVisible,
    unanswered,
  ] = await Promise.all([
    prisma.supportFaqEntry.findMany({
      where,
      include: { category: true, currentPublishedVersion: true, _count: { select: { versions: true } } },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportFaqEntry.count({ where }),
    prisma.supportCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { entries: true } } },
    }),
    prisma.supportFaqEntry.findMany({
      where: { updatedBy: { not: null } },
      distinct: ['updatedBy'],
      orderBy: { updatedBy: 'asc' },
      select: { updatedBy: true },
    }),
    prisma.supportFaqEntry.count({ where: includeRestricted ? undefined : publicFaqWhere() }),
    prisma.supportFaqEntry.count({ where: includeRestricted ? { status: SupportFaqStatus.PUBLISHED } : publicFaqWhere() }),
    includeRestricted ? prisma.supportFaqEntry.count({ where: { status: SupportFaqStatus.DRAFT } }) : Promise.resolve(0),
    includeRestricted ? prisma.supportFaqEntry.count({ where: { status: SupportFaqStatus.HIDDEN } }) : Promise.resolve(0),
    includeRestricted ? prisma.supportFaqEntry.count({ where: { status: SupportFaqStatus.ARCHIVED } }) : Promise.resolve(0),
    prisma.supportFaqEntry.count({
      where: { status: SupportFaqStatus.PUBLISHED, assistantEnabled: true },
    }),
    prisma.supportFaqEntry.count({
      where: { status: SupportFaqStatus.PUBLISHED, clientVisible: true },
    }),
    prisma.assistantUnansweredQuestion.count({
      where: { status: AssistantQuestionStatus.NEW },
    }),
  ]);

  return {
    faqs: faqs.map((faq) => includeRestricted ? faqToDto(faq) : publishedFaqToDto(faq)),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
    summary: {
      total,
      published,
      drafts,
      hidden,
      archived,
      assistantEnabled,
      clientVisible,
      unanswered,
    },
    filterOptions: {
      categories: categories.map(categoryToDto),
      statuses: Object.values(SupportFaqStatus).map(enumLabel),
      relatedModules: Object.values(SupportRelatedModule).map(enumLabel),
      updatedBy: updatedByOptions.flatMap((item) => item.updatedBy ? [item.updatedBy] : []),
    },
  };
}

export async function getFaqDetail(id: string, includeRestricted = true) {
  const faq = await prisma.supportFaqEntry.findUnique({
    where: { id },
    include: {
      category: true,
      currentPublishedVersion: true,
      versions: { orderBy: { createdAt: 'desc' } },
      _count: { select: { versions: true } },
    },
  });
  if (!faq) throw new SupportCenterError('FAQ entry not found.', 404);
  if (!includeRestricted) {
    if (
      faq.status === SupportFaqStatus.HIDDEN ||
      faq.status === SupportFaqStatus.ARCHIVED ||
      !faq.currentPublishedVersion ||
      faq.currentPublishedVersion.publicationStatus !== PublicationStatus.PUBLISHED ||
      faq.currentPublishedVersion.clientVisible !== true ||
      (faq.currentPublishedVersion.expiresAt && faq.currentPublishedVersion.expiresAt <= new Date())
    ) {
      throw new SupportCenterError('Published FAQ entry not found.', 404);
    }
    return publishedFaqToDto(faq);
  }
  return faqToDto(faq);
}

export async function createFaq(
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const categoryId = optionalText(body.categoryId, 255);
  await ensureCategory(categoryId);

  const data: Prisma.SupportFaqEntryUncheckedCreateInput = {
    question: requiredText(body.question, 'Question', 800),
    answer: requiredText(body.answer, 'Answer', 8000),
    categoryId,
    tags: parseTags(body.tags),
    relatedModule: enumValue(
      body.relatedModule,
      Object.values(SupportRelatedModule),
      'relatedModule',
      SupportRelatedModule.GENERAL,
    ),
    status: SupportFaqStatus.DRAFT,
    clientVisible: booleanValue(body.clientVisible),
    assistantEnabled: booleanValue(body.assistantEnabled),
    priority: intValue(body.priority),
    internalNotes: optionalText(body.internalNotes, 4000),
    createdBy: adminLabel(actor),
    updatedBy: adminLabel(actor),
  };

  const created = await prisma.$transaction(async (transaction) => {
    const entry = await transaction.supportFaqEntry.create({ data });
    const version = await transaction.supportFaqVersion.create({
      data: {
        faqEntryId: entry.id,
        versionNumber: 1,
        question: entry.question,
        answer: entry.answer,
        categoryId: entry.categoryId,
        tags: entry.tags,
        relatedModule: entry.relatedModule,
        clientVisible: entry.clientVisible,
        assistantEnabled: entry.assistantEnabled,
        priority: entry.priority,
        internalNotes: entry.internalNotes,
        publicationStatus: PublicationStatus.DRAFT,
        changeSummary: optionalText(body.changeSummary, 1000) ?? 'Initial FAQ draft.',
        changedBy: adminLabel(actor),
      },
    });
    return transaction.supportFaqEntry.update({
      where: { id: entry.id },
      data: { currentDraftVersionId: version.id },
      include: { category: true, _count: { select: { versions: true } } },
    });
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.CREATE,
    module: SUPPORT_MODULE,
    description: `${actor.username} created support FAQ "${created.question}".`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    newValues: {
      faqId: created.id,
      question: created.question,
      status: created.status,
      clientVisible: created.clientVisible,
      assistantEnabled: created.assistantEnabled,
    },
  });

  revalidateSupportSurfaces();
  return faqToDto(created);
}

export async function updateFaq(
  id: string,
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.supportFaqEntry.findUnique({ where: { id } });
  if (!existing) throw new SupportCenterError('FAQ entry not found.', 404);

  const data: Prisma.SupportFaqEntryUpdateInput = {
    updatedBy: adminLabel(actor),
  };
  const previousValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};
  let changed = false;

  function record(key: string, oldValue: unknown, nextValue: unknown) {
    previousValues[key] = oldValue;
    newValues[key] = nextValue;
    changed = true;
  }

  if ('question' in body) {
    const question = requiredText(body.question, 'Question', 800);
    if (question !== existing.question) {
      data.question = question;
      record('question', existing.question, question);
    }
  }
  if ('answer' in body) {
    const answer = requiredText(body.answer, 'Answer', 8000);
    if (answer !== existing.answer) {
      data.answer = answer;
      record('answer', existing.answer, answer);
    }
  }
  if ('categoryId' in body) {
    const categoryId = optionalText(body.categoryId, 255);
    await ensureCategory(categoryId);
    if (categoryId !== existing.categoryId) {
      data.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
      record('categoryId', existing.categoryId, categoryId);
    }
  }
  if ('tags' in body) {
    const tags = parseTags(body.tags);
    if (JSON.stringify(tags) !== JSON.stringify(existing.tags)) {
      data.tags = { set: tags };
      record('tags', existing.tags, tags);
    }
  }
  if ('relatedModule' in body) {
    const relatedModule = enumValue(body.relatedModule, Object.values(SupportRelatedModule), 'relatedModule');
    if (relatedModule !== existing.relatedModule) {
      data.relatedModule = relatedModule;
      record('relatedModule', existing.relatedModule, relatedModule);
    }
  }
  if ('status' in body) {
    const status = enumValue(body.status, Object.values(SupportFaqStatus), 'status');
    if (status !== existing.status) {
      data.status = status;
      record('status', existing.status, status);
    }
  }
  if ('clientVisible' in body) {
    const clientVisible = booleanValue(body.clientVisible, existing.clientVisible);
    if (clientVisible !== existing.clientVisible) {
      data.clientVisible = clientVisible;
      record('clientVisible', existing.clientVisible, clientVisible);
    }
  }
  if ('assistantEnabled' in body) {
    const assistantEnabled = booleanValue(body.assistantEnabled, existing.assistantEnabled);
    if (assistantEnabled !== existing.assistantEnabled) {
      data.assistantEnabled = assistantEnabled;
      record('assistantEnabled', existing.assistantEnabled, assistantEnabled);
    }
  }
  if ('priority' in body) {
    const priority = intValue(body.priority);
    if (priority !== existing.priority) {
      data.priority = priority;
      record('priority', existing.priority, priority);
    }
  }
  if ('internalNotes' in body) {
    const internalNotes = optionalText(body.internalNotes, 4000);
    if (internalNotes !== existing.internalNotes) {
      data.internalNotes = internalNotes;
      record('internalNotes', existing.internalNotes, internalNotes);
    }
  }

  if (!changed) throw new SupportCenterError('No supported FAQ changes were provided.');

  if (existing.status === SupportFaqStatus.PUBLISHED) {
    data.status = SupportFaqStatus.DRAFT;
    newValues.status = SupportFaqStatus.DRAFT;
    previousValues.status = existing.status;
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.supportFaqEntry.update({
      where: { id },
      data,
      include: { category: true, _count: { select: { versions: true } } },
    });

    let draftVersionId = existing.currentDraftVersionId;
    if (draftVersionId) {
      const draft = await tx.supportFaqVersion.findUnique({ where: { id: draftVersionId } });
      if (!draft || ![PublicationStatus.DRAFT, PublicationStatus.REJECTED].includes(draft.publicationStatus as 'DRAFT' | 'REJECTED')) {
        draftVersionId = null;
      }
    }
    const snapshot = {
      question: result.question,
      answer: result.answer,
      categoryId: result.categoryId,
      tags: result.tags,
      relatedModule: result.relatedModule,
      clientVisible: result.clientVisible,
      assistantEnabled: result.assistantEnabled,
      priority: result.priority,
      internalNotes: result.internalNotes,
      publicationStatus: PublicationStatus.DRAFT,
      changeSummary: optionalText(body.changeSummary, 1000) ?? 'Updated FAQ draft.',
      changedBy: adminLabel(actor),
    };
    if (draftVersionId) {
      await tx.supportFaqVersion.update({
        where: { id: draftVersionId },
        data: snapshot,
      });
    } else {
      const latest = await tx.supportFaqVersion.aggregate({
        where: { faqEntryId: id },
        _max: { versionNumber: true },
      });
      const draft = await tx.supportFaqVersion.create({
        data: {
          faqEntryId: id,
          versionNumber: (latest._max.versionNumber ?? 0) + 1,
          ...snapshot,
        },
      });
      await tx.supportFaqEntry.update({
        where: { id },
        data: { currentDraftVersionId: draft.id },
      });
    }

    return result;
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.UPDATE,
    module: SUPPORT_MODULE,
    description: `${actor.username} edited support FAQ "${updated.question}".`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues,
    newValues: { faqId: id, ...newValues },
  });

  revalidateSupportSurfaces();
  return faqToDto(updated);
}

export async function setFaqStatus(
  id: string,
  status: SupportFaqStatus,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.supportFaqEntry.findUnique({ where: { id } });
  if (!existing) throw new SupportCenterError('FAQ entry not found.', 404);

  const updated = status === SupportFaqStatus.PUBLISHED
    ? await prisma.$transaction(async (transaction) => {
        const current = await transaction.supportFaqEntry.findUnique({ where: { id } });
        if (!current) throw new SupportCenterError('FAQ entry not found.', 404);
        let draft = current.currentDraftVersionId
          ? await transaction.supportFaqVersion.findUnique({ where: { id: current.currentDraftVersionId } })
          : null;
        if (!draft) {
          const latest = await transaction.supportFaqVersion.aggregate({
            where: { faqEntryId: id },
            _max: { versionNumber: true },
          });
          draft = await transaction.supportFaqVersion.create({
            data: {
              faqEntryId: id,
              versionNumber: (latest._max.versionNumber ?? 0) + 1,
              question: current.question,
              answer: current.answer,
              categoryId: current.categoryId,
              tags: current.tags,
              relatedModule: current.relatedModule,
              clientVisible: current.clientVisible,
              assistantEnabled: current.assistantEnabled,
              priority: current.priority,
              internalNotes: current.internalNotes,
              publicationStatus: PublicationStatus.DRAFT,
              changeSummary: 'Legacy FAQ draft prepared for publication.',
              changedBy: adminLabel(actor),
            },
          });
        }
        if (![PublicationStatus.DRAFT, PublicationStatus.IN_REVIEW, PublicationStatus.APPROVED, PublicationStatus.REJECTED].includes(draft.publicationStatus as 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED')) {
          throw new SupportCenterError('FAQ version is not publishable.', 409);
        }
        const now = new Date();
        await transaction.supportFaqVersion.updateMany({
          where: {
            faqEntryId: id,
            publicationStatus: PublicationStatus.PUBLISHED,
            id: { not: draft.id },
          },
          data: { publicationStatus: PublicationStatus.ARCHIVED },
        });
        await transaction.supportFaqVersion.update({
          where: { id: draft.id },
          data: {
            publicationStatus: PublicationStatus.PUBLISHED,
            approvedAt: draft.approvedAt ?? now,
            approvedBy: draft.approvedBy ?? actor.id,
            publishedAt: now,
            publishedBy: actor.id,
          },
        });
        const latestGeneration = await transaction.knowledgeIndexGeneration.aggregate({ _max: { generation: true } });
        const generation = await transaction.knowledgeIndexGeneration.create({
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
            resourceId: generation.id,
            idempotencyKey: `index:faq:${id}:${draft.id}`,
            createdBy: actor.id,
          },
        });
        return transaction.supportFaqEntry.update({
          where: { id },
          data: {
            status,
            updatedBy: adminLabel(actor),
            currentPublishedVersionId: draft.id,
            currentDraftVersionId: null,
          },
          include: { category: true, _count: { select: { versions: true } } },
        });
      })
    : await prisma.supportFaqEntry.update({
        where: { id },
        data: { status, updatedBy: adminLabel(actor) },
        include: { category: true, _count: { select: { versions: true } } },
      });
  const action = status === SupportFaqStatus.PUBLISHED ? AuditAction.APPROVAL : AuditAction.UPDATE;
  const actionLabel = enumLabel(status);

  await createAuditLog({
    ...auditActor(actor),
    action,
    module: SUPPORT_MODULE,
    description: `${actor.username} changed support FAQ "${existing.question}" to ${actionLabel}.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues: { status: existing.status },
    newValues: { faqId: id, status },
  });

  revalidateSupportSurfaces();
  return faqToDto(updated);
}

export async function setFaqAssistantEnabled(
  id: string,
  enabledValue: unknown,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.supportFaqEntry.findUnique({ where: { id } });
  if (!existing) throw new SupportCenterError('FAQ entry not found.', 404);
  const assistantEnabled = booleanValue(enabledValue, !existing.assistantEnabled);
  return updateFaq(id, {
    assistantEnabled,
    changeSummary: `${assistantEnabled ? 'Enable' : 'Disable'} Assistant retrieval in a new FAQ draft.`,
  }, actor, request);
}

export async function setFaqClientVisible(
  id: string,
  visibleValue: unknown,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.supportFaqEntry.findUnique({ where: { id } });
  if (!existing) throw new SupportCenterError('FAQ entry not found.', 404);
  const clientVisible = booleanValue(visibleValue, !existing.clientVisible);
  return updateFaq(id, {
    clientVisible,
    changeSummary: `${clientVisible ? 'Show' : 'Hide'} the FAQ on public pages in a new draft.`,
  }, actor, request);
}

export async function getAdminCategories() {
  const categories = await prisma.supportCategory.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { entries: true } } },
  });
  return { categories: categories.map(categoryToDto) };
}

export async function createCategory(
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const name = requiredText(body.name, 'Category name', 180);
  const category = await prisma.supportCategory.create({
    data: {
      name,
      slug: await uniqueCategorySlug(name),
      description: optionalText(body.description, 2000),
      displayOrder: intValue(body.displayOrder),
      status: enumValue(
        body.status,
        Object.values(SupportCategoryStatus),
        'status',
        SupportCategoryStatus.ACTIVE,
      ),
      clientVisible: booleanValue(body.clientVisible, true),
      createdBy: adminLabel(actor),
      updatedBy: adminLabel(actor),
    },
    include: { _count: { select: { entries: true } } },
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.CREATE,
    module: SUPPORT_MODULE,
    description: `${actor.username} created support category "${category.name}".`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    newValues: { categoryId: category.id, name: category.name, status: category.status },
  });

  revalidateSupportSurfaces();
  return categoryToDto(category);
}

export async function updateCategory(
  id: string,
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.supportCategory.findUnique({ where: { id } });
  if (!existing) throw new SupportCenterError('Category not found.', 404);
  const data: Prisma.SupportCategoryUpdateInput = { updatedBy: adminLabel(actor) };

  if ('name' in body) {
    const name = requiredText(body.name, 'Category name', 180);
    if (name !== existing.name) {
      data.name = name;
      data.slug = await uniqueCategorySlug(name, id);
    }
  }
  if ('description' in body) data.description = optionalText(body.description, 2000);
  if ('displayOrder' in body) data.displayOrder = intValue(body.displayOrder);
  if ('status' in body) {
    data.status = enumValue(body.status, Object.values(SupportCategoryStatus), 'status');
  }
  if ('clientVisible' in body) {
    data.clientVisible = booleanValue(body.clientVisible, existing.clientVisible);
  }

  const updated = await prisma.supportCategory.update({
    where: { id },
    data,
    include: { _count: { select: { entries: true } } },
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.UPDATE,
    module: SUPPORT_MODULE,
    description: `${actor.username} edited support category "${updated.name}".`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues: {
      name: existing.name,
      status: existing.status,
      clientVisible: existing.clientVisible,
      displayOrder: existing.displayOrder,
    },
    newValues: {
      categoryId: updated.id,
      name: updated.name,
      status: updated.status,
      clientVisible: updated.clientVisible,
      displayOrder: updated.displayOrder,
    },
  });

  revalidateSupportSurfaces();
  return categoryToDto(updated);
}

export async function archiveCategory(id: string, actor: CurrentAdmin, request: Request) {
  return updateCategory(id, { status: 'archived', clientVisible: false }, actor, request);
}

export async function getPublicFaqs(url: URL, request?: Request) {
  const search = optionalText(url.searchParams.get('search'), 200);
  const category = optionalText(url.searchParams.get('category'), 255);
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50);
  const where = publicFaqWhere(search ?? undefined, category ?? undefined);
  const [faqs, totalRecords] = await Promise.all([
    prisma.supportFaqEntry.findMany({
      where,
      include: { category: true, currentPublishedVersion: true },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportFaqEntry.count({ where }),
  ]);

  const ids = faqs.map((faq) => faq.id);
  if (ids.length) {
    await prisma.supportFaqEntry.updateMany({
      where: { id: { in: ids } },
      data: { viewCount: { increment: 1 } },
    });
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.READ,
      module: SUPPORT_MODULE,
      description: `Client FAQ page displayed ${ids.length} approved support FAQ entries.`,
      status: AuditStatus.INFO,
      ...(request ? getRequestContext(request) : {}),
      metadata: { faqIds: ids, search, category },
    });
  }

  return {
    faqs: faqs.map((faq) => publishedFaqToDto(faq)),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
  };
}

export async function getPublicPopularFaqs(limitValue = 6) {
  const limit = Math.min(Math.max(limitValue, 1), 12);
  const faqs = await prisma.supportFaqEntry.findMany({
    where: publicFaqWhere(),
    include: { category: true, currentPublishedVersion: true },
    orderBy: [{ viewCount: 'desc' }, { priority: 'desc' }, { updatedAt: 'desc' }],
    take: limit,
  });
  return { faqs: faqs.map((faq) => publishedFaqToDto(faq)) };
}

export async function getPublicFaqCategories() {
  const categories = await prisma.supportCategory.findMany({
    where: {
      status: SupportCategoryStatus.ACTIVE,
      clientVisible: true,
      entries: {
        some: {
          status: { notIn: [SupportFaqStatus.HIDDEN, SupportFaqStatus.ARCHIVED] },
          currentPublishedVersion: { is: { publicationStatus: PublicationStatus.PUBLISHED, clientVisible: true } },
        },
      },
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          entries: {
            where: {
              status: { notIn: [SupportFaqStatus.HIDDEN, SupportFaqStatus.ARCHIVED] },
              currentPublishedVersion: { is: { publicationStatus: PublicationStatus.PUBLISHED, clientVisible: true } },
            },
          },
        },
      },
    },
  });
  return { categories: categories.map(categoryToDto) };
}

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && !STOP_WORDS.has(item));
}

function tokenScore(queryTokens: Set<string>, fieldTokens: Set<string>) {
  if (!queryTokens.size || !fieldTokens.size) return 0;
  let hits = 0;
  queryTokens.forEach((token) => {
    if (fieldTokens.has(token)) hits += 1;
  });
  return hits / queryTokens.size;
}

function scoreEntry(question: string, entry: SupportFaqShape) {
  const normalizedQuestion = question.toLowerCase().trim();
  const entryQuestion = entry.question.toLowerCase().trim();
  if (entryQuestion === normalizedQuestion) return 1;
  if (normalizedQuestion.length > 4 && entryQuestion.includes(normalizedQuestion)) return 0.95;
  if (normalizedQuestion.length > 4 && normalizedQuestion.includes(entryQuestion)) return 0.9;

  const queryTokens = new Set(tokens(question));
  const questionTokens = new Set(tokens(entry.question));
  const answerTokens = new Set(tokens(entry.answer));
  const tagTokens = new Set(entry.tags.flatMap(tokens));
  return (
    tokenScore(queryTokens, questionTokens) * 0.7 +
    tokenScore(queryTokens, answerTokens) * 0.2 +
    tokenScore(queryTokens, tagTokens) * 0.1
  );
}

async function findAssistantMatch(question: string, recordUsage: boolean): Promise<AssistantMatch> {
  const entries = await prisma.supportFaqEntry.findMany({
    where: {
      status: SupportFaqStatus.PUBLISHED,
      assistantEnabled: true,
      OR: [
        { categoryId: null },
        { category: { status: { not: SupportCategoryStatus.ARCHIVED } } },
      ],
    },
    include: { category: true },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });

  const best = entries.reduce<{ entry: SupportFaqShape | null; confidence: number }>(
    (current, entry) => {
      const confidence = scoreEntry(question, entry);
      return confidence > current.confidence ? { entry, confidence } : current;
    },
    { entry: null, confidence: 0 },
  );

  if (!best.entry || best.confidence < ASSISTANT_MATCH_THRESHOLD) {
    return {
      entry: null,
      confidence: Number(best.confidence.toFixed(3)),
      response: FALLBACK_RESPONSE,
      fallback: true,
    };
  }

  if (recordUsage) {
    await prisma.supportFaqEntry.update({
      where: { id: best.entry.id },
      data: { lastUsedByAssistantAt: new Date() },
    });
  }

  return {
    entry: best.entry,
    confidence: Number(Math.min(best.confidence, 1).toFixed(3)),
    response: best.entry.answer,
    fallback: false,
  };
}

async function createUnansweredNotification(unansweredId: string, question: string, sourcePage: string | null) {
  await prisma.notification.create({
    data: {
      title: 'Unanswered assistant question',
      message: 'A new unanswered client question needs review.',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      relatedModule: SUPPORT_MODULE,
      relatedRecordId: unansweredId,
      source: sourcePage ?? 'smart_assistant',
      createdBy: 'System',
    },
  });

  await createAuditLog({
    ...systemAuditActor(),
    action: AuditAction.CREATE,
    module: SUPPORT_MODULE,
    description: 'Saved an unanswered Smart Assistant question for admin review.',
    status: AuditStatus.INFO,
    metadata: { unansweredId, question, sourcePage },
  });
}

export async function askClientAssistant(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const question = requiredText(body.question, 'Question', 1000);
  const sourcePage = optionalText(body.sourcePage, 120) ?? 'smart_assistant';
  const match = await findAssistantMatch(question, true);

  if (match.fallback) {
    const unanswered = await prisma.assistantUnansweredQuestion.create({
      data: {
        question,
        sourcePage,
        suggestedCategory: null,
        matchConfidence: match.confidence,
      },
    });
    await createUnansweredNotification(unanswered.id, question, sourcePage);
  }

  return {
    answer: match.response,
    fallback: match.fallback,
    matchConfidence: match.confidence,
    source: match.entry
      ? {
          id: match.entry.id,
          question: match.entry.question,
          categoryName: match.entry.category?.name ?? null,
        }
      : null,
  };
}

export async function testAssistantAnswer(
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const question = requiredText(body.question, 'Question', 1000);
  const match = await findAssistantMatch(question, false);
  const log = await prisma.assistantTestLog.create({
    data: {
      testQuestion: question,
      matchedFaqId: match.entry?.id ?? null,
      responsePreview: match.response,
      matchConfidence: match.confidence,
      testedBy: adminLabel(actor),
    },
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.READ,
    module: SUPPORT_MODULE,
    description: `${actor.username} tested a Smart Assistant answer.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    metadata: {
      assistantTestLogId: log.id,
      matchedFaqId: match.entry?.id ?? null,
      matchConfidence: match.confidence,
      fallback: match.fallback,
    },
  });

  return {
    answer: match.response,
    fallback: match.fallback,
    matchConfidence: match.confidence,
    source: match.entry
      ? {
          id: match.entry.id,
          question: match.entry.question,
          answer: match.entry.answer,
          categoryName: match.entry.category?.name ?? null,
          status: enumLabel(match.entry.status),
          assistantEnabled: match.entry.assistantEnabled,
        }
      : null,
  };
}

export async function getUnansweredQuestions(url: URL) {
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 10, 5), 50);
  const search = optionalText(url.searchParams.get('search'), 200);
  const statusParam = optionalText(url.searchParams.get('status'), 80);
  const where: Prisma.AssistantUnansweredQuestionWhereInput = {};

  if (search) where.question = { contains: search, mode: 'insensitive' };
  if (statusParam) {
    where.status = enumValue(statusParam, Object.values(AssistantQuestionStatus), 'status');
  }

  const [questions, totalRecords, newCount, convertedCount] = await Promise.all([
    prisma.assistantUnansweredQuestion.findMany({
      where,
      include: { convertedFaq: { select: { id: true, question: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.assistantUnansweredQuestion.count({ where }),
    prisma.assistantUnansweredQuestion.count({ where: { status: AssistantQuestionStatus.NEW } }),
    prisma.assistantUnansweredQuestion.count({
      where: { status: AssistantQuestionStatus.CONVERTED_TO_FAQ },
    }),
  ]);

  return {
    questions: questions.map((item) => ({
      id: item.id,
      question: item.question,
      sourcePage: item.sourcePage,
      suggestedCategory: item.suggestedCategory,
      matchConfidence: item.matchConfidence,
      status: enumLabel(item.status),
      convertedFaqId: item.convertedFaqId,
      convertedFaqQuestion: item.convertedFaq?.question ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
    summary: { new: newCount, converted: convertedCount },
    statusOptions: Object.values(AssistantQuestionStatus).map(enumLabel),
  };
}

export async function ignoreUnansweredQuestion(
  id: string,
  actor: CurrentAdmin,
  request: Request,
) {
  const existing = await prisma.assistantUnansweredQuestion.findUnique({ where: { id } });
  if (!existing) throw new SupportCenterError('Unanswered question not found.', 404);
  const updated = await prisma.assistantUnansweredQuestion.update({
    where: { id },
    data: { status: AssistantQuestionStatus.IGNORED },
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.UPDATE,
    module: SUPPORT_MODULE,
    description: `${actor.username} ignored an unanswered Smart Assistant question.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues: { status: existing.status },
    newValues: { unansweredQuestionId: id, status: updated.status },
  });

  return { id: updated.id, status: enumLabel(updated.status) };
}

export async function convertUnansweredToFaq(
  id: string,
  body: Record<string, unknown>,
  actor: CurrentAdmin,
  request: Request,
) {
  const unanswered = await prisma.assistantUnansweredQuestion.findUnique({ where: { id } });
  if (!unanswered) throw new SupportCenterError('Unanswered question not found.', 404);
  if (unanswered.convertedFaqId) {
    throw new SupportCenterError('This unanswered question has already been converted.', 409);
  }

  const faq = await createFaq(
    {
      question: unanswered.question,
      answer: requiredText(body.answer, 'Answer', 8000),
      categoryId: optionalText(body.categoryId, 255),
      tags: parseTags(body.tags),
      relatedModule: body.relatedModule ?? SupportRelatedModule.GENERAL,
      status: body.status ?? SupportFaqStatus.DRAFT,
      clientVisible: booleanValue(body.clientVisible),
      assistantEnabled: booleanValue(body.assistantEnabled),
      priority: intValue(body.priority),
      internalNotes: optionalText(body.internalNotes, 4000) ?? 'Created from an unanswered Smart Assistant question.',
    },
    actor,
    request,
  );

  await prisma.assistantUnansweredQuestion.update({
    where: { id },
    data: {
      status: AssistantQuestionStatus.CONVERTED_TO_FAQ,
      convertedFaqId: faq.id,
    },
  });

  await createAuditLog({
    ...auditActor(actor),
    action: AuditAction.CREATE,
    module: SUPPORT_MODULE,
    description: `${actor.username} converted an unanswered Smart Assistant question into an FAQ entry.`,
    status: AuditStatus.SUCCESS,
    ...getRequestContext(request),
    previousValues: { unansweredQuestionId: id, status: unanswered.status },
    newValues: { unansweredQuestionId: id, convertedFaqId: faq.id },
  });

  revalidateSupportSurfaces();
  return faq;
}

export async function getSupportAnalytics() {
  const [
    total,
    published,
    drafts,
    assistantEnabled,
    unansweredCount,
    mostViewedFaqs,
    categories,
    testLogs,
    unansweredQuestions,
  ] = await Promise.all([
    prisma.supportFaqEntry.count(),
    prisma.supportFaqEntry.count({ where: { status: SupportFaqStatus.PUBLISHED } }),
    prisma.supportFaqEntry.count({ where: { status: SupportFaqStatus.DRAFT } }),
    prisma.supportFaqEntry.count({
      where: { status: SupportFaqStatus.PUBLISHED, assistantEnabled: true },
    }),
    prisma.assistantUnansweredQuestion.count({ where: { status: AssistantQuestionStatus.NEW } }),
    prisma.supportFaqEntry.findMany({
      orderBy: [{ viewCount: 'desc' }, { priority: 'desc' }],
      take: 5,
      select: { id: true, question: true, viewCount: true },
    }),
    prisma.supportCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { entries: true } } },
    }),
    prisma.assistantTestLog.findMany({
      where: { matchedFaqId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { matchedFaq: { select: { id: true, question: true } } },
    }),
    prisma.assistantUnansweredQuestion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { question: true },
    }),
  ]);

  const usedAnswerCounts = new Map<string, { question: string; count: number }>();
  testLogs.forEach((log) => {
    if (!log.matchedFaq) return;
    const current = usedAnswerCounts.get(log.matchedFaq.id) ?? {
      question: log.matchedFaq.question,
      count: 0,
    };
    current.count += 1;
    usedAnswerCounts.set(log.matchedFaq.id, current);
  });

  const keywordCounts = new Map<string, number>();
  unansweredQuestions.forEach((item) => {
    tokens(item.question).forEach((token) => {
      keywordCounts.set(token, (keywordCounts.get(token) ?? 0) + 1);
    });
  });

  return {
    analytics: {
      totalFaqEntries: total,
      publishedFaqs: published,
      draftFaqs: drafts,
      assistantEnabledEntries: assistantEnabled,
      unansweredQuestionsCount: unansweredCount,
      mostViewedFaqs,
      mostSearchedKeywords: Array.from(keywordCounts, ([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      categoriesWithMissingAnswers: categories
        .filter((category) => (category._count.entries ?? 0) === 0)
        .map((category) => category.name),
      mostUsedAssistantAnswers: Array.from(usedAnswerCounts, ([id, value]) => ({
        id,
        question: value.question,
        count: value.count,
      }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      frequentlyAskedTopics: categories
        .map((category) => ({
          name: category.name,
          count: category._count.entries ?? 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    },
  };
}

export function supportErrorResponse(error: unknown, fallback = 'Unable to process support request.') {
  if (error instanceof SupportCenterError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof Error && error.message.startsWith('Forbidden')) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: 'The request body is invalid.' }, { status: 400 });
  }

  console.error(fallback, errorMetadata(error));
  return Response.json({ error: fallback }, { status: 500 });
}
