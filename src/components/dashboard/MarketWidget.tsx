'use client';

/**
 * 시장 지수 위젯
 * - S&P500, NASDAQ, VIX, KOSPI 실시간 표시
 * - Dashboard API market.indices 데이터
 */

import type { DashboardIndex } from '@/lib/api/dashboard';

interface MarketWidgetProps {
  indices: DashboardIndex[];
}

const INDEX_LABELS: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^NDX': 'NASDAQ',
  '^VIX': 'VIX',
  '^KS11': 'KOSPI',
};

export function MarketWidget({ indices }: MarketWidgetProps) {
  if (!indices || indices.length === 0) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4">
      <h3 className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
        시장 현황
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {indices.map((index) => {
          const label = INDEX_LABELS[index.symbol] ?? index.name ?? index.symbol;
          const isPositive = (index.changePercent ?? 0) >= 0;
          const isVix = index.symbol === '^VIX';

          return (
            <div key={index.symbol} className="flex items-center justify-between gap-1 min-w-0">
              <span className="text-[11px] text-slate-400 truncate">{label}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-mono text-slate-200 tabular-nums">
                  {index.price.toLocaleString(undefined, {
                    maximumFractionDigits: index.price >= 100 ? 0 : 2,
                  })}
                </span>
                {index.changePercent != null && (
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      isVix
                        ? isPositive
                          ? 'text-red-400'
                          : 'text-emerald-400'
                        : isPositive
                          ? 'text-emerald-400'
                          : 'text-red-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {index.changePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketWidgetSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 animate-pulse">
      <div className="h-3 bg-slate-700 rounded w-16 mb-2.5" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-slate-700 rounded w-12" />
            <div className="h-3 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
