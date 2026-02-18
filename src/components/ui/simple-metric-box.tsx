import { cn } from '@/lib/utils';

interface SimpleMetricBoxProps {
  label: string;
  value: string | number;
  valueColor?: string;
  valueSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VALUE_SIZE = {
  sm: 'text-sm font-medium',
  md: 'text-base font-bold',
  lg: 'text-lg font-bold',
} as const;

export function SimpleMetricBox({
  label,
  value,
  valueColor,
  valueSize = 'lg',
  className,
}: SimpleMetricBoxProps) {
  return (
    <div className={cn('bg-metric-surface p-3 rounded-lg min-w-0', className)}>
      <p className="text-xs text-slate-400 mb-1 break-keep">{label}</p>
      <p className={cn(VALUE_SIZE[valueSize], valueColor ?? 'text-white')}>{value}</p>
    </div>
  );
}
