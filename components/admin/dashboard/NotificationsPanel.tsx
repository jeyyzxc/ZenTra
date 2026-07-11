import Link from 'next/link';
import { Bell, Eye } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { NotificationItem } from '@/types/admin-dashboard';

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (Number.isNaN(timestamp)) return '';
  if (diffMinutes < 1) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function shorten(message: string) {
  return message.length > 110 ? `${message.slice(0, 107)}...` : message;
}

export function NotificationsPanel({
  notifications,
  onSelect,
}: {
  notifications: NotificationItem[];
  onSelect: (notification: NotificationItem) => void;
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
      <SectionHeader
        title="Notifications"
        description="Recent important alerts"
        action={
          <Link href="/admin/dashboard" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Dashboard
          </Link>
        }
      />

      {notifications.length ? (
        <div className="divide-y divide-[#EAECF0] dark:divide-white/10">
          {notifications.map((notification) => (
            <article key={notification.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className={notification.isRead ? 'mt-1 h-2.5 w-2.5 rounded-full bg-[#D0D5DD]' : 'mt-1 h-2.5 w-2.5 rounded-full bg-[#C9A227]'} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F4F4F0]">
                      {notification.title}
                    </h3>
                    <StatusBadge status={notification.priority} />
                    <StatusBadge status={notification.type} />
                  </div>
                  <p className="text-sm leading-5 text-[#667085] dark:text-[#A3B19B]">
                    {shorten(notification.message)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#98A2B3] dark:text-white/40">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onSelect(notification)}
                    aria-label={`View notification ${notification.title}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-8 w-8" aria-hidden="true" />}
          title="No notifications yet."
          detail="Important system updates will appear here."
        />
      )}
    </section>
  );
}
