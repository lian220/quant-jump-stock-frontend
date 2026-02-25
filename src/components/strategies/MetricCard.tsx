'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { parseMetricValue, gradeMetric, type GradeResult } from '@/lib/strategy-metrics';
import { TermTooltip } from './TermTooltip';

interface MetricCardProps {
  value: string;
  label: string;
  termKey?: string;
  metricKey?: string;
  valueColor?: string;
  formatter?: (value: string) => string;
}

export function MetricCard({
  value,
  label,
  termKey,
  metricKey,
  valueColor = 'text-white',
  formatter,
}: MetricCardProps) {
  // 데이터 없는 상태 감지: "0.00%", "0.00", "N/A", "NaN%" 등
  const isNoData =
    !value ||
    value === 'N/A' ||
    value === 'NaN%' ||
    (metricKey && /^0(\.0+)?%?$/.test(value.trim()));

  const displayValue = isNoData ? '-' : formatter ? formatter(value) : value;

  let gradeResult: GradeResult | null = null;
  if (metricKey && !isNoData) {
    const numValue = parseMetricValue(value);
    if (numValue !== null) {
      gradeResult = gradeMetric(metricKey, numValue);
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 relative">
      {gradeResult && (
        <div className="absolute top-3 right-3 flex flex-col items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${gradeResult.color} shadow-[0_0_6px] ${gradeResult.glowColor}`}
          />
          <span className="text-[10px] text-slate-400">{gradeResult.label}</span>
        </div>
      )}
      <CardContent className="px-2 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-6 text-center">
        <p
          className={`text-base sm:text-2xl font-bold whitespace-nowrap ${isNoData ? 'text-slate-500' : valueColor}`}
        >
          {displayValue}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-tight">
          {termKey ? <TermTooltip termKey={termKey}>{label}</TermTooltip> : label}
        </p>
        {isNoData && <p className="text-[10px] text-slate-500 mt-0.5">데이터 없음</p>}
      </CardContent>
    </Card>
  );
}
