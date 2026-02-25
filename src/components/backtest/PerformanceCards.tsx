'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { BacktestMetrics } from '@/types/backtest';

interface PerformanceCardsProps {
  metrics: BacktestMetrics;
}

export default function PerformanceCards({ metrics }: PerformanceCardsProps) {
  const fmt = (v: number | null | undefined, digits = 2) => (v != null ? v.toFixed(digits) : '-');

  const cards = [
    {
      label: '연평균 수익률',
      value: metrics.cagr != null ? `${metrics.cagr > 0 ? '+' : ''}${fmt(metrics.cagr)}%` : '-',
      color: (metrics.cagr ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: '최대 손실폭',
      value: metrics.mdd != null ? `${fmt(metrics.mdd)}%` : '-',
      color: 'text-red-400',
    },
    {
      label: '안정성 지수',
      value: fmt(metrics.sharpeRatio),
      color: 'text-cyan-400',
    },
    {
      label: '승률',
      value: metrics.winRate != null ? `${fmt(metrics.winRate, 1)}%` : '-',
      color: 'text-purple-400',
    },
    {
      label: '총 수익률',
      value:
        metrics.totalReturn != null
          ? `${metrics.totalReturn > 0 ? '+' : ''}${fmt(metrics.totalReturn)}%`
          : '-',
      color: (metrics.totalReturn ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: '총 거래수',
      value: metrics.totalTrades != null ? `${metrics.totalTrades}회` : '-',
      color: 'text-yellow-400',
    },
    {
      label: '손익비 (Profit Factor)',
      value: fmt(metrics.profitFactor),
      color: (metrics.profitFactor ?? 0) >= 1 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: '기대값 (Expectancy)',
      value:
        metrics.expectancy != null
          ? `${metrics.expectancy > 0 ? '+' : ''}${fmt(metrics.expectancy)}%`
          : '-',
      color: (metrics.expectancy ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card-surface border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
