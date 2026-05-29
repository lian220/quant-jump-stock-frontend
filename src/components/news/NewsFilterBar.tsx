'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FilterMode = 'recent' | 'category' | 'tickers' | 'tags';

interface Props {
  filterMode: FilterMode;
  filterInput: string;
  activeFilter: string[];
  resultCount: number;
  isLoading: boolean;
  onFilterModeChange: (mode: FilterMode) => void;
  onFilterInputChange: (value: string) => void;
  onFilterApply: () => void;
}

export function NewsFilterBar({
  filterMode,
  filterInput,
  activeFilter,
  resultCount,
  isLoading,
  onFilterModeChange,
  onFilterInputChange,
  onFilterApply,
}: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <>
      {/* 모바일 컴팩트 바 */}
      <div className="sm:hidden mb-3">
        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2">
            {!isLoading && (
              <span className="text-sm text-slate-300 font-medium">{resultCount}건</span>
            )}
            {activeFilter.length > 0 && (
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
                {filterMode === 'tickers' ? '티커' : '태그'}: {activeFilter.join(', ')}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="필터 토글"
            aria-expanded={isFilterOpen}
            className="text-slate-400 hover:text-white text-xs px-2"
          >
            {isFilterOpen ? '접기' : '검색'}
          </Button>
        </div>
      </div>

      {/* 모바일 검색 펼침 */}
      {isFilterOpen && (
        <Card className="sm:hidden bg-slate-800/50 border-slate-700 mb-3">
          <CardContent className="pt-3 pb-3 space-y-3">
            <div className="flex gap-2">
              <Button
                variant={filterMode === 'tickers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterModeChange('tickers')}
                className={
                  filterMode === 'tickers'
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'border-slate-600 text-slate-300'
                }
              >
                티커
              </Button>
              <Button
                variant={filterMode === 'tags' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterModeChange('tags')}
                className={
                  filterMode === 'tags'
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'border-slate-600 text-slate-300'
                }
              >
                태그
              </Button>
            </div>
            {(filterMode === 'tickers' || filterMode === 'tags') && (
              <div className="flex gap-2">
                <Input
                  placeholder={filterMode === 'tickers' ? 'AAPL,MSFT' : '경제,연준'}
                  value={filterInput}
                  onChange={(e) => onFilterInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onFilterApply()}
                  className="bg-slate-700/50 border-slate-600 text-white text-sm"
                />
                <Button
                  size="sm"
                  onClick={onFilterApply}
                  className="bg-cyan-600 hover:bg-cyan-700 whitespace-nowrap"
                >
                  검색
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 데스크톱 검색 */}
      <div className="hidden sm:flex items-center gap-3 max-w-3xl mx-auto bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant={filterMode === 'tickers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterModeChange('tickers')}
            className={
              filterMode === 'tickers'
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : 'border-slate-600 text-slate-300'
            }
          >
            티커별
          </Button>
          <Button
            variant={filterMode === 'tags' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterModeChange('tags')}
            className={
              filterMode === 'tags'
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : 'border-slate-600 text-slate-300'
            }
          >
            태그별
          </Button>
        </div>
        {(filterMode === 'tickers' || filterMode === 'tags') && (
          <div className="flex gap-2 flex-1">
            <Input
              placeholder={
                filterMode === 'tickers' ? '티커 입력 (예: AAPL,MSFT)' : '태그 입력 (예: 경제,연준)'
              }
              value={filterInput}
              onChange={(e) => onFilterInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onFilterApply()}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Button size="sm" onClick={onFilterApply} className="bg-cyan-600 hover:bg-cyan-700">
              검색
            </Button>
          </div>
        )}
        {!isLoading && (
          <span className="text-sm text-slate-400 whitespace-nowrap ml-auto">{resultCount}건</span>
        )}
      </div>
    </>
  );
}
