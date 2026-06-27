import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService, type DashboardAgendaInput } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as DashboardAgendaInput;
    const task = await DashboardService.createTaskFromOrchestration(body);

    return dashboardCreated({ id: task.id }, 'Dashboard task created successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to create dashboard task.');
  }
}
