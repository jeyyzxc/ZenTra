import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService, type WorkflowLogInput } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as WorkflowLogInput;
    const workflowLog = await DashboardService.createWorkflowLog(body);

    return dashboardCreated({ id: workflowLog.id }, 'Workflow log saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to save workflow log.');
  }
}
