import { AuditAction, AuditStatus, Prisma, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auditActor, createAuditLog, errorMetadata, getRequestContext } from '@/lib/audit';
import { requireSuperAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import {
  createTeamMemberCsv,
  createTeamMemberPdf,
  createTeamMemberXlsx,
  getTeamMemberExportFilename,
  normalizeTeamMemberExportRecords,
  type TeamMemberExportFormat,
  type TeamMemberExportRecord,
} from '@/lib/team-member-export';

export const dynamic = 'force-dynamic';

const TEAM_MEMBER_EXPORT_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  contactNumber: true,
  addressRegionCode: true,
  addressRegion: true,
  addressProvinceCode: true,
  addressProvince: true,
  addressCityCode: true,
  addressCity: true,
  addressBarangayCode: true,
  addressBarangay: true,
  profileImage: true,
  role: true,
  status: true,
  mustChangePassword: true,
  lastPasswordChangedAt: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type TeamMemberExportUser = Prisma.UserGetPayload<{
  select: typeof TEAM_MEMBER_EXPORT_SELECT;
}>;

const FORMATS = ['csv', 'excel', 'pdf'] as const;

function isTeamMemberExportFormat(format: string): format is TeamMemberExportFormat {
  return FORMATS.includes(format as TeamMemberExportFormat);
}

function displayName(user: Pick<TeamMemberExportUser, 'fullName' | 'email'>) {
  return user.fullName?.trim() || user.email;
}

async function getCreatorNameMap(users: TeamMemberExportUser[]) {
  const creatorIds = Array.from(new Set(
    users
      .map((user) => user.createdBy)
      .filter((id): id is string => Boolean(id)),
  ));

  if (creatorIds.length === 0) {
    return new Map<string, string>();
  }

  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  return new Map(creators.map((creator) => [creator.id, displayName(creator)]));
}

function toExportRecord(
  user: TeamMemberExportUser,
  creatorNameById: Map<string, string>,
): TeamMemberExportRecord {
  return {
    ...user,
    createdByName: user.createdBy ? creatorNameById.get(user.createdBy) ?? null : null,
  };
}

function responseForExport(
  format: TeamMemberExportFormat,
  records: TeamMemberExportRecord[],
  timeZone?: string,
  generatedBy?: string,
) {
  if (format === 'csv') {
    return {
      body: createTeamMemberCsv(records),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
    };
  }

  if (format === 'excel') {
    return {
      body: createTeamMemberXlsx(records, timeZone, generatedBy),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }

  return {
    body: createTeamMemberPdf(records, timeZone),
    contentType: 'application/pdf',
    extension: 'pdf',
  };
}

export async function GET(request: Request) {
  let actor: Awaited<ReturnType<typeof requireSuperAdmin>>;

  try {
    actor = await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestUrl = new URL(request.url);
  const requestContext = getRequestContext(request);
  const format = requestUrl.searchParams.get('format')?.trim().toLowerCase() || 'csv';
  const timeZone = requestUrl.searchParams.get('timeZone')?.trim() || undefined;

  if (!isTeamMemberExportFormat(format)) {
    return NextResponse.json({ error: 'format must be csv, excel, or pdf.' }, { status: 400 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.SUPERADMIN, Role.ADMIN],
        },
      },
      select: TEAM_MEMBER_EXPORT_SELECT,
      orderBy: [
        { role: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    const creatorNameById = await getCreatorNameMap(users);
    const records = normalizeTeamMemberExportRecords(
      users.map((user) => toExportRecord(user, creatorNameById)),
    );
    const output = responseForExport(format, records, timeZone, actor.fullName || actor.email);
    const filename = getTeamMemberExportFilename(output.extension);

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Team',
      description: `Exported ${records.length} team member record(s) as ${format.toUpperCase()}.`,
      status: AuditStatus.SUCCESS,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        timeZone,
        exportedRecords: records.length,
      },
    });

    return new Response(output.body, {
      headers: {
        'Content-Type': output.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'X-Export-Records': String(records.length),
      },
    });
  } catch (error) {
    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.EXPORT,
      module: 'Team',
      description: `Failed to export team member records as ${format.toUpperCase()}.`,
      status: AuditStatus.FAILED,
      ...requestContext,
      metadata: {
        requestPath: requestUrl.pathname,
        format,
        ...errorMetadata(error),
      },
    });

    return NextResponse.json({ error: 'Unable to export team members.' }, { status: 500 });
  }
}
