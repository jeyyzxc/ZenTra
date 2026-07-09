export type BookingCategorizationInput = {
  bookingId: string;
  bookingReference: string;
  eventType?: string | null;
  eventCategoryName?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  packageSnapshot?: unknown;
  guestCount?: number | null;
  eventDate?: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
  conflicts?: unknown[];
  paymentSummary?: unknown;
};

export type BookingCategorizationResult = {
  eventCategory: string;
  eventCategoryKey: string;
  packageCategory: string;
  packageTier: string;
  taskTemplateKey: string;
  riskLevel: 'low' | 'medium' | 'high';
  hasScheduleConflict: boolean;
  requiresManualReview: boolean;
  suggestedAdminRole: 'ADMIN' | 'SUPERADMIN';
  tags: string[];
  reasonCodes: string[];
};

const CATEGORY_RULES = [
  {
    key: 'wedding',
    label: 'Wedding',
    taskTemplateKey: 'wedding_standard',
    reasonCode: 'EVENT_WEDDING',
    terms: ['wedding', 'marriage', 'reception', 'kasal', 'bridal', 'bride', 'groom', 'nuptial'],
  },
  {
    key: 'birthday_debut',
    label: 'Birthday / Debut',
    taskTemplateKey: 'birthday_debut_standard',
    reasonCode: 'EVENT_BIRTHDAY_DEBUT',
    terms: ['birthday', 'debut', '18th birthday', '18th', '7th birthday'],
  },
  {
    key: 'christening',
    label: 'Christening / Baptism',
    taskTemplateKey: 'christening_standard',
    reasonCode: 'EVENT_CHRISTENING',
    terms: ['christening', 'baptism', 'baptismal', 'dedication'],
  },
  {
    key: 'corporate_group',
    label: 'Corporate / Group Event',
    taskTemplateKey: 'corporate_group_standard',
    reasonCode: 'EVENT_CORPORATE_GROUP',
    terms: ['corporate', 'company', 'company party', 'christmas party', 'reunion', 'group event', 'team building', 'seminar'],
  },
  {
    key: 'general_event',
    label: 'General Event',
    taskTemplateKey: 'general_event_standard',
    reasonCode: 'EVENT_GENERAL',
    terms: [],
  },
] as const;

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normalize(value: unknown) {
  return text(value).toLowerCase();
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function snapshotText(snapshot: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = text(snapshot[key]);

    if (value) {
      return value;
    }
  }

  return '';
}

function snapshotNumber(snapshot: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = snapshot[key];

    if (value === null || value === undefined || value === '') {
      continue;
    }

    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function hasPaymentOrPriceData(input: BookingCategorizationInput, snapshot: Record<string, unknown>) {
  if (input.paymentSummary !== null && input.paymentSummary !== undefined) {
    return true;
  }

  return snapshotNumber(
    snapshot,
    'price',
    'packagePrice',
    'totalAmount',
    'downPaymentAmount',
    'reservationFee',
    'fullPaymentAmount',
  ) !== null;
}

function chooseEventCategory(input: BookingCategorizationInput, snapshot: Record<string, unknown>) {
  const haystack = [
    input.eventType,
    input.eventCategoryName,
    input.packageName,
    snapshotText(snapshot, 'eventType', 'eventCategoryName', 'categoryName', 'packageName'),
  ].map(normalize).join(' ');

  return CATEGORY_RULES.find((rule) => (
    rule.terms.length > 0 && rule.terms.some((term) => haystack.includes(term))
  )) ?? CATEGORY_RULES[CATEGORY_RULES.length - 1];
}

function classifyPackageTier(packageName: string, snapshot: Record<string, unknown>) {
  const haystack = [
    packageName,
    snapshotText(snapshot, 'packageTier', 'tier', 'packageCategory'),
  ].map(normalize).join(' ');

  if (
    haystack.includes('premium') ||
    haystack.includes('gold') ||
    haystack.includes('full') ||
    haystack.includes('complete')
  ) {
    return 'premium';
  }

  if (
    haystack.includes('standard') ||
    haystack.includes('regular') ||
    haystack.includes('basic')
  ) {
    return 'standard';
  }

  if (haystack.includes('reservation only') || haystack.includes('venue only')) {
    return 'reservation_only';
  }

  return 'custom_or_unknown';
}

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

export function categorizeBooking(
  input: BookingCategorizationInput,
): BookingCategorizationResult {
  const snapshot = record(input.packageSnapshot);
  const category = chooseEventCategory(input, snapshot);
  const packageCategory = text(input.packageName) ||
    snapshotText(snapshot, 'packageName', 'name', 'title') ||
    'Unspecified Package';
  const packageTier = classifyPackageTier(packageCategory, snapshot);
  const hasScheduleConflict = Array.isArray(input.conflicts) && input.conflicts.length > 0;
  const hasPackageData = Boolean(text(input.packageId) || text(input.packageName) || snapshotText(snapshot, 'packageName'));
  const hasFinancialData = hasPaymentOrPriceData(input, snapshot);
  const hasEventDate = Boolean(input.eventDate);
  const hasTimeWindow = Boolean(text(input.startTime) || text(input.endTime));
  const tags: string[] = [];
  const reasonCodes: string[] = [category.reasonCode];

  pushUnique(tags, category.key);
  pushUnique(tags, packageTier);

  if (hasScheduleConflict) {
    pushUnique(tags, 'schedule_conflict');
    pushUnique(reasonCodes, 'SCHEDULE_CONFLICT');
  }

  if (!hasPackageData) {
    pushUnique(reasonCodes, 'MISSING_PACKAGE_DATA');
  }

  if (!hasFinancialData) {
    pushUnique(reasonCodes, 'MISSING_PAYMENT_DATA');
  }

  if (!hasEventDate) {
    pushUnique(reasonCodes, 'MISSING_EVENT_DATE');
  }

  if (!hasTimeWindow) {
    pushUnique(reasonCodes, 'MISSING_EVENT_TIME');
  }

  if (Number(input.guestCount) > 150) {
    pushUnique(tags, 'large_guest_count');
    pushUnique(reasonCodes, 'LARGE_GUEST_COUNT');
  }

  pushUnique(reasonCodes, `PACKAGE_${packageTier.toUpperCase()}`);

  const hasMediumRiskGap = !hasPackageData || !hasFinancialData || !hasEventDate || !hasTimeWindow;
  const riskLevel = hasScheduleConflict
    ? 'high'
    : hasMediumRiskGap
      ? 'medium'
      : 'low';

  return {
    eventCategory: category.label,
    eventCategoryKey: category.key,
    packageCategory,
    packageTier,
    taskTemplateKey: category.taskTemplateKey,
    riskLevel,
    hasScheduleConflict,
    requiresManualReview: riskLevel !== 'low',
    suggestedAdminRole: riskLevel === 'high' ? 'SUPERADMIN' : 'ADMIN',
    tags,
    reasonCodes,
  };
}
