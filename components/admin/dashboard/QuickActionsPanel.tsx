import Link from 'next/link';
import { CalendarDays, ClipboardList, FileSignature, Inbox, WalletCards } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';

const actions = [
  { label: 'Open Calendar', href: '/admin/calendar', icon: CalendarDays },
  { label: 'View Pending Payments', href: '/admin/payments', icon: WalletCards },
  { label: 'Review Contracts', href: '/admin/contracts', icon: FileSignature },
  { label: 'Open Tasks', href: '/admin/calendar', icon: ClipboardList },
  { label: 'View Inquiries', href: '/admin/inquiries', icon: Inbox },
];

export function QuickActionsPanel() {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader title="Quick Actions" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="flex min-h-12 items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3 text-sm font-semibold text-[#1F2933] transition hover:border-[#D4AF37]/45 hover:bg-[#F5E8B8]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#F4F4F0] dark:hover:bg-[#D4AF37]/10"
            >
              <Icon className="h-4 w-4 text-[#8E7722] dark:text-[#D4AF37]" aria-hidden="true" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
