import Link from 'next/link';
import { Check, ClipboardCheck, Eye } from 'lucide-react';
import { buttonStyles, Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/class-names';
import type { AdminTaskItem } from '@/types/admin-dashboard';

export type TaskFilter = 'all' | 'overdue' | 'today' | 'payments' | 'contracts';

const filters: Array<{ value: TaskFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'payments', label: 'Payments' },
  { value: 'contracts', label: 'Contracts' },
];

function formatDueDate(value: string, time: string | null) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);

  return time ? `${datePart}, ${time}` : datePart;
}

export function AdminActionCenter({
  tasks,
  activeFilter,
  onFilterChange,
  onSelect,
  onComplete,
  pendingTaskId,
}: {
  tasks: AdminTaskItem[];
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onSelect: (task: AdminTaskItem) => void;
  onComplete: (task: AdminTaskItem) => void;
  pendingTaskId: string | null;
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader
        title="Admin Action Center"
        description="High-priority tasks and pending follow-ups"
      />

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Task filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0C100B]',
              activeFilter === filter.value
                ? 'border-[#D4AF37]/40 bg-[#F5E8B8] text-[#8E7722] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]'
                : 'border-[#E5E7EB] bg-white text-[#667085] hover:border-[#D4AF37]/40 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {tasks.length ? (
        <div className="divide-y divide-[#EAECF0] dark:divide-white/10">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isInactive = !task.isActive;

            return (
              <article
                key={task.id}
                className={cn(
                  'py-4 first:pt-0 last:pb-0',
                  isCompleted && 'task-completed',
                  isInactive && 'opacity-75',
                )}
              >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        'text-sm font-semibold text-[#111827] dark:text-[#F4F4F0]',
                        isCompleted && 'line-through',
                      )}
                    >
                      {task.title}
                    </h3>
                    <StatusBadge status={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                  <p className={cn('text-sm text-[#667085] dark:text-[#A3B19B]', isCompleted && 'line-through')}>
                    {task.relatedLabel}
                  </p>
                  <p className={cn('mt-1 text-sm text-[#667085] dark:text-[#A3B19B]', isCompleted && 'line-through')}>
                    Due {formatDueDate(task.dueDate, task.dueTime)}
                    {task.category ? ` - ${task.category}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(task)}
                    aria-label={`View details for ${task.title}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Details
                  </Button>
                  <Link href={task.href} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                    View
                  </Link>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onComplete(task)}
                    disabled={!task.canComplete || pendingTaskId === task.id}
                    aria-label={`Complete ${task.title}`}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Complete
                  </Button>
                </div>
              </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8" aria-hidden="true" />}
          title="No admin tasks yet."
          detail="Tasks will be created automatically when bookings are processed."
        />
      )}
    </section>
  );
}
