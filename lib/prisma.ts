import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { requireServerEnv } from '@/lib/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function positiveInteger(name: string, fallback: number, maximum: number) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

const adapter = new PrismaPg({
  connectionString: requireServerEnv('DATABASE_URL'),
  // Keep each serverless instance deliberately small. Supavisor transaction
  // mode multiplexes these short-lived client pools onto the database.
  max: positiveInteger('DATABASE_POOL_MAX', process.env.NODE_ENV === 'production' ? 3 : 10, 20),
  connectionTimeoutMillis: positiveInteger('DATABASE_CONNECT_TIMEOUT_MS', 10_000, 60_000),
  idleTimeoutMillis: positiveInteger('DATABASE_IDLE_TIMEOUT_MS', 10_000, 120_000),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
