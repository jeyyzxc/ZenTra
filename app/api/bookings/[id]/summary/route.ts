import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { getBookingDetail } from '@/lib/booking-query';
import { createBookingSummaryPdf } from '@/lib/export/booking-export';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestContext = getRequestContext(request);
  const requestUrl = new URL(request.url);
  const timeZone = requestUrl.searchParams.get('timeZone')?.trim() || undefined;
  const { id } = await context.params;

  try {
    const booking = await getBookingDetail(id);

    if (!booking) {
      return NextResponse.json({ error: 'The requested booking is no longer available.' }, { status: 404 });
    }

    const pdf = createBookingSummaryPdf(booking, actor, timeZone);
    const filename = `zion-booking-summary-${booking.bookingReference}-${new Date().toISOString().slice(0, 10)}.pdf`;

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Bookings',
      description: `Downloaded booking summary ${booking.bookingReference}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        format: 'pdf',
        scope: 'single',
      },
    });

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Bookings',
      description: 'Failed to download booking summary.',
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        bookingId: id,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to download booking summary.' }, { status: 500 });
  }
}

