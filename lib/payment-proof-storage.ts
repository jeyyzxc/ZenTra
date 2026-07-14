import { randomUUID } from 'node:crypto';

// Vercel Functions enforce a 4.5 MB request/response body limit. Keep the
// multipart request safely below it until payment proofs use signed uploads.
const MAX_PROOF_SIZE = 4 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export class PaymentProofError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaymentProofError';
    this.status = status;
  }
}

export type StoredPaymentProof = {
  path: string;
  fileName: string;
  fileType: string;
};

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PAYMENT_PROOFS_BUCKET || 'payment-proofs';

  if (!url || !serviceRoleKey) {
    throw new PaymentProofError(
      'Payment proof storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
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
    .slice(0, 100) || 'file';
}

function encodedObjectPath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export function validatePaymentProof(file: File | null | undefined): asserts file is File {
  if (!file || file.size === 0) {
    throw new PaymentProofError('Payment proof is required before saving payment changes.');
  }

  if (!ALLOWED_PROOF_TYPES.has(file.type)) {
    throw new PaymentProofError('Payment proof must be a JPG, JPEG, PNG, WEBP, or PDF file.');
  }

  if (file.size > MAX_PROOF_SIZE) {
    throw new PaymentProofError('Payment proof must not exceed 4 MB.');
  }
}

export async function uploadPaymentProof(input: {
  file: File;
  bookingReference: string;
  paymentReference: string;
}): Promise<StoredPaymentProof> {
  validatePaymentProof(input.file);
  const { url, serviceRoleKey, bucket } = storageConfig();
  const fileName = cleanSegment(input.file.name);
  const path = [
    cleanSegment(input.bookingReference),
    cleanSegment(input.paymentReference),
    `${Date.now()}-${randomUUID()}-${fileName}`,
  ].join('/');
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
    const details = await response.text();
    throw new PaymentProofError(
      `Unable to upload payment proof.${details ? ` ${details.slice(0, 180)}` : ''}`,
      502,
    );
  }

  return {
    path,
    fileName: input.file.name,
    fileType: input.file.type,
  };
}

export async function deletePaymentProof(path: string): Promise<void> {
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
    // A failed cleanup must not hide the original database or validation error.
  }
}

export async function downloadPaymentProof(path: string) {
  const { url, serviceRoleKey, bucket } = storageConfig();
  const response = await fetch(
    `${url}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedObjectPath(path)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new PaymentProofError('Unable to load the saved payment proof.', response.status === 404 ? 404 : 502);
  }

  return response;
}
