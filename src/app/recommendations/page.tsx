'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { PageSEO } from '@/components/seo';
import { classifyByTier } from '@/lib/api/predictions';
import { getNewsByTickers } from '@/lib/api/news';
import { useBuySignals, useStrategies } from '@/hooks/useData';
import type { NewsArticle } from '@/lib/api/news';
import { trackEvent } from '@/lib/analytics';
import { searchStocks } from '@/lib/api/stocks';
import { StateMessageCard } from '@/components/common/StateMessageCard';
import { RecommendationsHero } from '@/components/recommendations/RecommendationsHero';
import { RecommendationsFilterBar } from '@/components/recommendations/RecommendationsFilterBar';
import { RecommendationsStockCard } from '@/components/recommendations/RecommendationsStockCard';
import { RecommendationsPagination } from '@/components/recommendations/RecommendationsPagination';
import { RecommendationsStrategyBanner } from '@/components/recommendations/RecommendationsStrategyBanner';

const ITEMS_PER_PAGE = 12;

export default function RecommendationsPage() {
  const router = useRouter();

  // 필터/정렬 상태
  const [selectedDate, setSelectedDate] = useState<string>(''); // 빈값 = 백엔드에서 최신 날짜 자동 조회
  const [sortBy, setSortBy] = useState<string>('compositeScore');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

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
    // ADR 0006 §2.8: 점수 임계 재정의 금지 → 백엔드 grade(S/A) 기반 분류
    const strongCount = classifyByTier(recommendations).strong.length;

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

  const handleSortByChange = (value: string) => {
    if (sortBy !== value) {
      setSortBy(value);
      setSortOrder('desc');
    }
  };

  const handleSortOrderToggle = () => {
    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
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
            <RecommendationsHero
              displayDate={displayDate}
              isLoading={isLoadingRecommendations}
              heroStats={heroStats}
            />

            <RecommendationsFilterBar
              selectedDate={selectedDate}
              displayDate={displayDate}
              sortBy={sortBy}
              sortOrder={sortOrder}
              totalCount={sortedRecommendations.length}
              isLoading={isLoadingRecommendations}
              onDateChange={setSelectedDate}
              onDateReset={handleDateReset}
              onSortByChange={handleSortByChange}
              onSortOrderToggle={handleSortOrderToggle}
            />

            {/* 로딩 상태 */}
            {isLoadingRecommendations && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="animate-pulse">
                        <div className="h-8 bg-slate-700 rounded mb-4"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 에러 상태 */}
            {!isLoadingRecommendations && recommendationsError && (
              <StateMessageCard
                tone="error"
                icon="⚠️"
                title={recommendationsError}
                description="네트워크 상태를 확인한 뒤 다시 시도해주세요."
                primaryAction={{
                  label: '다시 시도',
                  onClick: () => window.location.reload(),
                }}
                secondaryAction={{
                  label: '직접 종목 검색하기',
                  href: '/stocks',
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
                    {paginatedRecommendations.map((stock) => (
                      <RecommendationsStockCard
                        key={stock.ticker}
                        stock={stock}
                        relatedNews={tickerNews[stock.ticker] ?? []}
                        isNavigating={navigatingTicker === stock.ticker}
                        onNavigate={navigateToStockDetail}
                      />
                    ))}
                  </div>

                  <RecommendationsPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />

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
          {!isLoadingStrategies && !strategiesError && (
            <RecommendationsStrategyBanner popularStrategies={popularStrategies} />
          )}
        </main>
      </div>
    </>
  );
}
