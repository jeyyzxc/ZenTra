import Link from 'next/link';
import { Activity, MailCheck, Workflow } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buttonStyles } from '@/components/ui/Button';
import type { WorkflowHealth } from '@/types/admin-dashboard';

function formatDateTime(value: string | null) {
  if (!value) return 'No recent activity';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function WorkflowHealthPanel({
  health,
}: {
  health: WorkflowHealth;
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader
        title="Automation Health"
        description="n8n workflow and email delivery status"
        action={
          <Link href="/admin/audit" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Workflow Logs
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
            <Activity className="h-4 w-4 text-[#8E7722] dark:text-[#D4AF37]" aria-hidden="true" />
            Status
          </div>
          <StatusBadge status={health.statusLabel} />
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
            <Workflow className="h-4 w-4 text-[#8E7722] dark:text-[#D4AF37]" aria-hidden="true" />
            Failed
          </div>
          <p className="text-xl font-bold text-[#111827] dark:text-[#F4F4F0]">
            {health.failedWorkflows.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1F2933] dark:text-[#F4F4F0]">
            <MailCheck className="h-4 w-4 text-[#8E7722] dark:text-[#D4AF37]" aria-hidden="true" />
            Email
          </div>
          <StatusBadge status={health.emailDeliveryLabel} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085] dark:text-[#A3B19B]">
          Last successful booking workflow
        </p>
        <p className="mt-2 text-sm font-semibold text-[#111827] dark:text-[#F4F4F0]">
          {formatDateTime(health.lastSuccessfulBookingWorkflow)}
        </p>
      </div>

      <div className="mt-5">
        {health.recentIssues.length ? (
          <div className="divide-y divide-[#EAECF0] dark:divide-white/10">
            {health.recentIssues.map((issue) => (
              <Link
                key={issue.id}
                href={issue.href}
                className="block py-3 text-sm transition hover:text-[#8E7722] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] dark:hover:text-[#D4AF37]"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#111827] dark:text-[#F4F4F0]">
                    {issue.title}
                  </span>
                  <StatusBadge status={issue.priority} />
                </span>
                <span className="mt-1 block text-[#667085] dark:text-[#A3B19B]">
                  {issue.message}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Workflow className="h-8 w-8" aria-hidden="true" />}
            title="No workflow activity yet."
            detail="Automation activity will appear after the first booking is processed."
          />
        )}
      </div>
    </section>
  );
}
