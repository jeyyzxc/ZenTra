import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { SessionAccessScope } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/authorization';
import { authOptions } from '@/lib/auth';
import AdminShell from '../components/AdminShell';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (
    session?.user?.accessScope === SessionAccessScope.PASSWORD_CHANGE_ONLY ||
    session?.user?.mustChangePassword
  ) {
    redirect('/change-password');
  }

  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect('/admin');
  }

  return (
    <AdminShell currentUser={currentAdmin}>
      {children}
    </AdminShell>
  );
}
