import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { BookingActivityPoint } from '@/types/admin-dashboard';

export function BookingActivityChart({
  points,
}: {
  points: BookingActivityPoint[];
}) {
  const maxBookings = Math.max(...points.map((point) => point.bookings), 0);
  const hasData = maxBookings > 0;

  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader
        title="Booking Activity"
        description="Bookings created over the last 6 months"
      />

      {hasData ? (
        <div className="h-[310px]" role="img" aria-label="Bookings per month chart">
          <div className="mb-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#667085] dark:text-[#A3B19B]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9A227]" />
              Total
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2F855A]" />
              Confirmed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              Pending
            </span>
          </div>

          <div className="grid h-[238px] grid-cols-6 items-end gap-3 border-b border-[#EAECF0] pb-7 dark:border-white/10">
            {points.map((point) => {
              const totalHeight = Math.max(8, (point.bookings / maxBookings) * 100);
              const confirmedHeight = point.bookings
                ? (point.confirmed / point.bookings) * totalHeight
                : 0;
              const pendingHeight = point.bookings
                ? (point.pending / point.bookings) * totalHeight
                : 0;

              return (
                <div key={point.month} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <div className="flex w-full max-w-12 flex-1 items-end justify-center gap-1">
                    <div
                      className="w-4 rounded-t-md bg-[#C9A227]"
                      style={{ height: `${totalHeight}%` }}
                      title={`${point.bookings} total bookings`}
                    />
                    <div
                      className="w-3 rounded-t-md bg-[#2F855A]"
                      style={{ height: `${Math.max(0, confirmedHeight)}%` }}
                      title={`${point.confirmed} confirmed bookings`}
                    />
                    <div
                      className="w-3 rounded-t-md bg-[#2563EB]"
                      style={{ height: `${Math.max(0, pendingHeight)}%` }}
                      title={`${point.pending} pending bookings`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
                      {point.bookings}
                    </p>
                    <p className="text-xs text-[#667085] dark:text-[#A3B19B]">
                      {point.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
          title="No bookings yet."
          detail="New client bookings will appear here once submitted."
        />
      )}
    </section>
  );
}
