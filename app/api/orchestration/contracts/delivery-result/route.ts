import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { ContractService } from '@/services/contract';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    await ContractService.recordDeliveryResult(body);
    const workflowLog = await DashboardService.createWorkflowLog({
      workflowName: body.workflowName ?? 'contract-delivery-flow',
      workflowExecutionId: body.workflowExecutionId ?? body.n8nExecutionId,
      relatedModule: 'contract',
      relatedRecordId: body.relatedRecordId ?? body.contractRecordId ?? body.bookingReference,
      triggerSource: 'n8n_contract_delivery',
      requestPayload: body.requestPayload,
      responsePayload: body.responsePayload ?? body,
      status: body.status,
      errorMessage: body.errorMessage,
      startedAt: body.startedAt,
      completedAt: body.completedAt,
    });

    if (String(body.status).toUpperCase() === 'FAILED') {
      await DashboardService.createNotification({
        title: 'Contract delivery workflow failed',
        message: typeof body.errorMessage === 'string'
          ? body.errorMessage
          : 'A contract delivery workflow failed and needs fallback review.',
        type: 'WORKFLOW',
        priority: 'HIGH',
        relatedModule: 'workflow_logs',
        relatedRecordId: workflowLog.id,
      });
    }

    return dashboardCreated({ id: workflowLog.id }, 'Contract delivery result saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to save contract delivery result.');
  }
}
