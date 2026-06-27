import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const searchParams = new URL(request.url).searchParams;
    const data = await DashboardService.getOverview(actor, {
      range: searchParams.get('range') ?? undefined,
      month: searchParams.get('month') ?? undefined,
    });

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error);
  }
}
