'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StrategyCategory, RiskLevel, SortOption } from '@/types/strategy';

interface StrategyFilterProps {
  selectedCategory: StrategyCategory;
  selectedRiskLevel: RiskLevel | 'all';
  selectedSort: SortOption;
  onCategoryChange: (category: StrategyCategory) => void;
  onRiskLevelChange: (riskLevel: RiskLevel | 'all') => void;
  onSortChange: (sort: SortOption) => void;
}

export function StrategyFilter({
  selectedCategory,
  selectedRiskLevel,
  selectedSort,
  onCategoryChange,
  onRiskLevelChange,
  onSortChange,
}: StrategyFilterProps) {
  const categories: { value: StrategyCategory; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'value', label: '가치투자' },
    { value: 'momentum', label: '모멘텀' },
    { value: 'asset_allocation', label: '자산배분' },
    { value: 'quant_composite', label: '퀀트 복합' },
    { value: 'seasonal', label: '시즌널' },
    { value: 'ml_prediction', label: 'AI 예측' },
  ];

  const riskLevels: { value: RiskLevel | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'low', label: '낮음' },
    { value: 'medium', label: '중간' },
    { value: 'high', label: '높음' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popularity', label: '인기순' },
    { value: 'return_high', label: '수익률 높은순' },
    { value: 'return_low', label: '수익률 낮은순' },
    { value: 'latest', label: '최신순' },
    { value: 'risk_low', label: '리스크 낮은순' },
  ];

  return (
    <div className="space-y-6">
      {/* 카테고리 필터 */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">카테고리</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`cursor-pointer transition-all ${
                selectedCategory === category.value
                  ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              {category.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 리스크 레벨 필터 */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">리스크 레벨</h3>
        <div className="flex flex-wrap gap-2">
          {riskLevels.map((risk) => (
            <Badge
              key={risk.value}
              onClick={() => onRiskLevelChange(risk.value)}
              className={`cursor-pointer transition-all ${
                selectedRiskLevel === risk.value
                  ? 'bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-700'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              {risk.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">정렬</h3>
        <div className="grid grid-cols-2 gap-2">
          {sortOptions.map((sort) => (
            <Button
              key={sort.value}
              onClick={() => onSortChange(sort.value)}
              variant={selectedSort === sort.value ? 'default' : 'outline'}
              size="sm"
              className={
                selectedSort === sort.value
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }
            >
              {sort.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 필터 초기화 */}
      <Button
        onClick={() => {
          onCategoryChange('all');
          onRiskLevelChange('all');
          onSortChange('popularity');
        }}
        variant="outline"
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        필터 초기화
      </Button>
    </div>
  );
}
