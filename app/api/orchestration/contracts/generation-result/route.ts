import {
  AuditAction,
  AuditStatus,
  ContractStatus,
  ContractWorkflowStatus,
  Prisma,
} from '@prisma/client';
import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import { createAuditLog, systemAuditActor } from '@/lib/audit';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService } from '@/lib/dashboard-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    const body = await request.json() as Record<string, unknown>;
    const contractId = text(body.contractId) ?? text(body.relatedRecordId);

    if (!contractId) {
      return Response.json({ error: 'contractId is required.' }, { status: 400 });
    }

    const status = String(body.status ?? '').toUpperCase();
    const failed = status === 'FAILED';
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        ...(text(body.pdfUrl) ? { pdfUrl: text(body.pdfUrl) } : {}),
        ...(text(body.htmlPreview) ? { htmlPreview: text(body.htmlPreview) } : {}),
        contractStatus: failed ? ContractStatus.DELIVERY_FAILED : ContractStatus.READY_TO_SEND,
        workflowStatus: failed ? ContractWorkflowStatus.FAILED : ContractWorkflowStatus.COMPLETED,
        snapshotData: body.snapshotData as Prisma.InputJsonValue,
      },
    });

    await prisma.contractTimeline.create({
      data: {
        contractId: contract.id,
        action: failed ? 'contract_generation_failed' : 'contract_generation_completed',
        description: failed
          ? text(body.errorMessage) ?? 'Contract generation workflow failed.'
          : 'Contract generation workflow completed.',
        source: 'n8n_workflow',
        performedBy: 'n8n',
        metadata: body as Prisma.InputJsonValue,
      },
    });

    await createAuditLog({
      ...systemAuditActor(),
      action: failed ? AuditAction.ERROR : AuditAction.UPDATE,
      module: 'Contracts',
      description: `Recorded contract generation result for ${contract.contractNumber}.`,
      status: failed ? AuditStatus.FAILED : AuditStatus.SUCCESS,
      metadata: {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
      },
    });

    const workflowLog = await DashboardService.createWorkflowLog({
      workflowName: body.workflowName ?? 'contract-generation-flow',
      workflowExecutionId: body.workflowExecutionId ?? body.n8nExecutionId,
      relatedModule: 'contract',
      relatedRecordId: contract.id,
      triggerSource: 'n8n_contract_generation',
      requestPayload: body.requestPayload,
      responsePayload: body.responsePayload ?? body,
      status: body.status,
      errorMessage: body.errorMessage,
      startedAt: body.startedAt,
      completedAt: body.completedAt,
    });

    return dashboardCreated({ id: workflowLog.id, contractId: contract.id }, 'Contract generation result saved successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to save contract generation result.');
  }
}
