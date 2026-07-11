import {
  getFeaturedTestimonies,
  testimonyErrorResponse,
} from '@/lib/testimony-service';
import { requireClientFeature, settingsErrorResponse } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireClientFeature('publicTestimonies');
    const limit = Number(new URL(request.url).searchParams.get('limit')) || 6;
    return Response.json({ testimonies: await getFeaturedTestimonies(limit) });
  } catch (error) {
    if (error instanceof Error && error.name === 'ClientFeatureDisabledError') {
      return settingsErrorResponse(error, 'Unable to load featured testimonies.');
    }

    return testimonyErrorResponse(error, 'Unable to load featured testimonies.');
  }
}
