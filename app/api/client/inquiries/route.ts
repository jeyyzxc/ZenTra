import {
  inquiryErrorResponse,
  submitInquiry,
} from '@/lib/inquiry-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireClientFeature('inquirySubmissions');
    return Response.json(await submitInquiry(request), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to submit your inquiry.');
    }

    return inquiryErrorResponse(error, 'Unable to submit your inquiry.');
  }
}
