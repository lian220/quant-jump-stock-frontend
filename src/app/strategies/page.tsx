'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StrategyGrid } from '@/components/strategies/StrategyGrid';
import { StrategyFilter } from '@/components/strategies/StrategyFilter';
import { StrategyPagination } from '@/components/strategies/StrategyPagination';
import { getStrategies } from '@/lib/api/strategies';
import { Footer } from '@/components/layout/Footer';
import type {
  Strategy,
  StrategyCategory,
  RiskLevel,
  SortOption,
  PaginationInfo,
} from '@/types/strategy';

export default function StrategiesPage() {
  // 데이터 상태
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popularity');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 8,
    totalItems: 0,
  });

  const pageSize = 8;

  // API 호출
  useEffect(() => {
    const fetchStrategies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sortByMapping: Record<SortOption, 'subscribers' | 'cagr' | 'sharpe' | 'recent'> = {
          popularity: 'subscribers',
          return_high: 'cagr',
          return_low: 'cagr',
          latest: 'recent',
          risk_low: 'subscribers', // 백엔드에 리스크 정렬이 없으므로 구독자순으로
        };

        const response = await getStrategies({
          category: selectedCategory,
          sortBy: sortByMapping[selectedSort],
          page: currentPage - 1, // 백엔드는 0부터 시작
          size: pageSize,
        });

        // 프론트엔드에서 리스크 레벨 필터링
        let filteredStrategies = response.strategies;
        if (selectedRiskLevel !== 'all') {
          filteredStrategies = filteredStrategies.filter(
            (strategy) => strategy.riskLevel === selectedRiskLevel,
          );
        }

        // return_low 정렬은 프론트엔드에서 처리 (백엔드는 높은순만 지원)
        if (selectedSort === 'return_low') {
          filteredStrategies = [...filteredStrategies].reverse();
        }

        // 리스크 낮은순 정렬은 프론트엔드에서 처리
        if (selectedSort === 'risk_low') {
          const riskOrder = { low: 1, medium: 2, high: 3 };
          filteredStrategies = [...filteredStrategies].sort(
            (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel],
          );
        }

        setStrategies(filteredStrategies);
        setPaginationInfo({
          currentPage,
          totalPages: response.totalPages,
          pageSize,
          totalItems: response.totalItems,
        });
      } catch (err) {
        console.error('Failed to fetch strategies:', err);
        setError('전략 목록을 불러오는데 실패했습니다. 나중에 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrategies();
  }, [selectedCategory, selectedRiskLevel, selectedSort, currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 필터 변경 시 1페이지로 리셋
  const handleCategoryChange = (category: StrategyCategory) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleRiskLevelChange = (riskLevel: RiskLevel | 'all') => {
    setSelectedRiskLevel(riskLevel);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎯 전략 마켓플레이스</h1>
          <p className="text-lg text-slate-400">
            검증된 퀀트 투자 전략을 탐색하고 나에게 맞는 전략을 선택하세요.
          </p>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-emerald-400">
                {isLoading ? '-' : paginationInfo.totalItems}
              </p>
              <p className="text-sm text-slate-400 mt-1">전략 수</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-cyan-400">
                {isLoading
                  ? '-'
                  : (() => {
                      const avg = Math.round(
                        strategies.reduce((sum, s) => sum + s.subscribers, 0) / strategies.length ||
                          0,
                      );
                      return avg > 0 ? avg.toLocaleString() : '집계 중';
                    })()}
              </p>
              <p className="text-sm text-slate-400 mt-1">평균 구독자</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {isLoading
                  ? '-'
                  : (() => {
                      const avg =
                        strategies.reduce((sum, s) => sum + s.rating, 0) / strategies.length || 0;
                      return avg > 0 ? avg.toFixed(1) : '집계 중';
                    })()}
              </p>
              <p className="text-sm text-slate-400 mt-1">평균 평점</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-400">
                {isLoading
                  ? '-'
                  : (() => {
                      const count = strategies.filter((s) => s.isPremium).length;
                      return count > 0 ? count : '준비 중';
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
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <StrategyFilter
                  selectedCategory={selectedCategory}
                  selectedRiskLevel={selectedRiskLevel}
                  selectedSort={selectedSort}
                  onCategoryChange={handleCategoryChange}
                  onRiskLevelChange={handleRiskLevelChange}
                  onSortChange={handleSortChange}
                />
              </CardContent>
            </Card>
          </aside>

          {/* 전략 그리드 */}
          <div>
            {/* 결과 수 표시 */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400">
                총{' '}
                <span className="text-white font-semibold">
                  {isLoading ? '-' : paginationInfo.totalItems}
                </span>
                개의 전략
              </p>
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                {isLoading ? '-' : currentPage} / {isLoading ? '-' : paginationInfo.totalPages}{' '}
                페이지
              </Badge>
            </div>

            {/* 전략 목록 */}
            {error ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-red-400 mb-4">⚠️ {error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
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

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
