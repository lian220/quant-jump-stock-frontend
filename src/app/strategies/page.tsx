'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StrategyGrid } from '@/components/strategies/StrategyGrid';
import { StrategyFilter } from '@/components/strategies/StrategyFilter';
import { StrategyPagination } from '@/components/strategies/StrategyPagination';
import { StateMessageCard } from '@/components/common/StateMessageCard';
import { useStrategies } from '@/hooks/useData';
import type { StrategyCategory, RiskLevel, SortOption, PaginationInfo } from '@/types/strategy';

const VALID_CATEGORIES: StrategyCategory[] = [
  'value',
  'momentum',
  'asset_allocation',
  'quant_composite',
  'seasonal',
  'ml_prediction',
];
const VALID_RISKS: RiskLevel[] = ['low', 'medium', 'high'];
const VALID_SORTS: SortOption[] = ['popularity', 'return_high', 'return_low', 'latest', 'risk_low'];

const SORT_BY_MAPPING: Record<SortOption, 'subscribers' | 'cagr' | 'sharpe' | 'recent'> = {
  popularity: 'subscribers',
  return_high: 'cagr',
  return_low: 'cagr',
  latest: 'recent',
  risk_low: 'subscribers', // 백엔드에 리스크 정렬이 없으므로 구독자순으로
};

function StrategiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get('category');
  const urlRisk = searchParams.get('risk');
  const urlSort = searchParams.get('sort');

  const selectedCategory: StrategyCategory =
    urlCategory && VALID_CATEGORIES.includes(urlCategory as StrategyCategory)
      ? (urlCategory as StrategyCategory)
      : 'all';

  const selectedRiskLevel: RiskLevel | 'all' =
    urlRisk && VALID_RISKS.includes(urlRisk as RiskLevel) ? (urlRisk as RiskLevel) : 'all';

  const selectedSort: SortOption =
    urlSort && VALID_SORTS.includes(urlSort as SortOption)
      ? (urlSort as SortOption)
      : 'return_high';

  // 모바일 필터 토글
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 필터 URL 업데이트 — URL이 바뀌면 searchParams가 변경되어 자동 리렌더
  const updateFilters = useCallback(
    (updates: { category?: StrategyCategory; risk?: RiskLevel | 'all'; sort?: SortOption }) => {
      const params = new URLSearchParams(searchParams.toString());

      if ('category' in updates) {
        if (updates.category === 'all') params.delete('category');
        else params.set('category', updates.category!);
      }
      if ('risk' in updates) {
        if (updates.risk === 'all') params.delete('risk');
        else params.set('risk', updates.risk!);
      }
      if ('sort' in updates) {
        if (updates.sort === 'return_high') params.delete('sort');
        else params.set('sort', updates.sort!);
      }

      const qs = params.toString();
      router.replace(`/strategies${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router],
  );

  // URL 파라미터가 바뀌면(뒤로가기 등) 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRiskLevel, selectedSort]);

  const pageSize = 8;

  // SWR 기반 전략 목록 조회
  const {
    data: strategiesData,
    isLoading,
    error: swrError,
  } = useStrategies({
    category: selectedCategory,
    sortBy: SORT_BY_MAPPING[selectedSort],
    page: currentPage - 1, // 백엔드는 0부터 시작
    size: pageSize,
  });

  const error = swrError ? '전략 목록을 불러오는데 실패했습니다. 나중에 다시 시도해주세요.' : null;

  // 프론트엔드에서 리스크 레벨 필터링 + 정렬
  const strategies = useMemo(() => {
    if (!strategiesData) return [];
    let filtered = strategiesData.strategies;
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter((strategy) => strategy.riskLevel === selectedRiskLevel);
    }
    if (selectedSort === 'return_low') {
      filtered = [...filtered].reverse();
    }
    if (selectedSort === 'risk_low') {
      const riskOrder = { low: 1, medium: 2, high: 3 };
      filtered = [...filtered].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }
    return filtered;
  }, [strategiesData, selectedRiskLevel, selectedSort]);

  const paginationInfo: PaginationInfo = useMemo(
    () => ({
      currentPage,
      totalPages: strategiesData?.totalPages ?? 1,
      pageSize,
      totalItems: strategiesData?.totalItems ?? 0,
    }),
    [currentPage, strategiesData, pageSize],
  );

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 모바일 필터 패널 자동 닫기
  const closeMobileFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  // 필터 변경 시 URL 업데이트 → searchParams 변경 → 자동 리렌더
  const handleCategoryChange = (category: StrategyCategory) => {
    updateFilters({ category });
    closeMobileFilter();
  };

  const handleRiskLevelChange = (riskLevel: RiskLevel | 'all') => {
    updateFilters({ risk: riskLevel });
    closeMobileFilter();
  };

  const handleSortChange = (sort: SortOption) => {
    updateFilters({ sort });
    closeMobileFilter();
  };

  const handleReset = useCallback(() => {
    updateFilters({ category: 'all', risk: 'all', sort: 'return_high' });
    closeMobileFilter();
  }, [updateFilters, closeMobileFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎯 전략 마켓플레이스</h1>
          <p className="text-lg text-slate-400">
            검증된 투자 전략을 탐색하고 나에게 맞는 전략을 선택하세요.
          </p>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-emerald-400">
                {isLoading ? '집계중' : paginationInfo.totalItems.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400 mt-1">전략 수</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-cyan-400">
                {isLoading
                  ? '집계중'
                  : (() => {
                      if (strategies.length === 0) return '0';
                      const avg = Math.round(
                        strategies.reduce((sum, s) => sum + s.subscribers, 0) / strategies.length,
                      );
                      return avg.toLocaleString();
                    })()}
              </p>
              <p className="text-sm text-slate-400 mt-1">평균 구독자</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {isLoading
                  ? '집계중'
                  : (() => {
                      if (strategies.length === 0) return '0.0';
                      const avg =
                        strategies.reduce((sum, s) => sum + s.rating, 0) / strategies.length;
                      return avg.toFixed(1);
                    })()}
              </p>
              <p className="text-sm text-slate-400 mt-1">평균 평점</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-400">
                {isLoading
                  ? '집계중'
                  : (() => {
                      const count = strategies.filter((s) => s.isPremium).length;
                      return count.toString();
                    })()}
              </p>
              <p className="text-sm text-slate-400 mt-1">프리미엄 전략</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 + 그리드 레이아웃 */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* 필터 사이드바 */}
          <aside className="lg:sticky lg:top-4 h-fit">
            {/* 모바일: 접기/펼치기 토글 */}
            <div className="lg:hidden mb-3">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
                aria-controls="strategy-filter-panel"
                className="flex items-center justify-between w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-slate-300">필터 / 정렬</span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            {/* 모바일에서는 isFilterOpen일 때만 표시, 데스크톱에서는 항상 표시 */}
            <div
              id="strategy-filter-panel"
              className={`${isFilterOpen ? 'block' : 'hidden'} lg:block`}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <StrategyFilter
                    selectedCategory={selectedCategory}
                    selectedRiskLevel={selectedRiskLevel}
                    selectedSort={selectedSort}
                    onCategoryChange={handleCategoryChange}
                    onRiskLevelChange={handleRiskLevelChange}
                    onSortChange={handleSortChange}
                    onReset={handleReset}
                  />
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* 전략 그리드 */}
          <div>
            {/* 결과 수 + 활성 필터 표시 */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-400">
                  총{' '}
                  <span className="text-white font-semibold">
                    {isLoading ? '집계중' : paginationInfo.totalItems.toLocaleString()}
                  </span>
                  개의 전략
                </p>
                <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                  {isLoading ? '로딩중' : `${currentPage} / ${paginationInfo.totalPages} 페이지`}
                </Badge>
              </div>

              {/* 활성 필터 칩 */}
              {(selectedCategory !== 'all' || selectedRiskLevel !== 'all') && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">활성 필터:</span>
                  {selectedCategory !== 'all' && (
                    <Badge
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCategoryChange('all')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCategoryChange('all');
                        }
                      }}
                      className="cursor-pointer bg-emerald-600/20 text-emerald-400 border-emerald-600/40 hover:bg-emerald-600/30 active:scale-90 transition-all gap-1"
                    >
                      {
                        {
                          value: '가치투자',
                          momentum: '모멘텀',
                          asset_allocation: '자산배분',
                          quant_composite: 'AI 복합',
                          seasonal: '시즌널',
                          ml_prediction: 'AI 예측',
                          all: '',
                        }[selectedCategory]
                      }
                      <span className="text-emerald-400/60">✕</span>
                    </Badge>
                  )}
                  {selectedRiskLevel !== 'all' && (
                    <Badge
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRiskLevelChange('all')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRiskLevelChange('all');
                        }
                      }}
                      className="cursor-pointer bg-cyan-600/20 text-cyan-400 border-cyan-600/40 hover:bg-cyan-600/30 active:scale-90 transition-all gap-1"
                    >
                      위험도: {{ low: '낮음', medium: '중간', high: '높음' }[selectedRiskLevel]}
                      <span className="text-cyan-400/60">✕</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* 전략 목록 */}
            {error ? (
              <StateMessageCard
                tone="error"
                icon="⚠️"
                title={error}
                description="잠시 후 다시 시도하거나 필터 조건을 기본값으로 되돌려주세요."
                primaryAction={{ label: '다시 시도', onClick: () => window.location.reload() }}
                secondaryAction={{
                  label: '필터 초기화',
                  onClick: handleReset,
                  variant: 'ghost',
                }}
              />
            ) : (
              <>
                <StrategyGrid strategies={strategies} isLoading={isLoading} />

                {/* 페이지네이션 */}
                {!isLoading && paginationInfo.totalPages > 1 && (
                  <StrategyPagination pagination={paginationInfo} onPageChange={handlePageChange} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StrategiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      }
    >
      <StrategiesContent />
    </Suspense>
  );
}
