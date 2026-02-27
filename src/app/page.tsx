'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';
import { getCategoryLabel } from '@/lib/strategy-helpers';
import {
  classifyByTier,
  getScoreGrade,
  checkPredictionReliability,
  type BuySignal,
} from '@/lib/api/predictions';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import {
  useBuySignals,
  usePredictionStats,
  useLatestPredictions,
  useStrategies,
} from '@/hooks/useData';

/** recommendationReason에서 기술 지표 키워드를 파싱하여 배지 라벨 배열 반환 */
function parseIndicatorBadges(reason?: string): string[] {
  if (!reason) return [];
  const badges: string[] = [];
  const lower = reason.toLowerCase();
  if (
    lower.includes('골든크로스') ||
    lower.includes('golden_cross') ||
    lower.includes('golden cross')
  ) {
    badges.push('골든크로스');
  }
  if (lower.includes('rsi')) {
    if (lower.includes('과매수') || lower.includes('overbought')) {
      badges.push('RSI 과열');
    } else {
      badges.push('RSI 저점');
    }
  }
  if (lower.includes('macd')) {
    if (lower.includes('매도') || lower.includes('sell') || lower.includes('bearish')) {
      badges.push('MACD 하락');
    } else {
      badges.push('MACD 상승');
    }
  }
  if (lower.includes('볼린저') || lower.includes('bollinger')) {
    badges.push('볼린저 하단');
  }
  return badges;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();

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
  } = useBuySignals({
    minConfidence: 0.05,
  });

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

  const aGradeRatio = predictionStats?.gradeDistribution
    ? (() => {
        const dist = predictionStats.gradeDistribution;
        const total = Object.values(dist).reduce((sum, v) => sum + v, 0);
        const excellent = (dist['EXCELLENT'] || 0) + (dist['GOOD'] || 0);
        return total > 0 ? Math.round((excellent / total) * 100) : null;
      })()
    : null;

  /* ──────────────────────────────────────────────
     공통 섹션: AI 분석 미니 대시보드
     ────────────────────────────────────────────── */
  const miniDashboard = (
    <>
      {predictionStats || !isLoadingRecommendations ? (
        <div className="max-w-2xl mx-auto text-left">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 text-center">
              오늘 AI가 분석한 종목
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">
                  {predictionStats?.uniqueTickers ?? '집계중'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">분석 종목</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-emerald-400 tabular-nums">
                  {tiers.strong.length}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">AI 추천</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-cyan-400 tabular-nums">
                  {aGradeRatio !== null ? `${aGradeRatio}%` : '집계중'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">좋은 평가</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums">
                  {predictionStats?.avgCompositeScore != null
                    ? `${Math.min(Math.round((predictionStats.avgCompositeScore / 4.0) * 100), 100)}점`
                    : '집계중'}
                  {predictionStats?.avgCompositeScore != null && (
                    <span className="text-xs text-slate-500 font-normal"> / 100</span>
                  )}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">평균 점수</p>
              </div>
            </div>
            {predictionStats?.gradeDistribution &&
              (() => {
                const dist = predictionStats.gradeDistribution;
                const total = Object.values(dist).reduce((sum, v) => sum + v, 0);
                if (total === 0) return null;
                const excellentPct = ((dist['EXCELLENT'] || 0) / total) * 100;
                const goodPct = ((dist['GOOD'] || 0) / total) * 100;
                const fairPct = ((dist['FAIR'] || 0) / total) * 100;
                const lowPct = ((dist['LOW'] || 0) / total) * 100;
                return (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>등급 분포</span>
                      <div className="flex gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> 우수
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> 양호
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 보통
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> 미흡
                        </span>
                      </div>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
                      {excellentPct > 0 && (
                        <div className="bg-emerald-400" style={{ width: `${excellentPct}%` }} />
                      )}
                      {goodPct > 0 && (
                        <div className="bg-cyan-400" style={{ width: `${goodPct}%` }} />
                      )}
                      {fairPct > 0 && (
                        <div className="bg-yellow-400" style={{ width: `${fairPct}%` }} />
                      )}
                      {lowPct > 0 && <div className="bg-red-400" style={{ width: `${lowPct}%` }} />}
                    </div>
                  </div>
                );
              })()}
            {lastUpdated && (
              <p className="text-[10px] text-slate-500 text-center">
                마지막 업데이트: {new Date(lastUpdated).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-40 mx-auto mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-slate-700 rounded w-16 mx-auto mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  /* ──────────────────────────────────────────────
     공통 섹션: AI 주목 종목 + 분석된 종목
     ────────────────────────────────────────────── */
  const aiStocksSection = (
    <div className="mb-10 md:mb-16">
      {isLoadingRecommendations ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <p className="text-slate-400 mt-4">AI 분석 데이터 로딩 중...</p>
        </div>
      ) : buySignalsError ? (
        <div className="text-center py-12">
          <Card className="bg-slate-800/30 border-slate-700 max-w-lg mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-lg text-slate-300 mb-2">AI 분석 데이터를 불러오지 못했어요</p>
              <p className="text-sm text-slate-500 mb-4">잠시 후 다시 시도해주세요.</p>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Tier 1: 강한 신호 */}
          {tiers.strong.length > 0 ? (
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-2">
                🔥 AI 주목 종목
              </h2>
              <p className="text-center text-slate-400 text-sm md:text-base mb-2">
                AI가 오늘 가장 유망하다고 판단한 종목이에요
              </p>
              {lastUpdated && (
                <p className="hidden sm:block text-center text-slate-500 text-xs mb-1">
                  마지막 업데이트: {new Date(lastUpdated).toLocaleDateString('ko-KR')}
                </p>
              )}
              <p className="text-center mb-4 md:mb-8">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] sm:text-xs">
                  차트 패턴 + AI 예측 종합 분석
                </Badge>
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {tiers.strong.slice(0, 3).map((stock) => {
                  const grade = getScoreGrade(stock.compositeScore);
                  const indicators = parseIndicatorBadges(stock.recommendationReason);
                  const displayScore = stock.compositeScoreDisplay;
                  // 예측 신뢰도 검증 (P0-1: 모순 데이터 감지)
                  const reliability = checkPredictionReliability(stock);
                  const isUnreliable = reliability.status !== 'reliable';
                  const priceRec = stock.priceRecommendation;
                  // 모순 데이터인 경우 매도/매수 배지 무시
                  const isSellSignal = !isUnreliable && priceRec === '매도';
                  const isBuySignal =
                    !isUnreliable && (priceRec === '강력매수' || priceRec === '매수');
                  return (
                    <Link key={stock.ticker} href="/recommendations">
                      <Card
                        className={`bg-slate-800/50 transition-all hover:scale-105 cursor-pointer ${
                          isUnreliable
                            ? 'border-amber-500/30 hover:border-amber-400'
                            : isSellSignal
                              ? 'border-red-500/30 hover:border-red-400'
                              : 'border-emerald-500/50 hover:border-emerald-400'
                        }`}
                      >
                        <CardHeader className="pb-1 sm:pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-base sm:text-lg text-white truncate">
                                {stock.stockName}
                              </CardTitle>
                              <p className="text-[11px] sm:text-xs text-slate-500">
                                {stock.ticker}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-xl sm:text-2xl font-bold ${grade.color}`}>
                                {displayScore}점
                              </div>
                              {isUnreliable ? (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 whitespace-nowrap">
                                  ⚠️ 예측 점검 중
                                </Badge>
                              ) : (
                                <Badge
                                  className={
                                    isSellSignal
                                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                      : isBuySignal
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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
                                          : priceRec || grade.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {indicators.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {indicators.map((label) => (
                                  <span
                                    key={label}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                            {stock.currentPrice != null && (
                              <div className="bg-slate-700/20 p-2.5 sm:p-3 rounded-lg">
                                <div className="flex items-end justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500 mb-0.5">현재가</p>
                                    <p className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">
                                      ${stock.currentPrice.toFixed(2)}
                                    </p>
                                  </div>
                                  {stock.upsidePercent != null && (
                                    <Badge
                                      className={`${stock.upsidePercent > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} text-xs`}
                                    >
                                      {stock.upsidePercent > 0 ? '+' : ''}
                                      {stock.upsidePercent.toFixed(1)}%
                                    </Badge>
                                  )}
                                </div>
                                {stock.targetPrice != null && (
                                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                                    <p className="text-[10px] text-slate-500">AI 예상 목표가</p>
                                    <p className="text-sm font-semibold text-slate-300 font-mono tabular-nums">
                                      ${stock.targetPrice.toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            <div
                              className={`grid ${stock.sentimentScore > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2`}
                            >
                              <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                <p className="text-[10px] text-slate-500 mb-0.5 sm:mb-1">
                                  차트 분석
                                </p>
                                <p className="text-sm sm:text-base font-bold text-cyan-400 tabular-nums">
                                  {stock.techScoreDisplay}점
                                </p>
                              </div>
                              <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                <p className="text-[10px] text-slate-500 mb-0.5 sm:mb-1">AI 예측</p>
                                <p className="text-sm sm:text-base font-bold text-purple-400 tabular-nums">
                                  {stock.aiScoreDisplay}점
                                </p>
                              </div>
                              {stock.sentimentScore > 0 && (
                                <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                  <p className="text-[10px] text-slate-500 mb-0.5 sm:mb-1">
                                    뉴스 분위기
                                  </p>
                                  <p className="text-sm sm:text-base font-bold text-yellow-400 tabular-nums">
                                    {stock.sentimentScoreDisplay}점
                                  </p>
                                </div>
                              )}
                            </div>
                            {stock.recommendationReason && (
                              <div className="border-t border-slate-700 pt-2.5 sm:pt-3 mt-2.5 sm:mt-3">
                                <p className="text-[11px] sm:text-xs text-slate-500 mb-1">
                                  왜 이 종목을?
                                </p>
                                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                                  {stock.recommendationReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-2">
                오늘의 시장 인사이트
              </h2>
              <div className="max-w-2xl mx-auto mt-8">
                <Card className="bg-slate-800/30 border-slate-700">
                  <CardContent className="pt-6 text-center">
                    <p className="text-lg text-slate-300 mb-3">
                      오늘은 AI가 자신 있게 추천할 종목이 없어요
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      충분히 좋은 점수를 받은 종목이 없습니다.
                      <br />
                      시장 상황이 불확실할 때는 무리하지 않는 게 좋아요.
                    </p>
                    <Badge className="bg-slate-600/50 text-slate-300 border-slate-500/30">
                      확신이 높을 때만 추천해요
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tier 2: 중간 신호 (참고용) */}
          {tiers.medium.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-center text-slate-300 mb-2">
                그 외 눈여겨볼 종목
              </h3>
              <p className="text-center text-slate-500 text-xs sm:text-sm mb-6">
                AI 점수는 낮지만 일부 긍정 신호가 있는 종목이에요 -- 참고만 하세요
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto">
                {tiers.medium.slice(0, 4).map((stock) => {
                  const grade = getScoreGrade(stock.compositeScore);
                  const mDisplayScore = stock.compositeScoreDisplay;
                  const mPriceRec = stock.priceRecommendation;
                  const mReliability = checkPredictionReliability(stock);
                  const mIsUnreliable = mReliability.status !== 'reliable';
                  return (
                    <Link key={stock.ticker} href="/recommendations">
                      <Card
                        className={`bg-slate-800/30 transition-colors cursor-pointer ${
                          mIsUnreliable
                            ? 'border-amber-500/30 hover:border-amber-400/50'
                            : 'border-slate-700 hover:border-cyan-500/30'
                        }`}
                      >
                        <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
                          <div className="flex justify-between items-center gap-1 mb-1.5 sm:mb-2">
                            <p className="font-medium text-slate-200 text-xs sm:text-sm truncate min-w-0">
                              {stock.stockName}
                            </p>
                            <span
                              className={`text-xs sm:text-sm font-bold shrink-0 ${grade.color}`}
                            >
                              {mDisplayScore}점
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] sm:text-xs text-slate-500">{stock.ticker}</p>
                            {mIsUnreliable ? (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                ⚠️ 점검 중
                              </Badge>
                            ) : (
                              <Badge
                                className={`text-[10px] ${
                                  mPriceRec === '매도'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                }`}
                              >
                                {mPriceRec === '매도'
                                  ? '주의'
                                  : mPriceRec === '강력매수'
                                    ? '강력 추천'
                                    : mPriceRec === '매수'
                                      ? '추천'
                                      : mPriceRec === '보유'
                                        ? '관망'
                                        : mPriceRec || grade.grade}
                              </Badge>
                            )}
                          </div>
                          {stock.currentPrice != null && (
                            <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[11px] sm:text-xs font-mono">
                              <span className="text-slate-400">
                                ${stock.currentPrice.toFixed(2)}
                              </span>
                              {stock.targetPrice != null && (
                                <span className="text-slate-500">
                                  → ${stock.targetPrice.toFixed(0)}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-center text-[11px] sm:text-xs text-slate-500 mt-6 mb-4">
        위 정보는 AI가 차트와 뉴스를 분석한 참고 자료이며, 투자를 권유하는 것이 아닙니다.
      </p>
      <div className="text-center mt-4">
        <Link href="/recommendations">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 h-12 sm:h-10 w-full sm:w-auto"
          >
            전체 분석 종목 보기 →
          </Button>
        </Link>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────
     공통 섹션: 인기 투자 전략
     ────────────────────────────────────────────── */
  const strategiesSection = (
    <div className="mb-10 md:mb-16">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
            인기 투자 전략
          </h2>
          <p className="text-sm text-slate-400">
            과거 데이터로 미리 테스트된 투자 방법을 구독하세요
          </p>
        </div>
        <Link href="/strategies">
          <Button
            variant="outline"
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-10 w-full sm:w-auto"
          >
            모든 전략 보기 →
          </Button>
        </Link>
      </div>

      {isLoadingStrategies ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
      ) : featuredStrategies.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {featuredStrategies.map((strategy) => (
            <Link key={strategy.id} href={`/strategies/${strategy.id}`}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all h-full">
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
                  <CardTitle className="text-lg sm:text-xl text-white">{strategy.name}</CardTitle>
                  <CardDescription className="text-slate-400 line-clamp-2">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
                      <p className="text-slate-400">안정성 지수</p>
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
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center text-slate-400">
            전략을 불러오는데 실패했습니다
          </CardContent>
        </Card>
      )}
    </div>
  );

  /* ──────────────────────────────────────────────
     공통 섹션: 투자위험 고지
     ────────────────────────────────────────────── */
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
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-12">
          {authLoading ? (
            /* ──────────────────────────────────────
               로딩 상태
               ────────────────────────────────────── */
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            </div>
          ) : user ? (
            /* ══════════════════════════════════════
               로그인 사용자: 대시보드 뷰
               ══════════════════════════════════════ */
            <>
              {/* 1. 대시보드 헤더 */}
              <div className="mb-8 md:mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">오늘의 AI 분석</h1>
                    <p className="text-sm text-slate-400 mt-1">
                      {lastUpdated
                        ? `${new Date(lastUpdated).toLocaleDateString('ko-KR')} 업데이트`
                        : 'AI가 매일 종목을 분석합니다'}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-0">
                    <Link href="/recommendations">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-sm h-10 px-4">
                        전체 분석 보기
                      </Button>
                    </Link>
                    <Link href="/strategies">
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 text-sm h-10 px-4"
                      >
                        전략 둘러보기
                      </Button>
                    </Link>
                  </div>
                </div>
                {miniDashboard}
              </div>

              {/* 2. AI 주목 종목 */}
              {aiStocksSection}

              {/* 3. 인기 전략 */}
              {strategiesSection}

              {/* 4. 투자 유의사항 */}
              {disclaimerSection}
            </>
          ) : (
            /* ══════════════════════════════════════
               비로그인 사용자: 랜딩 페이지 뷰
               ══════════════════════════════════════ */
            <>
              {/* 1. 컴팩트 히어로 */}
              <div className="text-center mb-10 md:mb-16">
                <Badge className="mb-3 md:mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  AI 기반 주식 분석 플랫폼
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6">
                  AI가 찾고,{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    전략이 검증
                  </span>
                  합니다
                </h1>
                <p className="hidden sm:block text-base md:text-lg lg:text-xl text-slate-400 mb-6 md:mb-8 max-w-3xl mx-auto">
                  2,500+ 종목을 AI가 매일 분석하고, 좋은 종목을 골라드립니다.
                  <br />
                  어떤 주식을 살지 고민될 때, 여기서 시작하세요.
                </p>
                <p className="sm:hidden text-sm text-slate-400 mb-5">
                  AI가 매일 종목을 분석하고 골라드립니다
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    href="/signup"
                    onClick={() =>
                      trackEvent('landing_cta_click', {
                        cta: 'hero_primary_signup',
                        location: 'hero',
                      })
                    }
                  >
                    <Button
                      size="lg"
                      className="w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-700 h-12 sm:h-10 text-base sm:text-sm"
                    >
                      무료 회원가입
                    </Button>
                  </Link>
                  <Link
                    href="/recommendations"
                    onClick={() =>
                      trackEvent('landing_cta_click', {
                        cta: 'hero_secondary_recommendations',
                        location: 'hero',
                      })
                    }
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto min-w-[200px] border-slate-600 text-slate-300 hover:bg-slate-700 h-12 sm:h-10 text-base sm:text-sm"
                    >
                      AI 분석 종목 보기
                    </Button>
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                  <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                    베타 서비스
                  </Badge>
                  {predictionStats?.totalPredictions ? (
                    <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                      최근 30일 분석 {predictionStats.totalPredictions.toLocaleString()}건
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                      매일 데이터 업데이트
                    </Badge>
                  )}
                  <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                    투자 권유가 아닌 참고 정보 서비스
                  </Badge>
                </div>
              </div>

              {/* 2. AI 주목 종목 (히어로 바로 아래) */}
              {aiStocksSection}

              {/* 3. 왜 Alpha Foundry? */}
              <div className="mb-10 md:mb-16">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-2">
                  왜 Alpha Foundry인가요?
                </h2>
                <p className="text-center text-slate-400 text-sm mb-6 md:mb-10">
                  AI 종목 분석, 투자 전략, 과거 성과 검증을 하나의 플랫폼에서
                </p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/30 transition-colors">
                    <CardContent className="pt-5 sm:pt-6">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl mb-3">
                        🤖
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                        AI 종목 스캐너
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        매일 2,500+ 종목의 차트 패턴, AI 예측, 시장 분위기를 자동 분석하고, 관심
                        종목을 골라드립니다.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
                    <CardContent className="pt-5 sm:pt-6">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl mb-3">
                        📊
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                        전략 마켓플레이스
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        전문가가 설계한 투자 전략을 구독하세요. 상승 추세 따라가기, 저평가 종목 찾기
                        등 다양한 전략을 한 번에 적용합니다.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 transition-colors">
                    <CardContent className="pt-5 sm:pt-6">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl mb-3">
                        🔬
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                        과거 성과 검증
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        모든 전략은 과거 데이터로 미리 검증됩니다. 수익률, 안정성 지수, 최대 손실폭
                        등 핵심 성과를 투명하게 공개합니다.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 4. 인기 전략 */}
              {strategiesSection}

              {/* 5. 투자 유의사항 */}
              {disclaimerSection}

              {/* 7. CTA */}
              <Card className="bg-gradient-to-r from-emerald-600 to-cyan-600 border-0">
                <CardContent className="text-center py-8 sm:py-10 md:py-12">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white">
                    지금 바로 AI 투자 분석을 시작하세요
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-emerald-100">
                    무료 가입으로 AI가 골라주는 종목을 확인해보세요.
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
