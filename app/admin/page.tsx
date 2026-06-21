import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/authorization';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLoginPage() {
  const currentAdmin = await getCurrentAdmin();

  if (currentAdmin) {
    redirect('/admin/dashboard');
  }

  return <AdminLoginForm />;
}
