import Link from 'next/link';
import { CalendarDays, Eye } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buttonStyles, Button } from '@/components/ui/Button';
import type { UpcomingEvent } from '@/types/admin-dashboard';

function formatEventDate(value: string, time: string | null) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  return time ? `${datePart} at ${time}` : datePart;
}

export function UpcomingEventsPanel({
  events,
  onSelect,
}: {
  events: UpcomingEvent[];
  onSelect: (event: UpcomingEvent) => void;
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader
        title="Upcoming Events"
        description="Next 5 scheduled client events"
        action={
          <Link href="/admin/calendar" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Open Calendar
          </Link>
        }
      />

      {events.length ? (
        <div className="divide-y divide-[#EAECF0] dark:divide-white/10">
          {events.map((event) => (
            <article key={event.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F4F4F0]">
                      {event.title}
                    </h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-sm text-[#667085] dark:text-[#A3B19B]">
                    {event.clientName} - {event.eventType}
                  </p>
                  <p className="mt-1 text-sm text-[#667085] dark:text-[#A3B19B]">
                    {formatEventDate(event.date, event.time)} - {event.venue}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(event)}
                    aria-label={`View details for ${event.title}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Details
                  </Button>
                  <Link href={event.href} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" aria-hidden="true" />}
          title="No upcoming events yet."
          detail="Confirmed client events will appear here once scheduled."
        />
      )}
    </section>
  );
}
