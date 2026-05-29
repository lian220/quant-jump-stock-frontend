'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';
import { classifyByTier, computeAGradeRatio, type BuySignal } from '@/lib/api/predictions';
import { searchStocks } from '@/lib/api/stocks';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBuySignals,
  usePredictionStats,
  useLatestPredictions,
  useStrategies,
  useRecentNews,
  useDashboard,
} from '@/hooks/useData';
import {
  PersonalDashboard,
  PersonalDashboardSkeleton,
  MarketWidget,
  MarketWidgetSkeleton,
} from '@/components/dashboard';
import { HomeMiniDashboard } from '@/components/home/HomeMiniDashboard';
import { HomeAIStocksSection } from '@/components/home/HomeAIStocksSection';
import { HomeNewsPreview } from '@/components/home/HomeNewsPreview';
import { HomeStrategiesPreview } from '@/components/home/HomeStrategiesPreview';
import { HomeAnonymousHero } from '@/components/home/HomeAnonymousHero';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [navigatingTicker, setNavigatingTicker] = useState<string | null>(null);

  // 종목 카드 클릭 → ticker로 stock id 조회 후 종목 상세로 이동
  // (recommendations 페이지의 navigateToStockDetail 패턴과 동일)
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

  // SWR 훅: 페이지 이동 후 돌아와도 캐시된 데이터 즉시 표시
  const { data: strategiesData, isLoading: isLoadingStrategies } = useStrategies({
    sortBy: 'subscribers',
    page: 0,
    size: 10,
  });
  const { data: predictionStats } = usePredictionStats(30);
  const { data: latestData } = useLatestPredictions();
  const {
    data: buySignalsData,
    isLoading: isLoadingRecommendations,
    error: buySignalsError,
    mutate: mutateBuySignals,
  } = useBuySignals({
    minConfidence: 0.05,
  });
  const { data: recentNewsData } = useRecentNews(3);
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboard(!!user);

  const featuredStrategies = useMemo(
    () => strategiesData?.strategies.slice(0, 3) ?? [],
    [strategiesData],
  );
  const lastUpdated = latestData?.analysisDate ?? null;
  const tiers = useMemo(
    () =>
      buySignalsData?.data && buySignalsData.data.length > 0
        ? classifyByTier(buySignalsData.data)
        : { strong: [] as BuySignal[], medium: [] as BuySignal[], weak: [] as BuySignal[] },
    [buySignalsData],
  );

  const displayStocks = useMemo(
    () => (tiers.strong.length > 0 ? tiers.strong : tiers.medium.slice(0, 3)),
    [tiers],
  );
  const isFallback = tiers.strong.length === 0 && displayStocks.length > 0;

  const aGradeRatio = predictionStats?.gradeDistribution
    ? computeAGradeRatio(predictionStats.gradeDistribution)
    : null;

  const miniDashboard = (
    <HomeMiniDashboard
      predictionStats={predictionStats}
      strongCount={tiers.strong.length}
      aGradeRatio={aGradeRatio}
      lastUpdated={lastUpdated}
      isLoadingRecommendations={isLoadingRecommendations}
    />
  );

  const aiStocksSection = (
    <HomeAIStocksSection
      onStockClick={navigateToStockDetail}
      navigatingTicker={navigatingTicker}
      isLoading={isLoadingRecommendations}
      hasError={!!buySignalsError}
      onRetry={mutateBuySignals}
      displayStocks={displayStocks}
      isFallback={isFallback}
      tiers={tiers}
      isLoggedIn={!!user}
      lastUpdated={lastUpdated}
    />
  );

  const newsPreviewSection = <HomeNewsPreview recentNewsData={recentNewsData} />;

  const strategiesSection = (
    <HomeStrategiesPreview
      featuredStrategies={featuredStrategies}
      isLoading={isLoadingStrategies}
    />
  );

  const disclaimerSection = (
    <div className="mb-6 md:mb-8 bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 sm:p-4">
      <p className="text-[11px] sm:text-xs text-slate-400 text-center leading-relaxed">
        <span className="text-yellow-500/80 font-medium">투자 유의사항</span> · 본 서비스에서
        제공하는 모든 정보는 투자 참고 자료이며, 투자 자문이나 매매 권유가 아닙니다. AI 분석 결과는
        과거 기술적 지표를 기반으로 하며 미래 수익을 보장하지 않습니다. 투자에 대한 최종 결정과 그에
        따른 손익은 투자자 본인에게 있습니다.
      </p>
    </div>
  );

  return (
    <>
      <PageSEO
        title={pageDefaults.home.title}
        description={pageDefaults.home.description}
        keywords={pageDefaults.home.keywords}
        ogImage="/images/og/home.jpg"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-12">
          {authLoading ? (
            /* 로딩 상태 */
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            </div>
          ) : user ? (
            /* 로그인 사용자: 대시보드 뷰 */
            <>
              {/* 1. 개인화 블록 + 시장 현황 (PC: 2컬럼) */}
              <div className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">오늘의 AI 분석</h1>
                    <p className="text-sm text-slate-400 mt-1">
                      {lastUpdated
                        ? `${new Date(lastUpdated).toLocaleDateString('ko-KR')} 업데이트`
                        : 'AI가 매일 종목을 분석합니다'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/recommendations">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-sm h-9 px-3">
                        AI가 고른 종목 보기
                      </Button>
                    </Link>
                    <Link href="/strategies">
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 text-sm h-9 px-3"
                      >
                        전략 구독하기
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* 좌측 2/3: 개인 KPI + AI 분석 요약 */}
                  <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                    {/* 개인 KPI 카드 */}
                    {isLoadingDashboard ? (
                      <PersonalDashboardSkeleton />
                    ) : dashboardData?.subscriptions ? (
                      <PersonalDashboard dashboard={dashboardData} />
                    ) : null}

                    {/* AI 분석 미니 대시보드 */}
                    {miniDashboard}
                  </div>

                  {/* 우측 1/3: 시장 현황 */}
                  <div className="space-y-3">
                    {isLoadingDashboard ? (
                      <MarketWidgetSkeleton />
                    ) : dashboardData?.market ? (
                      <MarketWidget indices={dashboardData.market.indices} />
                    ) : null}

                    {/* 최근 알림 미리보기 */}
                    {dashboardData?.signals?.recent && dashboardData.signals.recent.length > 0 && (
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4">
                        <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                          최근 알림
                        </h3>
                        <div className="space-y-1.5">
                          {dashboardData.signals.recent.slice(0, 3).map((noti) => (
                            <div key={noti.id} className="flex items-start gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0" />
                              <p className="text-[11px] text-slate-300 line-clamp-1">
                                {noti.title}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. AI 주목 종목 */}
              {aiStocksSection}

              {/* 3+4. 뉴스 + 전략 (PC: 2컬럼 병렬) */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-8 [&_.strategy-grid]:lg:grid-cols-1">
                <div>{newsPreviewSection}</div>
                <div>{strategiesSection}</div>
              </div>

              {/* 5. 투자 유의사항 (1회만) */}
              {disclaimerSection}
            </>
          ) : (
            /* 비로그인 사용자: 랜딩 페이지 뷰 */
            <>
              {/* 1. Hero */}
              <HomeAnonymousHero
                lastUpdated={lastUpdated}
                predictionStats={predictionStats}
                totalStrategies={strategiesData?.totalItems}
                displayStocks={displayStocks}
                isFallback={isFallback}
                onStockClick={navigateToStockDetail}
                navigatingTicker={navigatingTicker}
              />

              {/* 2. AI 주목 종목 */}
              {aiStocksSection}

              {/* 3. 최신 뉴스 */}
              {newsPreviewSection}

              {/* 4. 인기 전략 */}
              {strategiesSection}

              {/* 5. CTA */}
              <Card className="bg-gradient-to-r from-emerald-600 to-cyan-600 border-0">
                <CardContent className="text-center py-8 sm:py-10 md:py-12">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white">
                    매일 새로운 AI 분석을 받아보세요
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-emerald-100">
                    가입하면 맞춤 종목 추천과 알림을 받을 수 있어요.
                  </p>
                  <Link
                    href="/signup"
                    onClick={() =>
                      trackEvent('landing_cta_click', {
                        cta: 'bottom_primary_signup',
                        location: 'bottom_cta',
                      })
                    }
                  >
                    <Button
                      size="lg"
                      className="bg-white text-emerald-700 hover:bg-slate-100 h-12 sm:h-10 w-full sm:w-auto min-w-[200px]"
                    >
                      무료 회원가입
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </>
  );
}
