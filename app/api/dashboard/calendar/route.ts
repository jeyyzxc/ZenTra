import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const month = new URL(request.url).searchParams.get('month') ?? undefined;
    const data = await DashboardService.getCalendar(month ?? '', actor);

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error, 'Unable to load dashboard calendar.');
  }
}
