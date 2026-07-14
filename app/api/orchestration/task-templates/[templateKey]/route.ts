import { BookingRequestError } from '@/lib/booking-validation';
import { getTaskTemplateForOrchestration } from '@/services/booking-orchestration';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateKey: string }> },
) {
  try {
    const { templateKey } = await params;
    const template = await getTaskTemplateForOrchestration({
      request,
      requestedTemplateKey: templateKey,
    });

    return Response.json({ success: true, template });
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }

    console.error('Protected task template retrieval failed:', error);
    return Response.json({
      success: false,
      error: 'Unable to retrieve task template.',
    }, { status: 500 });
  }
}
