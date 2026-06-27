import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const task = await DashboardService.completeAgendaTask(id, actor);

    return dashboardSuccess({ id: task.id }, 'Agenda task completed successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to complete agenda task.');
  }
}
