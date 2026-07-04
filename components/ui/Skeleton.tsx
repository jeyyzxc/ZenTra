import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/class-names';

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[#EAECF0] dark:bg-white/10',
        className,
      )}
      {...props}
    />
  );
}
