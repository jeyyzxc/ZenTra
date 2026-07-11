import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAF8] px-5 py-7 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 text-[#98A2B3] dark:text-white/30">{icon}</div>
      <p className="text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">{title}</p>
      <p className="mt-1 max-w-[280px] text-sm leading-5 text-[#667085] dark:text-[#A3B19B]">
        {detail}
      </p>
    </div>
  );
}
