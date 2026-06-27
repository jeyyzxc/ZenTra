import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { sanitizeEmailLogForRole, serializeEmailLog } from '@/lib/email-log-query';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const log = await prisma.emailLog.findUnique({
    where: { id },
  });

  if (!log) {
    return NextResponse.json({ error: 'Email log not found.' }, { status: 404 });
  }

  return NextResponse.json({
    log: sanitizeEmailLogForRole(serializeEmailLog(log), actor.role),
  });
}
