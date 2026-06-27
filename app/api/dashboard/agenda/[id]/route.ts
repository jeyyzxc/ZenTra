import { requireAdmin } from '@/lib/authorization';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService, type DashboardAgendaInput } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const body = await request.json() as DashboardAgendaInput;
    const task = await DashboardService.updateAgendaTask(id, body, actor);

    return dashboardSuccess({ id: task.id }, 'Agenda task updated successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to update agenda task.');
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    await DashboardService.deleteAgendaTask(id, actor);

    return dashboardSuccess({ id }, 'Agenda task deleted successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to delete agenda task.');
  }
}
