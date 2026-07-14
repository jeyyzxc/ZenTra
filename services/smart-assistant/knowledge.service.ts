import {
  AuditAction,
  AuditStatus,
  CommandCenterJobType,
  ContentType,
  KnowledgeAccessLevel,
  KnowledgeDocumentType,
  KnowledgeIndexStatus,
  Prisma,
  PublicationStatus,
  SupportFaqStatus,
} from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { auditActor, createAuditLog, getRequestContext } from '@/lib/audit';
import type { CurrentAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { CommandCenterError } from '@/services/command-center';
import { getLlmProvider } from './gemini-provider';

const EMBEDDING_MODEL = () => process.env.GEMINI_EMBEDDING_MODEL?.trim() || 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 768;
const CHUNK_TARGET_CHARS = 2_400;
const CHUNK_OVERLAP_CHARS = 320;

type ProjectableSource = {
  resourceType: string;
  resourceId: string;
  resourceVersion: number | null;
  documentVersionId: string | null;
  sourcePath: string;
  title: string;
  content: string;
  checksum: string;
  accessLevel: KnowledgeAccessLevel;
  publishedAt: Date;
  expiresAt: Date | null;
};

export type RetrievedKnowledge = {
  chunkId: string;
  sourceId: string;
  label: string;
  content: string;
  sourcePath: string | null;
  resourceVersion: number | null;
  publishedAt: string;
  score: number;
};

function text(value: unknown, maxLength = 100_000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function requiredText(value: unknown, label: string, maxLength = 100_000) {
  const result = text(value, maxLength);
  if (!result) throw new CommandCenterError(`${label} is required.`, 422);
  return result;
}

function optionalText(value: unknown, maxLength = 100_000) {
  return text(value, maxLength) || null;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || randomUUID();
}

function parseAccessLevel(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : 'PUBLIC';
  if (!Object.values(KnowledgeAccessLevel).includes(normalized as KnowledgeAccessLevel)) {
    throw new CommandCenterError('Knowledge access level is invalid.', 422);
  }
  return normalized as KnowledgeAccessLevel;
}

function parseDocumentType(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : 'TEXT';
  if (!Object.values(KnowledgeDocumentType).includes(normalized as KnowledgeDocumentType)) {
    throw new CommandCenterError('Knowledge document type is invalid.', 422);
  }
  return normalized as KnowledgeDocumentType;
}

function checksum(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function sanitizeKnowledgeText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .split(/\r?\n/)
    .filter((line) => !/(ignore|disregard|override).{0,30}(previous|system|developer|instruction|prompt)|system\s*prompt|developer\s*message|reveal.{0,30}(secret|credential|token)/i.test(line))
    .join('\n')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim();
}

export async function extractKnowledgeFile(file: File) {
  const data = await file.arrayBuffer();
  if (file.type === 'application/pdf') {
    const parser = new PDFParse({ data: Buffer.from(data) });
    try {
      const result = await parser.getText();
      const extracted = sanitizeKnowledgeText(result.text || '');
      if (!extracted) throw new CommandCenterError('No readable text was extracted from the PDF.', 422);
      return extracted;
    } finally {
      await parser.destroy();
    }
  }
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
    const extracted = sanitizeKnowledgeText(result.value || '');
    if (!extracted) throw new CommandCenterError('No readable text was extracted from the DOCX file.', 422);
    return extracted;
  }
  throw new CommandCenterError('Only PDF and DOCX files can be extracted.', 422);
}

function estimatedTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

export function chunkKnowledgeText(value: string) {
  const clean = sanitizeKnowledgeText(value);
  if (!clean) return [];
  const sections = clean.split(/(?=^#{1,4}\s+|^[A-Z][A-Z\s&-]{5,80}$)/m);
  const chunks: Array<{ heading: string | null; content: string; tokenCount: number; checksum: string }> = [];
  let buffer = '';
  let heading: string | null = null;

  const flush = () => {
    const content = buffer.trim();
    if (!content) return;
    chunks.push({ heading, content, tokenCount: estimatedTokens(content), checksum: checksum(content) });
    buffer = content.slice(Math.max(0, content.length - CHUNK_OVERLAP_CHARS));
  };

  for (const section of sections) {
    const lines = section.trim().split(/\r?\n/);
    const first = lines[0]?.trim() || '';
    const looksLikeHeading = /^#{1,4}\s+/.test(first) || /^[A-Z][A-Z\s&-]{5,80}$/.test(first);
    if (looksLikeHeading) {
      if (buffer.length > CHUNK_TARGET_CHARS / 2) flush();
      heading = first.replace(/^#{1,4}\s+/, '').trim();
    }
    const paragraphs = section.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      let remaining = paragraph;
      while (remaining) {
        const separatorLength = buffer ? 2 : 0;
        const available = CHUNK_TARGET_CHARS - buffer.length - separatorLength;
        if (available < 200 && buffer) {
          flush();
          continue;
        }
        if (remaining.length <= available) {
          buffer += `${buffer ? '\n\n' : ''}${remaining}`;
          remaining = '';
          continue;
        }
        const candidate = remaining.slice(0, available);
        const whitespaceBreak = Math.max(candidate.lastIndexOf(' '), candidate.lastIndexOf('\n'));
        const take = whitespaceBreak >= Math.floor(available * 0.65) ? whitespaceBreak : available;
        buffer += `${buffer ? '\n\n' : ''}${remaining.slice(0, take).trim()}`;
        remaining = remaining.slice(take).trim();
        flush();
      }
    }
  }
  if (buffer.trim()) {
    const content = buffer.trim();
    chunks.push({ heading, content, tokenCount: estimatedTokens(content), checksum: checksum(content) });
  }
  return chunks.filter((chunk, index, all) => index === 0 || chunk.checksum !== all[index - 1].checksum);
}

function documentDto(document: Prisma.KnowledgeDocumentGetPayload<{ include: { versions: true } }>) {
  return {
    id: document.id,
    title: document.title,
    slug: document.slug,
    type: document.type,
    accessLevel: document.accessLevel,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    versions: [...document.versions].sort((a, b) => b.versionNumber - a.versionNumber).map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      extractedText: version.extractedText,
      sourceObjectPath: version.sourceObjectPath,
      sourceChecksum: version.sourceChecksum,
      changeSummary: version.changeSummary,
      publishAt: version.publishAt?.toISOString() ?? null,
      publishedAt: version.publishedAt?.toISOString() ?? null,
      expiresAt: version.expiresAt?.toISOString() ?? null,
      approvedAt: version.approvedAt?.toISOString() ?? null,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    })),
  };
}

export async function listKnowledgeDocuments(includeRestricted = true) {
  const documents = await prisma.knowledgeDocument.findMany({
    include: {
      versions: includeRestricted ? true : {
        where: { status: PublicationStatus.PUBLISHED },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return documents.map(documentDto).filter((document) => includeRestricted || document.versions.length > 0);
}

export async function createKnowledgeDocument(
  input: Record<string, unknown>,
  actor: CurrentAdmin,
  request?: Request,
) {
  const title = requiredText(input.title, 'Knowledge title', 240);
  const type = parseDocumentType(input.type);
  const extractedText = type === KnowledgeDocumentType.TEXT
    ? sanitizeKnowledgeText(requiredText(input.text, 'Knowledge text'))
    : sanitizeKnowledgeText(optionalText(input.extractedText) || '');
  const sourceObjectPath = optionalText(input.sourceObjectPath, 2_000);
  if (type !== KnowledgeDocumentType.TEXT && !sourceObjectPath) {
    throw new CommandCenterError('Uploaded PDF or DOCX source path is required.', 422);
  }
  if (!extractedText) throw new CommandCenterError('Extracted knowledge text is empty.', 422);

  const document = await prisma.knowledgeDocument.create({
    data: {
      title,
      slug: slugify(optionalText(input.slug, 120) || title),
      type,
      accessLevel: parseAccessLevel(input.accessLevel),
      createdBy: actor.id,
      updatedBy: actor.id,
      versions: {
        create: {
          versionNumber: 1,
          status: PublicationStatus.DRAFT,
          extractedText,
          sourceObjectPath,
          sourceChecksum: checksum(extractedText),
          changeSummary: optionalText(input.changeSummary, 2_000) || 'Initial knowledge draft.',
          createdBy: actor.id,
        },
      },
    },
    include: { versions: true },
  });
  await createAuditLog({
    ...auditActor(actor),
    ...(request ? getRequestContext(request) : {}),
    action: AuditAction.CREATE,
    module: 'ZENTRA Command Center',
    description: `Created Assistant Knowledge draft “${title}”.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'KNOWLEDGE_DOCUMENT_CREATED', knowledgeDocumentId: document.id },
  });
  return documentDto(document);
}

export async function createKnowledgeDraftVersion(
  documentId: string,
  actor: CurrentAdmin,
  request?: Request,
) {
  const document = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  });
  if (!document) throw new CommandCenterError('Knowledge document not found.', 404);
  const editable = document.versions.find((version) => [
    PublicationStatus.DRAFT,
    PublicationStatus.IN_REVIEW,
    PublicationStatus.APPROVED,
    PublicationStatus.REJECTED,
  ].includes(version.status as 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'));
  if (editable) throw new CommandCenterError('This knowledge document already has an editable version.', 409);
  const source = document.versions.find((version) => version.status === PublicationStatus.PUBLISHED);
  if (!source) throw new CommandCenterError('A published version is required to create the next draft.', 409);
  const created = await prisma.knowledgeDocumentVersion.create({
    data: {
      documentId,
      versionNumber: (document.versions[0]?.versionNumber ?? 0) + 1,
      status: PublicationStatus.DRAFT,
      extractedText: source.extractedText,
      sourceObjectPath: source.sourceObjectPath,
      sourceChecksum: source.sourceChecksum,
      changeSummary: `New draft copied from version ${source.versionNumber}.`,
      createdBy: actor.id,
    },
  });
  await createAuditLog({
    ...auditActor(actor), ...(request ? getRequestContext(request) : {}),
    action: AuditAction.CREATE, module: 'ZENTRA Command Center',
    description: `Created Assistant Knowledge draft version ${created.versionNumber} for “${document.title}”.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'KNOWLEDGE_VERSION_CREATED', knowledgeDocumentId: documentId, versionId: created.id },
  });
  const updated = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: documentId }, include: { versions: true } });
  return documentDto(updated);
}

export async function updateKnowledgeDraft(
  documentId: string,
  versionId: string,
  input: Record<string, unknown>,
  actor: CurrentAdmin,
  request?: Request,
) {
  const version = await prisma.knowledgeDocumentVersion.findUnique({
    where: { id: versionId },
    include: { document: true },
  });
  if (!version || version.documentId !== documentId) throw new CommandCenterError('Knowledge draft not found.', 404);
  if (![PublicationStatus.DRAFT, PublicationStatus.REJECTED].includes(version.status as 'DRAFT' | 'REJECTED')) {
    throw new CommandCenterError('Only draft or rejected knowledge versions can be edited.', 409);
  }
  const nextText = input.text === undefined
    ? version.extractedText || ''
    : sanitizeKnowledgeText(requiredText(input.text, 'Knowledge text'));
  await prisma.$transaction([
    prisma.knowledgeDocumentVersion.update({
      where: { id: version.id },
      data: {
        status: PublicationStatus.DRAFT,
        extractedText: nextText,
        sourceChecksum: checksum(nextText),
        changeSummary: input.changeSummary === undefined ? version.changeSummary : optionalText(input.changeSummary, 2_000),
      },
    }),
    prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        title: input.title ? requiredText(input.title, 'Knowledge title', 240) : undefined,
        accessLevel: input.accessLevel ? parseAccessLevel(input.accessLevel) : undefined,
        updatedBy: actor.id,
      },
    }),
  ]);
  await createAuditLog({
    ...auditActor(actor),
    ...(request ? getRequestContext(request) : {}),
    action: AuditAction.UPDATE,
    module: 'ZENTRA Command Center',
    description: `Updated Assistant Knowledge draft “${version.document.title}”.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'KNOWLEDGE_DRAFT_UPDATED', knowledgeDocumentId: documentId, versionId },
  });
  const updated = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: documentId }, include: { versions: true } });
  return documentDto(updated);
}

export async function changeKnowledgeReviewStatus(input: {
  documentId: string;
  versionId: string;
  action: 'submit' | 'approve' | 'reject';
  actor: CurrentAdmin;
  request?: Request;
}) {
  const version = await prisma.knowledgeDocumentVersion.findUnique({
    where: { id: input.versionId },
    include: { document: true },
  });
  if (!version || version.documentId !== input.documentId) throw new CommandCenterError('Knowledge version not found.', 404);
  const transitions = {
    submit: { from: [PublicationStatus.DRAFT, PublicationStatus.REJECTED], to: PublicationStatus.IN_REVIEW },
    approve: { from: [PublicationStatus.IN_REVIEW], to: PublicationStatus.APPROVED },
    reject: { from: [PublicationStatus.IN_REVIEW], to: PublicationStatus.REJECTED },
  } as const;
  const transition = transitions[input.action];
  if (!(transition.from as readonly PublicationStatus[]).includes(version.status)) {
    throw new CommandCenterError(`Cannot ${input.action} a ${version.status.toLowerCase()} knowledge version.`, 409);
  }
  await prisma.knowledgeDocumentVersion.update({
    where: { id: version.id },
    data: {
      status: transition.to,
      approvedAt: input.action === 'approve' ? new Date() : null,
      approvedBy: input.action === 'approve' ? input.actor.id : null,
    },
  });
  await createAuditLog({
    ...auditActor(input.actor),
    ...(input.request ? getRequestContext(input.request) : {}),
    action: input.action === 'approve' ? AuditAction.APPROVAL : input.action === 'reject' ? AuditAction.REJECTION : AuditAction.SUBMISSION,
    module: 'ZENTRA Command Center',
    description: `${input.action} Assistant Knowledge “${version.document.title}” version ${version.versionNumber}.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: `KNOWLEDGE_${input.action.toUpperCase()}`, knowledgeDocumentId: input.documentId, versionId: version.id },
  });
  const updated = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: input.documentId }, include: { versions: true } });
  return documentDto(updated);
}

export async function publishKnowledgeVersion(input: {
  documentId: string;
  versionId: string;
  expiresAt?: unknown;
  actor: CurrentAdmin;
  request?: Request;
}) {
  const version = await prisma.knowledgeDocumentVersion.findUnique({
    where: { id: input.versionId },
    include: { document: true },
  });
  if (!version || version.documentId !== input.documentId) throw new CommandCenterError('Knowledge version not found.', 404);
  if (version.status !== PublicationStatus.APPROVED) throw new CommandCenterError('Only approved knowledge can be published.', 409);
  const expiresAt = input.expiresAt ? new Date(String(input.expiresAt)) : null;
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())) {
    throw new CommandCenterError('Knowledge expiration must be in the future.', 422);
  }
  const now = new Date();
  const generation = await prisma.$transaction(async (transaction) => {
    await transaction.knowledgeDocumentVersion.updateMany({
      where: { documentId: input.documentId, status: PublicationStatus.PUBLISHED, id: { not: version.id } },
      data: { status: PublicationStatus.ARCHIVED },
    });
    await transaction.knowledgeDocumentVersion.update({
      where: { id: version.id },
      data: { status: PublicationStatus.PUBLISHED, publishedAt: now, publishedBy: input.actor.id, expiresAt },
    });
    const latest = await transaction.knowledgeIndexGeneration.aggregate({ _max: { generation: true } });
    const next = await transaction.knowledgeIndexGeneration.create({
      data: {
        generation: (latest._max.generation ?? 0) + 1,
        modelIdentifier: EMBEDDING_MODEL(),
        embeddingDimension: EMBEDDING_DIMENSION,
        status: KnowledgeIndexStatus.PENDING,
      },
    });
    await transaction.commandCenterJob.create({
      data: {
        type: CommandCenterJobType.INDEX_KNOWLEDGE,
        resourceType: 'knowledge_generation',
        resourceId: next.id,
        idempotencyKey: `index:generation:${next.id}`,
        createdBy: input.actor.id,
      },
    });
    return next;
  });
  await createAuditLog({
    ...auditActor(input.actor),
    ...(input.request ? getRequestContext(input.request) : {}),
    action: AuditAction.APPROVAL,
    module: 'ZENTRA Command Center',
    description: `Published Assistant Knowledge “${version.document.title}” version ${version.versionNumber}.`,
    status: AuditStatus.SUCCESS,
    metadata: { event: 'KNOWLEDGE_PUBLISHED', knowledgeDocumentId: input.documentId, versionId: version.id, indexGenerationId: generation.id },
  });
  return { generationId: generation.id, generation: generation.generation };
}

function payloadText(type: ContentType, payload: Prisma.JsonValue) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '';
  const value = payload as Record<string, unknown>;
  if (type === ContentType.GALLERY_ITEM) return [value.title, value.caption, value.altText].filter((item): item is string => typeof item === 'string').join('\n');
  if (type === ContentType.FACILITY) {
    return [value.name, value.summary, value.description, ...(Array.isArray(value.amenities) ? value.amenities : []), value.accessibilityGuidance]
      .filter((item): item is string => typeof item === 'string').join('\n');
  }
  const blocks = Array.isArray(value.blocks) ? value.blocks : [];
  return [value.title, value.summary, ...blocks.flatMap((block) => {
    if (!block || typeof block !== 'object' || Array.isArray(block)) return [];
    const item = block as Record<string, unknown>;
    return [item.text, item.label, ...(Array.isArray(item.items) ? item.items : [])];
  })].filter((item): item is string => typeof item === 'string').join('\n');
}

async function collectProjectableSources(): Promise<ProjectableSource[]> {
  const now = new Date();
  const [documents, faqs, content] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      include: {
        versions: {
          where: { status: PublicationStatus.PUBLISHED, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.supportFaqEntry.findMany({
      where: {
        status: { notIn: [SupportFaqStatus.HIDDEN, SupportFaqStatus.ARCHIVED] },
        currentPublishedVersion: {
          is: {
            publicationStatus: PublicationStatus.PUBLISHED,
            assistantEnabled: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
      include: { category: { select: { name: true } }, currentPublishedVersion: true },
    }),
    prisma.contentVersion.findMany({
      where: { status: PublicationStatus.PUBLISHED, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      include: { contentItem: true },
    }),
  ]);
  const sources: ProjectableSource[] = [];
  for (const document of documents) {
    const version = document.versions[0];
    if (!version?.extractedText || !version.publishedAt) continue;
    sources.push({
      resourceType: 'knowledge_document', resourceId: document.id, resourceVersion: version.versionNumber,
      documentVersionId: version.id, sourcePath: `/knowledge/${document.slug}`, title: document.title,
      content: version.extractedText, checksum: version.sourceChecksum || checksum(version.extractedText),
      accessLevel: document.accessLevel, publishedAt: version.publishedAt, expiresAt: version.expiresAt,
    });
  }
  for (const faq of faqs) {
    const published = faq.currentPublishedVersion;
    if (!published?.question || !published.answer) continue;
    const contentText = `${published.question}\n\n${published.answer}`;
    sources.push({
      resourceType: 'faq', resourceId: faq.id, resourceVersion: null, documentVersionId: null,
      sourcePath: '/faq', title: published.question, content: contentText, checksum: checksum(contentText),
      accessLevel: KnowledgeAccessLevel.PUBLIC, publishedAt: published.publishedAt ?? published.createdAt, expiresAt: published.expiresAt,
    });
  }
  for (const version of content) {
    const contentText = payloadText(version.contentItem.type, version.payload);
    if (!contentText || !version.publishedAt) continue;
    const path = version.contentItem.type === ContentType.GALLERY_ITEM ? '/gallery' : version.contentItem.type === ContentType.FACILITY ? '/facilities' : version.contentItem.type === ContentType.RULES ? '/rules' : version.contentItem.type === ContentType.PRIVACY ? '/privacy-policy' : '/terms-and-conditions';
    sources.push({
      resourceType: `content_${version.contentItem.type.toLowerCase()}`, resourceId: version.contentItemId,
      resourceVersion: version.versionNumber, documentVersionId: null, sourcePath: path,
      title: version.contentItem.title, content: contentText, checksum: checksum(contentText),
      accessLevel: KnowledgeAccessLevel.PUBLIC, publishedAt: version.publishedAt, expiresAt: version.expiresAt,
    });
  }
  return sources;
}

export async function buildKnowledgeIndex(generationId: string) {
  const generation = await prisma.knowledgeIndexGeneration.findUnique({ where: { id: generationId } });
  if (!generation) throw new CommandCenterError('Knowledge index generation not found.', 404);
  if (generation.embeddingDimension !== EMBEDDING_DIMENSION) throw new CommandCenterError('Knowledge index dimension is incompatible.', 409);
  await prisma.knowledgeIndexGeneration.update({ where: { id: generation.id }, data: { status: KnowledgeIndexStatus.PROCESSING, safeError: null } });

  try {
    const sources = await collectProjectableSources();
    const provider = getLlmProvider();
    for (const source of sources) {
      const chunks = chunkKnowledgeText(source.content);
      if (!chunks.length) continue;
      const createdSource = await prisma.knowledgeSource.create({
        data: {
          documentVersionId: source.documentVersionId,
          indexGenerationId: generation.id,
          resourceType: source.resourceType,
          resourceId: source.resourceId,
          resourceVersion: source.resourceVersion,
          sourcePath: source.sourcePath,
          title: source.title,
          sourceChecksum: source.checksum,
          accessLevel: source.accessLevel,
          publishedAt: source.publishedAt,
          expiresAt: source.expiresAt,
        },
      });
      const previous = await prisma.knowledgeSource.findFirst({
        where: {
          id: { not: createdSource.id }, resourceType: source.resourceType, resourceId: source.resourceId,
          sourceChecksum: source.checksum, indexGeneration: { isActive: true, status: KnowledgeIndexStatus.READY },
        },
        select: { id: true },
      });
      if (previous) {
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO "knowledge_chunks" (
            "id", "source_id", "chunk_index", "heading", "content", "token_count",
            "content_checksum", "search_text", "embedding", "created_at"
          )
          SELECT ${createdSource.id} || ':' || "chunk_index"::text, ${createdSource.id}, "chunk_index",
            "heading", "content", "token_count", "content_checksum", "search_text", "embedding", NOW()
          FROM "knowledge_chunks" WHERE "source_id" = ${previous.id}
        `);
        continue;
      }
      const embeddings = await provider.embedDocuments(chunks.map((chunk) => ({ title: source.title, content: chunk.content })));
      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index];
        const vector = `[${embeddings[index].join(',')}]`;
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO "knowledge_chunks" (
            "id", "source_id", "chunk_index", "heading", "content", "token_count",
            "content_checksum", "search_text", "embedding", "created_at"
          ) VALUES (
            ${`${createdSource.id}:${index}`}, ${createdSource.id}, ${index}, ${chunk.heading}, ${chunk.content},
            ${chunk.tokenCount}, ${chunk.checksum}, ${`${source.title}\n${chunk.heading || ''}\n${chunk.content}`},
            ${vector}::extensions.vector, NOW()
          )
        `);
      }
    }
    const chunkCount = await prisma.knowledgeChunk.count({ where: { source: { indexGenerationId: generation.id } } });
    if (sources.length > 0 && chunkCount === 0) throw new CommandCenterError('Knowledge index validation found no chunks.', 422);
    await prisma.$transaction([
      prisma.knowledgeIndexGeneration.updateMany({ where: { isActive: true, id: { not: generation.id } }, data: { isActive: false } }),
      prisma.knowledgeIndexGeneration.update({
        where: { id: generation.id },
        data: { status: KnowledgeIndexStatus.READY, isActive: true, validatedAt: new Date(), activatedAt: new Date() },
      }),
    ]);
    return { generationId: generation.id, generation: generation.generation, sourceCount: sources.length, chunkCount };
  } catch (error) {
    await prisma.knowledgeIndexGeneration.update({
      where: { id: generation.id },
      data: { status: KnowledgeIndexStatus.FAILED, isActive: false, safeError: error instanceof Error ? error.message.slice(0, 1_000) : 'Indexing failed.' },
    });
    throw error;
  }
}

function permittedLevels(actorType: 'GUEST' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN') {
  if (actorType === 'SUPERADMIN') return Object.values(KnowledgeAccessLevel);
  if (actorType === 'ADMIN') return [KnowledgeAccessLevel.PUBLIC, KnowledgeAccessLevel.CLIENT, KnowledgeAccessLevel.ADMIN];
  if (actorType === 'CLIENT') return [KnowledgeAccessLevel.PUBLIC, KnowledgeAccessLevel.CLIENT];
  return [KnowledgeAccessLevel.PUBLIC];
}

export async function searchPublishedKnowledge(input: {
  query: string;
  actorType: 'GUEST' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN';
  limit?: number;
}) {
  const query = requiredText(input.query, 'Search query', 2_000);
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 6);
  const levels = permittedLevels(input.actorType);
  const vectorPromise = getLlmProvider().embedQuery(query).then((embedding) => {
    const vector = `[${embedding.join(',')}]`;
    return prisma.$queryRaw<Array<{
      chunkId: string; sourceId: string; label: string; content: string; sourcePath: string | null;
      resourceVersion: number | null; publishedAt: Date; rank: number;
    }>>(Prisma.sql`
      SELECT c."id" AS "chunkId", s."id" AS "sourceId", s."title" AS "label", c."content",
        s."source_path" AS "sourcePath", s."resource_version" AS "resourceVersion", s."published_at" AS "publishedAt",
        ROW_NUMBER() OVER (ORDER BY c."embedding" OPERATOR(extensions.<=>) ${vector}::extensions.vector) AS "rank"
      FROM "knowledge_chunks" c
      JOIN "knowledge_sources" s ON s."id" = c."source_id"
      JOIN "knowledge_index_generations" g ON g."id" = s."index_generation_id"
      WHERE g."is_active" = true AND g."status" = 'READY'
        AND s."access_level" IN (${Prisma.join(levels.map((level) => Prisma.sql`${level}::"KnowledgeAccessLevel"`))})
        AND s."published_at" <= NOW() AND (s."expires_at" IS NULL OR s."expires_at" > NOW())
        AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" OPERATOR(extensions.<=>) ${vector}::extensions.vector
      LIMIT 20
    `);
  });
  const textPromise = prisma.$queryRaw<Array<{
    chunkId: string; sourceId: string; label: string; content: string; sourcePath: string | null;
    resourceVersion: number | null; publishedAt: Date; rank: number;
  }>>(Prisma.sql`
    SELECT c."id" AS "chunkId", s."id" AS "sourceId", s."title" AS "label", c."content",
      s."source_path" AS "sourcePath", s."resource_version" AS "resourceVersion", s."published_at" AS "publishedAt",
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', c."search_text"), websearch_to_tsquery('english', ${query})) DESC) AS "rank"
    FROM "knowledge_chunks" c
    JOIN "knowledge_sources" s ON s."id" = c."source_id"
    JOIN "knowledge_index_generations" g ON g."id" = s."index_generation_id"
    WHERE g."is_active" = true AND g."status" = 'READY'
      AND s."access_level" IN (${Prisma.join(levels.map((level) => Prisma.sql`${level}::"KnowledgeAccessLevel"`))})
      AND s."published_at" <= NOW() AND (s."expires_at" IS NULL OR s."expires_at" > NOW())
      AND to_tsvector('english', c."search_text") @@ websearch_to_tsquery('english', ${query})
    ORDER BY ts_rank_cd(to_tsvector('english', c."search_text"), websearch_to_tsquery('english', ${query})) DESC
    LIMIT 20
  `);
  const [vectorResult, textResult] = await Promise.allSettled([vectorPromise, textPromise]);
  const vectorRows = vectorResult.status === 'fulfilled' ? vectorResult.value : [];
  const textRows = textResult.status === 'fulfilled' ? textResult.value : [];
  const combined = new Map<string, RetrievedKnowledge>();
  const addRows = (rows: typeof vectorRows) => rows.forEach((row, index) => {
    const current = combined.get(row.chunkId);
    const score = 1 / (60 + index + 1);
    combined.set(row.chunkId, {
      chunkId: row.chunkId,
      sourceId: row.sourceId,
      label: row.label,
      content: row.content,
      sourcePath: row.sourcePath,
      resourceVersion: row.resourceVersion,
      publishedAt: row.publishedAt.toISOString(),
      score: (current?.score ?? 0) + score,
    });
  });
  addRows(vectorRows); addRows(textRows);
  return [...combined.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
