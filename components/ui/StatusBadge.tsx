import { Badge } from '@/components/ui/Badge';

function toneForStatus(status: string) {
  const normalized = status.toLowerCase();

  if (['confirmed', 'completed', 'healthy', 'success', 'delivered', 'sent', 'fully_paid'].includes(normalized)) {
    return 'success' as const;
  }

  if (['pending', 'pending_approval', 'in_preparation', 'processing', 'warning', 'for_verification', 'partially_paid', 'reservation_paid', 'down_payment_paid'].includes(normalized)) {
    return 'warning' as const;
  }

  if (['cancelled', 'failed', 'overdue', 'rejected', 'bounced', 'critical'].includes(normalized)) {
    return 'danger' as const;
  }

  if (['in_progress', 'rescheduled', 'info', 'no_recent_activity'].includes(normalized)) {
    return 'info' as const;
  }

  return 'neutral' as const;
}

function labelForStatus(status: string) {
  return status
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={toneForStatus(status)}>
      {labelForStatus(status)}
    </Badge>
  );
}
