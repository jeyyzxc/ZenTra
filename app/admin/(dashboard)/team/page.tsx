import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/authorization';
import { getTeamMembers } from './actions';
import TeamManagementClient from './TeamManagementClient';

export default async function TeamManagementPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect('/admin');
  }

  if (currentAdmin.role !== Role.SUPERADMIN) {
    redirect('/admin/dashboard');
  }

  const members = await getTeamMembers();

  return (
    <TeamManagementClient
      initialMembers={members}
      currentUserId={currentAdmin.id}
    />
  );
}
