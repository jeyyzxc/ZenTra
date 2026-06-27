import { getPublicPopularFaqs, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const limit = Number(new URL(request.url).searchParams.get('limit')) || 6;
    return Response.json(await getPublicPopularFaqs(limit));
  } catch (error) {
    return supportErrorResponse(error, 'Unable to load popular FAQs.');
  }
}
