import { BookingRequestError } from '@/lib/booking-validation';
import {
  executeCommandCenterJob,
  handleCommandCenterError,
} from '@/services/command-center';
import {
  requireBackendOrchestrationSecret,
  requireN8nWorkflowHeaders,
} from '@/services/booking-orchestration';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireBackendOrchestrationSecret(request);
    requireN8nWorkflowHeaders(request, 'ZENTRA - Command Center Worker');
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const job = await executeCommandCenterJob({
      jobId: decodeURIComponent(id),
      workerId: body.workerId,
    });
    return Response.json({ success: true, data: job });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return handleCommandCenterError(error);
  }
}
