import { cn } from '@/lib/utils';
import { SimpleMetricBox } from './simple-metric-box';

interface MetricItem {
  label: string;
  value: string | number;
  valueColor?: string;
  valueSize?: 'sm' | 'md' | 'lg';
}

interface MetricsGridProps {
  metrics: MetricItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const GRID_COLS = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

export function MetricsGrid({ metrics, columns = 2, className }: MetricsGridProps) {
  return (
    <div className={cn('grid gap-3', GRID_COLS[columns], className)}>
      {metrics.map((metric) => (
        <SimpleMetricBox
          key={metric.label}
          label={metric.label}
          value={metric.value}
          valueColor={metric.valueColor}
          valueSize={metric.valueSize}
        />
      ))}
    </div>
  );
}
