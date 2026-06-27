import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { ContractService } from '@/services/contract';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    const contract = await ContractService.recordDeliveryResult(body);
    const workflowLog = await DashboardService.createWorkflowLog({
      workflowName: body.workflowName ?? 'contract-resend-flow',
      workflowExecutionId: body.workflowExecutionId ?? body.n8nExecutionId,
      relatedModule: 'contract',
      relatedRecordId: contract.id,
      triggerSource: 'n8n_contract_resend',
      requestPayload: body.requestPayload,
      responsePayload: body.responsePayload ?? body,
      status: body.status,
      errorMessage: body.errorMessage,
      startedAt: body.startedAt,
      completedAt: body.completedAt,
    });

    return dashboardCreated({ id: workflowLog.id, contractId: contract.id }, 'Contract resend result saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to save contract resend result.');
  }
}
