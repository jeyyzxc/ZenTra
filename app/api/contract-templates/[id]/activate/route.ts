import { AuditAction, AuditStatus } from '@prisma/client';
import { requireSuperAdmin } from '@/lib/authorization';
import { auditActor, createAuditLog } from '@/lib/audit';
import { contractErrorResponse } from '@/services/contract';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await context.params;
    const template = await prisma.contractTemplate.findUnique({ where: { id } });

    if (!template) {
      return Response.json({ error: 'Contract template not found.' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.contractTemplate.updateMany({
        where: {
          templateType: template.templateType,
          eventType: template.eventType,
        },
        data: { isActive: false },
      }),
      prisma.contractTemplate.update({
        where: { id: template.id },
        data: {
          isActive: true,
          updatedBy: actor.id,
        },
      }),
    ]);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.APPROVAL,
      module: 'Contracts',
      description: `Activated contract template version ${template.templateVersion}.`,
      status: AuditStatus.SUCCESS,
      metadata: {
        templateId: template.id,
        templateVersion: template.templateVersion,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to activate contract template.');
  }
}
