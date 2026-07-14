import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import { handleCommandCenterError } from '@/services/command-center';
import { createKnowledgeDocument, listKnowledgeDocuments } from '@/services/smart-assistant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await requireAdmin();
    return Response.json({
      success: true,
      data: await listKnowledgeDocuments(actor.role === 'SUPERADMIN'),
    });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as Record<string, unknown>;
    return Response.json({
      success: true,
      data: await createKnowledgeDocument(body, actor, request),
    }, { status: 201 });
  } catch (error) {
    return handleCommandCenterError(error);
  }
}

