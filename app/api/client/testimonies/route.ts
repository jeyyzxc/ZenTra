import {
  getPublicTestimonies,
  submitTestimony,
  testimonyErrorResponse,
} from '@/lib/testimony-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireClientFeature('publicTestimonies');
    return Response.json(await getPublicTestimonies(new URL(request.url)));
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load testimonies.');
    }

    return testimonyErrorResponse(error, 'Unable to load testimonies.');
  }
}

export async function POST(request: Request) {
  try {
    await requireClientFeature('testimonySubmissions');
    return Response.json(await submitTestimony(request), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to submit testimony.');
    }

    return testimonyErrorResponse(error, 'Unable to submit testimony.');
  }
}
