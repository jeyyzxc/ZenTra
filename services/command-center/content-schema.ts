import { ContentType, Prisma } from '@prisma/client';

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

function record(value: unknown, label = 'payload'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ContentValidationError(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function requiredText(value: unknown, label: string, maxLength = 10_000) {
  const result = typeof value === 'string' ? value.trim() : '';

  if (!result) throw new ContentValidationError(`${label} is required.`);
  if (result.length > maxLength) {
    throw new ContentValidationError(`${label} must be ${maxLength} characters or fewer.`);
  }

  return result;
}

function optionalText(value: unknown, label: string, maxLength = 10_000) {
  if (value === undefined || value === null || value === '') return null;
  return requiredText(value, label, maxLength);
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function integerValue(value: unknown, label: string, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const result = Number(value);

  if (!Number.isInteger(result)) throw new ContentValidationError(`${label} must be a whole number.`);
  return result;
}

function stringList(value: unknown, label: string, limit = 50) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > limit) {
    throw new ContentValidationError(`${label} must be an array with at most ${limit} items.`);
  }

  return value.map((item, index) => requiredText(item, `${label}[${index}]`, 500));
}

function safeUrl(value: unknown, label: string, required = false) {
  const text = optionalText(value, label, 2_000);

  if (!text) {
    if (required) throw new ContentValidationError(`${label} is required.`);
    return null;
  }

  if (text.startsWith('/')) return text;

  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('unsafe');
    return parsed.toString();
  } catch {
    throw new ContentValidationError(`${label} must be a safe HTTP(S) or site-relative URL.`);
  }
}

function validateGalleryPayload(input: unknown): Prisma.InputJsonObject {
  const value = record(input);

  return {
    title: requiredText(value.title, 'Gallery title', 180),
    caption: optionalText(value.caption, 'Gallery caption', 2_000),
    altText: requiredText(value.altText, 'Gallery alt text', 300),
    mediaAssetId: optionalText(value.mediaAssetId, 'Gallery media asset', 120),
    imageUrl: safeUrl(value.imageUrl, 'Gallery image URL'),
    eventCategoryId: optionalText(value.eventCategoryId, 'Event category', 120),
    collectionId: optionalText(value.collectionId, 'Gallery collection', 120),
    featured: booleanValue(value.featured),
    displayOrder: integerValue(value.displayOrder, 'Display order'),
  };
}

function validateFacilityPayload(input: unknown): Prisma.InputJsonObject {
  const value = record(input);
  const cta = value.cta ? record(value.cta, 'Facility CTA') : null;

  return {
    name: requiredText(value.name, 'Facility name', 180),
    slug: requiredText(value.slug, 'Facility slug', 120),
    summary: requiredText(value.summary, 'Facility summary', 600),
    description: requiredText(value.description, 'Facility description', 12_000),
    amenities: stringList(value.amenities, 'Amenities'),
    accessibilityGuidance: optionalText(
      value.accessibilityGuidance,
      'Accessibility guidance',
      4_000,
    ),
    mediaAssetIds: stringList(value.mediaAssetIds, 'Facility media assets', 20),
    imageUrls: Array.isArray(value.imageUrls)
      ? value.imageUrls.map((url, index) => safeUrl(url, `Facility image URL ${index + 1}`, true))
      : [],
    cta: cta ? {
      label: requiredText(cta.label, 'CTA label', 80),
      href: safeUrl(cta.href, 'CTA link', true),
    } : null,
    displayOrder: integerValue(value.displayOrder, 'Display order'),
    visible: booleanValue(value.visible, true),
  };
}

function validatePolicyPayload(input: unknown): Prisma.InputJsonObject {
  const value = record(input);

  if (!Array.isArray(value.blocks) || value.blocks.length === 0 || value.blocks.length > 100) {
    throw new ContentValidationError('Policy blocks must contain between 1 and 100 blocks.');
  }

  const blocks = value.blocks.map((block, index) => {
    const item = record(block, `blocks[${index}]`);
    const type = requiredText(item.type, `blocks[${index}].type`, 30);

    if (type === 'heading') {
      const level = integerValue(item.level, `blocks[${index}].level`, 2);
      if (level < 2 || level > 4) {
        throw new ContentValidationError(`blocks[${index}].level must be 2, 3, or 4.`);
      }
      return { type, level, text: requiredText(item.text, `blocks[${index}].text`, 300) };
    }

    if (type === 'paragraph' || type === 'callout') {
      return { type, text: requiredText(item.text, `blocks[${index}].text`, 8_000) };
    }

    if (type === 'list') {
      return {
        type,
        ordered: booleanValue(item.ordered),
        items: stringList(item.items, `blocks[${index}].items`, 50),
      };
    }

    if (type === 'link') {
      return {
        type,
        label: requiredText(item.label, `blocks[${index}].label`, 200),
        href: safeUrl(item.href, `blocks[${index}].href`, true),
      };
    }

    throw new ContentValidationError(`blocks[${index}].type is not supported.`);
  });

  return {
    title: requiredText(value.title, 'Document title', 240),
    effectiveDate: optionalText(value.effectiveDate, 'Effective date', 40),
    summary: optionalText(value.summary, 'Document summary', 1_000),
    blocks,
  };
}

export function parseContentType(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (!Object.values(ContentType).includes(normalized as ContentType)) {
    throw new ContentValidationError('Content type is invalid.');
  }

  return normalized as ContentType;
}

export function validateContentPayload(type: ContentType, input: unknown): Prisma.InputJsonObject {
  switch (type) {
    case ContentType.GALLERY_ITEM:
      return validateGalleryPayload(input);
    case ContentType.FACILITY:
      return validateFacilityPayload(input);
    case ContentType.RULES:
    case ContentType.PRIVACY:
    case ContentType.TERMS:
      return validatePolicyPayload(input);
  }
}

export function commandCenterSlug(value: unknown) {
  const slug = requiredText(value, 'Slug', 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) throw new ContentValidationError('Slug must contain letters or numbers.');
  return slug;
}

