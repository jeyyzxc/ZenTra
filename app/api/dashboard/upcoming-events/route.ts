import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam) || 5, 1), 25);
    const data = await DashboardService.getUpcomingEvents(limit);

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error, 'Unable to load upcoming events.');
  }
}
