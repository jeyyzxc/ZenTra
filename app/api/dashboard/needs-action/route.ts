import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await requireAdmin();
    const data = await DashboardService.getNeedsAction(actor);

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error, 'Unable to load action items.');
  }
}
