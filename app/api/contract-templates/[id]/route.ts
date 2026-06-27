import { AuditAction, AuditStatus, Prisma } from '@prisma/client';
import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import { auditActor, createAuditLog } from '@/lib/audit';
import { contractErrorResponse } from '@/services/contract';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const template = await prisma.contractTemplate.findUnique({ where: { id } });

    if (!template) {
      return Response.json({ error: 'Contract template not found.' }, { status: 404 });
    }

    return Response.json({ template });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to load contract template.');
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireSuperAdmin();
    const { id } = await context.params;
    const body = await request.json() as {
      templateName?: string;
      htmlTemplate?: string;
      staticTermsContent?: string | null;
      lockedSections?: unknown;
    };

    const previous = await prisma.contractTemplate.findUnique({ where: { id } });
    if (!previous) {
      return Response.json({ error: 'Contract template not found.' }, { status: 404 });
    }

    const template = await prisma.contractTemplate.update({
      where: { id },
      data: {
        ...(body.templateName !== undefined ? { templateName: body.templateName.trim() || previous.templateName } : {}),
        ...(body.htmlTemplate !== undefined ? { htmlTemplate: body.htmlTemplate || previous.htmlTemplate } : {}),
        ...(body.staticTermsContent !== undefined ? { staticTermsContent: body.staticTermsContent?.trim() || null } : {}),
        ...(body.lockedSections !== undefined ? { lockedSections: body.lockedSections as Prisma.InputJsonValue } : {}),
        updatedBy: actor.id,
      },
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Contracts',
      description: `Updated contract template ${template.templateName}.`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        templateId: previous.id,
        templateVersion: previous.templateVersion,
      },
      newValues: {
        templateId: template.id,
        templateVersion: template.templateVersion,
      },
    });

    return Response.json({ template });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to update contract template.');
  }
}
