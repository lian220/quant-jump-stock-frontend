'use client';

import React from 'react';
import { StrategyCard } from './StrategyCard';
import type { Strategy } from '@/types/strategy';
import { StateMessageCard } from '@/components/common/StateMessageCard';

interface StrategyGridProps {
  strategies: Strategy[];
  isLoading?: boolean;
}

export function StrategyGrid({ strategies, isLoading = false }: StrategyGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-slate-800/50 border border-slate-700 rounded-xl h-[400px] animate-pulse"
          >
            <div className="p-6 space-y-4">
              <div className="h-6 bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <StateMessageCard
        icon="🔍"
        title="조건에 맞는 전략이 없습니다"
        description="필터를 조정하거나 정렬 기준을 변경해 더 많은 전략을 확인해보세요."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {strategies.map((strategy) => (
        <StrategyCard key={strategy.id} strategy={strategy} />
      ))}
    </div>
  );
}
