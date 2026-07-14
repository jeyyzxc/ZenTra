import {
  AssistantActorType,
  AssistantResponseStatus,
  AuditAction,
  AuditStatus,
  DashboardTaskStatus,
  Prisma,
  Role,
  SupportFaqStatus,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { createAuditLog, getRequestContext, systemAuditActor } from '@/lib/audit';
import { getCurrentAdmin } from '@/lib/authorization';
import { getClientCalendarAvailability } from '@/lib/client-calendar-availability';
import { prisma } from '@/lib/prisma';
import {
  getPublicEventCategories,
  getPublicPackageBySlug,
  getPublicPackagesForCategory,
} from '@/lib/services-packages';
import { CommandCenterError } from '@/services/command-center';
import {
  enforceRateLimit,
  hashedRateLimitIdentity,
  requestIpAddress,
} from '@/services/rate-limit.service';
import { resolveClientAccess } from './client-access.service';
import { getLlmProvider } from './gemini-provider';
import { searchPublishedKnowledge } from './knowledge.service';
import {
  type AssistantToolName,
  type GroundingEvidence,
  type IntentPlan,
  LlmProviderError,
} from './provider';

type AuthorizationContext = {
  actorType: AssistantActorType;
  actorReference: string;
  bookingId: string | null;
  bookingReference: string | null;
  adminId: string | null;
  role: Role | 'GUEST';
};

const PUBLIC_TOOLS = new Set<AssistantToolName>([
  'checkCalendarAvailability',
  'getCurrentEventCategories',
  'getCurrentPackages',
  'getCurrentPackagePriceAndInclusions',
  'searchPublishedKnowledge',
]);
const CLIENT_TOOLS = new Set<AssistantToolName>([
  ...PUBLIC_TOOLS,
  'getOwnBookingProgress',
  'getOwnPaymentStatus',
  'getOwnContractStatus',
  'getOwnEventTimeline',
  'getPermittedAssignedTasks',
]);

function publicReference(prefix: string) {
  return `${prefix}_${randomBytes(18).toString('base64url')}`;
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function requiredMessage(value: unknown) {
  const message = typeof value === 'string' ? value.trim() : '';
  if (!message) throw new CommandCenterError('Message is required.', 422);
  if (message.length > 2_000) throw new CommandCenterError('Message must be 2,000 characters or fewer.', 422);
  return message;
}

function redacted(value: string) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b(?:\+?63|0)?9\d{9}\b/g, '[phone]')
    .replace(/\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/\b(?:ZION|ZEP|BOOK)[-_]?[A-Z0-9-]{5,}\b/gi, '[booking-reference]')
    .slice(0, 4_000);
}

async function authorizationContext(request: Request): Promise<AuthorizationContext> {
  const admin = await getCurrentAdmin();
  if (admin) {
    return {
      actorType: admin.role === Role.SUPERADMIN ? AssistantActorType.SUPERADMIN : AssistantActorType.ADMIN,
      actorReference: hash(`admin|${admin.id}`),
      bookingId: null,
      bookingReference: null,
      adminId: admin.id,
      role: admin.role,
    };
  }
  const grant = await resolveClientAccess(request);
  if (grant) {
    return {
      actorType: AssistantActorType.CLIENT,
      actorReference: hash(`client-grant|${grant.publicReference}`),
      bookingId: grant.bookingId,
      bookingReference: grant.booking.bookingReference,
      adminId: null,
      role: Role.CLIENT,
    };
  }
  return {
    actorType: AssistantActorType.GUEST,
    actorReference: hash(`guest|${requestIpAddress(request)}`),
    bookingId: null,
    bookingReference: null,
    adminId: null,
    role: 'GUEST',
  };
}

function availableTools(context: AuthorizationContext) {
  if (context.actorType === AssistantActorType.CLIENT || context.actorType === AssistantActorType.ADMIN || context.actorType === AssistantActorType.SUPERADMIN) {
    return [...CLIENT_TOOLS];
  }
  return [...PUBLIC_TOOLS];
}

function deterministicPlan(message: string, context: AuthorizationContext): IntentPlan {
  const normalized = message.toLowerCase();
  const tools: IntentPlan['tools'] = [];
  const date = message.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/)?.slice(1, 4);
  if (/(available|availability|vacant|open|booked|calendar|petsa|date)/i.test(message)) {
    tools.push({ name: 'checkCalendarAvailability', arguments: date ? { date: `${date[0]}-${date[1].padStart(2, '0')}-${date[2].padStart(2, '0')}` } : {} });
  }
  if (/(event categor|type of event|anong event|offer.*event)/i.test(message)) tools.push({ name: 'getCurrentEventCategories', arguments: {} });
  if (/(package|price|presyo|inclusion|magkano)/i.test(message)) {
    tools.push({ name: 'getCurrentPackagePriceAndInclusions', arguments: { query: message } });
  }
  if (context.bookingId) {
    if (/(my booking|booking progress|status ng booking)/i.test(message)) tools.push({ name: 'getOwnBookingProgress', arguments: {} });
    if (/(payment|paid|balance|bayad)/i.test(message)) tools.push({ name: 'getOwnPaymentStatus', arguments: {} });
    if (/(contract|kontrata)/i.test(message)) tools.push({ name: 'getOwnContractStatus', arguments: {} });
    if (/(timeline|schedule ng event|event timeline)/i.test(message)) tools.push({ name: 'getOwnEventTimeline', arguments: {} });
    if (/(task|todo|to-do)/i.test(message)) tools.push({ name: 'getPermittedAssignedTasks', arguments: {} });
  }
  const unique = [...new Map(tools.map((tool) => [tool.name, tool])).values()].slice(0, 4);
  return {
    intents: unique.map((tool) => tool.name),
    tools: unique,
    needsKnowledge: unique.length === 0 || /(rule|privacy|term|facility|venue|faq|how|what|where|policy)/i.test(normalized),
    complexity: unique.length > 1 ? 'complex' : 'simple',
    language: /\b(ang|mga|po|ba|magkano|presyo|petsa|bayad)\b/i.test(message) ? 'tl-PH' : 'en',
  };
}

function safeJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === 'string') return item.slice(0, 2_000);
    return item;
  });
}

function stringArgument(args: Record<string, unknown>, key: string, maxLength = 200) {
  return typeof args[key] === 'string' ? args[key].trim().slice(0, maxLength) : '';
}

function dateFromMessage(message: string) {
  const iso = message.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const monthNames: Record<string, string> = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
  const named = message.match(new RegExp(`\\b(${Object.keys(monthNames).join('|')})\\s+([0-3]?\\d)(?:,?\\s+(20\\d{2}))?`, 'i'));
  if (named) return `${named[3] || new Date().getFullYear()}-${monthNames[named[1].toLowerCase()]}-${named[2].padStart(2, '0')}`;
  return '';
}

async function packageByQuery(query: string) {
  const packages = await prisma.package.findMany({
    where: {
      status: 'ACTIVE',
      clientVisible: true,
      eventCategory: { status: 'ACTIVE', clientVisible: true },
    },
    include: {
      eventCategory: { select: { name: true, slug: true } },
      inclusions: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const ranked = packages.map((item) => ({
    item,
    score: tokens.reduce((score, token) => score + (`${item.packageName} ${item.eventCategory.name}`.toLowerCase().includes(token) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);
  const selected = ranked[0]?.score ? ranked[0].item : null;
  if (!selected) return { available: false, reason: 'No current package matched the request.' };
  return {
    available: true,
    packageName: selected.packageName,
    category: selected.eventCategory.name,
    price: selected.price,
    currency: selected.currency,
    paxIncluded: selected.paxIncluded,
    excessPaxFee: selected.excessPaxFee,
    reservationFee: selected.reservationFee,
    inclusions: selected.inclusions.map((inclusion) => ({
      title: inclusion.inclusionName,
      description: inclusion.description,
      isFree: inclusion.isFree,
      isOptional: inclusion.isOptional,
    })),
    version: selected.currentVersion,
    checkedAt: new Date().toISOString(),
  };
}

async function bookingForContext(context: AuthorizationContext, args: Record<string, unknown>) {
  if (context.bookingId) {
    return prisma.booking.findUnique({ where: { id: context.bookingId } });
  }
  if (context.actorType !== AssistantActorType.ADMIN && context.actorType !== AssistantActorType.SUPERADMIN) {
    throw new CommandCenterError('Booking verification is required for private records.', 403);
  }
  const bookingReference = stringArgument(args, 'bookingReference', 120).toUpperCase();
  if (!bookingReference) throw new CommandCenterError('A booking reference is required for this admin tool.', 422);
  return prisma.booking.findUnique({ where: { bookingReference } });
}

async function executeTool(
  tool: IntentPlan['tools'][number],
  context: AuthorizationContext,
  message: string,
): Promise<GroundingEvidence | null> {
  const allowed = new Set(availableTools(context));
  if (!allowed.has(tool.name)) throw new CommandCenterError(`Tool ${tool.name} is not permitted for this actor.`, 403);
  const checkedAt = new Date().toISOString();
  if (tool.name === 'checkCalendarAvailability') {
    const date = stringArgument(tool.arguments, 'date', 20) || dateFromMessage(message);
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(date)) return null;
    const data = await getClientCalendarAvailability(date.slice(0, 7));
    return { label: 'Venue Calendar', type: 'live', content: safeJson({ date, available: !data.bookedDates.includes(date) }), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getCurrentEventCategories') {
    const categories = await getPublicEventCategories();
    return { label: 'Current Event Categories', type: 'live_record', content: safeJson(categories), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getCurrentPackages') {
    const slug = stringArgument(tool.arguments, 'categorySlug', 120);
    if (!slug) return null;
    return { label: 'Current Packages', type: 'live_record', content: safeJson(await getPublicPackagesForCategory(slug)), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getCurrentPackagePriceAndInclusions') {
    const slug = stringArgument(tool.arguments, 'packageSlug', 120);
    const data = slug ? await getPublicPackageBySlug(slug).catch(() => packageByQuery(message)) : await packageByQuery(stringArgument(tool.arguments, 'query', 500) || message);
    const version = data && typeof data === 'object' && 'version' in data && typeof data.version === 'number' ? data.version : undefined;
    return { label: 'Current Package and Inclusions', type: 'live_record', content: safeJson(data), checkedAt, freshness: 'real_time', version };
  }
  if (tool.name === 'searchPublishedKnowledge') return null;
  const booking = await bookingForContext(context, tool.arguments);
  if (!booking) return { label: 'Booking Record', type: 'live_record', content: safeJson({ available: false }), checkedAt, freshness: 'real_time' };
  if (tool.name === 'getOwnBookingProgress') {
    return { label: 'Booking Progress', type: 'live_record', content: safeJson({ bookingReference: booking.bookingReference, eventTitle: booking.eventTitle, eventType: booking.eventType, eventDate: booking.eventDate, status: booking.status, automationStatus: booking.automationStatus, syncStatus: booking.syncStatus }), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getOwnPaymentStatus') {
    return { label: 'Payment Status', type: 'live_record', content: safeJson({ bookingReference: booking.bookingReference, status: booking.paymentSummaryStatus, totalAmount: booking.paymentTotalAmount, amountPaid: booking.paymentAmountPaid, remainingBalance: booking.paymentRemainingBalance, dueDate: booking.paymentDueDate }), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getOwnContractStatus') {
    return { label: 'Contract Status', type: 'live_record', content: safeJson({ bookingReference: booking.bookingReference, contractStatus: booking.contractStatus }), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getOwnEventTimeline') {
    const timeline = await prisma.bookingTimeline.findMany({ where: { bookingId: booking.id }, orderBy: { createdAt: 'asc' }, take: 50, select: { action: true, source: true, description: true, createdAt: true } });
    return { label: 'Event Timeline', type: 'live_record', content: safeJson(timeline), checkedAt, freshness: 'real_time' };
  }
  if (tool.name === 'getPermittedAssignedTasks') {
    const tasks = await prisma.dashboardTask.findMany({
      where: { relatedRecordId: booking.id, isActive: true, status: { in: [DashboardTaskStatus.PENDING, DashboardTaskStatus.OVERDUE] } },
      orderBy: [{ taskDate: 'asc' }, { orderIndex: 'asc' }],
      take: 50,
      select: { title: true, description: true, taskDate: true, priority: true, status: true, category: true },
    });
    return { label: 'Permitted Assigned Tasks', type: 'live_record', content: safeJson(tasks), checkedAt, freshness: 'real_time' };
  }
  return null;
}

async function faqEvidence(message: string) {
  const entries = await prisma.supportFaqEntry.findMany({
    where: {
      status: { notIn: [SupportFaqStatus.HIDDEN, SupportFaqStatus.ARCHIVED] },
      currentPublishedVersion: {
        is: { publicationStatus: 'PUBLISHED', assistantEnabled: true, clientVisible: true },
      },
    },
    include: { category: { select: { name: true } }, currentPublishedVersion: true },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    take: 200,
  });
  const tokens = new Set(message.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const ranked = entries.map((entry) => {
    const published = entry.currentPublishedVersion;
    const haystack = `${published?.question || ''} ${(published?.tags || []).join(' ')} ${entry.category?.name || ''}`.toLowerCase();
    const matches = [...tokens].filter((token) => haystack.includes(token)).length;
    return { entry, score: tokens.size ? matches / tokens.size : 0 };
  }).sort((a, b) => b.score - a.score);
  if (!ranked[0] || ranked[0].score < 0.2) return null;
  return {
    evidence: {
      label: `FAQ: ${ranked[0].entry.currentPublishedVersion?.question || ranked[0].entry.question}`,
      type: 'knowledge' as const,
      content: ranked[0].entry.currentPublishedVersion?.answer || ranked[0].entry.answer,
      checkedAt: (ranked[0].entry.currentPublishedVersion?.publishedAt || ranked[0].entry.currentPublishedVersion?.createdAt || ranked[0].entry.updatedAt).toISOString(),
      freshness: 'published' as const,
    },
    confidence: ranked[0].score,
  };
}

function deterministicAnswer(evidence: GroundingEvidence[], locale: string) {
  if (evidence.length === 1 && evidence[0].label.startsWith('FAQ:')) return evidence[0].content;
  const lead = locale.toLowerCase().startsWith('tl') ? 'Narito ang beripikadong impormasyon:' : 'Here is the verified information:';
  return `${lead}\n\n${evidence.map((item) => `${item.label}: ${item.content}`).join('\n\n')}`.slice(0, 6_000);
}

function answerNumbersAreGrounded(answer: string, evidence: GroundingEvidence[]) {
  const numbers = answer.match(/\b\d+(?:[.,]\d+)*\b/g) || [];
  const source = evidence.map((item) => item.content).join(' ');
  return numbers.every((number) => source.includes(number));
}

async function conversationFor(input: {
  suppliedReference: unknown;
  context: AuthorizationContext;
  locale: string;
  sourcePage: string;
}) {
  const supplied = typeof input.suppliedReference === 'string' ? input.suppliedReference.trim().slice(0, 80) : '';
  if (supplied) {
    const existing = await prisma.assistantConversation.findFirst({
      where: { publicReference: supplied, actorReference: input.context.actorReference, expiresAt: { gt: new Date() } },
    });
    if (existing) return existing;
  }
  return prisma.assistantConversation.create({
    data: {
      publicReference: publicReference('conv'),
      actorType: input.context.actorType,
      actorReference: input.context.actorReference,
      bookingId: input.context.bookingId,
      locale: input.locale,
      sourcePage: input.sourcePage,
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
    },
  });
}

export async function askGroundedAssistant(request: Request, body?: Record<string, unknown>) {
  const input = body ?? await request.json() as Record<string, unknown>;
  const message = requiredMessage(input.message ?? input.question);
  const locale = typeof input.locale === 'string' ? input.locale.trim().slice(0, 20) || 'en-PH' : 'en-PH';
  const sourcePage = typeof input.sourcePage === 'string' ? input.sourcePage.trim().slice(0, 255) || 'smart_assistant' : 'smart_assistant';
  const context = await authorizationContext(request);
  await enforceRateLimit({
    scope: 'assistant-ask-ip',
    identity: hashedRateLimitIdentity([requestIpAddress(request)]),
    limit: 30,
    windowSeconds: 60,
  });
  await enforceRateLimit({
    scope: 'assistant-ask-actor',
    identity: context.actorReference,
    limit: context.actorType === AssistantActorType.GUEST ? 20 : 60,
    windowSeconds: 60,
  });
  const conversation = await conversationFor({ suppliedReference: input.conversationId, context, locale, sourcePage });
  const traceId = publicReference('trace');
  const startedAt = Date.now();
  const provider = getLlmProvider();
  let providerFailed = false;
  let plan: IntentPlan;
  try {
    plan = await provider.classifyIntent({
      message: redacted(message), locale, actorType: context.actorType, availableTools: availableTools(context),
    });
  } catch {
    providerFailed = true;
    plan = deterministicPlan(message, context);
  }
  plan.tools = plan.tools.filter((tool) => availableTools(context).includes(tool.name)).slice(0, 4);
  if (plan.tools.length > 1) plan.complexity = 'complex';

  const evidence: GroundingEvidence[] = [];
  if (plan.needsKnowledge) {
    try {
      const results = await searchPublishedKnowledge({ query: message, actorType: context.actorType, limit: 6 });
      evidence.push(...results.map((item) => ({
        label: item.label,
        type: 'knowledge' as const,
        content: item.content,
        checkedAt: item.publishedAt,
        freshness: 'published' as const,
        version: item.resourceVersion ?? undefined,
      })));
    } catch {
      const faq = await faqEvidence(message);
      if (faq) evidence.push(faq.evidence);
    }
  }
  const toolResults = await Promise.allSettled(plan.tools.map((tool) => executeTool(tool, context, message)));
  for (const result of toolResults) {
    if (result.status === 'fulfilled' && result.value) evidence.push(result.value);
  }
  const deduped = [...new Map(evidence.map((item) => [`${item.label}|${item.content}`, item])).values()].slice(0, 10);

  let status: AssistantResponseStatus = AssistantResponseStatus.ANSWERED;
  let answerMode = plan.complexity === 'complex' ? 'multi_source_summary' : 'grounded_answer';
  let answer: string;
  let modelIdentifier: string | null = null;
  let citedIndexes: number[] = [];
  if (!deduped.length) {
    status = AssistantResponseStatus.UNABLE_TO_VERIFY;
    answerMode = 'unable_to_verify';
    answer = locale.toLowerCase().startsWith('tl')
      ? 'Hindi ko ma-verify ang sagot mula sa kasalukuyang aprubadong impormasyon. Mangyaring makipag-ugnayan sa ZENTRA team para sa kumpirmasyon.'
      : 'I cannot verify that from the currently approved information. Please contact the ZENTRA team for confirmation.';
    const unanswered = await prisma.assistantUnansweredQuestion.create({
      data: { question: redacted(message), sourcePage, matchConfidence: 0 },
    });
    await createAuditLog({
      ...systemAuditActor(), ...getRequestContext(request), action: AuditAction.CREATE,
      module: 'ZENTRA Smart Assistant', description: 'Recorded an unable-to-verify assistant question.',
      status: AuditStatus.INFO, metadata: { event: 'ASSISTANT_UNABLE_TO_VERIFY', unansweredId: unanswered.id, traceId },
    });
  } else if (providerFailed) {
    status = AssistantResponseStatus.PROVIDER_UNAVAILABLE;
    answerMode = 'deterministic_fallback';
    answer = deterministicAnswer(deduped, locale);
    citedIndexes = deduped.map((_item, index) => index);
  } else {
    try {
      const generated = await provider.generateGroundedAnswer({ message: redacted(message), locale, plan, evidence: deduped, complexity: plan.complexity });
      if (!answerNumbersAreGrounded(generated.answer, generated.citedEvidenceIndexes.map((index) => deduped[index]))) {
        throw new LlmProviderError('Generated numerical claims were not grounded.', 502);
      }
      answer = generated.answer;
      citedIndexes = generated.citedEvidenceIndexes;
      modelIdentifier = generated.modelIdentifier;
    } catch {
      status = AssistantResponseStatus.PROVIDER_UNAVAILABLE;
      answerMode = 'deterministic_fallback';
      answer = deterministicAnswer(deduped, locale);
      citedIndexes = deduped.map((_item, index) => index);
    }
  }
  const citations = citedIndexes.map((index) => deduped[index]).filter(Boolean).map((item) => ({
    label: item.label,
    type: item.type,
    version: item.version,
    checkedAt: item.checkedAt,
    freshness: item.freshness,
  }));
  await prisma.assistantInteraction.create({
    data: {
      conversationId: conversation.id,
      traceReference: traceId,
      status,
      answerMode,
      redactedQuestion: redacted(message),
      redactedAnswer: redacted(answer),
      intentPlan: plan as unknown as Prisma.InputJsonValue,
      citationMetadata: citations as unknown as Prisma.InputJsonValue,
      toolMetadata: plan.tools.map((tool) => ({ name: tool.name })) as Prisma.InputJsonValue,
      providerModel: modelIdentifier,
      latencyMs: Date.now() - startedAt,
    },
  });
  return {
    status: status === AssistantResponseStatus.UNABLE_TO_VERIFY ? 'unable_to_verify' : 'answered',
    mode: answerMode,
    answer,
    citations,
    safeActions: context.bookingId ? ['revoke_booking_access'] : ['request_booking_verification'],
    traceId,
    conversationId: conversation.publicReference,
    fallback: answerMode === 'deterministic_fallback' || answerMode === 'unable_to_verify',
    matchConfidence: deduped.length ? 1 : 0,
    source: citations[0] ? { question: citations[0].label, categoryName: null } : null,
  };
}

export async function submitAssistantFeedback(request: Request, body: Record<string, unknown>) {
  const context = await authorizationContext(request);
  const traceId = typeof body.traceId === 'string' ? body.traceId.trim().slice(0, 80) : '';
  const rating = Number(body.rating);
  if (!traceId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new CommandCenterError('Trace ID and a rating from 1 to 5 are required.', 422);
  }
  const interaction = await prisma.assistantInteraction.findFirst({
    where: {
      traceReference: traceId,
      conversation: { actorReference: context.actorReference },
    },
  });
  if (!interaction) throw new CommandCenterError('Assistant interaction not found.', 404);
  const feedback = await prisma.assistantFeedback.create({
    data: {
      interactionId: interaction.id,
      rating,
      correction: typeof body.correction === 'string' ? redacted(body.correction).slice(0, 2_000) || null : null,
      escalation: body.escalation === true,
      submittedBy: context.actorReference,
    },
  });
  return { feedbackReference: hash(feedback.id).slice(0, 24) };
}
