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
  useRecentNews,
} from '@/hooks/useData';
import { Newspaper } from 'lucide-react';

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
  const { data: recentNewsData } = useRecentNews(3);

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
            <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4 text-center leading-relaxed">
              오늘 AI가{' '}
              <span className="text-white font-semibold">
                {predictionStats?.uniqueTickers ?? '...'}개
              </span>{' '}
              종목을 분석해서{' '}
              <span className="text-emerald-400 font-semibold">{tiers.strong.length}개</span>를
              골랐어요
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-lg sm:text-2xl font-bold text-cyan-400 tabular-nums">
                  {aGradeRatio !== null ? `${aGradeRatio}%` : '...'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">좋은 평가 비율</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums">
                  {predictionStats?.avgCompositeScore != null
                    ? `${Math.min(Math.round((predictionStats.avgCompositeScore / 4.0) * 100), 100)}점`
                    : '...'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">평균 AI 점수</p>
              </div>
            </div>
            {/* 등급분포 바 제거 — 초보자에게 불필요한 정보 */}
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
          {/* Tier 1: 강한 신호 (없으면 중간 신호 fallback) */}
          {(() => {
            const displayStocks = tiers.strong.length > 0 ? tiers.strong : tiers.medium.slice(0, 3);
            const isFallback = tiers.strong.length === 0 && displayStocks.length > 0;
            return displayStocks.length > 0 ? (
              <div className="mb-10 md:mb-12">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-2">
                  {isFallback ? '📊 AI 분석 종목' : '🔥 AI 주목 종목'}
                </h2>
                <p className="text-center text-slate-400 text-sm md:text-base mb-2">
                  {isFallback
                    ? '오늘 AI가 분석한 종목이에요 — 참고 정보입니다'
                    : 'AI가 오늘 가장 유망하다고 판단한 종목이에요'}
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
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-5 lg:gap-6">
                  {displayStocks.slice(0, 3).map((stock) => {
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
                          className={`bg-slate-800/50 transition-all active:scale-[0.98] hover:shadow-lg cursor-pointer ${
                            isUnreliable
                              ? 'border-amber-500/30 hover:border-amber-400'
                              : isSellSignal
                                ? 'border-red-500/30 hover:border-red-400'
                                : 'border-emerald-500/50 hover:border-emerald-400'
                          }`}
                        >
                          {/* ── 모바일: 컴팩트 카드 ── */}
                          <div className="sm:hidden px-3 py-2.5 space-y-2">
                            {/* 상단: 종목 정보 + 점수/배지 */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-1.5 mb-0.5">
                                  <span className="text-[15px] font-bold text-white truncate">
                                    {stock.stockName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 shrink-0">
                                    {stock.ticker}
                                  </span>
                                </div>
                                {/* 가격 행 */}
                                <div className="flex items-center gap-1.5">
                                  {stock.currentPrice != null && (
                                    <span className="text-[13px] font-semibold text-slate-200 font-mono tabular-nums">
                                      ${stock.currentPrice.toFixed(2)}
                                    </span>
                                  )}
                                  {stock.upsidePercent != null && (
                                    <span
                                      className={`text-[11px] font-semibold ${stock.upsidePercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                    >
                                      {stock.upsidePercent > 0 ? '+' : ''}
                                      {stock.upsidePercent.toFixed(1)}%
                                    </span>
                                  )}
                                  {stock.targetPrice != null && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      → ${stock.targetPrice.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* 점수 + 배지 */}
                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <div className={`text-xl font-bold leading-none ${grade.color}`}>
                                  {displayScore}점
                                </div>
                                {isUnreliable ? (
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                    ⚠️ 점검 중
                                  </Badge>
                                ) : (
                                  <Badge
                                    className={`text-[10px] ${
                                      isSellSignal
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : isBuySignal
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }`}
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
                            {/* 하단: 추천이유 + 지표 */}
                            {stock.recommendationReason && (
                              <div className="bg-slate-700/20 rounded-md px-2 py-1.5">
                                <p className="text-[11px] text-slate-300 leading-snug line-clamp-1">
                                  💡 {stock.recommendationReason}
                                </p>
                              </div>
                            )}
                            {indicators.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {indicators.map((label) => (
                                  <span
                                    key={label}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ── 데스크탑: 기존 상세 카드 ── */}
                          <CardHeader className="hidden sm:block px-6 py-4 pb-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <CardTitle className="text-lg text-white truncate">
                                  {stock.stockName}
                                </CardTitle>
                                <p className="text-xs text-slate-500">{stock.ticker}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`text-2xl font-bold ${grade.color}`}>
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
                          <CardContent className="hidden sm:block px-6 pb-6">
                            <div className="space-y-3">
                              {stock.recommendationReason && (
                                <div className="bg-slate-700/20 rounded-lg p-2.5">
                                  <p className="text-sm text-slate-200 leading-relaxed">
                                    💡 {stock.recommendationReason}
                                  </p>
                                </div>
                              )}
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
                                <div className="bg-slate-700/20 p-3 rounded-lg">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-xl font-bold text-white font-mono tabular-nums">
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
                                      <p className="text-[10px] text-slate-500">목표가</p>
                                      <p className="text-sm font-semibold text-slate-300 font-mono tabular-nums">
                                        ${stock.targetPrice.toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* 세부 점수 — 모바일에서는 숨기고 데스크탑에서만 표시 */}
                              <div
                                className={`hidden sm:grid ${stock.sentimentScore > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2`}
                              >
                                <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                  <p className="text-[10px] text-slate-500 mb-0.5 sm:mb-1">
                                    차트 패턴
                                  </p>
                                  <p className="text-sm sm:text-base font-bold text-cyan-400 tabular-nums">
                                    {stock.techScoreDisplay}점
                                  </p>
                                </div>
                                <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                  <p className="text-[10px] text-slate-500 mb-0.5 sm:mb-1">
                                    AI 예측
                                  </p>
                                  <p className="text-sm sm:text-base font-bold text-purple-400 tabular-nums">
                                    {stock.aiScoreDisplay}점
                                  </p>
                                </div>
                                {stock.sentimentScore > 0 && (
                                  <div className="bg-slate-700/30 p-2 sm:p-2.5 rounded-lg">
                                    <p className="text-[10px] text-slate-500 mb-0.5 sm:mb-1">
                                      뉴스 반응
                                    </p>
                                    <p className="text-sm sm:text-base font-bold text-yellow-400 tabular-nums">
                                      {stock.sentimentScoreDisplay}점
                                    </p>
                                  </div>
                                )}
                              </div>
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
                      <p className="text-lg text-slate-300 mb-3">AI가 종목을 분석하고 있어요</p>
                      <p className="text-sm text-slate-500 mb-4">곧 새로운 분석 결과가 나옵니다.</p>
                      <Link href="/recommendations">
                        <Button
                          variant="outline"
                          className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          이전 분석 결과 보기 →
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* Tier 2: 중간 신호 (참고용 — strong이 있을 때만 별도 표시) */}
          {tiers.strong.length > 0 && tiers.medium.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-center text-slate-300 mb-2">
                참고 종목
              </h3>
              <p className="text-center text-slate-500 text-xs sm:text-sm mb-6">
                AI 확신도가 낮은 종목이에요 — 참고만 해주세요
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

  /* ──────────────────────────────────────────────
     공통 섹션: 최신 뉴스 미리보기
     ────────────────────────────────────────────── */
  const newsPreviewSection = recentNewsData?.news && recentNewsData.news.length > 0 && (
    <div className="mb-10 md:mb-16">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} className="text-slate-400" />
          최신 투자 뉴스
        </h2>
        <Link href="/news">
          <Button variant="ghost" className="text-slate-400 hover:text-slate-200 text-sm h-8 px-2">
            더보기 →
          </Button>
        </Link>
      </div>
      <div className="space-y-2.5">
        {recentNewsData.news.slice(0, 3).map((article) => (
          <Link
            key={article.id ?? article.title}
            href={article.sourceUrl ?? '/news'}
            target={article.sourceUrl ? '_blank' : undefined}
            rel={article.sourceUrl ? 'noopener noreferrer' : undefined}
          >
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-slate-200 font-medium line-clamp-1">
                    {article.title}
                  </p>
                  {article.summary && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{article.summary}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 whitespace-nowrap shrink-0 mt-0.5">
                  {article.createdAt
                    ? new Date(article.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
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

              {/* 3. 최신 뉴스 */}
              {newsPreviewSection}

              {/* 4. 인기 전략 */}
              {strategiesSection}

              {/* 5. 투자 유의사항 */}
              {disclaimerSection}
            </>
          ) : (
            /* ══════════════════════════════════════
               비로그인 사용자: 랜딩 페이지 뷰
               ══════════════════════════════════════ */
            <>
              {/* 1. 컴팩트 히어로 */}
              <div className="text-center mb-6 md:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
                  주식,{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    뭘 사야 할지
                  </span>{' '}
                  모르겠다면
                </h1>
                <p className="hidden sm:block text-base md:text-lg text-slate-400 mb-5 md:mb-6 max-w-2xl mx-auto">
                  AI가 매일 종목을 분석하고, 좋은 종목을 골라드립니다.
                  <br />
                  초보자도 쉽게 시작할 수 있어요.
                </p>
                <p className="sm:hidden text-sm text-slate-400 mb-4">
                  AI가 매일 종목을 분석하고 골라드립니다
                </p>
                <Link
                  href="/recommendations"
                  onClick={() =>
                    trackEvent('landing_cta_click', {
                      cta: 'hero_primary_recommendations',
                      location: 'hero',
                    })
                  }
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[220px] bg-emerald-600 hover:bg-emerald-700 h-12 sm:h-11 text-base"
                  >
                    오늘의 AI 추천 보기 →
                  </Button>
                </Link>
                <div className="mt-3">
                  <Link
                    href="/signup"
                    onClick={() =>
                      trackEvent('landing_cta_click', {
                        cta: 'hero_secondary_signup',
                        location: 'hero',
                      })
                    }
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    회원가입하면 맞춤 추천을 받을 수 있어요
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                  {predictionStats?.uniqueTickers ? (
                    <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                      매일 {predictionStats.uniqueTickers}개 종목 분석 중
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                      매일 종목 자동 분석
                    </Badge>
                  )}
                  {predictionStats?.totalPredictions ? (
                    <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                      최근 30일 {predictionStats.totalPredictions.toLocaleString()}건 분석 완료
                    </Badge>
                  ) : null}
                  <Badge className="bg-slate-800/70 text-slate-300 border-slate-600">
                    투자 권유가 아닌 참고 정보
                  </Badge>
                </div>
              </div>

              {/* 2. AI 주목 종목 (히어로 바로 아래) */}
              {aiStocksSection}

              {/* 3. 최신 뉴스 */}
              {newsPreviewSection}

              {/* 4. 인기 전략 */}
              {strategiesSection}

              {/* 5. 투자 유의사항 */}
              {disclaimerSection}

              {/* 6. CTA */}
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
