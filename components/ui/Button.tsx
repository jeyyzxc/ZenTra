import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/class-names';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-[#1F2933] bg-[#1F2933] text-white hover:border-[#C9A227] hover:bg-[#C9A227] dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#111827]',
  secondary:
    'border-[#D4AF37]/40 bg-[#F5E8B8]/50 text-[#8E7722] hover:bg-[#F5E8B8] dark:border-[#D4AF37]/30 dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]',
  ghost:
    'border-transparent bg-transparent text-[#667085] hover:border-[#E5E7EB] hover:bg-white dark:text-[#A3B19B] dark:hover:border-white/10 dark:hover:bg-white/5',
  danger:
    'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C] hover:bg-[#FFEDD5] dark:border-[#C2410C]/30 dark:bg-[#C2410C]/10 dark:text-[#FDBA74]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-2 text-xs',
  md: 'min-h-10 px-4 py-2.5 text-sm',
  icon: 'h-10 w-10 p-0',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-[#0C100B]',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
