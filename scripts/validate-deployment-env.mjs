const target = process.argv[2] || process.env.VERCEL_ENV || process.env.DEPLOYMENT_ENV || 'development';

const value = (name) => process.env[name]?.trim() || '';
const missing = [];
const invalid = [];
const warnings = [];
const PLACEHOLDER = /(?:\bPROJECT_REF\b|\bPASSWORD\b|\bYOUR_[A-Z0-9_]+\b|replace_with)/i;

function isPlaceholder(name) {
  return PLACEHOLDER.test(value(name));
}

function requireKey(name) {
  if (!value(name)) missing.push(name);
  else if (isPlaceholder(name)) invalid.push(`${name} still contains a template placeholder`);
}

function requireOneOf(names) {
  const selected = names.find((name) => value(name));
  if (!selected) missing.push(`one of: ${names.join(', ')}`);
  else if (isPlaceholder(selected)) invalid.push(`${selected} still contains a template placeholder`);
}

function parsedUrl(name) {
  if (!value(name)) return null;
  try {
    return new URL(value(name));
  } catch {
    invalid.push(`${name} must be a valid URL`);
    return null;
  }
}

[
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'BOOKING_ORCHESTRATION_API_KEY',
  'BACKEND_ORCHESTRATION_SECRET',
  'N8N_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_PAYMENT_PROOFS_BUCKET',
  'SUPABASE_TESTIMONY_PHOTOS_BUCKET',
  'SUPABASE_PROFILE_MEDIA_BUCKET',
  'SUPABASE_COMMAND_CENTER_DRAFTS_BUCKET',
  'SUPABASE_ASSISTANT_DOCUMENTS_BUCKET',
  'SUPABASE_PUBLIC_CONTENT_BUCKET',
].forEach(requireKey);

requireOneOf(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY']);

const databaseUrl = parsedUrl('DATABASE_URL');
const directUrl = parsedUrl('DIRECT_URL');
const appUrl = parsedUrl('NEXTAUTH_URL');
const supabaseUrl = parsedUrl('SUPABASE_URL');
const projectRef = supabaseUrl?.hostname.endsWith('.supabase.co')
  ? supabaseUrl.hostname.split('.')[0]
  : null;

function validateSupabaseDatabaseIdentity(name, url) {
  if (!url || !projectRef) return;
  const username = decodeURIComponent(url.username);
  if (url.hostname.endsWith('.pooler.supabase.com') && username !== `postgres.${projectRef}`) {
    invalid.push(`${name} pooler username must be postgres.${projectRef}`);
  }
  if (url.hostname.startsWith('db.') && url.hostname.endsWith('.supabase.co')) {
    const hostRef = url.hostname.split('.')[1];
    if (hostRef !== projectRef) invalid.push(`${name} points to a different Supabase project`);
  }
}

validateSupabaseDatabaseIdentity('DATABASE_URL', databaseUrl);
validateSupabaseDatabaseIdentity('DIRECT_URL', directUrl);

if (databaseUrl && (target === 'preview' || target === 'production')) {
  if (!databaseUrl.hostname.endsWith('.pooler.supabase.com') || databaseUrl.port !== '6543') {
    invalid.push('DATABASE_URL must use the Supabase transaction pooler on port 6543 for Vercel');
  }
  if (!value('DIRECT_URL')) {
    warnings.push('DIRECT_URL is intentionally optional at runtime; configure it only in the trusted migration environment');
  }
}

if (directUrl && (target === 'preview' || target === 'production')) {
  const isPooler = directUrl.hostname.endsWith('.pooler.supabase.com');
  const isDirect = directUrl.hostname.startsWith('db.') && directUrl.hostname.endsWith('.supabase.co');
  if ((!isPooler && !isDirect) || (isPooler && directUrl.port !== '5432')) {
    invalid.push('DIRECT_URL must use the Supabase session pooler on port 5432 or the direct database endpoint');
  }
}

if (appUrl && target !== 'development' && appUrl.protocol !== 'https:') {
  invalid.push('NEXTAUTH_URL must use HTTPS for deployed environments');
}

if (supabaseUrl && supabaseUrl.protocol !== 'https:') {
  invalid.push('SUPABASE_URL must use HTTPS');
}
if (supabaseUrl && !supabaseUrl.hostname.endsWith('.supabase.co')) {
  invalid.push('SUPABASE_URL must be the Supabase project URL');
}

if (target === 'preview' && value('N8N_WEBHOOK_ENABLED') === 'true' && value('ALLOW_PREVIEW_AUTOMATION') !== 'true') {
  invalid.push('Preview automation is blocked; set N8N_WEBHOOK_ENABLED=false or explicitly set ALLOW_PREVIEW_AUTOMATION=true');
}

if (target === 'production') {
  [
    'N8N_BOOKING_WEBHOOK_URL',
    'N8N_CLIENT_ACCESS_WEBHOOK_URL',
    'CLIENT_ACCESS_HASH_SECRET',
    'GEMINI_API_KEY',
    'DOCUMENT_MALWARE_SCANNER_URL',
    'DOCUMENT_MALWARE_SCANNER_SECRET',
  ].forEach(requireKey);
  if (value('CLIENT_ACCESS_DEV_CODE')) invalid.push('CLIENT_ACCESS_DEV_CODE must be absent in production');
  if (value('N8N_WEBHOOK_ENABLED') !== 'true') warnings.push('N8N_WEBHOOK_ENABLED is not true; booking automation will remain disabled');
}

const secretLikePublic = Object.keys(process.env).filter((name) => (
  name.startsWith('NEXT_PUBLIC_') && /SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE|SERVICE_ROLE/i.test(name)
));
if (secretLikePublic.length) invalid.push(`secret-like NEXT_PUBLIC_ keys: ${secretLikePublic.join(', ')}`);

if (missing.length || invalid.length) {
  console.error(`Environment validation failed for ${target}.`);
  if (missing.length) console.error(`Missing: ${missing.join('; ')}`);
  if (invalid.length) console.error(`Invalid: ${invalid.join('; ')}`);
  process.exit(1);
}

console.log(`Environment validation passed for ${target}.`);
if (warnings.length) console.warn(`Warnings: ${warnings.join('; ')}`);
