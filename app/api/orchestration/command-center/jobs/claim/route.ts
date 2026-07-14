import { BookingRequestError } from '@/lib/booking-validation';
import {
  claimCommandCenterJobs,
  handleCommandCenterError,
} from '@/services/command-center';
import {
  requireBackendOrchestrationSecret,
  requireN8nWorkflowHeaders,
} from '@/services/booking-orchestration';

export async function POST(request: Request) {
  try {
    requireBackendOrchestrationSecret(request);
    requireN8nWorkflowHeaders(request, 'ZENTRA - Command Center Worker');
    const body = await request.json() as Record<string, unknown>;
    const jobs = await claimCommandCenterJobs({
      workerId: body.workerId,
      limit: body.limit,
      leaseSeconds: body.leaseSeconds,
    });
    return Response.json({ success: true, data: jobs });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    return handleCommandCenterError(error);
  }
}
