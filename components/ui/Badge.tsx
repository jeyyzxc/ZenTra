import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/class-names';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    'border-[#E5E7EB] bg-[#F9FAFB] text-[#667085] dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]',
  success:
    'border-[#BBF7D0] bg-[#F0FDF4] text-[#2F855A] dark:border-[#2F855A]/30 dark:bg-[#2F855A]/10 dark:text-[#86EFAC]',
  warning:
    'border-[#FDE68A] bg-[#FFFBEB] text-[#B7791F] dark:border-[#B7791F]/30 dark:bg-[#B7791F]/10 dark:text-[#FCD34D]',
  danger:
    'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C] dark:border-[#C2410C]/30 dark:bg-[#C2410C]/10 dark:text-[#FDBA74]',
  info:
    'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] dark:border-[#2563EB]/30 dark:bg-[#2563EB]/10 dark:text-[#93C5FD]',
  gold:
    'border-[#D4AF37]/35 bg-[#F5E8B8]/55 text-[#8E7722] dark:border-[#D4AF37]/30 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
