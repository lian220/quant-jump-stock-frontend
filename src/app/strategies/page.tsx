'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StrategyGrid } from '@/components/strategies/StrategyGrid';
import { StrategyFilter } from '@/components/strategies/StrategyFilter';
import { StrategyPagination } from '@/components/strategies/StrategyPagination';
import { mockStrategies } from '@/lib/mock/strategies';
import type { StrategyCategory, RiskLevel, SortOption, PaginationInfo } from '@/types/strategy';

export default function StrategiesPage() {
  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popularity');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // 필터링 및 정렬된 전략 목록
  const filteredAndSortedStrategies = useMemo(() => {
    let result = [...mockStrategies];

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      result = result.filter((strategy) => strategy.category === selectedCategory);
    }

    // 리스크 레벨 필터
    if (selectedRiskLevel !== 'all') {
      result = result.filter((strategy) => strategy.riskLevel === selectedRiskLevel);
    }

    // 정렬
    result.sort((a, b) => {
      switch (selectedSort) {
        case 'popularity':
          return b.subscribers - a.subscribers;
        case 'return_high':
          return (
            parseFloat(b.totalReturn.replace(/[+%]/g, '')) -
            parseFloat(a.totalReturn.replace(/[+%]/g, ''))
          );
        case 'return_low':
          return (
            parseFloat(a.totalReturn.replace(/[+%]/g, '')) -
            parseFloat(b.totalReturn.replace(/[+%]/g, ''))
          );
        case 'latest':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'risk_low':
          const riskOrder = { low: 1, medium: 2, high: 3 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        default:
          return 0;
      }
    });

    return result;
  }, [selectedCategory, selectedRiskLevel, selectedSort]);

  // 페이지네이션 적용
  const paginatedStrategies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedStrategies.slice(startIndex, endIndex);
  }, [filteredAndSortedStrategies, currentPage]);

  // 페이지네이션 정보
  const paginationInfo: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedStrategies.length / pageSize),
    pageSize,
    totalItems: filteredAndSortedStrategies.length,
  };

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
      {/* 헤더 */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                퀀트점프
              </h1>
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              >
                BETA
              </Badge>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  로그인
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-emerald-600 hover:bg-emerald-700">무료 시작</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
              <p className="text-3xl font-bold text-emerald-400">{mockStrategies.length}</p>
              <p className="text-sm text-slate-400 mt-1">전략 수</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-cyan-400">
                {Math.round(
                  mockStrategies.reduce((sum, s) => sum + s.subscribers, 0) / mockStrategies.length,
                ).toLocaleString()}
              </p>
              <p className="text-sm text-slate-400 mt-1">평균 구독자</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {(
                  mockStrategies.reduce((sum, s) => sum + s.rating, 0) / mockStrategies.length
                ).toFixed(1)}
              </p>
              <p className="text-sm text-slate-400 mt-1">평균 평점</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-400">
                {mockStrategies.filter((s) => s.isPremium).length}
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
                총 <span className="text-white font-semibold">{paginationInfo.totalItems}</span>개의
                전략
              </p>
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                {currentPage} / {paginationInfo.totalPages} 페이지
              </Badge>
            </div>

            {/* 전략 목록 */}
            <StrategyGrid strategies={paginatedStrategies} />

            {/* 페이지네이션 */}
            <StrategyPagination pagination={paginationInfo} onPageChange={handlePageChange} />
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p className="mb-2">퀀트점프 - AI 기반 스마트 투자 플랫폼</p>
            <p className="text-sm">© 2025 QuantJump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
