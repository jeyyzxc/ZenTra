import { requireAdmin } from '@/lib/authorization';
import { dashboardCreated, dashboardError, dashboardSuccess } from '@/lib/dashboard-api';
import { DashboardService, type DashboardAgendaInput } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const date = new URL(request.url).searchParams.get('date') ?? 'today';
    const data = await DashboardService.getAgenda(date, actor);

    return dashboardSuccess(data);
  } catch (error) {
    return dashboardError(error, 'Unable to load today agenda.');
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await request.json() as DashboardAgendaInput;
    const task = await DashboardService.createAgendaTask(body, actor);

    return dashboardCreated({ id: task.id }, 'Agenda task created successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to create agenda task.');
  }
}
