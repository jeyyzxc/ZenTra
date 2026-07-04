import { AdminDashboardClient } from '@/components/admin/dashboard/AdminDashboardClient';
import { DashboardErrorState } from '@/components/admin/dashboard/DashboardErrorState';
import { getAdminDashboardSummary } from '@/lib/admin-dashboard-summary';
import { requireAdmin } from '@/lib/authorization';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const currentAdmin = await requireAdmin();
  let dashboardData;

  try {
    dashboardData = await getAdminDashboardSummary(currentAdmin);
  } catch (error) {
    const detail = error instanceof Error
      ? error.message
      : 'Please try refreshing the page.';

    return (
      <DashboardErrorState
        detail={detail}
      />
    );
  }

  return <AdminDashboardClient initialData={dashboardData} />;
}
