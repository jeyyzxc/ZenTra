import { NextResponse } from 'next/server';
import { getAdminDashboardSummary } from '@/lib/admin-dashboard-summary';
import { requireAdmin } from '@/lib/authorization';
import { dashboardError } from '@/lib/dashboard-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await requireAdmin();
    const data = await getAdminDashboardSummary(actor);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return dashboardError(error, 'Unable to load admin dashboard summary.');
  }
}
