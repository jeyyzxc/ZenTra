import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function MetricCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0C100B]">
      <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-[#D4AF37]/45 group-hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#667085] dark:text-[#A3B19B]">
              {label}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-normal text-[#111827] dark:text-[#F4F4F0]">
              {value}
            </p>
            <p className="mt-2 text-sm text-[#667085] dark:text-[#A3B19B]">
              {detail}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/30 bg-[#F5E8B8]/55 text-[#8E7722] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
