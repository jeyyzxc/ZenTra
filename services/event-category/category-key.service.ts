import type { Prisma } from '@prisma/client';

type CategoryKeyDb = Pick<Prisma.TransactionClient, 'eventCategory'>;

export function normalizeCategoryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

export async function generateUniqueCategoryKey(
  name: string,
  db: CategoryKeyDb,
) {
  const baseKey = normalizeCategoryKey(name) || 'event';
  const existing = await db.eventCategory.findMany({
    where: {
      OR: [
        { categoryKey: baseKey },
        { categoryKey: { startsWith: `${baseKey}_` } },
      ],
    },
    select: { categoryKey: true },
  });
  const usedKeys = new Set(existing.map((item) => item.categoryKey));

  if (!usedKeys.has(baseKey)) {
    return baseKey;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${baseKey}_${suffix}`;

    if (!usedKeys.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique event category key.');
}

export function taskTemplateKeyForCategory(categoryKey: string) {
  return `${categoryKey}_standard`;
}
