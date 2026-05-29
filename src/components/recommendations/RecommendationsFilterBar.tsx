'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  selectedDate: string;
  displayDate: string;
  sortBy: string;
  sortOrder: 'desc' | 'asc';
  totalCount: number;
  isLoading: boolean;
  onDateChange: (date: string) => void;
  onDateReset: () => void;
  onSortByChange: (value: string) => void;
  onSortOrderToggle: () => void;
}

export function RecommendationsFilterBar({
  selectedDate,
  displayDate,
  sortBy,
  sortOrder,
  totalCount,
  isLoading,
  onDateChange,
  onDateReset,
  onSortByChange,
  onSortOrderToggle,
}: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="sticky top-[57px] z-40 bg-slate-900/95 backdrop-blur-md -mx-3 px-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2.5 mb-4 border-b border-slate-800/50">
      {/* 모바일 필터 */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="text-sm text-slate-300 font-medium shrink-0">{totalCount}개</span>
          )}
          <div className="flex-1 flex gap-1.5 overflow-x-auto">
            {[
              { value: 'compositeScore', label: '종합 점수' },
              { value: 'upsidePercent', label: '예상 수익률' },
              { value: 'techScore', label: '차트 점수' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (sortBy === opt.value) {
                    onSortOrderToggle();
                  } else {
                    onSortByChange(opt.value);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  sortBy === opt.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700 active:bg-slate-700'
                }`}
              >
                {opt.label}
                {sortBy === opt.value && (
                  <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="날짜 필터 토글"
            aria-expanded={isFilterOpen}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${
              isFilterOpen || selectedDate
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 active:bg-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
        {isFilterOpen && (
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5">
            <Input
              type="date"
              value={selectedDate || displayDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-white flex-1 h-9"
              max={new Date().toISOString().split('T')[0]}
            />
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDateReset}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-9"
              >
                초기화
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 데스크톱 필터 */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white w-44"
            max={new Date().toISOString().split('T')[0]}
          />
          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDateReset}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              초기화
            </Button>
          )}
        </div>
        <div className="flex-1" />
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-40 bg-slate-900/50 border-slate-600 text-white">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="compositeScore" className="text-slate-200">
              종합 점수
            </SelectItem>
            <SelectItem value="upsidePercent" className="text-slate-200">
              예상 수익률
            </SelectItem>
            <SelectItem value="techScore" className="text-slate-200">
              차트 점수
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onSortOrderToggle}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          {sortOrder === 'desc' ? '높은 것 먼저' : '낮은 것 먼저'}
        </Button>
        {!isLoading && <span className="text-sm text-slate-400">{totalCount}개</span>}
      </div>
    </div>
  );
}
