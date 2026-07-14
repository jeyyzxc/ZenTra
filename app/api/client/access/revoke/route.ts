import { CLIENT_ACCESS_COOKIE, revokeClientAccess } from '@/services/smart-assistant';
import { handleCommandCenterError } from '@/services/command-center';

export async function POST(request: Request) {
  try {
    await revokeClientAccess(request);
    const response = Response.json({ success: true });
    response.headers.append(
      'set-cookie',
      `${CLIENT_ACCESS_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    );
    return response;
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

