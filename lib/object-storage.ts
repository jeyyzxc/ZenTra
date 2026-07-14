import 'server-only';

type StorageConfig = {
  url: string;
  serviceRoleKey: string;
};

function config(): StorageConfig {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const serviceRoleKey = (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  if (!url || !serviceRoleKey) throw new Error('Supabase object storage is not configured.');
  return { url, serviceRoleKey };
}

function path(value: string) {
  return value.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

async function storageFetch(endpoint: string, init: RequestInit) {
  const storage = config();
  const response = await fetch(`${storage.url}/storage/v1${endpoint}`, {
    ...init,
    headers: {
      authorization: `Bearer ${storage.serviceRoleKey}`,
      apikey: storage.serviceRoleKey,
      ...init.headers,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(payload.message || payload.error || `Object storage request failed (${response.status}).`);
  }
  return response;
}

export interface ObjectStorage {
  upload(input: { bucket: string; objectPath: string; data: ArrayBuffer; mimeType: string }): Promise<void>;
  createSignedUploadUrl(input: { bucket: string; objectPath: string }): Promise<string>;
  createSignedUrl(input: { bucket: string; objectPath: string; expiresInSeconds?: number }): Promise<string>;
  download(input: { bucket: string; objectPath: string }): Promise<ArrayBuffer>;
  copy(input: { sourceBucket: string; sourcePath: string; destinationBucket: string; destinationPath: string }): Promise<void>;
  remove(input: { bucket: string; objectPaths: string[] }): Promise<void>;
  publicUrl(input: { bucket: string; objectPath: string }): string;
}

export class SupabaseObjectStorage implements ObjectStorage {
  async upload(input: { bucket: string; objectPath: string; data: ArrayBuffer; mimeType: string }) {
    await storageFetch(`/object/${encodeURIComponent(input.bucket)}/${path(input.objectPath)}`, {
      method: 'POST',
      headers: { 'content-type': input.mimeType, 'x-upsert': 'false' },
      body: input.data,
    });
  }

  async createSignedUploadUrl(input: { bucket: string; objectPath: string }) {
    const response = await storageFetch(
      `/object/upload/sign/${encodeURIComponent(input.bucket)}/${path(input.objectPath)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      },
    );
    const payload = await response.json() as { url?: string };
    if (!payload.url) throw new Error('Object storage did not return a signed upload URL.');
    return payload.url.startsWith('http')
      ? payload.url
      : `${config().url}/storage/v1${payload.url.startsWith('/') ? '' : '/'}${payload.url}`;
  }

  async createSignedUrl(input: { bucket: string; objectPath: string; expiresInSeconds?: number }) {
    const response = await storageFetch(`/object/sign/${encodeURIComponent(input.bucket)}/${path(input.objectPath)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: Math.min(Math.max(input.expiresInSeconds ?? 600, 30), 3_600) }),
    });
    const payload = await response.json() as { signedURL?: string; signedUrl?: string };
    const signed = payload.signedURL || payload.signedUrl;
    if (!signed) throw new Error('Object storage did not return a signed URL.');
    return signed.startsWith('http') ? signed : `${config().url}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`;
  }

  async download(input: { bucket: string; objectPath: string }) {
    const response = await storageFetch(
      `/object/${encodeURIComponent(input.bucket)}/${path(input.objectPath)}`,
      { method: 'GET' },
    );
    return response.arrayBuffer();
  }

  async copy(input: { sourceBucket: string; sourcePath: string; destinationBucket: string; destinationPath: string }) {
    await storageFetch('/object/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bucketId: input.sourceBucket,
        sourceKey: input.sourcePath,
        destinationBucket: input.destinationBucket,
        destinationKey: input.destinationPath,
      }),
    });
  }

  async remove(input: { bucket: string; objectPaths: string[] }) {
    if (!input.objectPaths.length) return;
    await storageFetch(`/object/${encodeURIComponent(input.bucket)}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prefixes: input.objectPaths }),
    });
  }

  publicUrl(input: { bucket: string; objectPath: string }) {
    return `${config().url}/storage/v1/object/public/${encodeURIComponent(input.bucket)}/${path(input.objectPath)}`;
  }
}

let objectStorage: ObjectStorage | null = null;

export function getObjectStorage() {
  objectStorage ??= new SupabaseObjectStorage();
  return objectStorage;
}
