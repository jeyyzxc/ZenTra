import { requireAdmin } from '@/lib/authorization';
import PaymentManagementClient from './PaymentManagementClient';

export const dynamic = 'force-dynamic';

export default async function PaymentAndHistory() {
  const actor = await requireAdmin();
  return <PaymentManagementClient currentUserRole={actor.role} />;
}
