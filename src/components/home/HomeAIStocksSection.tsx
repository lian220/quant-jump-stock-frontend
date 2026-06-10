'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getScoreGrade,
  checkPredictionReliability,
  getPriceRecLabel,
  parseIndicatorBadges,
  type BuySignal,
} from '@/lib/api/predictions';
import { AxisContributionBars } from '@/components/predictions';

interface Tiers {
  strong: BuySignal[];
  medium: BuySignal[];
  weak: BuySignal[];
}

interface Props {
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  displayStocks: BuySignal[];
  isFallback: boolean;
  tiers: Tiers;
  isLoggedIn: boolean;
  lastUpdated: string | null;
  onStockClick: (ticker: string) => void;
  navigatingTicker: string | null;
}

export function HomeAIStocksSection({
  isLoading,
  hasError,
  onRetry,
  displayStocks,
  isFallback,
  tiers,
  isLoggedIn,
  lastUpdated,
  onStockClick,
  navigatingTicker,
}: Props) {
  return (
    <div className="mb-8 md:mb-10">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <p className="text-slate-400 mt-4">AI 분석 데이터 로딩 중...</p>
        </div>
      ) : hasError ? (
        <div className="text-center py-12">
          <Card className="bg-slate-800/30 border-slate-700 max-w-lg mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-lg text-slate-300 mb-2">AI 분석 데이터를 불러오지 못했어요</p>
              <p className="text-sm text-slate-500 mb-4">잠시 후 다시 시도해주세요.</p>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={onRetry}
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Tier 1: 강한 신호 (없으면 중간 신호 fallback) */}
          {displayStocks.length > 0 ? (
            <div className="mb-8 md:mb-10">
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
                {displayStocks.slice(0, 3).map((stock, idx) => {
                  const grade = getScoreGrade(stock.compositeGrade);
                  const indicators = parseIndicatorBadges(stock.recommendationReason);
                  const displayScore = stock.compositeScore; // 0~100 단일 스케일
                  const reliability = checkPredictionReliability(stock);
                  const isUnreliable = reliability.status !== 'reliable';
                  const priceRec = stock.priceRecommendation;
                  const isSellSignal = !isUnreliable && priceRec === '매도';
                  const isBuySignal =
                    !isUnreliable && (priceRec === '강력매수' || priceRec === '매수');
                  const isNavigating = navigatingTicker === stock.ticker;
                  return (
                    <div
                      key={stock.ticker}
                      role="link"
                      tabIndex={0}
                      onClick={() => onStockClick(stock.ticker)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onStockClick(stock.ticker);
                        }
                      }}
                      className={`${idx === 0 && !isLoggedIn ? 'hidden sm:block' : ''} ${isNavigating ? 'opacity-60 pointer-events-none' : ''}`}
                      aria-label={`${stock.stockName} 종목 상세 보기`}
                    >
                      <Card
                        className={`relative bg-slate-800/50 transition-all active:scale-[0.98] hover:shadow-lg cursor-pointer ${
                          isUnreliable
                            ? 'border-amber-500/30 hover:border-amber-400'
                            : isSellSignal
                              ? 'border-red-500/30 hover:border-red-400'
                              : 'border-emerald-500/50 hover:border-emerald-400'
                        }`}
                      >
                        {/* 순위 배지 (#1 emerald / 그 외 slate) */}
                        <span
                          className={`absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap ${
                            idx === 0
                              ? 'bg-emerald-500 text-emerald-950'
                              : 'bg-slate-700 text-slate-200 border border-slate-600'
                          }`}
                        >
                          {idx === 0 ? '🏆 #1' : `#${idx + 1}`}
                        </span>
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
                                  {getPriceRecLabel(priceRec, grade.label)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* 하단: XAI 축별 기여도(모바일도 노출) + 추천이유 한 줄 (ADR 0006 §2.9) */}
                          <div className="bg-slate-700/20 rounded-md px-2 py-1.5">
                            <AxisContributionBars stock={stock} />
                          </div>
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
                                  {getPriceRecLabel(priceRec, grade.label)}
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
                            {/* XAI 축별 기여도 — 데스크탑 (ADR 0006 §2.9) */}
                            <div className="hidden sm:block bg-slate-700/30 p-2.5 rounded-lg">
                              <AxisContributionBars stock={stock} showReason={false} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
          )}

          {/* Tier 2: 중간 신호 (참고용 — strong이 있을 때만 별도 표시) */}
          {tiers.strong.length > 0 && tiers.medium.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-center text-slate-300 mb-2">
                참고 종목
              </h3>
              <p className="text-center text-slate-500 text-xs sm:text-sm mb-6">
                AI 점수가 낮아 추천하지 않지만, 관심 있다면 참고하세요
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto">
                {tiers.medium.slice(0, 4).map((stock) => {
                  const grade = getScoreGrade(stock.compositeGrade);
                  const mDisplayScore = stock.compositeScore; // 0~100 단일 스케일
                  const mPriceRec = stock.priceRecommendation;
                  const mReliability = checkPredictionReliability(stock);
                  const mIsUnreliable = mReliability.status !== 'reliable';
                  const mIsNavigating = navigatingTicker === stock.ticker;
                  return (
                    <div
                      key={stock.ticker}
                      role="link"
                      tabIndex={0}
                      onClick={() => onStockClick(stock.ticker)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onStockClick(stock.ticker);
                        }
                      }}
                      className={mIsNavigating ? 'opacity-60 pointer-events-none' : ''}
                      aria-label={`${stock.stockName} 종목 상세 보기`}
                    >
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
                                {getPriceRecLabel(mPriceRec, grade.label)}
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-6">
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
}
