'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { BacktestMetrics } from '@/types/backtest';

interface PerformanceCardsProps {
  metrics: BacktestMetrics;
}

export default function PerformanceCards({ metrics }: PerformanceCardsProps) {
  const cards = [
    {
      label: '연환산 수익률 (CAGR)',
      value: `${metrics.cagr > 0 ? '+' : ''}${metrics.cagr.toFixed(2)}%`,
      color: metrics.cagr >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: '최대 낙폭 (MDD)',
      value: `${metrics.mdd.toFixed(2)}%`,
      color: 'text-red-400',
    },
    {
      label: '샤프 비율',
      value: metrics.sharpeRatio.toFixed(2),
      color: 'text-cyan-400',
    },
    {
      label: '승률',
      value: `${metrics.winRate.toFixed(1)}%`,
      color: 'text-purple-400',
    },
    {
      label: '총 수익률',
      value: `${metrics.totalReturn > 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`,
      color: metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: '총 거래수',
      value: `${metrics.totalTrades}회`,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
