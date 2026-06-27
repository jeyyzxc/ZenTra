import { askClientAssistant, supportErrorResponse } from '@/lib/support-center-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return Response.json(await askClientAssistant(request));
  } catch (error) {
    return supportErrorResponse(error, 'Unable to answer assistant question.');
  }
}
