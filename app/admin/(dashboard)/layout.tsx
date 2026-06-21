import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/authorization';
import AdminShell from '../components/AdminShell';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
