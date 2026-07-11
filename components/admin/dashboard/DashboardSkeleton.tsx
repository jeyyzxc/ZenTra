import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-6 dark:border-white/10 dark:bg-[#141A13]">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-10 w-full max-w-xl" />
        <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[360px]" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </section>
    </div>
  );
}
