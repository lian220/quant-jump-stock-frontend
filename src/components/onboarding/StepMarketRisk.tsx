'use client';

import type { MarketPreference, RiskTolerance } from '@/types/onboarding';
import { MARKET_OPTIONS, RISK_OPTIONS } from '@/lib/onboarding';
import { getRiskColor } from '@/lib/strategy-helpers';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepMarketRiskProps {
  markets: MarketPreference[];
  riskTolerance: RiskTolerance | null;
  onMarketsChange: (markets: MarketPreference[]) => void;
  onRiskChange: (risk: RiskTolerance) => void;
}

export function StepMarketRisk({
  markets,
  riskTolerance,
  onMarketsChange,
  onRiskChange,
}: StepMarketRiskProps) {
  const toggleMarket = (value: MarketPreference) => {
    if (markets.includes(value)) {
      onMarketsChange(markets.filter((v) => v !== value));
    } else {
      onMarketsChange([...markets, value]);
    }
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-bold text-white mb-2">관심 시장과 위험 성향을 알려주세요</h2>
      <p className="text-slate-400 mb-6 text-sm">
        투자할 시장과 감수할 수 있는 위험 수준을 선택해주세요.
      </p>

      {/* 관심 시장 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">관심 시장 (복수 선택)</h3>
        <div className="grid grid-cols-3 gap-3">
          {MARKET_OPTIONS.map(({ value, label, icon, description }) => {
            const isSelected = markets.includes(value);

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleMarket(value)}
                className={cn(
                  'relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800',
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <span className="text-2xl mb-1">{icon}</span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    isSelected ? 'text-emerald-400' : 'text-white',
                  )}
                >
                  {label}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 위험 성향 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">위험 성향</h3>
        <div className="flex flex-col gap-3">
          {RISK_OPTIONS.map(({ value, label, icon, description }) => {
            const isSelected = riskTolerance === value;
            const riskColorClass = getRiskColor(value);

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onRiskChange(value)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                  isSelected
                    ? riskColorClass
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800',
                )}
              >
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn('text-sm font-semibold block', isSelected ? '' : 'text-white')}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-slate-500">{description}</span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
