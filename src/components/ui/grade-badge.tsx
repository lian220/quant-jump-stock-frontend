import { cn } from '@/lib/utils';

const GRADE_CONFIG = {
  excellent: {
    label: '우수',
    className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  good: { label: '양호', className: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30' },
  fair: { label: '보통', className: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' },
  low: { label: '주의', className: 'bg-red-400/10 text-red-400 border-red-400/30' },
} as const;

const DOT_COLORS = {
  excellent: 'bg-emerald-400',
  good: 'bg-cyan-400',
  fair: 'bg-yellow-400',
  low: 'bg-red-400',
} as const;

interface GradeBadgeProps {
  grade: keyof typeof GRADE_CONFIG;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function GradeBadge({
  grade,
  label,
  showDot = false,
  size = 'sm',
  className,
}: GradeBadgeProps) {
  const config = GRADE_CONFIG[grade];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className,
        className,
      )}
    >
      {showDot && <span className={cn('size-1.5 rounded-full', DOT_COLORS[grade])} />}
      {label ?? config.label}
    </span>
  );
}
