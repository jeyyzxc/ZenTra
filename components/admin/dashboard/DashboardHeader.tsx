import Link from 'next/link';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import { buttonStyles, Button } from '@/components/ui/Button';
import type { OperationsSummary } from '@/types/admin-dashboard';

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function DashboardHeader({
  summary,
  generatedAt,
  isRefreshing,
  onRefresh,
}: {
  summary: OperationsSummary;
  generatedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-5 py-5 shadow-sm dark:border-white/10 dark:bg-[#141A13] sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#8E7722] dark:text-[#D4AF37]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>{summary.currentDate}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-normal text-[#111827] dark:text-[#F4F4F0]">
            {summary.greeting}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085] dark:text-[#A3B19B]">
            {summary.summary}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
            {summary.priorityAction}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#667085] dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
            Updated {formatGeneratedAt(generatedAt)}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh admin dashboard data"
          >
            <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
            Refresh
          </Button>
          <Link href="/admin/bookings" className={buttonStyles({ variant: 'primary' })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Booking
          </Link>
        </div>
      </div>
    </header>
  );
}
