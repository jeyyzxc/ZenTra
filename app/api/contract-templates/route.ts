import {
  AuditAction,
  AuditStatus,
  ContractTemplateType,
  Prisma,
} from '@prisma/client';
import { requireAdmin, requireSuperAdmin } from '@/lib/authorization';
import { auditActor, createAuditLog } from '@/lib/audit';
import { ContractService, contractErrorResponse } from '@/services/contract';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await requireAdmin();
    return Response.json({ templates: await ContractService.getTemplates(actor) });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to load contract templates.');
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdmin();
    const body = await request.json() as {
      templateName?: string;
      eventType?: string | null;
      htmlTemplate?: string;
      staticTermsContent?: string | null;
      lockedSections?: unknown;
    };

    if (!body.templateName?.trim() || !body.htmlTemplate?.trim()) {
      return Response.json({ error: 'templateName and htmlTemplate are required.' }, { status: 400 });
    }

    const latest = await prisma.contractTemplate.findFirst({
      where: {
        templateType: ContractTemplateType.EVENT_CONTRACT,
        eventType: body.eventType?.trim() || null,
      },
      orderBy: { templateVersion: 'desc' },
      select: { templateVersion: true },
    });

    const template = await prisma.contractTemplate.create({
      data: {
        templateName: body.templateName.trim(),
        templateType: ContractTemplateType.EVENT_CONTRACT,
        templateVersion: (latest?.templateVersion ?? 0) + 1,
        eventType: body.eventType?.trim() || null,
        htmlTemplate: body.htmlTemplate,
        staticTermsContent: body.staticTermsContent?.trim() || null,
        lockedSections: (body.lockedSections ?? []) as Prisma.InputJsonValue,
        isActive: false,
        createdBy: actor.id,
        updatedBy: actor.id,
      },
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.CREATE,
      module: 'Contracts',
      description: `Created contract template version ${template.templateVersion}.`,
      status: AuditStatus.SUCCESS,
      newValues: {
        templateId: template.id,
        templateVersion: template.templateVersion,
      },
    });

    return Response.json({ template }, { status: 201 });
  } catch (error) {
    return contractErrorResponse(error, 'Unable to create contract template.');
  }
}
