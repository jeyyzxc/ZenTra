import { requireAdmin } from '@/lib/authorization';
import InquiryManagementClient from './InquiryManagementClient';

export const dynamic = 'force-dynamic';

export default async function InquiryManagementPage() {
  const actor = await requireAdmin();
  return <InquiryManagementClient currentUserRole={actor.role} />;
}
