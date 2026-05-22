'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getScoreGrade, TIER_THRESHOLDS, checkPredictionReliability } from '@/lib/api/predictions';
import { getNewsByTickers } from '@/lib/api/news';
import { formatRelativeTime } from '@/lib/utils';
import { useBuySignals, useStrategies } from '@/hooks/useData';

import type { NewsArticle } from '@/lib/api/news';
import { trackEvent } from '@/lib/analytics';
import { searchStocks } from '@/lib/api/stocks';
import { StateMessageCard } from '@/components/common/StateMessageCard';

const ITEMS_PER_PAGE = 12;

export default function RecommendationsPage() {
  const router = useRouter();

  // 필터/정렬 상태
  const [selectedDate, setSelectedDate] = useState<string>(''); // 빈값 = 백엔드에서 최신 날짜 자동 조회
  const [sortBy, setSortBy] = useState<string>('compositeScore');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 모바일 필터 토글
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 가이드 토글 (첫 방문 시 자동 표시)
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('recommendations-guide-seen') !== 'true') {
      setShowGuide(true);
    }
  }, []);

  // SWR: 종목 분석 데이터 (날짜 변경 시 자동 재조회)
  const buySignalsParams = useMemo(
    () => ({ date: selectedDate || undefined, minConfidence: 0.1 }),
    [selectedDate],
  );
  const {
    data: buySignalsData,
    isLoading: isLoadingRecommendations,
    error: buySignalsError,
  } = useBuySignals(buySignalsParams);
  const recommendations = useMemo(() => buySignalsData?.data ?? [], [buySignalsData?.data]);
  const displayDate = buySignalsData?.date ?? '';
  const recommendationsError = buySignalsError
    ? 'AI 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
    : null;

  // SWR: 인기 전략 (구독자순 상위 10개 → 클라이언트에서 필터)
  const {
    data: strategiesData,
    isLoading: isLoadingStrategies,
    error: strategiesError,
  } = useStrategies({ sortBy: 'subscribers', page: 0, size: 10 });
  const popularStrategies = useMemo(
    () =>
      (strategiesData?.strategies ?? [])
        .filter((s) => parseFloat(String(s.annualReturn)) >= 0)
        .slice(0, 3),
    [strategiesData],
  );

  // 관련 뉴스
  const [tickerNews, setTickerNews] = useState<Record<string, NewsArticle[]>>({});

  // 카드 클릭 시 종목 이동 중인 ticker 추적
  const [navigatingTicker, setNavigatingTicker] = useState<string | null>(null);

  const firstViewTracked = useRef(false);

  useEffect(() => {
    if (!isLoadingRecommendations && !firstViewTracked.current) {
      firstViewTracked.current = true;
      trackEvent('first_analysis_view', {
        hasData: recommendations.length > 0,
      });
    }
  }, [isLoadingRecommendations, recommendations.length]);

  // 관련 뉴스 로드 (추천 종목 로드 후)
  useEffect(() => {
    if (recommendations.length === 0) return;
    const tickers = Array.from(new Set(recommendations.map((r) => r.ticker)));
    getNewsByTickers(tickers, 30)
      .then((res) => {
        const grouped: Record<string, NewsArticle[]> = {};
        for (const article of res.news ?? []) {
          for (const t of article.tickers) {
            if (!grouped[t]) grouped[t] = [];
            if (grouped[t].length < 2) grouped[t].push(article);
          }
        }
        setTickerNews(grouped);
      })
      .catch(() => {});
  }, [recommendations]);

  // 히어로 카운터 통계
  const heroStats = useMemo(() => {
    if (recommendations.length === 0) return null;
    const withUpside = recommendations.filter(
      (s) => s.upsidePercent != null && s.currentPrice != null,
    );
    const positiveUpside = withUpside.filter((s) => s.upsidePercent! > 0);
    const maxUpsideStock = positiveUpside.length
      ? positiveUpside.reduce((a, b) => (a.upsidePercent! > b.upsidePercent! ? a : b))
      : null;
    const avgUpside = positiveUpside.length
      ? positiveUpside.reduce((sum, s) => sum + s.upsidePercent!, 0) / positiveUpside.length
      : 0;
    const strongCount = recommendations.filter(
      (s) => s.compositeScore >= TIER_THRESHOLDS.STRONG,
    ).length;

    return {
      totalCount: recommendations.length,
      maxUpsideTicker: maxUpsideStock?.ticker ?? null,
      maxUpsidePercent: maxUpsideStock?.upsidePercent ?? 0,
      avgUpside: Math.round(avgUpside * 10) / 10,
      strongCount,
    };
  }, [recommendations]);

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
    setSelectedDate(''); // 빈값으로 리셋 → 백엔드가 최신 날짜 자동 조회
  };

  // 종목 상세 페이지로 이동 (ticker → stock id 조회 후 이동)
  const navigateToStockDetail = useCallback(
    async (ticker: string) => {
      if (navigatingTicker) return; // 중복 클릭 방지
      setNavigatingTicker(ticker);
      try {
        const result = await searchStocks({ query: ticker, size: 1 });
        if (result.stocks.length > 0) {
          router.push(`/stocks/${result.stocks[0].id}`);
        } else {
          router.push(`/stocks?query=${ticker}`);
        }
      } catch {
        router.push(`/stocks?query=${ticker}`);
      } finally {
        setNavigatingTicker(null);
      }
    },
    [router, navigatingTicker],
  );

  return (
    <>
      <PageSEO
        title="AI 추천 - Alpha Foundry"
        description="AI가 매일 분석한 오늘의 추천 종목을 확인하세요. 주식 초보도 쉽게 이해할 수 있어요."
        keywords="AI 종목 추천, 주식 초보, 주식 분석, 투자 참고, Alpha Foundry"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
          {/* Hero 섹션: 오늘의 AI 추천 종목 */}
          <section className="mb-6 md:mb-10">
            {/* Compact Hero */}
            <div className="mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5">
                    🤖 AI 분석
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    오늘의 주목 종목
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  {displayDate
                    ? `${new Date(displayDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} 마감 가격 기준`
                    : '최신 데이터 로딩 중...'}
                  <span className="hidden sm:inline text-slate-600 ml-2">
                    · 매일 23:05 업데이트
                  </span>
                </p>
              </div>

              {/* 핵심 통계 인라인 */}
              {heroStats && !isLoadingRecommendations && (
                <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-400 mb-3">
                  <span>
                    <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                      {heroStats.totalCount}
                    </span>
                    개 분석
                  </span>
                  <span className="text-slate-700">|</span>
                  <span>
                    <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
                      {heroStats.strongCount}
                    </span>
                    개 AI 추천
                  </span>
                  {heroStats.maxUpsidePercent > 0 && (
                    <>
                      <span className="text-slate-700">|</span>
                      <span>
                        최대 예상 수익률{' '}
                        <span className="font-semibold text-emerald-400">
                          +{heroStats.maxUpsidePercent.toFixed(1)}%
                        </span>
                        {heroStats.maxUpsideTicker && (
                          <span className="text-slate-500 ml-1">· {heroStats.maxUpsideTicker}</span>
                        )}
                      </span>
                    </>
                  )}
                  {heroStats.avgUpside > 0 && (
                    <>
                      <span className="text-slate-700">|</span>
                      <span>
                        평균 예상 수익률{' '}
                        <span className="font-semibold text-cyan-400">+{heroStats.avgUpside}%</span>
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 가이드 토글 */}
              {heroStats && !isLoadingRecommendations && (
                <>
                  <button
                    onClick={() => {
                      setShowGuide((prev) => {
                        if (prev) {
                          localStorage.setItem('recommendations-guide-seen', 'true');
                        }
                        return !prev;
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-1"
                  >
                    <span>💡 처음이라면? 보는 법 안내</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${showGuide ? 'rotate-180' : ''}`}
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
                  {showGuide && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-3">
                      <div className="flex items-start gap-2.5 bg-slate-800/40 rounded-lg p-3">
                        <span className="text-lg leading-none mt-0.5">📊</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-300 mb-0.5">
                            종합 점수 (100점 만점)
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            AI 예측, 차트 패턴, 뉴스 분위기를 합산한 점수예요. 점수가 높을수록 AI가
                            긍정적으로 본 종목이에요.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 bg-slate-800/40 rounded-lg p-3">
                        <span className="text-lg leading-none mt-0.5">🎯</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-300 mb-0.5">예상 수익률</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            지금 가격에서 AI가 예측한 목표 가격까지 얼마나 오를 수 있는지 보여줘요.
                            예: +15%면 15% 상승 가능성이에요.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 bg-slate-800/40 rounded-lg p-3">
                        <span className="text-lg leading-none mt-0.5">🤖</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-300 mb-0.5">
                            왜 이 종목을?
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            AI가 이 종목을 선택한 이유를 태그로 요약해줘요. 예: &quot;AI 예측
                            강세&quot;, &quot;뉴스 긍정적&quot; 등
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sticky 필터 바 */}
            <div className="sticky top-[57px] z-40 bg-slate-900/95 backdrop-blur-md -mx-3 px-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2.5 mb-4 border-b border-slate-800/50">
              {/* 모바일 필터 */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center gap-2">
                  {!isLoadingRecommendations && (
                    <span className="text-sm text-slate-300 font-medium shrink-0">
                      {sortedRecommendations.length}개
                    </span>
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
                            setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
                          } else {
                            setSortBy(opt.value);
                            setSortOrder('desc');
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
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white flex-1 h-9"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {selectedDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDateReset}
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
                <div className="flex-1" />
                <Select value={sortBy} onValueChange={setSortBy}>
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
                  onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {sortOrder === 'desc' ? '높은 것 먼저' : '낮은 것 먼저'}
                </Button>
                {!isLoadingRecommendations && (
                  <span className="text-sm text-slate-400">{sortedRecommendations.length}개</span>
                )}
              </div>
            </div>

            {/* 로딩 상태 */}
            {isLoadingRecommendations && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <StateMessageCard
                tone="error"
                icon="⚠️"
                title={recommendationsError}
                description="잠시 후 다시 시도하거나 기준 날짜를 초기화해 최신 데이터를 확인해주세요."
                primaryAction={{ label: '다시 시도', onClick: () => window.location.reload() }}
                secondaryAction={{
                  label: '날짜 초기화',
                  onClick: handleDateReset,
                  variant: 'ghost',
                }}
              />
            )}

            {/* 추천 종목 카드 */}
            {!isLoadingRecommendations &&
              !recommendationsError &&
              sortedRecommendations.length > 0 && (
                <>
                  {/* 페이지 정보 */}
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
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

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {paginatedRecommendations.map((stock) => {
                      const scoreGrade = getScoreGrade(stock.compositeScore);
                      const score = stock.compositeScore;
                      const isStrong = score >= TIER_THRESHOLDS.STRONG;
                      const isMedium = score >= TIER_THRESHOLDS.MEDIUM;
                      const displayScore = stock.compositeScoreDisplay;
                      const gaugePercent = displayScore;
                      const gaugeColor = isStrong
                        ? 'bg-emerald-400'
                        : isMedium
                          ? 'bg-cyan-400'
                          : 'bg-slate-400';
                      // 예측 신뢰도 검증 (P0-1: 모순 데이터 감지)
                      const reliability = checkPredictionReliability(stock);
                      const isUnreliable = reliability.status !== 'reliable';

                      // 매매 방향: 예측 데이터가 모순인 경우 매도/매수 배지를 무시
                      const priceRec = stock.priceRecommendation;
                      const isSellSignal = !isUnreliable && priceRec === '매도';
                      const isBuySignal =
                        !isUnreliable && (priceRec === '강력매수' || priceRec === '매수');

                      const isNavigatingThis = navigatingTicker === stock.ticker;

                      return (
                        <Card
                          key={stock.ticker}
                          className={`flex flex-col bg-gradient-to-br from-slate-800/80 to-slate-800/50 transition-all hover:shadow-lg cursor-pointer ${
                            isNavigatingThis ? 'opacity-70 pointer-events-none' : ''
                          } ${
                            isUnreliable
                              ? 'border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/10'
                              : isSellSignal
                                ? 'border-red-500/30 hover:border-red-400 hover:shadow-red-500/10'
                                : isBuySignal && isStrong
                                  ? 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-500/10'
                                  : isMedium
                                    ? 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/10'
                                    : 'border-slate-700 hover:border-slate-600'
                          }`}
                          onClick={() => navigateToStockDetail(stock.ticker)}
                        >
                          <CardHeader className="px-4 sm:px-6">
                            <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                              <div className="min-w-0">
                                <CardTitle className="text-xl sm:text-2xl text-white mb-0.5 sm:mb-1 truncate">
                                  {stock.stockName}
                                </CardTitle>
                                <p className="text-xs sm:text-sm text-slate-400 font-mono">
                                  {stock.ticker}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* #3: compositeGrade 뱃지 */}
                                <span
                                  className={`text-xl font-black tabular-nums ${
                                    stock.compositeGrade === 'A' ||
                                    stock.compositeGrade === 'B' ||
                                    stock.compositeGrade === 'EXCELLENT'
                                      ? 'text-emerald-400'
                                      : stock.compositeGrade === 'C' ||
                                          stock.compositeGrade === 'GOOD'
                                        ? 'text-cyan-400'
                                        : stock.compositeGrade === 'FAIR'
                                          ? 'text-yellow-400'
                                          : stock.compositeGrade === 'D' ||
                                              stock.compositeGrade === 'LOW'
                                            ? 'text-red-400'
                                            : 'text-slate-400'
                                  }`}
                                >
                                  {stock.compositeGrade}
                                </span>
                                {isUnreliable ? (
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm whitespace-nowrap">
                                    ⚠️ 예측 점검 중
                                  </Badge>
                                ) : (
                                  <Badge
                                    className={
                                      isBuySignal
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm'
                                        : isSellSignal
                                          ? 'bg-red-500/20 text-red-400 border-red-500/30 text-sm'
                                          : priceRec === '보유'
                                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm'
                                            : isStrong
                                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm'
                                              : isMedium
                                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm'
                                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30 text-sm'
                                    }
                                  >
                                    {priceRec === '매도'
                                      ? '주의'
                                      : priceRec === '강력매수'
                                        ? '강력 추천'
                                        : priceRec === '매수'
                                          ? '추천'
                                          : priceRec === '보유'
                                            ? '관망'
                                            : isStrong
                                              ? '추천'
                                              : isMedium
                                                ? '참고'
                                                : '모니터링'}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* #2: 상승여력 시각화 - 현재가 → 목표가 */}
                            {stock.currentPrice != null &&
                              stock.targetPrice != null &&
                              stock.upsidePercent != null && (
                                <div
                                  className={`p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4 border ${
                                    isUnreliable
                                      ? 'bg-amber-500/5 border-amber-500/20'
                                      : stock.upsidePercent >= 5
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : stock.upsidePercent >= 0
                                          ? 'bg-cyan-500/5 border-cyan-500/20'
                                          : 'bg-red-500/5 border-red-500/20'
                                  }`}
                                >
                                  {isUnreliable && (
                                    <p className="text-[10px] text-amber-400 mb-1.5">
                                      {reliability.message} - 실제 가격과 AI 예측 가격의 차이가 커서
                                      참고만 하세요
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-sm text-slate-400 font-mono tabular-nums">
                                        ${stock.currentPrice.toFixed(0)}
                                      </span>
                                      <span
                                        className={`text-xs ${isUnreliable ? 'text-amber-400' : stock.upsidePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                      >
                                        →
                                      </span>
                                      <span className="text-sm font-semibold text-white font-mono tabular-nums">
                                        ${stock.targetPrice.toFixed(0)}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xl font-bold tabular-nums ${
                                        isUnreliable
                                          ? 'text-amber-400'
                                          : stock.upsidePercent >= 5
                                            ? 'text-emerald-400'
                                            : stock.upsidePercent >= 0
                                              ? 'text-cyan-400'
                                              : 'text-red-400'
                                      }`}
                                    >
                                      {stock.upsidePercent > 0 ? '+' : ''}
                                      {stock.upsidePercent.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              )}

                            {/* AI 분석 점수 게이지 바 (100점 만점) */}
                            <div className="bg-slate-700/30 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-400">AI 분석 점수</p>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`text-lg font-bold tabular-nums ${scoreGrade.color}`}
                                  >
                                    {displayScore}점
                                  </span>
                                  <span className="text-xs text-slate-500">/ 100</span>
                                  {scoreGrade.badge && (
                                    <span
                                      className="relative group"
                                      title="AI 분석 점수는 베타 단계로 지속 개선 중입니다"
                                    >
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0 cursor-help">
                                        {scoreGrade.badge}
                                      </Badge>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${gaugeColor}`}
                                  style={{ width: `${gaugePercent}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-slate-500">
                                  {scoreGrade.grade === '우수'
                                    ? '우수 - 매수 신호 강함'
                                    : scoreGrade.grade === '양호'
                                      ? '양호 - 참고할 만함'
                                      : scoreGrade.grade === '보통'
                                        ? '보통 - 추가 확인 필요'
                                        : '낮음 - 신중하게'}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  100점에 가까울수록 매수 신호가 강해요
                                </p>
                              </div>
                            </div>

                            {/* 점수 상세 (100점 만점) */}
                            <div
                              className={`grid ${stock.sentimentScore > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2 mb-3 sm:mb-4`}
                            >
                              {(() => {
                                const subScoreColor = (val: number) =>
                                  val >= 80
                                    ? 'text-emerald-400'
                                    : val >= 50
                                      ? 'text-yellow-400'
                                      : 'text-red-400';
                                return (
                                  <>
                                    <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                      <p className="text-[10px] text-slate-400 mb-0.5 sm:mb-1">
                                        차트 분석
                                      </p>
                                      <p
                                        className={`text-sm sm:text-base font-bold tabular-nums ${subScoreColor(stock.techScoreDisplay)}`}
                                      >
                                        {stock.techScoreDisplay}점
                                      </p>
                                    </div>
                                    <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                      <p className="text-[10px] text-slate-400 mb-0.5 sm:mb-1">
                                        AI 예측
                                      </p>
                                      <p
                                        className={`text-sm sm:text-base font-bold tabular-nums ${subScoreColor(stock.aiScoreDisplay)}`}
                                      >
                                        {stock.aiScoreDisplay}점
                                      </p>
                                    </div>
                                    {stock.sentimentScore > 0 && (
                                      <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                        <p className="text-[10px] text-slate-400 mb-0.5 sm:mb-1">
                                          뉴스 분위기
                                        </p>
                                        <p
                                          className={`text-sm sm:text-base font-bold tabular-nums ${subScoreColor(stock.sentimentScoreDisplay)}`}
                                        >
                                          {stock.sentimentScoreDisplay}점
                                        </p>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* 가격 정보 (상승여력 바 없을 때만 fallback) */}
                            {stock.currentPrice == null && stock.targetPrice != null && (
                              <div className="bg-slate-700/20 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-slate-400">AI 예상 목표가</p>
                                  <p className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                                    ${stock.targetPrice.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className="flex-1 flex flex-col px-4 sm:px-6">
                            {/* #4: 왜 이 종목을? 태그 */}
                            {stock.recommendationReason && (
                              <div className="mb-3 sm:mb-4">
                                <p className="text-[11px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">
                                  왜 이 종목을?
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {stock.recommendationReason.split(',').map((reason, rIdx) => {
                                    const trimmed = reason.trim();
                                    const isAI = trimmed.includes('AI');
                                    const isTech = trimmed.includes('기술');
                                    const isSentiment =
                                      trimmed.includes('뉴스') || trimmed.includes('긍정');
                                    return (
                                      <span
                                        key={rIdx}
                                        className={`inline-flex items-center text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border ${
                                          isAI
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : isSentiment
                                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                              : isTech
                                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}
                                      >
                                        {isAI ? '🤖 ' : isSentiment ? '📰 ' : isTech ? '📊 ' : ''}
                                        {trimmed}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 관련 뉴스 */}
                            {tickerNews[stock.ticker] && tickerNews[stock.ticker].length > 0 && (
                              <div
                                className="mb-3 sm:mb-4 bg-slate-700/20 rounded-lg p-2.5 sm:p-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-xs text-slate-400 mb-2">관련 뉴스</p>
                                <div className="space-y-1.5">
                                  {tickerNews[stock.ticker].map((news, nIdx) => (
                                    <div key={news.id || nIdx} className="flex items-start gap-1.5">
                                      <span className="text-[10px] text-cyan-400 mt-0.5 shrink-0">
                                        &bull;
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        {news.sourceUrl ? (
                                          <a
                                            href={news.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-slate-300 hover:text-cyan-400 transition-colors line-clamp-1 block"
                                          >
                                            {news.title}
                                          </a>
                                        ) : (
                                          <span className="text-xs text-slate-300 line-clamp-1 block">
                                            {news.title}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-slate-500">
                                          {formatRelativeTime(news.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* CTA 버튼 - Primary/Secondary 위계 */}
                            <div
                              className="flex gap-2 mt-auto pt-3 sm:pt-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => navigateToStockDetail(stock.ticker)}
                              >
                                이 종목 자세히 보기
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-slate-400 hover:text-slate-200 text-xs h-10 px-3"
                              >
                                <Link href="/strategies">투자 전략 보기 →</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* 페이지네이션 컨트롤 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
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

                  {/* 투자 면책 안내 */}
                  <p className="text-xs text-slate-500 mt-6 text-center">
                    본 정보는 투자 권유가 아니며, 모든 투자 판단과 책임은 투자자 본인에게 있습니다.
                  </p>
                </>
              )}

            {/* 결과 없음 */}
            {!isLoadingRecommendations &&
              !recommendationsError &&
              sortedRecommendations.length === 0 && (
                <StateMessageCard
                  icon="📭"
                  title={
                    displayDate
                      ? `${new Date(displayDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 분석 데이터가 없습니다`
                      : '분석 데이터가 없습니다'
                  }
                  description="이 날짜에는 AI가 추천할 만한 종목이 없었어요. 최신 날짜로 바꾸거나 직접 종목을 검색해보세요."
                  primaryAction={{ label: '최신 데이터 보기', onClick: handleDateReset }}
                  secondaryAction={{
                    label: '직접 종목 검색하기',
                    href: '/stocks',
                    variant: 'ghost',
                  }}
                />
              )}
          </section>

          {/* 하단 전략 배너 (컴팩트) */}
          {!isLoadingStrategies && !strategiesError && popularStrategies.length > 0 && (
            <section className="mt-8 sm:mt-12">
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm font-semibold text-white mb-1">
                        어떤 종목을 사야 할지 아직 모르겠다면?
                      </p>
                      <p className="text-xs text-slate-400">
                        과거 데이터로 검증된 투자 전략 {popularStrategies.length}개를 둘러보세요 ·{' '}
                        {popularStrategies.map((s) => s.name).join(', ')}
                      </p>
                    </div>
                    <Link href="/strategies" className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        전략 보기 →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
