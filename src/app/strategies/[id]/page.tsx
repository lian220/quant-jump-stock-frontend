'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  MetricCard,
  InvestmentSummary,
  StrategyEquityCurveChart,
  TermTooltip,
  SubscribeButton,
} from '@/components/strategies';
import { getMySubscriptions, type SubscriptionSummary } from '@/lib/api/subscriptions';
import {
  getRiskColor,
  getRiskLabel,
  getCategoryLabel,
  getRuleTypeLabel,
  getRuleTypeColor,
  getUniverseLabel,
  getUniverseColor,
} from '@/lib/strategy-helpers';
import type { UniverseType } from '@/types/strategy';
import { useStrategy, useStrategyDefaultStocks, useBenchmarkSeries } from '@/hooks/useData';
import { PageSEO } from '@/components/seo';
import type { StrategyCategory } from '@/types/strategy';

const BacktestHistoryList = dynamic(() => import('@/components/backtest/BacktestHistoryList'), {
  ssr: false,
});

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
    const token = localStorage.getItem('auth_token');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PageSEO
        title={`${strategy.name} - Alpha Foundry`}
        description={`${strategy.name} 전략 상세 - ${strategy.description}`}
      />
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 전략 헤더 — 모바일: 스택, 데스크톱: 2컬럼 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* 좌측: 제목 + 뱃지 + 설명 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{strategy.name}</h1>
                {strategy.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
                    프리미엄
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                  {getCategoryLabel(strategy.category)}
                </Badge>
                <Badge className={getRiskColor(strategy.riskLevel)}>
                  <TermTooltip termKey="riskLevel">
                    위험도: {getRiskLabel(strategy.riskLevel)}
                  </TermTooltip>
                </Badge>
                <span className="text-slate-400 text-sm">
                  <TermTooltip termKey="backtest">
                    시뮬레이션 기간: {strategy.backtestPeriod}
                  </TermTooltip>
                </span>
              </div>
              <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
                {strategy.description}
              </p>
            </div>

            {/* 우측: 평점 + 구독 버튼 */}
            <div className="flex flex-col gap-2 lg:items-end lg:shrink-0">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span> {strategy.rating.toFixed(1)}
                </span>
                <span className="w-px h-4 bg-slate-700" />
                <span>👥 {strategy.subscribers.toLocaleString()}명 구독</span>
              </div>
              <div className="w-full lg:w-auto">
                <SubscribeButton
                  strategyId={Number(id)}
                  initialSubscribed={isSubscribed}
                  isPremiumStrategy={strategy.isPremium}
                  onSubscribeChange={(sub) => {
                    setIsSubscribed(sub);
                    if (!sub) setSubscriptionInfo(null);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 구독 정보 카드 — 구독 중일 때만 표시 */}
          {isSubscribed && subscriptionInfo && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">구독 활성화됨</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(subscriptionInfo.subscribedAt).toLocaleDateString('ko-KR')} 시작
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                <div>
                  <p className="text-xs text-slate-500">카테고리</p>
                  <p className="text-sm text-slate-200">
                    {getCategoryLabel(subscriptionInfo.strategyCategory as StrategyCategory)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">상태</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${subscriptionInfo.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-yellow-400'}`}
                    />
                    <p className="text-sm text-slate-200">
                      {subscriptionInfo.status === 'ACTIVE' ? '운용 중' : '일시정지'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">알림</p>
                  <p className="text-sm text-slate-200">
                    {subscriptionInfo.alertEnabled ? '🔔 활성' : '🔕 비활성'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 성과 지표: 기본 성과 / 내 백테스트 탭 */}
        <Tabs defaultValue="canonical" className="mb-8">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger
              value="canonical"
              className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              기본 성과
            </TabsTrigger>
            <TabsTrigger
              value="my-backtests"
              className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              내 시뮬레이션
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canonical" className="space-y-6 mt-4">
            {/* SCRUM-344: 대표 백테스트 성과 (canonical) */}
            {strategy.canonicalBacktest && (
              <Card className="bg-gradient-to-r from-slate-800/70 to-slate-800/50 border-emerald-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">대표 시뮬레이션 성과</CardTitle>
                      <CardDescription className="text-slate-400 text-xs">
                        {strategy.canonicalBacktest.startDate} ~{' '}
                        {strategy.canonicalBacktest.endDate} | 초기자본{' '}
                        {(strategy.canonicalBacktest.initialCapital / 10000).toLocaleString()}만원
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      자동 산출
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                        <TermTooltip termKey="cagr">연평균 수익률</TermTooltip>
                      </p>
                      <p
                        className={`text-sm sm:text-lg font-bold ${strategy.canonicalBacktest.cagr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {strategy.canonicalBacktest.cagr >= 0 ? '+' : ''}
                        {strategy.canonicalBacktest.cagr.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                        <TermTooltip termKey="mdd">최대 손실폭</TermTooltip>
                      </p>
                      <p className="text-sm sm:text-lg font-bold text-red-400">
                        {strategy.canonicalBacktest.mdd.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                        <TermTooltip termKey="sharpeRatio">안정성 지수</TermTooltip>
                      </p>
                      <p className="text-sm sm:text-lg font-bold text-purple-400">
                        {strategy.canonicalBacktest.sharpeRatio?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">총 수익률</p>
                      <p
                        className={`text-sm sm:text-lg font-bold ${strategy.canonicalBacktest.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {strategy.canonicalBacktest.totalReturn >= 0 ? '+' : ''}
                        {strategy.canonicalBacktest.totalReturn.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">승률</p>
                      <p className="text-sm sm:text-lg font-bold text-yellow-400">
                        {strategy.canonicalBacktest.winRate != null
                          ? `${strategy.canonicalBacktest.winRate.toFixed(1)}%`
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">최종 자산</p>
                      <p className="text-sm sm:text-lg font-bold text-cyan-400 truncate">
                        {(strategy.canonicalBacktest.finalValue / 10000).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                        만원
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 성과 지표 카드 */}
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
              <MetricCard
                value={strategy.totalReturn}
                label="누적 수익률"
                termKey="totalReturn"
                metricKey="totalReturn"
                valueColor="text-emerald-400"
              />
              <MetricCard
                value={strategy.annualReturn}
                label="연평균 수익률"
                termKey="cagr"
                metricKey="cagr"
                valueColor="text-cyan-400"
              />
              <MetricCard
                value={strategy.maxDrawdown}
                label="최대 손실폭"
                termKey="mdd"
                metricKey="mdd"
                valueColor="text-red-400"
              />
              <MetricCard
                value={strategy.sharpeRatio}
                label="안정성 지수"
                termKey="sharpeRatio"
                metricKey="sharpeRatio"
                valueColor="text-purple-400"
              />
              <MetricCard
                value={strategy.winRate}
                label="승률"
                termKey="winRate"
                metricKey="winRate"
                valueColor="text-yellow-400"
              />
              <MetricCard
                value={`${(strategy.minInvestment / 10000).toLocaleString()}만원`}
                label="최소 투자금"
                termKey="minInvestment"
                valueColor="text-white"
              />
            </div>
          </TabsContent>

          <TabsContent value="my-backtests" className="mt-4">
            {/* 비로그인 상태 */}
            {!authLoading && !user ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-slate-400 mb-2">
                      로그인하고 나만의 조건으로 시뮬레이션해 보세요
                    </p>
                    <p className="text-slate-500 text-sm mb-6">
                      기간, 자본금, 벤치마크를 직접 설정하여 시뮬레이션할 수 있습니다
                    </p>
                    <Link href="/auth">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">로그인</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* 로그인 상태: BacktestHistoryList + CTA */
              <div className="space-y-4">
                <BacktestHistoryList strategyId={id} />

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-medium">새로운 조건으로 테스트</h4>
                        <p className="text-slate-400 text-sm">
                          기간, 자본금, 유니버스를 직접 설정하세요
                        </p>
                      </div>
                      <Link href={`/strategies/${id}/backtest`}>
                        <Button className="bg-cyan-600 hover:bg-cyan-700">
                          새 시뮬레이션 실행
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 포트폴리오 구성 (PORTFOLIO 타입일 때만) */}
        {strategy.stockSelectionType === 'PORTFOLIO' && defaultStocks.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">포트폴리오 구성</CardTitle>
              <CardDescription className="text-slate-400">
                이 전략의 기본 포트폴리오 종목과 비중입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 py-3 px-3">종목명</th>
                      <th className="text-left text-slate-400 py-3 px-2">티커</th>
                      <th className="text-left text-slate-400 py-3 px-2">시장</th>
                      <th className="text-right text-slate-400 py-3 px-3">비중</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className="border-t border-slate-700/50 hover:bg-slate-700/20"
                      >
                        <td className="text-white py-2.5 px-3 font-medium">
                          {stock.stockName}
                          {stock.stockNameEn && (
                            <span className="ml-1 text-xs text-slate-500">
                              ({stock.stockNameEn})
                            </span>
                          )}
                        </td>
                        <td className="text-slate-300 py-2.5 px-2 font-mono text-xs">
                          {stock.ticker}
                        </td>
                        <td className="py-2.5 px-2">
                          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                            {stock.market}
                          </Badge>
                        </td>
                        <td className="text-right py-2.5 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-slate-700/50 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${Math.min(stock.targetWeight, 100)}%` }}
                              />
                            </div>
                            <span className="text-emerald-400 font-semibold min-w-[3rem] text-right">
                              {stock.targetWeight}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-600">
                      <td colSpan={3} className="text-white font-semibold py-2.5 px-3">
                        합계
                      </td>
                      <td className="text-right py-2.5 px-3">
                        <span
                          className={`font-bold ${Math.abs(defaultStocksTotalWeight - 100) < 0.01 ? 'text-emerald-400' : 'text-orange-400'}`}
                        >
                          {defaultStocksTotalWeight}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 투자 시뮬레이션 */}
        <InvestmentSummary
          totalReturn={strategy.totalReturn}
          annualReturn={strategy.annualReturn}
          maxDrawdown={strategy.maxDrawdown}
          backtestPeriod={strategy.backtestPeriod}
        />

        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="performance" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-slate-800/50 border border-slate-700 w-max sm:w-auto">
              <TabsTrigger
                value="performance"
                className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                수익 곡선
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                전략 조건
              </TabsTrigger>
              <TabsTrigger
                value="trades"
                className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                거래 내역
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="text-xs sm:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                월별 수익률
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 수익 곡선 탭 */}
          <TabsContent value="performance">
            <StrategyEquityCurveChart data={strategy.equityCurve} benchmarks={benchmarks} />
          </TabsContent>

          {/* 전략 조건 탭 */}
          <TabsContent value="rules">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">전략 조건 요약</CardTitle>
                <CardDescription className="text-slate-400">
                  이 전략의 매매 규칙과 조건을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(strategy.rules?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    {(strategy.rules ?? []).map((rule, index) => (
                      <div key={rule.id}>
                        {index > 0 && <Separator className="bg-slate-700 my-4" />}
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <Badge className={getRuleTypeColor(rule.type)}>
                              {getRuleTypeLabel(rule.type)}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">{rule.name}</h4>
                            <p className="text-slate-400 text-sm mb-2">{rule.description}</p>
                            {Object.keys(rule.parameters).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(rule.parameters).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded"
                                  >
                                    {key}: {value}
                                    {typeof value === 'number' && key.includes('Period')
                                      ? '개월'
                                      : typeof value === 'number' && key.includes('Rate')
                                        ? '%'
                                        : typeof value === 'number' && key.includes('Loss')
                                          ? '%'
                                          : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">등록된 전략 조건이 없습니다</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 거래 내역 탭 */}
          <TabsContent value="trades">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">거래 내역</CardTitle>
                <CardDescription className="text-slate-400">
                  시뮬레이션 기간 동안의 매매 기록
                </CardDescription>
              </CardHeader>
              <CardContent>
                {strategy.trades.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">거래 내역이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-slate-400 py-3 px-3">날짜</th>
                          <th className="text-left text-slate-400 py-3 px-2">종목</th>
                          <th className="text-center text-slate-400 py-3 px-2">매매</th>
                          <th className="text-right text-slate-400 py-3 px-2">수량</th>
                          <th className="text-right text-slate-400 py-3 px-2">가격</th>
                          <th className="text-right text-slate-400 py-3 px-2">금액</th>
                          <th className="text-right text-slate-400 py-3 px-2">손익</th>
                          <th className="text-right text-slate-400 py-3 px-2">손익률</th>
                          <th className="text-right text-slate-400 py-3 px-2">보유일</th>
                          <th className="text-left text-slate-400 py-3 px-3">사유</th>
                        </tr>
                      </thead>
                      <tbody>
                        {strategy.trades.map((trade, idx) => {
                          const isBuy = trade.side === 'BUY';
                          const isProfit = trade.pnl !== null && trade.pnl > 0;
                          const isLoss = trade.pnl !== null && trade.pnl < 0;
                          return (
                            <tr
                              key={idx}
                              className="border-t border-slate-700/50 hover:bg-slate-700/20"
                            >
                              <td className="text-slate-300 py-2.5 px-3 font-mono text-xs">
                                {trade.tradeDate}
                              </td>
                              <td className="text-white py-2.5 px-2 font-medium">{trade.ticker}</td>
                              <td className="text-center py-2.5 px-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    isBuy
                                      ? 'bg-cyan-500/20 text-cyan-400'
                                      : 'bg-orange-500/20 text-orange-400'
                                  }`}
                                >
                                  {trade.side}
                                </span>
                              </td>
                              <td className="text-slate-300 text-right py-2.5 px-2">
                                {trade.quantity.toLocaleString()}
                              </td>
                              <td className="text-slate-300 text-right py-2.5 px-2 font-mono text-xs">
                                $
                                {trade.price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="text-slate-300 text-right py-2.5 px-2 font-mono text-xs">
                                $
                                {trade.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="text-right py-2.5 px-2 font-mono text-xs">
                                {isBuy ? (
                                  <span className="text-slate-600">-</span>
                                ) : (
                                  <span
                                    className={
                                      isProfit
                                        ? 'text-emerald-400'
                                        : isLoss
                                          ? 'text-red-400'
                                          : 'text-slate-300'
                                    }
                                  >
                                    {trade.pnl !== null
                                      ? `$${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                      : '-'}
                                  </span>
                                )}
                              </td>
                              <td className="text-right py-2.5 px-2 font-mono text-xs">
                                {isBuy ? (
                                  <span className="text-slate-600">-</span>
                                ) : (
                                  <span
                                    className={
                                      isProfit
                                        ? 'text-emerald-400'
                                        : isLoss
                                          ? 'text-red-400'
                                          : 'text-slate-300'
                                    }
                                  >
                                    {trade.pnlPercent !== null
                                      ? `${trade.pnlPercent > 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%`
                                      : '-'}
                                  </span>
                                )}
                              </td>
                              <td className="text-slate-400 text-right py-2.5 px-2 text-xs">
                                {isBuy
                                  ? '-'
                                  : trade.holdingDays !== null
                                    ? `${trade.holdingDays}일`
                                    : '-'}
                              </td>
                              <td className="text-slate-400 py-2.5 px-3 text-xs max-w-[200px] truncate">
                                {trade.signalReason || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 월별 수익률 탭 */}
          <TabsContent value="monthly">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">월별 수익률</CardTitle>
                <CardDescription className="text-slate-400">
                  연도별 월간 수익률 히트맵
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(strategy.monthlyReturns?.length ?? 0) > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left text-slate-400 py-2 px-3">연도</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="text-center text-slate-400 py-2 px-2">
                              {i + 1}월
                            </th>
                          ))}
                          <th className="text-center text-slate-400 py-2 px-3">연간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const years = [
                            ...new Set((strategy.monthlyReturns ?? []).map((r) => r.year)),
                          ].sort((a, b) => b - a);
                          return years.map((year) => {
                            const yearData = (strategy.monthlyReturns ?? []).filter(
                              (r) => r.year === year,
                            );
                            const yearTotal = yearData.reduce((sum, r) => sum + r.return, 0);
                            return (
                              <tr key={year} className="border-t border-slate-700">
                                <td className="text-white font-medium py-2 px-3">{year}</td>
                                {Array.from({ length: 12 }, (_, month) => {
                                  const monthData = yearData.find((r) => r.month === month + 1);
                                  const returnVal = monthData?.return;
                                  return (
                                    <td key={month} className="text-center py-2 px-2">
                                      {returnVal !== undefined ? (
                                        <span
                                          className={`inline-block w-12 py-1 rounded text-xs font-mono ${
                                            returnVal > 5
                                              ? 'bg-emerald-500/30 text-emerald-300'
                                              : returnVal > 0
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : returnVal > -5
                                                  ? 'bg-red-500/20 text-red-400'
                                                  : 'bg-red-500/30 text-red-300'
                                          }`}
                                        >
                                          {returnVal > 0 ? '+' : ''}
                                          {returnVal.toFixed(1)}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-600">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="text-center py-2 px-3">
                                  <span
                                    className={`font-medium ${yearTotal > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                  >
                                    {yearTotal > 0 ? '+' : ''}
                                    {yearTotal.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">월별 수익률 데이터가 없습니다</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 백테스트 실행 */}
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

        {/* 구독 CTA 섹션 — 구독 상태에 따라 다르게 표시 */}
        {isSubscribed ? (
          <Card className="bg-slate-800/50 border-emerald-500/20 mt-8">
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {strategy.name} 전략을 구독 중입니다
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  현재 이 전략의 매매 신호를 받고 있습니다
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
                  <Link href="/mypage">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      내 구독 관리
                    </Button>
                  </Link>
                  <Link href={`/strategies/${id}/backtest`}>
                    <Button className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700">
                      직접 시뮬레이션 →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 border-emerald-500/30 mt-8">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                    이 전략으로 투자를 시작하세요
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm md:text-base">
                    {!user
                      ? '로그인 후 무료로 구독할 수 있습니다.'
                      : strategy.isPremium
                        ? '프리미엄 구독으로 실시간 매매 신호를 받아보세요.'
                        : '무료로 이 전략의 매매 신호를 받아보세요.'}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-4 mt-3 text-[11px] sm:text-sm text-slate-400 flex-wrap">
                    <span className="whitespace-nowrap">✓ 실시간 매매 알림</span>
                    <span className="whitespace-nowrap">✓ 포트폴리오 연동</span>
                    <span className="whitespace-nowrap">✓ 성과 리포트</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 w-full md:w-auto shrink-0">
                  {strategy.isPremium && <p className="text-slate-400 text-sm">월 29,900원</p>}
                  {!user ? (
                    <Link href={`/auth?returnUrl=/strategies/${id}`} className="w-full md:w-auto">
                      <Button
                        size="lg"
                        className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-700"
                      >
                        로그인 후 구독하기
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      className={`w-full md:w-auto px-8 ${
                        strategy.isPremium
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                      onClick={() => {
                        setSelectedUniverseType(strategy.recommendedUniverseType ?? 'MARKET');
                        setShowUniverseModal(true);
                      }}
                    >
                      {strategy.isPremium ? '프리미엄 구독하기' : '무료로 구독하기'}
                    </Button>
                  )}
                  <p className="text-xs text-slate-500">
                    {strategy.subscribers.toLocaleString()}명이 이미 구독 중
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SCRUM-350: Universe 선택 모달 */}
        {showUniverseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
              <h3 className="text-xl font-bold text-white mb-1">투자 유니버스 선택</h3>
              <p className="text-slate-400 text-sm mb-5">
                매매 신호를 적용할 종목 범위를 선택하세요.
              </p>

              <div className="space-y-3 mb-6">
                {(strategy.supportedUniverseTypes ?? ['MARKET']).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedUniverseType(type)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      selectedUniverseType === type
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedUniverseType === type
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-500'
                      }`}
                    >
                      {selectedUniverseType === type && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getUniverseColor(type)} text-xs`}>
                          {getUniverseLabel(type)}
                        </Badge>
                        {type === strategy.recommendedUniverseType && (
                          <span className="text-xs text-emerald-400">추천</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {type === 'MARKET' && '시장 전체 종목 중 신호 발생 종목에 적용'}
                        {type === 'PORTFOLIO' && '전략 기본 종목 포트폴리오에만 적용'}
                        {type === 'FIXED' && '지정된 고정 종목 목록에만 적용'}
                        {type === 'SECTOR' && '특정 섹터 종목에만 적용'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                  onClick={() => setShowUniverseModal(false)}
                >
                  취소
                </Button>
                <Button
                  className={`flex-1 ${
                    strategy.isPremium
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  onClick={() => {
                    setShowUniverseModal(false);
                    router.push(
                      strategy.isPremium
                        ? '/payment'
                        : `/strategies/${id}/subscribe?universe=${selectedUniverseType}`,
                    );
                  }}
                >
                  {getUniverseLabel(selectedUniverseType)}으로 구독
                </Button>
              </div>
            </div>
          </div>
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
