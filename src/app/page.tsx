'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';
import { getStrategies } from '@/lib/api/strategies';
import { getCategoryLabel } from '@/lib/strategy-helpers';
import {
  getBuySignals,
  classifyByTier,
  getScoreGrade,
  getPredictionStats,
  getLatestPredictions,
  type BuySignal,
  type PredictionStatsResponse,
} from '@/lib/api/predictions';
import { Footer } from '@/components/layout/Footer';
import type { Strategy } from '@/types/strategy';

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
    badges.push('RSI 과매도');
  }
  if (lower.includes('macd')) {
    badges.push('MACD 매수');
  }
  if (lower.includes('볼린저') || lower.includes('bollinger')) {
    badges.push('볼린저 하단');
  }
  return badges;
}

export default function Home() {
  const [featuredStrategies, setFeaturedStrategies] = useState<Strategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true);
  const [tiers, setTiers] = useState<{
    strong: BuySignal[];
    medium: BuySignal[];
    weak: BuySignal[];
  }>({
    strong: [],
    medium: [],
    weak: [],
  });
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [predictionStats, setPredictionStats] = useState<PredictionStatsResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 추천 전략 가져오기 (인기순 상위 3개)
  useEffect(() => {
    const fetchFeaturedStrategies = async () => {
      try {
        const response = await getStrategies({
          sortBy: 'subscribers',
          page: 0,
          size: 10,
        });
        setFeaturedStrategies(
          response.strategies.filter((s) => !String(s.annualReturn).startsWith('-')).slice(0, 3),
        );
      } catch (error) {
        console.warn('Failed to fetch featured strategies:', error);
      } finally {
        setIsLoadingStrategies(false);
      }
    };

    fetchFeaturedStrategies();
  }, []);

  // 예측 통계 및 최신 분석 데이터 가져오기
  useEffect(() => {
    const fetchStatsAndLatest = async () => {
      try {
        const [statsRes, latestRes] = await Promise.allSettled([
          getPredictionStats(30),
          getLatestPredictions(),
        ]);
        if (statsRes.status === 'fulfilled') {
          setPredictionStats(statsRes.value);
        }
        if (latestRes.status === 'fulfilled') {
          setLastUpdated(latestRes.value.analysisDate);
        }
      } catch (error) {
        console.warn('Failed to fetch prediction stats:', error);
      }
    };

    fetchStatsAndLatest();
  }, []);

  // 종목 분석 데이터 Tier별 분류
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await getBuySignals({ minConfidence: 0.05 });
        if (response.data && response.data.length > 0) {
          const classified = classifyByTier(response.data);
          setTiers(classified);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, []);

  const aGradeRatio = predictionStats?.gradeDistribution
    ? (() => {
        const dist = predictionStats.gradeDistribution;
        const total = Object.values(dist).reduce((sum, v) => sum + v, 0);
        const excellent = (dist['EXCELLENT'] || 0) + (dist['GOOD'] || 0);
        return total > 0 ? Math.round((excellent / total) * 100) : null;
      })()
    : null;

  const isStatsReal = !!predictionStats;

  const stats = [
    {
      label: '분석 종목',
      value: predictionStats?.uniqueTickers
        ? predictionStats.uniqueTickers.toLocaleString()
        : '2,500+',
      basis: '최근 30일 기준',
    },
    {
      label: '최근 30일 분석',
      value: predictionStats?.totalPredictions
        ? predictionStats.totalPredictions.toLocaleString()
        : '150+',
      basis: '기술적 지표 분석',
    },
    {
      label: '양호 이상 비율',
      value: aGradeRatio !== null ? `${aGradeRatio}%` : '78%',
      basis: 'GOOD+EXCELLENT 등급',
    },
    {
      label: '평균 종합 점수',
      value:
        predictionStats?.avgCompositeScore != null
          ? predictionStats.avgCompositeScore.toFixed(2)
          : '-',
      basis: '기술 지표 기준 · 최대 1.4점',
    },
  ];

  // 전략 데이터로부터 백테스트 결과 생성 (플러스 수익률만 노출)
  return (
    <>
      <PageSEO
        title={pageDefaults.home.title}
        description={pageDefaults.home.description}
        keywords={pageDefaults.home.keywords}
        ogImage="/images/og/home.jpg"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12">
          {/* 히어로 섹션 */}
          <div className="text-center mb-6 md:mb-16">
            <Badge className="mb-2 md:mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              AI 기반 퀀트 투자 플랫폼
            </Badge>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-2 md:mb-6">
              매일 밤,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                AI가 종목을 분석
              </span>
              합니다
            </h1>
            <p className="hidden sm:block text-lg md:text-xl text-slate-400 mb-6 md:mb-8 max-w-3xl mx-auto">
              2,500+ 종목의 기술적 지표를 매일 자동 분석하고, 매수 신호를 알려드립니다.
              <br />
              감이 아닌 데이터로, 놓치고 있던 기회를 찾아보세요.
            </p>
            <p className="sm:hidden text-sm text-slate-400 mb-3">
              2,500+ 종목을 매일 분석, 매수 신호를 알려드립니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/recommendations">
                <Button size="lg" className="min-w-[200px] bg-emerald-600 hover:bg-emerald-700">
                  AI 분석 종목 보기
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  variant="outline"
                  size="lg"
                  className="hidden sm:inline-flex min-w-[200px] border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  무료로 시작하기
                </Button>
              </Link>
            </div>

            {/* 라이브 AI 분석 요약 미니 대시보드 */}
            {predictionStats || !isLoadingRecommendations ? (
              <div className="mt-4 md:mt-10 max-w-2xl mx-auto text-left">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 text-center">
                    오늘 AI가 분석한 종목
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">
                        {predictionStats?.uniqueTickers ?? '-'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400">분석 종목</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-emerald-400 tabular-nums">
                        {tiers.strong.length}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400">강한 신호</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-cyan-400 tabular-nums">
                        {aGradeRatio !== null ? `${aGradeRatio}%` : '-'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400">양호 이상</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-purple-400 tabular-nums">
                        {predictionStats?.avgCompositeScore != null
                          ? predictionStats.avgCompositeScore.toFixed(2)
                          : '-'}
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
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{' '}
                                우수
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />{' '}
                                양호
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{' '}
                                보통
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{' '}
                                미흡
                              </span>
                            </div>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
                            {excellentPct > 0 && (
                              <div
                                className="bg-emerald-400"
                                style={{ width: `${excellentPct}%` }}
                              />
                            )}
                            {goodPct > 0 && (
                              <div className="bg-cyan-400" style={{ width: `${goodPct}%` }} />
                            )}
                            {fairPct > 0 && (
                              <div className="bg-yellow-400" style={{ width: `${fairPct}%` }} />
                            )}
                            {lowPct > 0 && (
                              <div className="bg-red-400" style={{ width: `${lowPct}%` }} />
                            )}
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
              <div className="mt-4 md:mt-10 max-w-2xl mx-auto">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-40 mx-auto mb-4" />
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
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
          </div>

          {/* AI 종목 분석 (Tier 시스템) - 핵심 콘텐츠 */}
          <div className="mb-8 md:mb-16">
            {isLoadingRecommendations ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                <p className="text-slate-400 mt-4">AI 분석 데이터 로딩 중...</p>
              </div>
            ) : (
              <>
                {/* Tier 1: 강한 신호 (추천) */}
                {tiers.strong.length > 0 ? (
                  <div className="mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
                      🔥 AI 주목 종목
                    </h2>
                    <p className="text-center text-slate-400 text-sm md:text-base mb-2">
                      강한 관심 신호가 감지된 종목
                    </p>
                    {lastUpdated && (
                      <p className="hidden sm:block text-center text-slate-500 text-xs mb-1">
                        마지막 업데이트: {new Date(lastUpdated).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                    <p className="text-center mb-4 md:mb-8">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] sm:text-xs">
                        기술적 지표 기반 · AI 통합 예정
                      </Badge>
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                      {tiers.strong.slice(0, 3).map((stock) => {
                        const grade = getScoreGrade(stock.compositeScore);
                        const indicators = parseIndicatorBadges(stock.recommendationReason);
                        return (
                          <Link key={stock.ticker} href="/recommendations">
                            <Card className="bg-slate-800/50 border-emerald-500/50 hover:border-emerald-400 transition-all hover:scale-105 cursor-pointer">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg text-white">
                                      {stock.stockName}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">{stock.ticker}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-2xl font-bold ${grade.color}`}>
                                      {stock.compositeScore.toFixed(1)}점
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                      {grade.grade}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {/* 기술 지표 배지 */}
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

                                  {/* 점수 분해 */}
                                  <div className="flex flex-wrap gap-3 text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-500">기술</span>
                                      <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-cyan-400 rounded-full"
                                          style={{
                                            width: `${Math.min((stock.techScore / 3.5) * 100, 100)}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-cyan-400 font-mono">
                                        {stock.techScore.toFixed(1)}
                                      </span>
                                    </div>
                                    {stock.aiScore > 0 && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500">AI</span>
                                        <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-purple-400 rounded-full"
                                            style={{
                                              width: `${Math.min((stock.aiScore / 3.5) * 100, 100)}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="text-purple-400 font-mono">
                                          {stock.aiScore.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">현재가</span>
                                    <span className="text-white font-mono">
                                      $
                                      {stock.currentPrice != null
                                        ? stock.currentPrice.toFixed(2)
                                        : '-'}
                                    </span>
                                  </div>
                                  {stock.targetPrice != null && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-400">목표가</span>
                                      <span className="text-emerald-400 font-mono">
                                        ${stock.targetPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {stock.upsidePercent != null && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-400">상승여력</span>
                                      <span
                                        className={`font-bold ${stock.upsidePercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                      >
                                        {stock.upsidePercent.toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                  {stock.recommendationReason && (
                                    <div className="border-t border-slate-700 pt-3 mt-3">
                                      <p className="text-xs text-slate-500 mb-1">분석 근거</p>
                                      <p className="text-xs text-slate-300">
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
                  /* 추천 종목 없을 때: 시장 인사이트 */
                  <div className="mb-12">
                    <h2 className="text-3xl font-bold text-center text-white mb-2">
                      🧭 오늘의 시장 인사이트
                    </h2>
                    <div className="max-w-2xl mx-auto mt-8">
                      <Card className="bg-slate-800/30 border-slate-700">
                        <CardContent className="pt-6 text-center">
                          <p className="text-lg text-slate-300 mb-3">
                            오늘은 강한 관심 신호가 감지되지 않았습니다
                          </p>
                          <p className="text-sm text-slate-500 mb-4">
                            기술적 지표(골든크로스, RSI, MACD) 기준을 충족하는 종목이 없습니다.
                            <br />
                            이는 시장이 관망세이거나 변동성이 높은 상태일 수 있습니다.
                          </p>
                          <Badge className="bg-slate-600/50 text-slate-300 border-slate-500/30">
                            확신이 있을 때만 추천합니다
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Tier 2: 중간 신호 (참고용) */}
                {tiers.medium.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-center text-slate-300 mb-2">
                      📊 분석된 종목 (참고용)
                    </h3>
                    <p className="text-center text-slate-500 text-sm mb-6">
                      기술적 신호가 일부 감지된 종목 · 투자 추천이 아닌 참고 정보입니다
                    </p>
                    <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                      {tiers.medium.slice(0, 4).map((stock) => {
                        const grade = getScoreGrade(stock.compositeScore);
                        return (
                          <Link key={stock.ticker} href="/recommendations">
                            <Card className="bg-slate-800/30 border-slate-700 hover:border-cyan-500/30 transition-colors cursor-pointer">
                              <CardContent className="pt-4 pb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium text-slate-200 text-sm">
                                    {stock.stockName}
                                  </p>
                                  <span className={`text-sm font-bold ${grade.color}`}>
                                    {stock.compositeScore.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-slate-500">{stock.ticker}</p>
                                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">
                                    {grade.grade}
                                  </Badge>
                                </div>
                                {stock.currentPrice != null && (
                                  <p className="text-xs text-slate-400 font-mono mt-2">
                                    ${stock.currentPrice.toFixed(2)}
                                  </p>
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

            {/* 인라인 리스크 고지 */}
            <p className="text-center text-xs text-slate-500 mt-6 mb-4">
              ⚠️ 본 정보는 기술적 지표 기반 참고 자료이며, 투자 권유가 아닙니다.
            </p>

            <div className="text-center mt-4">
              <Link href="/recommendations">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  전체 분석 종목 보기 →
                </Button>
              </Link>
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 text-center">
                <CardContent className="pt-6 pb-4">
                  <p className="text-3xl font-bold text-emerald-400 tabular-nums">{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{stat.basis}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {!isStatsReal && (
            <p className="text-center text-xs text-slate-400 -mt-12 mb-16">
              * 위 수치는 API 연결 전 예시 데이터이며, 실제 서비스 수치와 다를 수 있습니다.
            </p>
          )}

          {/* 추천 전략 미리보기 */}
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">인기 투자 전략</h2>
                <p className="text-slate-400">검증된 퀀트 전략으로 시작하세요</p>
              </div>
              <Link href="/strategies">
                <Button
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  모든 전략 보기 →
                </Button>
              </Link>
            </div>

            {isLoadingStrategies ? (
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
            ) : featuredStrategies.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
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
                                String(strategy.annualReturn).startsWith('-')
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
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400">
                  전략을 불러오는데 실패했습니다
                </CardContent>
              </Card>
            )}
          </div>

          {/* 투자위험 고지 */}
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              <span className="text-yellow-500/80 font-medium">투자 유의사항</span> · 본 서비스에서
              제공하는 모든 정보는 투자 참고 자료이며, 투자 자문이나 매매 권유가 아닙니다. AI 분석
              결과는 과거 기술적 지표를 기반으로 하며 미래 수익을 보장하지 않습니다. 투자에 대한
              최종 결정과 그에 따른 손익은 투자자 본인에게 있습니다.
            </p>
          </div>

          {/* CTA 섹션 */}
          <Card className="bg-gradient-to-r from-emerald-600 to-cyan-600 border-0">
            <CardContent className="text-center py-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                지금 바로 퀀트 투자를 시작하세요
              </h2>
              <p className="text-xl mb-8 text-emerald-100">
                무료 체험으로 AI 기반 투자 분석을 경험해보세요.
              </p>
              <Link href="/auth">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-slate-100">
                  무료 회원가입
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>

        {/* 푸터 */}
        <Footer />
      </div>
    </>
  );
}
