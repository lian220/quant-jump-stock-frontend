'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { calculateInvestmentOutcome, formatKoreanCurrency } from '@/lib/strategy-metrics';

interface InvestmentSummaryProps {
  totalReturn: string;
  annualReturn: string;
  maxDrawdown: string;
  backtestPeriod: string;
}

export function InvestmentSummary({
  totalReturn,
  annualReturn,
  maxDrawdown,
  backtestPeriod,
}: InvestmentSummaryProps) {
  const outcome = calculateInvestmentOutcome(
    totalReturn,
    annualReturn,
    maxDrawdown,
    backtestPeriod,
  );

  const profitSign = outcome.isPositive ? '+' : '';
  const profitColor = outcome.isPositive ? 'text-emerald-400' : 'text-red-400';
  const bgGradient = outcome.isPositive
    ? 'from-emerald-900/20 to-slate-800/50'
    : 'from-red-900/20 to-slate-800/50';

  return (
    <Card className={`bg-gradient-to-r ${bgGradient} border-slate-700 mb-8`}>
      <CardContent className="py-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
          💰 투자 시뮬레이션 결과
        </h3>
        <div className="space-y-3">
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            <span className="text-white font-medium">
              {formatKoreanCurrency(outcome.initialAmount)}원
            </span>
            을 투자했다면 →{' '}
            <span className={`font-bold text-base sm:text-lg ${profitColor}`}>
              {formatKoreanCurrency(outcome.finalAmount)}원
            </span>
            {outcome.isPositive ? '으로 불어났을 것입니다' : '으로 줄었을 것입니다'}
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            (수익:{' '}
            <span className={profitColor}>
              {profitSign}
              {formatKoreanCurrency(Math.abs(outcome.profit))}원
            </span>{' '}
            | 연평균{' '}
            <span className={profitColor}>
              {profitSign}
              {Math.abs(outcome.annualReturn).toFixed(1)}%
            </span>{' '}
            | {outcome.years}년 기준)
          </p>

          {outcome.mddPercent < 0 && (
            <p className="text-yellow-400/90 text-xs sm:text-sm mt-2">
              ⚠️ 단, 최대 <span className="font-medium">{outcome.mddPercent.toFixed(1)}%</span>{' '}
              하락을 견뎌야 했습니다 (약 -{formatKoreanCurrency(outcome.mddAmount)}원 일시 손실
              가능)
            </p>
          )}

          <p className="text-slate-500 text-xs mt-3">
            📋 위 결과는 {backtestPeriod} 시뮬레이션 기준이며, 실제 투자 성과는 다를 수 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
