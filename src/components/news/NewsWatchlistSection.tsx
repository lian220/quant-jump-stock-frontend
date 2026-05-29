'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NewsCategory } from '@/lib/api/news';

interface Props {
  subscribedCategories: Set<string>;
  subscribedTickers: Set<string>;
  availableCategories: NewsCategory[];
  onAddCategory: (categoryName: string) => Promise<void> | void;
  onRemoveCategory: (categoryName: string) => Promise<void> | void;
  onCategoryWatchlistFilter: () => void;
  onAddTicker: (ticker: string) => Promise<void> | void;
  onRemoveTicker: (ticker: string) => Promise<void> | void;
  onWatchlistFilter: () => void;
  isAddingCategory: boolean;
  isAddingTicker: boolean;
}

export function NewsWatchlistSection({
  subscribedCategories,
  subscribedTickers,
  availableCategories,
  onAddCategory,
  onRemoveCategory,
  onCategoryWatchlistFilter,
  onAddTicker,
  onRemoveTicker,
  onWatchlistFilter,
  isAddingCategory,
  isAddingTicker,
}: Props) {
  const [tickerInput, setTickerInput] = useState('');
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState('');

  const handleAddTicker = async () => {
    await onAddTicker(tickerInput);
    setTickerInput('');
  };

  const handleAddCategory = async () => {
    await onAddCategory(selectedCategoryToAdd);
    setSelectedCategoryToAdd('');
  };

  return (
    <div className="mb-4 md:mb-6 bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3 space-y-3">
      <span className="text-sm font-medium text-white">⭐ 내 관심 목록</span>

      {/* 관심 카테고리 서브섹션 */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-slate-400">📂 관심 카테고리</span>
          {subscribedCategories.size > 0 && (
            <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              {subscribedCategories.size}개
            </Badge>
          )}
        </div>

        {subscribedCategories.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Array.from(subscribedCategories).map((name) => (
              <Badge
                key={name}
                className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20 pl-2 pr-1 py-0.5 inline-flex items-center gap-1"
              >
                🔔 {name}
                <button
                  onClick={() => onRemoveCategory(name)}
                  className="ml-0.5 hover:text-red-400 transition-colors text-cyan-500/60"
                  aria-label={`${name} 삭제`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <select
            value={selectedCategoryToAdd}
            onChange={(e) => setSelectedCategoryToAdd(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 text-white text-sm h-8 rounded-md px-2 max-w-[200px]"
          >
            <option value="">카테고리 선택</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleAddCategory}
            disabled={isAddingCategory || !selectedCategoryToAdd}
            className="bg-cyan-600 hover:bg-cyan-700 text-xs h-8 px-3"
          >
            {isAddingCategory ? '...' : '추가'}
          </Button>
          {subscribedCategories.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCategoryWatchlistFilter}
              className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs h-8 px-3 ml-auto"
            >
              관심 카테고리 뉴스 보기
            </Button>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-slate-700/50" />

      {/* 관심 종목 서브섹션 */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-slate-400">📈 관심 종목</span>
          {subscribedTickers.size > 0 && (
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {subscribedTickers.size}개
            </Badge>
          )}
        </div>

        {subscribedTickers.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Array.from(subscribedTickers).map((ticker) => (
              <Badge
                key={ticker}
                className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 pl-2 pr-1 py-0.5 inline-flex items-center gap-1"
              >
                ${ticker}
                <button
                  onClick={() => onRemoveTicker(ticker)}
                  className="ml-0.5 hover:text-red-400 transition-colors text-emerald-500/60"
                  aria-label={`${ticker} 삭제`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <Input
            placeholder="티커 입력 (예: AAPL)"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTicker()}
            className="bg-slate-700/50 border-slate-600 text-white text-sm h-8 max-w-[180px]"
          />
          <Button
            size="sm"
            onClick={handleAddTicker}
            disabled={isAddingTicker || !tickerInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8 px-3"
          >
            {isAddingTicker ? '...' : '추가'}
          </Button>
          {subscribedTickers.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onWatchlistFilter}
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8 px-3 ml-auto"
            >
              관심종목 뉴스 보기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
