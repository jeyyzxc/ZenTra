import { CalendarCheck, ClipboardCheck, CreditCard, NotebookTabs } from 'lucide-react';
import { MetricCard } from '@/components/admin/dashboard/MetricCard';
import type { AdminDashboardMetrics } from '@/types/admin-dashboard';

export function MetricsGrid({ metrics }: { metrics: AdminDashboardMetrics }) {
  return (
    <section aria-label="Key dashboard metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Bookings"
        value={metrics.totalBookings.toLocaleString()}
        detail="All client booking records"
        href="/admin/bookings"
        icon={NotebookTabs}
      />
      <MetricCard
        label="Upcoming Events"
        value={metrics.upcomingEvents.toLocaleString()}
        detail="Next 30 days"
        href="/admin/calendar"
        icon={CalendarCheck}
      />
      <MetricCard
        label="Pending Payments"
        value={metrics.pendingPayments.toLocaleString()}
        detail="Open payment follow-ups"
        href="/admin/payments"
        icon={CreditCard}
      />
      <MetricCard
        label="Open Tasks"
        value={metrics.openTasks.toLocaleString()}
        detail="Pending admin tasks"
        href="/admin/calendar"
        icon={ClipboardCheck}
      />
    </section>
  );
}
