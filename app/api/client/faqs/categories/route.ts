import { getPublicFaqCategories, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(await getPublicFaqCategories());
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load FAQ categories.');
  }
}
