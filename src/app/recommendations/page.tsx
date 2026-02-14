'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageSEO } from '@/components/seo';
import { getBuySignals, getScoreGrade, TIER_THRESHOLDS } from '@/lib/api/predictions';
import { getStrategies } from '@/lib/api/strategies';
import { getCategoryLabel } from '@/lib/strategy-helpers';
import { Footer } from '@/components/layout/Footer';
import type { BuySignal } from '@/lib/api/predictions';
import type { Strategy } from '@/types/strategy';

const ITEMS_PER_PAGE = 12;

export default function RecommendationsPage() {
  // 종목 추천 상태
  const [recommendations, setRecommendations] = useState<BuySignal[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // 필터/정렬 상태
  const defaultDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [sortBy, setSortBy] = useState<string>('compositeScore');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 모바일 필터 토글
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 인기 전략 상태
  const [popularStrategies, setPopularStrategies] = useState<Strategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  // 종목 분석 데이터 가져오기 (날짜 변경 시 자동 재조회)
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoadingRecommendations(true);
      setRecommendationsError(null);
      try {
        const response = await getBuySignals({
          date: selectedDate || undefined,
          minConfidence: 0.1,
        });
        setRecommendations(response.data ?? []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setRecommendationsError('종목 분석 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [selectedDate]);

  // 정렬된 추천 목록
  const sortedRecommendations = useMemo(() => {
    const sorted = [...recommendations];
    sorted.sort((a, b) => {
      let valA: number;
      let valB: number;

      switch (sortBy) {
        case 'upsidePercent':
          valA = a.upsidePercent ?? 0;
          valB = b.upsidePercent ?? 0;
          break;
        case 'techScore':
          valA = a.techScore;
          valB = b.techScore;
          break;
        default:
          valA = a.compositeScore;
          valB = b.compositeScore;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
    return sorted;
  }, [recommendations, sortBy, sortOrder]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedRecommendations.length / ITEMS_PER_PAGE);
  const paginatedRecommendations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRecommendations.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedRecommendations, currentPage]);

  // 정렬/필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder, selectedDate]);

  const handleDateReset = () => {
    setSelectedDate(defaultDate);
  };

  // 인기 전략 가져오기 (구독자순 상위 3개)
  useEffect(() => {
    const fetchPopularStrategies = async () => {
      try {
        const response = await getStrategies({
          sortBy: 'subscribers',
          page: 0,
          size: 10,
        });
        setPopularStrategies(
          response.strategies.filter((s) => parseFloat(String(s.annualReturn)) >= 0).slice(0, 3),
        );
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
        setStrategiesError('전략을 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingStrategies(false);
      }
    };

    fetchPopularStrategies();
  }, []);

  return (
    <>
      <PageSEO
        title="종목 분석 - Alpha Foundry"
        description="AI 기반 오늘의 주목 종목과 검증된 퀀트 투자 전략을 확인하세요."
        keywords="AI 종목 분석, 매수 관심, 퀀트 전략, 투자 참고, Alpha Foundry"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12">
          {/* Hero 섹션: 오늘의 AI 추천 종목 */}
          <section className="mb-8 md:mb-20">
            {/* 헤더 */}
            <div className="text-center mb-4 md:mb-12">
              <Badge className="mb-2 md:mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm md:text-lg px-3 md:px-4 py-0.5 md:py-1">
                🤖 AI 분석
              </Badge>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-2 md:mb-4">
                오늘의 주목 종목
              </h1>
              <p className="text-sm md:text-lg text-slate-500 mb-2 md:mb-6">
                {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                종가 기준 분석
              </p>
              <p className="hidden sm:block text-xl text-slate-400 max-w-3xl mx-auto">
                실시간 데이터 분석 기반 매수 관심 종목
                <br />
                <span className="text-emerald-400 font-semibold">데이터 기반</span> 분석 종목을
                엄선했습니다
              </p>

              {/* 모바일: 컴팩트 필터 바 + 토글 */}
              <div className="mt-4 md:mt-8 max-w-4xl mx-auto">
                {/* 모바일 컴팩트 바 */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      {!isLoadingRecommendations && (
                        <span className="text-sm text-slate-300 font-medium">
                          {sortedRecommendations.length}개 종목
                        </span>
                      )}
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        기술 지표 + AI 분석
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      aria-label="필터 및 정렬 옵션 토글"
                      aria-expanded={isFilterOpen}
                      className="text-slate-400 hover:text-white text-xs px-2"
                    >
                      {isFilterOpen ? '접기' : '필터/정렬'}
                      <svg
                        className={`w-3.5 h-3.5 ml-1 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
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
                    </Button>
                  </div>

                  {/* 모바일 접히는 필터 영역 */}
                  {isFilterOpen && (
                    <Card className="bg-slate-800/50 border-slate-700 mb-3">
                      <CardContent className="pt-3 pb-3 space-y-3">
                        {/* 날짜 필터 */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-900/50 border-slate-600 text-white flex-1"
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {selectedDate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDateReset}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              초기화
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="flex-1 bg-slate-900/50 border-slate-600 text-white">
                              <SelectValue placeholder="정렬 기준" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              <SelectItem value="compositeScore" className="text-slate-200">
                                종합 점수
                              </SelectItem>
                              <SelectItem value="upsidePercent" className="text-slate-200">
                                상승여력
                              </SelectItem>
                              <SelectItem value="techScore" className="text-slate-200">
                                기술 점수
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            {sortOrder === 'desc' ? '높은순' : '낮은순'}
                          </Button>
                        </div>
                        {/* 모바일 Beta 안내 (컴팩트) */}
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          기술적 지표 + AI 분석 반영 · 매일 23:05 KST 업데이트
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* 데스크톱: 기존 필터 바 */}
                <div className="hidden sm:block">
                  <Card className="bg-slate-800/50 border-slate-700 mb-4">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-row items-center gap-3">
                        {/* 날짜 필터 */}
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-900/50 border-slate-600 text-white w-44"
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {selectedDate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDateReset}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              초기화
                            </Button>
                          )}
                        </div>

                        {/* 정렬 기준 */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-40 bg-slate-900/50 border-slate-600 text-white">
                            <SelectValue placeholder="정렬 기준" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="compositeScore" className="text-slate-200">
                              종합 점수
                            </SelectItem>
                            <SelectItem value="upsidePercent" className="text-slate-200">
                              상승여력
                            </SelectItem>
                            <SelectItem value="techScore" className="text-slate-200">
                              기술 점수
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* 오름/내림차순 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          {sortOrder === 'desc' ? '높은순' : '낮은순'}
                        </Button>

                        {/* 결과 수 */}
                        {!isLoadingRecommendations && (
                          <span className="text-sm text-slate-400">
                            {sortedRecommendations.length}개
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 안내 바 - 데스크톱만 */}
              <div className="hidden sm:flex mt-4 max-w-4xl mx-auto items-center justify-center gap-4 text-xs text-slate-500">
                <span>기술적 지표 + AI 분석 기반</span>
                <span className="text-slate-700">|</span>
                <span>매일 23:05 KST 업데이트</span>
              </div>
            </div>

            {/* 로딩 상태 */}
            {isLoadingRecommendations && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="animate-pulse">
                        <div className="h-8 bg-slate-700 rounded mb-4"></div>
                        <div className="h-6 bg-slate-700 rounded mb-3 w-2/3"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 에러 상태 */}
            {recommendationsError && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-xl text-red-400 mb-4">⚠️ {recommendationsError}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 추천 종목 카드 */}
            {!isLoadingRecommendations &&
              !recommendationsError &&
              sortedRecommendations.length > 0 && (
                <>
                  {/* 투자 면책 안내 */}
                  <p className="text-xs text-slate-500 mb-4">
                    본 정보는 투자 권유가 아니며, 모든 투자 판단과 책임은 투자자 본인에게 있습니다.
                  </p>

                  {/* 페이지 정보 */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-400">
                      총 {sortedRecommendations.length}개 중{' '}
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, sortedRecommendations.length)}
                    </p>
                    {totalPages > 1 && (
                      <p className="text-sm text-slate-500">
                        {currentPage} / {totalPages} 페이지
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedRecommendations.map((stock) => {
                      const scoreGrade = getScoreGrade(stock.compositeScore);
                      const score = stock.compositeScore;
                      const isStrong = score >= TIER_THRESHOLDS.STRONG;
                      const isMedium = score >= TIER_THRESHOLDS.MEDIUM;
                      // 게이지 바: AI/감정 통합 후 현재 범위 ~3.5점 기준
                      const gaugeMax = 3.5;
                      const gaugePercent = Math.min((score / gaugeMax) * 100, 100);
                      const gaugeColor = isStrong
                        ? 'bg-emerald-400'
                        : isMedium
                          ? 'bg-cyan-400'
                          : 'bg-slate-400';

                      return (
                        <Card
                          key={stock.ticker}
                          className={`bg-gradient-to-br from-slate-800/80 to-slate-800/50 transition-all hover:shadow-lg ${
                            isStrong
                              ? 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-500/10'
                              : isMedium
                                ? 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/10'
                                : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <CardTitle className="text-2xl text-white mb-1">
                                  {stock.stockName}
                                </CardTitle>
                                <p className="text-sm text-slate-400 font-mono">{stock.ticker}</p>
                              </div>
                              <Badge
                                className={
                                  isStrong
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm'
                                    : isMedium
                                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm'
                                      : 'bg-slate-500/20 text-slate-400 border-slate-500/30 text-sm'
                                }
                              >
                                {isStrong ? '추천' : isMedium ? '참고' : '모니터링'}
                              </Badge>
                            </div>

                            {/* 종합 점수 게이지 바 */}
                            <div className="bg-slate-700/30 p-3 rounded-lg mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-400">종합 점수</p>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-lg font-bold tabular-nums ${scoreGrade.color}`}
                                  >
                                    {score.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-slate-500">/ {gaugeMax}</span>
                                  {scoreGrade.badge && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
                                      {scoreGrade.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${gaugeColor}`}
                                  style={{ width: `${gaugePercent}%` }}
                                />
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{scoreGrade.grade}</p>
                            </div>

                            {/* 점수 상세 */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-slate-700/30 p-3 rounded-lg">
                                <p className="text-xs text-slate-400 mb-1">기술 점수</p>
                                <p className="text-lg font-bold text-cyan-400 tabular-nums">
                                  {stock.techScore.toFixed(1)}
                                </p>
                              </div>
                              <div className="bg-slate-700/30 p-3 rounded-lg">
                                <p className="text-xs text-slate-400 mb-1">AI 점수</p>
                                <p className="text-lg font-bold text-purple-400 tabular-nums">
                                  {stock.aiScore.toFixed(1)}
                                </p>
                              </div>
                            </div>

                            {/* 가격 정보 */}
                            {(stock.currentPrice != null || stock.targetPrice != null) && (
                              <div className="bg-slate-700/20 p-4 rounded-lg mb-4">
                                {stock.currentPrice != null ? (
                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">현재가</p>
                                      <p className="text-xl font-bold text-white font-mono tabular-nums">
                                        ${stock.currentPrice.toFixed(2)}
                                      </p>
                                    </div>
                                    {stock.targetPrice != null && (
                                      <div>
                                        <p className="text-xs text-slate-400 mb-1">목표가</p>
                                        <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                                          ${stock.targetPrice.toFixed(2)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mb-3">
                                    <p className="text-xs text-slate-400 mb-1">AI 목표가</p>
                                    <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                                      ${stock.targetPrice!.toFixed(2)}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  {stock.upsidePercent !== undefined &&
                                    stock.upsidePercent !== null && (
                                      <Badge
                                        className={`
                                    ${
                                      stock.upsidePercent >= 10
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : stock.upsidePercent >= 5
                                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }
                                  `}
                                      >
                                        상승여력 {stock.upsidePercent > 0 ? '+' : ''}
                                        {stock.upsidePercent.toFixed(1)}%
                                      </Badge>
                                    )}

                                  {stock.priceRecommendation && (
                                    <Badge
                                      className={`
                                    ${
                                      stock.priceRecommendation === '강력매수' ||
                                      stock.priceRecommendation === '높은 관심'
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : stock.priceRecommendation === '매수' ||
                                            stock.priceRecommendation === '관심'
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }
                                  `}
                                    >
                                      {stock.priceRecommendation}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardHeader>

                          <CardContent>
                            {/* 분석 근거 */}
                            {stock.recommendationReason && (
                              <div className="mb-4">
                                <p className="text-xs text-slate-400 mb-2">분석 근거</p>
                                <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                                  {stock.recommendationReason}
                                </p>
                              </div>
                            )}

                            {/* CTA 버튼 - Primary/Secondary 위계 */}
                            <div className="flex gap-2">
                              <Button
                                asChild
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <Link href={`/stocks?query=${stock.ticker}`}>종목 상세</Link>
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-slate-400 hover:text-slate-200 text-xs"
                              >
                                <Link href="/strategies">전략 보기 →</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* 페이지네이션 컨트롤 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                      >
                        이전
                      </Button>
                      {(() => {
                        const pages: (number | string)[] = [];
                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else if (currentPage <= 3) {
                          pages.push(1, 2, 3, 4, '...', totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          pages.push(
                            1,
                            '...',
                            totalPages - 3,
                            totalPages - 2,
                            totalPages - 1,
                            totalPages,
                          );
                        } else {
                          pages.push(
                            1,
                            '...',
                            currentPage - 1,
                            currentPage,
                            currentPage + 1,
                            '...',
                            totalPages,
                          );
                        }
                        return pages.map((page, idx) =>
                          typeof page === 'string' ? (
                            <span key={`ellipsis-${idx}`} className="text-slate-500 px-1">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={
                                page === currentPage
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                              }
                            >
                              {page}
                            </Button>
                          ),
                        );
                      })()}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                      >
                        다음
                      </Button>
                    </div>
                  )}
                </>
              )}

            {/* 결과 없음 */}
            {!isLoadingRecommendations &&
              !recommendationsError &&
              sortedRecommendations.length === 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 text-center py-16">
                    <p className="text-slate-400 text-lg mb-2">오늘은 분석 데이터가 없습니다</p>
                    <p className="text-slate-500 text-sm">
                      신뢰도 기준을 충족하는 매수 관심 종목이 발견되지 않았습니다.
                    </p>
                  </CardContent>
                </Card>
              )}
          </section>

          {/* 구분선 */}
          <div className="relative mb-20">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-6 text-slate-500 text-sm">장기 투자 전략</span>
            </div>
          </div>

          {/* 하단 섹션: 인기 투자 전략 */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">검증된 퀀트 전략</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-6">
                장기 포트폴리오 구성을 위한 체계적인 투자 전략을 탐색하세요
              </p>
              <Link href="/strategies">
                <Button
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  모든 전략 보기 →
                </Button>
              </Link>
            </div>

            {/* 로딩 상태 */}
            {isLoadingStrategies && (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="animate-pulse">
                        <div className="h-6 bg-slate-700 rounded mb-4"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 에러 상태 */}
            {strategiesError && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-red-400">{strategiesError}</p>
                </CardContent>
              </Card>
            )}

            {/* 전략 카드 */}
            {!isLoadingStrategies && !strategiesError && popularStrategies.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                {popularStrategies.map((strategy) => (
                  <Link key={strategy.id} href={`/strategies/${strategy.id}`}>
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            className={`
                              ${strategy.category === 'value' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}
                              ${strategy.category === 'momentum' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                              ${strategy.category === 'asset_allocation' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                              ${strategy.category === 'quant_composite' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : ''}
                              ${strategy.category === 'seasonal' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : ''}
                              ${strategy.category === 'ml_prediction' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : ''}
                            `}
                          >
                            {getCategoryLabel(strategy.category)}
                          </Badge>
                          {strategy.isPremium && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              프리미엄
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl text-white">{strategy.name}</CardTitle>
                        <CardDescription className="text-slate-400 line-clamp-2">
                          {strategy.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">연평균 수익률</p>
                            <p
                              className={`font-semibold ${
                                parseFloat(String(strategy.annualReturn)) < 0
                                  ? 'text-red-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {strategy.annualReturn}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">샤프 비율</p>
                            <p className="text-cyan-400 font-semibold">{strategy.sharpeRatio}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">구독자</p>
                            <p className="text-slate-300 font-semibold">
                              {strategy.subscribers.toLocaleString()}명
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">평점</p>
                            <p className="text-yellow-400 font-semibold">⭐ {strategy.rating}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CTA 섹션 */}
          <section className="mt-20">
            <Card className="bg-gradient-to-r from-emerald-600 to-cyan-600 border-0">
              <CardContent className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4 text-white">
                  지금 바로 데이터 기반 투자를 시작하세요
                </h2>
                <p className="text-xl mb-8 text-emerald-100">
                  AI 분석 종목과 검증된 퀀트 전략으로 스마트한 투자를 경험하세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/strategies">
                    <Button size="lg" className="bg-white text-emerald-700 hover:bg-slate-100">
                      전략 둘러보기
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white/10"
                    >
                      무료 회원가입
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        {/* 푸터 */}
        <Footer />
      </div>
    </>
  );
}
