export const ASSISTANT_TOOLS = [
  'checkCalendarAvailability',
  'getCurrentEventCategories',
  'getCurrentPackages',
  'getCurrentPackagePriceAndInclusions',
  'getOwnBookingProgress',
  'getOwnPaymentStatus',
  'getOwnContractStatus',
  'getOwnEventTimeline',
  'getPermittedAssignedTasks',
  'searchPublishedKnowledge',
] as const;

export type AssistantToolName = typeof ASSISTANT_TOOLS[number];

export type IntentInput = {
  message: string;
  locale: string;
  actorType: 'GUEST' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN';
  availableTools: AssistantToolName[];
};

export type IntentPlan = {
  intents: string[];
  tools: Array<{ name: AssistantToolName; arguments: Record<string, unknown> }>;
  needsKnowledge: boolean;
  complexity: 'simple' | 'complex';
  language: string;
};

export type GroundingEvidence = {
  label: string;
  type: 'knowledge' | 'live' | 'live_record';
  content: string;
  checkedAt: string;
  freshness: 'real_time' | 'published' | 'historical';
  version?: number;
};

export type GroundedAnswerInput = {
  message: string;
  locale: string;
  plan: IntentPlan;
  evidence: GroundingEvidence[];
  complexity: 'simple' | 'complex';
};

export type GroundedAnswer = {
  answer: string;
  citedEvidenceIndexes: number[];
  modelIdentifier: string;
};

export type EmbeddingDocument = {
  title: string;
  content: string;
};

export type ProviderHealth = {
  available: boolean;
  provider: string;
  checkedAt: string;
  models: string[];
  safeError?: string;
};

export interface LlmProvider {
  classifyIntent(input: IntentInput): Promise<IntentPlan>;
  generateGroundedAnswer(input: GroundedAnswerInput): Promise<GroundedAnswer>;
  embedDocuments(input: EmbeddingDocument[]): Promise<number[][]>;
  embedQuery(input: string): Promise<number[]>;
  healthCheck(): Promise<ProviderHealth>;
}

export class LlmProviderError extends Error {
  status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.name = 'LlmProviderError';
    this.status = status;
  }
}

export function normalizeEmbedding(values: number[], expectedDimension = 768) {
  if (values.length !== expectedDimension || values.some((value) => !Number.isFinite(value))) {
    throw new LlmProviderError(`Embedding must contain ${expectedDimension} finite values.`);
  }
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(magnitude) || magnitude === 0) throw new LlmProviderError('Embedding magnitude is invalid.');
  return values.map((value) => value / magnitude);
}

