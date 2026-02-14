'use client';

import type { InvestmentCategory } from '@/types/onboarding';
import { CATEGORY_OPTIONS } from '@/lib/onboarding';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepInvestmentStyleProps {
  selected: InvestmentCategory[];
  onChange: (categories: InvestmentCategory[]) => void;
}

export function StepInvestmentStyle({ selected, onChange }: StepInvestmentStyleProps) {
  const toggle = (value: InvestmentCategory) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-bold text-white mb-2">관심 있는 투자 전략은?</h2>
      <p className="text-slate-400 mb-6 text-sm">
        여러 개 선택할 수 있어요. 맞춤 전략 추천에 활용됩니다.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CATEGORY_OPTIONS.map(({ value, label, icon, description }) => {
          const isSelected = selected.includes(value);

          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={cn(
                'relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left',
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800',
              )}
            >
              {/* 체크 오버레이 */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}

              <span className="text-2xl mb-2">{icon}</span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  isSelected ? 'text-emerald-400' : 'text-white',
                )}
              >
                {label}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">{description}</span>
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-slate-400 mt-4 text-center">최소 1개 이상 선택해주세요</p>
      )}
    </div>
  );
}
