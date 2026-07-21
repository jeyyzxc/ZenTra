import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/class-names';

type ElementProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function ResponsivePage({ className, ...props }: ElementProps) {
  return <main className={cn('responsive-page', className)} {...props} />;
}

export function ResponsiveSection({ className, ...props }: ElementProps) {
  return <section className={cn('responsive-section', className)} {...props} />;
}

export function ResponsiveContainer({
  className,
  readingWidth = false,
  ...props
}: ElementProps & { readingWidth?: boolean }) {
  return (
    <div
      className={cn(
        'responsive-container',
        readingWidth && 'responsive-container--reading',
        className,
      )}
      {...props}
    />
  );
}

export function ResponsiveGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('responsive-grid', className)} {...props} />;
}

export function ResponsiveActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('responsive-actions', className)} {...props} />;
}

export function ResponsiveScrollRegion({
  className,
  label = 'Scrollable content',
  ...props
}: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      aria-label={label}
      className={cn('responsive-scroll-region', className)}
      role="region"
      tabIndex={0}
      {...props}
    />
  );
}
