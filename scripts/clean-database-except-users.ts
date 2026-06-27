import 'dotenv/config';

import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const PRESERVED_TABLES = new Set(['users', '_prisma_migrations']);

if (!process.argv.includes('--confirm')) {
  console.error('Cleanup aborted. Add --confirm to intentionally delete all non-user database records.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Cleanup aborted. DATABASE_URL is not configured.');
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

type CleanupTable = {
  schemaname: string;
  tablename: string;
};

function targetSummary(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || 'default',
      database: url.pathname.replace(/^\//, '') || 'unknown',
      schema: url.searchParams.get('schema') ?? 'public',
      nodeEnv: process.env.NODE_ENV ?? 'not set',
    };
  } catch {
    return {
      host: 'unparseable DATABASE_URL',
      port: 'unknown',
      database: 'unknown',
      schema: 'unknown',
      nodeEnv: process.env.NODE_ENV ?? 'not set',
    };
  }
}

function quoteIdent(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function qualifiedName(table: CleanupTable) {
  return `${quoteIdent(table.schemaname)}.${quoteIdent(table.tablename)}`;
}

async function publicTables() {
  const tables = await prisma.$queryRaw<CleanupTable[]>`
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename ASC
  `;

  return tables;
}

async function countTable(table: CleanupTable) {
  const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM ${qualifiedName(table)}`,
  );

  return Number(result[0]?.count ?? 0);
}

async function createPgDumpBackup() {
  const backupDirectory = path.join(process.cwd(), 'backups');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDirectory, `database-before-clean-except-users-${stamp}.sql`);

  await mkdir(backupDirectory, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(backupPath, { flags: 'wx' });
    const pgDump = spawn('pg_dump', [process.env.DATABASE_URL!], {
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stderr: string[] = [];
    let closeCode: number | null | undefined;
    let outputFinished = false;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      output.destroy();
      pgDump.kill();
      reject(error);
    };

    const maybeResolve = () => {
      if (settled || closeCode === undefined || !outputFinished) {
        return;
      }

      settled = true;

      if (closeCode === 0) {
        resolve();
      } else {
        reject(new Error(stderr.join('').trim() || `pg_dump exited with status ${closeCode}.`));
      }
    };

    pgDump.stdout.pipe(output);
    pgDump.stderr.on('data', (chunk: Buffer) => {
      stderr.push(chunk.toString());
    });
    output.on('error', fail);
    output.on('finish', () => {
      outputFinished = true;
      maybeResolve();
    });
    pgDump.on('error', fail);
    pgDump.on('close', (code) => {
      closeCode = code;
      maybeResolve();
    });
  });

  const backupStats = await stat(backupPath);

  if (backupStats.size <= 0) {
    throw new Error('pg_dump backup was created but is empty.');
  }

  return backupPath;
}

async function main() {
  const target = targetSummary(process.env.DATABASE_URL!);
  const tables = await publicTables();
  const preserved = tables.filter((table) => PRESERVED_TABLES.has(table.tablename));
  const cleanupTables = tables.filter((table) => !PRESERVED_TABLES.has(table.tablename));
  const usersTable = tables.find((table) => table.tablename === 'users');
  const userCount = usersTable ? await countTable(usersTable) : 0;

  console.log('Starting database cleanup except users...');
  console.log('Target database:', target);
  console.log(`Preserved tables: ${[...PRESERVED_TABLES].join(', ')}`);
  console.log(`Detected preserved tables: ${preserved.map((table) => table.tablename).join(', ') || 'none'}`);
  console.log(`Users preserved before cleanup: ${userCount}`);

  if (!usersTable) {
    throw new Error('The users table was not found. Cleanup aborted.');
  }

  console.log('Creating PostgreSQL backup with pg_dump...');
  const backupPath = await createPgDumpBackup();
  console.log(`Backup created and verified: ${backupPath}`);

  const deletedCounts: Record<string, number> = {};

  for (const table of cleanupTables) {
    deletedCounts[table.tablename] = await countTable(table);
  }

  if (cleanupTables.length > 0) {
    const truncateTargets = cleanupTables.map(qualifiedName).join(', ');

    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(
        `TRUNCATE TABLE ${truncateTargets} RESTART IDENTITY CASCADE`,
      );
    });
  }

  const usersAfterCleanup = await countTable(usersTable);

  console.table(deletedCounts);
  console.log(`Users preserved after cleanup: ${usersAfterCleanup}`);
  console.log('Database cleanup completed. Users and _prisma_migrations were preserved.');
}

main()
  .catch((error: unknown) => {
    console.error('Database cleanup failed.', {
      message: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
