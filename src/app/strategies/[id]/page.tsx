'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvestmentSummary } from '@/components/strategies';
import { getMySubscriptions, type SubscriptionSummary } from '@/lib/api/subscriptions';
import type { UniverseType } from '@/types/strategy';
import { useStrategy, useStrategyDefaultStocks, useBenchmarkSeries } from '@/hooks/useData';
import { PageSEO } from '@/components/seo';
import { StrategyHeader } from '@/components/strategy-detail/StrategyHeader';
import { StrategySubscriptionInfo } from '@/components/strategy-detail/StrategySubscriptionInfo';
import { StrategyPerformanceTabs } from '@/components/strategy-detail/StrategyPerformanceTabs';
import { StrategyPortfolioComposition } from '@/components/strategy-detail/StrategyPortfolioComposition';
import { StrategyAnalysisTabs } from '@/components/strategy-detail/StrategyAnalysisTabs';
import { StrategySubscriptionCTA } from '@/components/strategy-detail/StrategySubscriptionCTA';
import { StrategyUniverseModal } from '@/components/strategy-detail/StrategyUniverseModal';

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const id = params.id as string;

  // SWR 기반 전략 상세 조회
  const { data: strategy, isLoading: strategyLoading, error: strategyError } = useStrategy(id);

  // PORTFOLIO 타입이면 기본 종목도 조회 (전략 데이터 로드 후 조건부)
  const { data: defaultStocksData } = useStrategyDefaultStocks(
    strategy?.stockSelectionType === 'PORTFOLIO' ? id : null,
  );
  const defaultStocks = defaultStocksData?.stocks ?? [];
  const defaultStocksTotalWeight = defaultStocksData?.totalWeight ?? 0;

  // 벤치마크 파라미터: 전략의 equityCurve 기반으로 계산
  const benchmarkParams = useMemo(() => {
    if (!strategy) return null;
    if (strategy.equityCurve && strategy.equityCurve.length > 0) {
      const dates = strategy.equityCurve.map((p) => p.date).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const startPoint = strategy.equityCurve.find((p) => p.date === startDate);
      const initialCapital = startPoint?.value ?? 10000000;
      return { tickers: ['SPY', 'QQQ'], startDate, endDate, initialCapital };
    }
    // equityCurve가 없으면 최근 1년
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setFullYear(startDateObj.getFullYear() - 1);
    const startDate = startDateObj.toISOString().split('T')[0];
    return { tickers: ['SPY', 'QQQ'], startDate, endDate, initialCapital: 10000000 };
  }, [strategy]);

  const { data: benchmarkData } = useBenchmarkSeries(benchmarkParams);
  const benchmarks = benchmarkData?.benchmarks ?? [];

  const isLoading = strategyLoading;
  const error = strategyError
    ? strategyError instanceof Error
      ? strategyError.message
      : '전략 정보를 불러오는데 실패했습니다.'
    : null;

  // SCRUM-350: Universe 선택 모달 상태
  const [showUniverseModal, setShowUniverseModal] = useState(false);
  const [selectedUniverseType, setSelectedUniverseType] = useState<UniverseType>('MARKET');
  // 구독 상태
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionSummary | null>(null);

  // 로그인 상태일 때 구독 여부 조회
  useEffect(() => {
    // id 변경 시 구독 상태 초기화 (전략 간 이동 시 stale UI 방지)
    setIsSubscribed(false);
    setSubscriptionInfo(null);

    if (!user || !id) return;
    const token = getAuthToken();
    if (!token) return;

    getMySubscriptions(token)
      .then((data) => {
        const found = data.subscriptions.find((s) => s.strategyId === Number(id));
        if (found) {
          setIsSubscribed(true);
          setSubscriptionInfo(found);
        }
      })
      .catch(() => {
        // 구독 목록 조회 실패는 무시 (비로그인 등)
      });
  }, [user, id]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">전략 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !strategy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="text-center">
            <p className="text-xl text-red-400 mb-4">⚠️ {error || '전략을 찾을 수 없습니다.'}</p>
            <div className="space-x-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                뒤로가기
              </Button>
              <Link href="/strategies">
                <Button className="bg-emerald-600 hover:bg-emerald-700">전략 목록</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubscribeCTAClick = () => {
    setSelectedUniverseType(strategy.recommendedUniverseType ?? 'MARKET');
    setShowUniverseModal(true);
  };

  const handleUniverseConfirm = () => {
    setShowUniverseModal(false);
    router.push(
      strategy.isPremium
        ? '/payment'
        : `/strategies/${id}/subscribe?universe=${selectedUniverseType}`,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PageSEO
        title={`${strategy.name} - Alpha Foundry`}
        description={`${strategy.name} 전략 상세 - ${strategy.description}`}
      />
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 전략 헤더 */}
        <div className="mb-8">
          <StrategyHeader
            strategy={strategy}
            strategyId={Number(id)}
            isSubscribed={isSubscribed}
            onSubscribeChange={(sub) => {
              setIsSubscribed(sub);
              if (!sub) setSubscriptionInfo(null);
            }}
          />

          {/* 구독 정보 카드 — 구독 중일 때만 표시 */}
          {isSubscribed && subscriptionInfo && (
            <StrategySubscriptionInfo subscriptionInfo={subscriptionInfo} />
          )}
        </div>

        {/* 성과 지표: 기본 성과 / 내 백테스트 탭 */}
        <StrategyPerformanceTabs
          strategy={strategy}
          strategyId={id}
          isLoggedIn={!!user}
          authLoading={authLoading}
        />

        {/* 포트폴리오 구성 (PORTFOLIO 타입일 때만) */}
        {strategy.stockSelectionType === 'PORTFOLIO' && defaultStocks.length > 0 && (
          <StrategyPortfolioComposition
            defaultStocks={defaultStocks}
            totalWeight={defaultStocksTotalWeight}
          />
        )}

        {/* 투자 시뮬레이션 */}
        <InvestmentSummary
          totalReturn={strategy.totalReturn}
          annualReturn={strategy.annualReturn}
          maxDrawdown={strategy.maxDrawdown}
          backtestPeriod={strategy.backtestPeriod}
        />

        {/* 분석 탭 (수익 곡선 / 조건 / 거래 / 월별) */}
        <StrategyAnalysisTabs strategy={strategy} benchmarks={benchmarks} />

        {/* 백테스트 실행 CTA */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  내 설정으로 시뮬레이션
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm">
                  기간, 자본금, 유니버스를 직접 설정하여 시뮬레이션해 보세요
                </p>
              </div>
              <Link href={`/strategies/${id}/backtest`}>
                <Button className="bg-cyan-600 hover:bg-cyan-700 px-6 text-sm">
                  직접 시뮬레이션 →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 구독 CTA */}
        <StrategySubscriptionCTA
          strategy={strategy}
          strategyId={id}
          isSubscribed={isSubscribed}
          isLoggedIn={!!user}
          onSubscribeClick={handleSubscribeCTAClick}
        />

        {/* Universe 선택 모달 */}
        {showUniverseModal && (
          <StrategyUniverseModal
            strategy={strategy}
            selectedUniverseType={selectedUniverseType}
            onSelectUniverseType={setSelectedUniverseType}
            onClose={() => setShowUniverseModal(false)}
            onConfirm={handleUniverseConfirm}
          />
        )}

        {/* 태그 */}
        {strategy.tags.length > 0 && (
          <div className="mt-6 flex items-center gap-2">
            <span className="text-slate-400 text-sm">태그:</span>
            {strategy.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-slate-700/20 text-slate-400 border-slate-600"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
