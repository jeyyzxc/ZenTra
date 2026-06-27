import 'server-only';

type ServerEnvKey =
  | 'DATABASE_URL'
  | 'NEXTAUTH_SECRET'
  | 'BOOKING_ORCHESTRATION_API_KEY'
  | 'BACKEND_ORCHESTRATION_SECRET'
  | 'N8N_BOOKING_WEBHOOK_URL'
  | 'N8N_WEBHOOK_SECRET'
  | 'SMTP_HOST'
  | 'EMAIL_PROVIDER_API_KEY';

const SECRET_LIKE_PUBLIC_KEY = /(?:SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE|SERVICE_ROLE)/i;

export const REQUIRED_SERVER_ENV: readonly ServerEnvKey[] = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'BOOKING_ORCHESTRATION_API_KEY',
  'BACKEND_ORCHESTRATION_SECRET',
  'N8N_BOOKING_WEBHOOK_URL',
  'N8N_WEBHOOK_SECRET',
];

export function getServerEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    return null;
  }

  return value;
}

export function requireServerEnv(name: ServerEnvKey) {
  const value = getServerEnv(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function assertNoPublicSecrets() {
  const unsafeKeys = Object.keys(process.env).filter((key) => (
    key.startsWith('NEXT_PUBLIC_') && SECRET_LIKE_PUBLIC_KEY.test(key)
  ));

  if (unsafeKeys.length > 0) {
    throw new Error(
      `Secret-like variables must not use NEXT_PUBLIC_: ${unsafeKeys.join(', ')}`,
    );
  }
}

export function validateServerEnv() {
  assertNoPublicSecrets();

  const missing = REQUIRED_SERVER_ENV.filter((key) => !getServerEnv(key));
  const hasEmailProvider = Boolean(getServerEnv('SMTP_HOST') || getServerEnv('EMAIL_PROVIDER_API_KEY'));

  if (!hasEmailProvider) {
    missing.push('SMTP_HOST');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(', ')}`);
  }
}

