import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const range = new URL(request.url).searchParams.get('range') ?? 'this_year';
    const data = await DashboardService.getTrends(range);

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error, 'Unable to load dashboard trends.');
  }
}
