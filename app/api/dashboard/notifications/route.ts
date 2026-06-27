import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 50);
    const data = await DashboardService.getNotifications(actor, limit);

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error, 'Unable to load notifications.');
  }
}
