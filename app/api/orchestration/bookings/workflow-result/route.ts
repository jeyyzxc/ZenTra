import {
  enforceOrchestrationRateLimit,
  parseAutomationStatus,
  requireBookingOrchestrationKey,
  requireBookingReferenceHeader,
  requireN8nWorkflowHeaders,
  updateBookingAutomationStatus,
} from '@/services/booking-orchestration';
import { dashboardError, dashboardSuccess } from '@/lib/dashboard-api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    requireN8nWorkflowHeaders(request);
    const body = await request.json() as Record<string, unknown>;
    const bookingReference = typeof body.bookingReference === 'string' ? body.bookingReference : '';
    requireBookingReferenceHeader(request, bookingReference);
    await enforceOrchestrationRateLimit({
      request,
      scope: 'booking-workflow-result-write',
    });
    const workflowResult = typeof body.workflowResult === 'string'
      ? body.workflowResult
      : body.workflowResult && typeof body.workflowResult === 'object'
        ? JSON.stringify(body.workflowResult)
        : null;

    await updateBookingAutomationStatus({
      bookingReference,
      automationStatus: parseAutomationStatus(body.automationStatus),
      workflowResult,
      n8nWorkflowId: typeof body.n8nWorkflowId === 'string' ? body.n8nWorkflowId : null,
      n8nExecutionId: typeof body.n8nExecutionId === 'string' ? body.n8nExecutionId : null,
    });

    return dashboardSuccess({ bookingReference: body.bookingReference }, 'Booking workflow result saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Workflow result update failed.');
  }
}
