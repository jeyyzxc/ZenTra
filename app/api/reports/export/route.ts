import { requireAdmin } from '@/lib/authorization';
import { getReportsData } from '@/lib/reports-service';

export const dynamic = 'force-dynamic';

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET() {
  try {
    await requireAdmin();
    const data = await getReportsData();
    const rows = [
      ['Month', 'Bookings', 'Pending', 'Confirmed', 'Revenue'],
      ...data.monthly.map((month) => [
        month.label,
        month.bookings,
        month.pending,
        month.confirmed,
        month.revenue,
      ]),
      [],
      ['Metric', 'Value'],
      ['Booking Count', data.summary.bookingCount],
      ['Pending Booking Count', data.summary.pendingBookingCount],
      ['Revenue Collected', data.summary.revenueCollected],
      ['Revenue Forecast', data.summary.revenueForecast],
      ['Pending Payment Count', data.summary.pendingPaymentCount],
      ['Pending Payment Balance', data.summary.pendingPaymentBalance],
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="zion-reports-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    return Response.json({ error: 'Unable to export reports.' }, { status: 500 });
  }
}
