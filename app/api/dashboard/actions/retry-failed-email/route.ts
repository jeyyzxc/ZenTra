import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as { emailLogId?: string };

    if (!body.emailLogId) {
      return NextResponse.json({ success: false, error: 'emailLogId is required.' }, { status: 400 });
    }

    const emailLog = await prisma.emailLog.findUnique({
      where: { id: body.emailLogId },
      select: { id: true, retryCount: true },
    });

    if (!emailLog) {
      return NextResponse.json({ success: false, error: 'Email log not found.' }, { status: 404 });
    }

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'RETRIED',
        retryCount: emailLog.retryCount + 1,
        lastAttemptAt: new Date(),
        resentBy: actor.id,
      },
    });

    return dashboardSuccess({ emailLogId: emailLog.id }, 'Email retry queued for fallback handling.');
  } catch (error) {
    return dashboardError(error, 'Unable to retry failed email.');
  }
}
