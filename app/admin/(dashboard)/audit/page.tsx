import { Role } from '@prisma/client';
import { AUDIT_MODULES } from '@/lib/audit';
import { requireAdmin } from '@/lib/authorization';
import {
  ADMIN_ALLOWED_AUDIT_ACTIONS,
  AUDIT_ACTIONS,
  AUDIT_ROLES,
  AUDIT_STATUSES,
} from '@/lib/audit-query';
import {
  EMAIL_STATUSES,
  EMAIL_TYPES,
  RELATED_MODULES,
  TRIGGER_SOURCES,
  getEmailWorkflowOptions,
} from '@/lib/email-log-query';
import { prisma } from '@/lib/prisma';
import AuditLogsClient from './components/AuditLogsClient';
import type { AuditUserOption } from './types';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentAdmin = await requireAdmin();
  const isSuperAdmin = currentAdmin.role === Role.SUPERADMIN;
  const requestedTab = resolvedSearchParams.tab === 'email' ? 'email' : 'audit';
  const initialSearch = typeof resolvedSearchParams.search === 'string'
    ? resolvedSearchParams.search
    : '';

  const [users, workflowOptions] = await Promise.all([
    isSuperAdmin
      ? prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
          orderBy: {
            username: 'asc',
          },
        })
      : Promise.resolve([]),
    getEmailWorkflowOptions(),
  ]);

  const userOptions: AuditUserOption[] = users.map((user) => ({
    id: user.id,
    label: `@${user.username} · ${user.email}`,
    role: user.role,
  }));

  return (
    <AuditLogsClient
      actionOptions={isSuperAdmin ? AUDIT_ACTIONS : [...ADMIN_ALLOWED_AUDIT_ACTIONS]}
      currentUserRole={currentAdmin.role}
      emailStatusOptions={EMAIL_STATUSES}
      emailTypeOptions={EMAIL_TYPES}
      initialAuditSearch={requestedTab === 'audit' ? initialSearch : ''}
      initialEmailSearch={requestedTab === 'email' ? initialSearch : ''}
      initialTab={requestedTab}
      moduleOptions={[...AUDIT_MODULES]}
      relatedModuleOptions={RELATED_MODULES}
      roleOptions={isSuperAdmin ? [...AUDIT_ROLES] : []}
      statusOptions={AUDIT_STATUSES}
      triggerSourceOptions={TRIGGER_SOURCES}
      userOptions={userOptions}
      workflowOptions={workflowOptions}
    />
  );
}
