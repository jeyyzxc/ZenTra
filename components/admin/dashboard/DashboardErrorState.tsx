import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DashboardErrorState({
  title = 'Unable to load dashboard data.',
  detail = 'Please try again.',
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <section role="alert" className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-5 text-[#C2410C] dark:border-[#C2410C]/30 dark:bg-[#C2410C]/10 dark:text-[#FDBA74]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm">{detail}</p>
          </div>
        </div>
        {onRetry ? (
          <Button type="button" variant="danger" onClick={onRetry}>
            Try Again
          </Button>
        ) : null}
      </div>
    </section>
  );
}
