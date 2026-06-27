import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    const workflowLog = await DashboardService.createWorkflowLog({
      workflowName: body.workflowName ?? 'payment-reminder-flow',
      workflowExecutionId: body.workflowExecutionId ?? body.n8nExecutionId,
      relatedModule: 'payment',
      relatedRecordId: body.relatedRecordId ?? body.paymentRecordId ?? body.bookingReference,
      triggerSource: 'n8n_payment_reminder',
      requestPayload: body.requestPayload,
      responsePayload: body.responsePayload ?? body,
      status: body.status,
      errorMessage: body.errorMessage,
      startedAt: body.startedAt,
      completedAt: body.completedAt,
    });

    if (String(body.status).toUpperCase() === 'FAILED') {
      await DashboardService.createNotification({
        title: 'Payment reminder workflow failed',
        message: typeof body.errorMessage === 'string'
          ? body.errorMessage
          : 'A payment reminder workflow failed and needs review.',
        type: 'WORKFLOW',
        priority: 'HIGH',
        relatedModule: 'workflow_logs',
        relatedRecordId: workflowLog.id,
      });
    }

    return dashboardCreated({ id: workflowLog.id }, 'Payment reminder result saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to save payment reminder result.');
  }
}
