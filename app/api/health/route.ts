import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function configured(...names: string[]) {
  return names.some((name) => Boolean(process.env[name]?.trim()));
}

export async function GET() {
  let database = false;
  let pgvector = false;
  let databaseError = false;

  try {
    const result = await prisma.$queryRaw<Array<{ database: boolean; pgvector: boolean }>>`
      SELECT
        TRUE AS "database",
        EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS "pgvector"
    `;
    database = result[0]?.database === true;
    pgvector = result[0]?.pgvector === true;
  } catch {
    databaseError = true;
  }

  const checks = {
    database,
    pgvector,
    authConfiguration: configured('NEXTAUTH_SECRET'),
    storageConfiguration: configured('SUPABASE_URL')
      && configured('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'),
    orchestrationConfiguration: configured('BACKEND_ORCHESTRATION_SECRET', 'N8N_WEBHOOK_SECRET'),
  };
  const ready = !databaseError && Object.values(checks).every(Boolean);

  return Response.json({
    status: ready ? 'ok' : 'degraded',
    service: 'zentra-next',
    ready,
    checks,
    deployment: process.env.VERCEL_ENV || process.env.DEPLOYMENT_ENV || 'local',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || null,
    checkedAt: new Date().toISOString(),
  }, {
    status: databaseError ? 503 : 200,
    headers: { 'cache-control': 'no-store, max-age=0' },
  });
}
