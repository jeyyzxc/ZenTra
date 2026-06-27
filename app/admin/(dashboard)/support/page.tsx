import { requireAdmin } from '@/lib/authorization';
import SupportCenterClient from './SupportCenterClient';

export const dynamic = 'force-dynamic';

export default async function SupportCenterPage() {
  const actor = await requireAdmin();
  return <SupportCenterClient currentUserRole={actor.role} />;
}
