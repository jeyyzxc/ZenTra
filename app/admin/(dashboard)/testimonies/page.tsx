import { requireAdmin } from '@/lib/authorization';
import TestimonyManagementClient from './TestimonyManagementClient';

export const dynamic = 'force-dynamic';

export default async function TestimonyManagementPage() {
  const actor = await requireAdmin();
  return <TestimonyManagementClient currentUserRole={actor.role} />;
}
