import { requireAdmin } from '@/lib/authorization';
import ContractManagementClient from './components/ContractManagementClient';

export const dynamic = 'force-dynamic';

export default async function ContractManagement() {
  const actor = await requireAdmin();

  return <ContractManagementClient currentUserRole={actor.role} />;
}
