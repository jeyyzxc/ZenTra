import { Sparkles } from 'lucide-react';

export function DashboardEmptyState() {
  return (
    <section className="rounded-lg border border-[#D4AF37]/30 bg-[#F5E8B8]/35 p-5 text-[#1F2933] dark:border-[#D4AF37]/30 dark:bg-[#D4AF37]/10 dark:text-[#F4F4F0]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/35 bg-white/70 text-[#8E7722] dark:bg-[#0C100B]/40 dark:text-[#D4AF37]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Dashboard is ready for live operations.</h2>
          <p className="mt-1 text-sm leading-5 text-[#667085] dark:text-[#A3B19B]">
            New bookings, tasks, notifications, payments, and workflow results will appear here as soon as records are created.
          </p>
        </div>
      </div>
    </section>
  );
}
