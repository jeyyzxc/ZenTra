import { AuditAction, AuditStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import { createPaymentReceiptPdf } from '@/lib/export/payment-export';
import { getPaymentRecord, paymentErrorResponse } from '@/lib/payment-service';

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
    const record = await getPaymentRecord(id);
    const pdf = createPaymentReceiptPdf(record, actor, timeZone);
    const filename = `zion-payment-receipt-${record.paymentReference}-${new Date().toISOString().slice(0, 10)}.pdf`;

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Payments',
      description: `Downloaded payment receipt ${record.paymentReference}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        paymentId: record.id,
        paymentReference: record.paymentReference,
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
      module: 'Payments',
      description: 'Failed to download payment receipt.',
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        paymentId: id,
        ...errorMetadata(error),
      },
    });

    return paymentErrorResponse(error);
  }
}

