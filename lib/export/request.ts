export function normalizeExportIds(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const uniqueIds = new Set<string>();

  for (const entry of values) {
    if (typeof entry !== 'string') {
      continue;
    }

    const trimmed = entry.trim();

    if (trimmed) {
      uniqueIds.add(trimmed);
    }
  }

  return Array.from(uniqueIds);
}

export function idsFromSearchParams(searchParams: URLSearchParams) {
  return normalizeExportIds(searchParams.get('ids'));
}
