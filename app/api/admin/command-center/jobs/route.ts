import { CommandCenterJobStatus } from '@prisma/client';
import { requireAdmin } from '@/lib/authorization';
import { handleCommandCenterError, listCommandCenterJobs } from '@/services/command-center';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const search = new URL(request.url).searchParams;
    const statusValue = search.get('status')?.toUpperCase();
    const status = statusValue && Object.values(CommandCenterJobStatus).includes(statusValue as CommandCenterJobStatus)
      ? statusValue as CommandCenterJobStatus
      : undefined;
    return Response.json({
      success: true,
      data: await listCommandCenterJobs({ status, take: Number(search.get('take')) || undefined }),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

