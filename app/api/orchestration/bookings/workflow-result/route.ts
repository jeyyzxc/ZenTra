import {
  parseAutomationStatus,
  requireBookingOrchestrationKey,
  updateBookingAutomationStatus,
} from '@/services/booking-orchestration';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    await updateBookingAutomationStatus({
      bookingReference: typeof body.bookingReference === 'string' ? body.bookingReference : '',
      automationStatus: parseAutomationStatus(body.automationStatus),
      workflowResult: typeof body.workflowResult === 'string' ? body.workflowResult : null,
      n8nWorkflowId: typeof body.n8nWorkflowId === 'string' ? body.n8nWorkflowId : null,
      n8nExecutionId: typeof body.n8nExecutionId === 'string' ? body.n8nExecutionId : null,
    });

    return dashboardSuccess({ bookingReference: body.bookingReference }, 'Booking workflow result saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Workflow result update failed.');
  }
}
