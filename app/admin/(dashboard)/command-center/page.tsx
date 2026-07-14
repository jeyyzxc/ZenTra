import { requireAdmin } from '@/lib/authorization';
import CommandCenterClient from './CommandCenterClient';

export const dynamic = 'force-dynamic';

const workspaces = new Set(['overview', 'workflow', 'assistant', 'content', 'jobs', 'analytics']);

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const actor = await requireAdmin();
  const params = await searchParams;
  const initialWorkspace = workspaces.has(params.workspace || '')
    ? params.workspace as 'overview' | 'workflow' | 'assistant' | 'content' | 'jobs' | 'analytics'
    : 'overview';
  return <CommandCenterClient currentUserRole={actor.role} initialWorkspace={initialWorkspace} />;
}

