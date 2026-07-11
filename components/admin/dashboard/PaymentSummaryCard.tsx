import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { buttonStyles } from '@/components/ui/Button';
import type { PaymentSummary } from '@/types/admin-dashboard';

function formatPeso(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function PaymentSummaryCard({
  summary,
}: {
  summary: PaymentSummary;
}) {
  const hasPaymentData =
    summary.totalCollected > 0 ||
    summary.pendingPayments > 0 ||
    summary.overduePayments > 0 ||
    summary.recentActivity.length > 0;

  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader
        title="Payment Summary"
        description="Collection and follow-up status"
        action={
          <Link href="/admin/payments" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            View Payments
          </Link>
        }
      />

      {hasPaymentData ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085] dark:text-[#A3B19B]">
                Total Collected
              </p>
              <p className="mt-2 text-xl font-bold text-[#111827] dark:text-[#F4F4F0]">
                {formatPeso(summary.totalCollected)}
              </p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085] dark:text-[#A3B19B]">
                Pending
              </p>
              <p className="mt-2 text-xl font-bold text-[#111827] dark:text-[#F4F4F0]">
                {summary.pendingPayments.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-4 dark:border-[#C2410C]/30 dark:bg-[#C2410C]/10">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C2410C] dark:text-[#FDBA74]">
                Overdue
              </p>
              <p className="mt-2 text-xl font-bold text-[#C2410C] dark:text-[#FDBA74]">
                {summary.overduePayments.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
              Recent payment activity
            </h3>
            {summary.recentActivity.length ? (
              <div className="divide-y divide-[#EAECF0] dark:divide-white/10">
                {summary.recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="flex items-start justify-between gap-3 py-3 text-sm transition hover:text-[#8E7722] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] dark:hover:text-[#D4AF37]"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-[#111827] dark:text-[#F4F4F0]">
                        {activity.title}
                      </span>
                      <span className="mt-1 block text-[#667085] dark:text-[#A3B19B]">
                        {activity.description}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold text-[#667085] dark:text-[#A3B19B]">
                      {activity.amount ? formatPeso(activity.amount) : formatDate(activity.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#667085] dark:text-[#A3B19B]">
                No recent payment activity.
              </p>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" aria-hidden="true" />}
          title="No payment records yet."
          detail="Payment activity will appear once records are added."
        />
      )}
    </section>
  );
}
