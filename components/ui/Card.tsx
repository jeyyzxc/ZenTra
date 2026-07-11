import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/class-names';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[#E5E7EB] bg-white shadow-sm dark:border-white/10 dark:bg-[#141A13]',
        className,
      )}
      {...props}
    />
  );
}
