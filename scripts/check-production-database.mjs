import pg from 'pg';

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error('Production database check failed: DIRECT_URL or DATABASE_URL is missing.');
  process.exit(1);
}

let target;
let diagnosticConnectionString;
try {
  const parsed = new URL(connectionString);
  target = `${parsed.hostname}:${parsed.port || '5432'}/${parsed.pathname.replace(/^\//, '') || 'postgres'}`;
  parsed.searchParams.delete('sslmode');
  parsed.searchParams.delete('uselibpqcompat');
  diagnosticConnectionString = parsed.toString();
} catch {
  console.error('Production database check failed: the connection URL is invalid.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: diagnosticConnectionString,
  connectionTimeoutMillis: 15_000,
  application_name: 'zentra-production-readiness-check',
  // Supabase pooler endpoints require TLS. This readiness probe checks the
  // encrypted connection without treating the managed CA chain as a public PKI
  // hostname-verification chain. Runtime URL normalization is handled separately.
  ssl: { rejectUnauthorized: false },
});

function safeMessage(error) {
  const original = error instanceof Error ? error.message : String(error);
  return original
    .replaceAll(connectionString, '[REDACTED_DATABASE_URL]')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_DATABASE_URL]')
    .slice(0, 500);
}

try {
  await client.connect();
  const result = await client.query(`
    select
      current_database() as database,
      current_user as database_user,
      exists(select 1 from pg_extension where extname = 'vector') as pgvector
  `);
  console.log(JSON.stringify({
    connected: true,
    target,
    database: result.rows[0]?.database,
    databaseUser: result.rows[0]?.database_user,
    pgvector: result.rows[0]?.pgvector === true,
  }, null, 2));
} catch (error) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN';
  console.error(`Production database check failed for ${target} (${code}): ${safeMessage(error)}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
