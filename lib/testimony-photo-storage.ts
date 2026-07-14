import { randomUUID } from 'node:crypto';

const MAX_PHOTO_SIZE = 4 * 1024 * 1024;
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class TestimonyPhotoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TestimonyPhotoError';
    this.status = status;
  }
}

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_TESTIMONY_PHOTOS_BUCKET || 'testimony-photos';

  if (!url || !serviceRoleKey) {
    throw new TestimonyPhotoError(
      'Event photo storage is not configured. You can submit without a photo.',
      503,
    );
  }

  return { url, serviceRoleKey, bucket };
}

function cleanSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'photo';
}

function encodedObjectPath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function hasValidSignature(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  );
}

async function validatePhoto(file: File) {
  if (!PHOTO_TYPES.has(file.type) || file.size <= 0) {
    throw new TestimonyPhotoError('Event photo must be a JPG, PNG, or WebP image.');
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new TestimonyPhotoError('Event photo must not exceed 4 MB.');
  }

  const signature = new Uint8Array((await file.slice(0, 16).arrayBuffer()));
  if (!hasValidSignature(signature, file.type)) {
    throw new TestimonyPhotoError('The selected event photo is not a valid image.');
  }
}

export async function uploadTestimonyPhoto(input: {
  file: File;
  testimonyId: string;
}) {
  await validatePhoto(input.file);
  const { url, serviceRoleKey, bucket } = storageConfig();
  const fileName = `${Date.now()}-${randomUUID()}-${cleanSegment(input.file.name)}`;
  const path = `${cleanSegment(input.testimonyId)}/${fileName}`;
  const response = await fetch(
    `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedObjectPath(path)}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': input.file.type,
        'x-upsert': 'false',
      },
      body: input.file,
    },
  );

  if (!response.ok) {
    throw new TestimonyPhotoError('Unable to upload the event photo. Please try again.', 502);
  }

  return {
    path,
    publicUrl: `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedObjectPath(path)}`,
  };
}

export async function deleteTestimonyPhoto(path: string) {
  try {
    const { url, serviceRoleKey, bucket } = storageConfig();
    await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [path] }),
    });
  } catch {
    // Storage cleanup must not hide the original failure.
  }
}
