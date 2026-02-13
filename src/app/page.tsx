'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';
import { getStrategies } from '@/lib/api/strategies';
import { getCategoryLabel } from '@/lib/strategy-helpers';
import {
  getBuySignals,
  classifyByTier,
  getScoreGrade,
  type BuySignal,
} from '@/lib/api/predictions';
import { Footer } from '@/components/layout/Footer';
import type { Strategy } from '@/types/strategy';

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

  // 추천 전략 가져오기 (인기순 상위 3개)
  useEffect(() => {
    const fetchFeaturedStrategies = async () => {
      try {
        const response = await getStrategies({
          sortBy: 'subscribers',
          page: 0,
          size: 3,
        });
        setFeaturedStrategies(response.strategies);
      } catch (error) {
        console.error('Failed to fetch featured strategies:', error);
      } finally {
        setIsLoadingStrategies(false);
      }
    };

    fetchFeaturedStrategies();
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

  const features = [
    {
      title: '📊 실시간 시세',
      description: '국내외 주식 실시간 시세 및 차트 제공',
      status: 'completed',
    },
    {
      title: '🤖 AI 데이터 분석',
      description: '머신러닝 기반 종목 분석 및 투자 참고 정보',
      status: 'completed',
    },
    {
      title: '📈 백테스팅',
      description: '과거 데이터 기반 전략 검증 시스템',
      status: 'completed',
    },
    {
      title: '🔔 알림 시스템',
      description: '맞춤형 분석 정보 및 포트폴리오 알림',
      status: 'completed',
    },
  ];

  const stats = [
    { label: '분석 종목', value: '2,500+' },
    { label: '일평균 분석', value: '150+' },
    { label: '백테스트 정확도', value: '78%' },
    { label: '활성 사용자', value: '5,000+' },
  ];

  // 백테스트 결과 샘플
  const backtestResults = [
    {
      strategy: '모멘텀 전략',
      period: '2020-2024',
      totalReturn: '+156.3%',
      annualReturn: '+26.2%',
      maxDrawdown: '-18.5%',
      winRate: '62%',
      sharpeRatio: '1.85',
    },
    {
      strategy: '밸류 투자',
      period: '2020-2024',
      totalReturn: '+98.7%',
      annualReturn: '+18.7%',
      maxDrawdown: '-12.3%',
      winRate: '58%',
      sharpeRatio: '1.42',
    },
    {
      strategy: '듀얼 모멘텀',
      period: '2020-2024',
      totalReturn: '+187.4%',
      annualReturn: '+30.1%',
      maxDrawdown: '-15.8%',
      winRate: '65%',
      sharpeRatio: '2.12',
    },
  ];

  // 로그인 필요 기능
  const premiumFeatures = [
    { icon: '📊', title: '실시간 시세', description: '전 종목 실시간 호가 및 체결 정보' },
    { icon: '🎯', title: '맞춤 AI 분석', description: '관심 종목 상세 분석 리포트' },
    { icon: '🔔', title: '분석 알림', description: '실시간 분석 정보 푸시 알림' },
    { icon: '📁', title: '포트폴리오 관리', description: '보유 종목 수익률 추적 및 분석' },
    { icon: '⚙️', title: '커스텀 백테스트', description: '나만의 전략 시뮬레이션' },
    { icon: '📈', title: '상세 차트', description: '고급 기술적 지표 및 패턴 분석' },
  ];

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 히어로 섹션 */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              AI 기반 퀀트 투자 플랫폼
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              데이터로{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                스마트하게
              </span>
              <br />
              투자하세요
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
              AI와 빅데이터 분석으로 최적의 매매 타이밍을 포착하세요.
              <br />
              감정이 아닌 데이터 기반의 체계적인 투자를 경험해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/strategies">
                <Button size="lg" className="min-w-[200px] bg-emerald-600 hover:bg-emerald-700">
                  전략 둘러보기
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[200px] border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  무료로 시작하기
                </Button>
              </Link>
            </div>
          </div>

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
                            <p className="text-emerald-400 font-semibold">
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

          {/* AI 종목 분석 (Tier 시스템) - 핵심 콘텐츠 */}
          <div className="mb-16">
            {isLoadingRecommendations ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                <p className="text-slate-400 mt-4">AI 분석 데이터 로딩 중...</p>
              </div>
            ) : (
              <>
                {/* Tier 1: 강한 신호 (추천) */}
                {tiers.strong.length > 0 ? (
                  <div className="mb-12">
                    <h2 className="text-3xl font-bold text-center text-white mb-2">
                      🔥 AI 주목 종목
                    </h2>
                    <p className="text-center text-slate-400 mb-2">강한 관심 신호가 감지된 종목</p>
                    <p className="text-center mb-8">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        BETA · 기술적 지표 기반
                      </Badge>
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                      {tiers.strong.slice(0, 3).map((stock) => {
                        const grade = getScoreGrade(stock.compositeScore);
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

            <div className="text-center mt-8">
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
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-emerald-400">{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 기능 섹션 */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              Alpha Foundry의 핵심 기능
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        {feature.status === 'completed' ? '제공중' : '준비중'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 분석 도구 */}
          <Card className="mb-16 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white">투자 분석 도구</CardTitle>
              <CardDescription className="text-center text-slate-400">
                전문 트레이더를 위한 고급 분석 기능
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-emerald-600">
                    기술적 분석
                  </TabsTrigger>
                  <TabsTrigger value="quant" className="data-[state=active]:bg-emerald-600">
                    퀀트 전략
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-emerald-600">
                    AI 예측
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      '이동평균선',
                      'RSI/MACD',
                      '볼린저밴드',
                      '거래량 분석',
                      '추세선',
                      '피보나치',
                    ].map((tech) => (
                      <div
                        key={tech}
                        className="bg-slate-700/50 p-4 rounded-lg text-center border border-slate-600"
                      >
                        <p className="font-semibold text-slate-200">{tech}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="quant" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      '모멘텀 전략',
                      '밸류 투자',
                      '듀얼 모멘텀',
                      '평균회귀',
                      '팩터 투자',
                      '리밸런싱',
                    ].map((tech) => (
                      <div
                        key={tech}
                        className="bg-slate-700/50 p-4 rounded-lg text-center border border-slate-600"
                      >
                        <p className="font-semibold text-slate-200">{tech}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['LSTM 예측', '감성 분석', '패턴 인식', '이상 탐지', '포트폴리오 최적화'].map(
                      (tech) => (
                        <div
                          key={tech}
                          className="bg-slate-700/50 p-4 rounded-lg text-center border border-slate-600"
                        >
                          <p className="font-semibold text-slate-200">{tech}</p>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 백테스트 결과 */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-white mb-4">📈 백테스트 성과</h2>
            <p className="text-center text-slate-400 mb-8">2020-2024년 전략별 시뮬레이션 결과</p>
            <div className="grid md:grid-cols-3 gap-6">
              {backtestResults.map((result) => (
                <Card
                  key={result.strategy}
                  className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-white text-center">
                      {result.strategy}
                    </CardTitle>
                    <p className="text-xs text-slate-500 text-center">{result.period}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-emerald-400">{result.totalReturn}</p>
                      <p className="text-sm text-slate-400">누적 수익률</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-700/30 p-2 rounded">
                        <p className="text-slate-400 text-xs">연환산 수익률</p>
                        <p className="text-white font-semibold">{result.annualReturn}</p>
                      </div>
                      <div className="bg-slate-700/30 p-2 rounded">
                        <p className="text-slate-400 text-xs">최대 낙폭</p>
                        <p className="text-red-400 font-semibold">{result.maxDrawdown}</p>
                      </div>
                      <div className="bg-slate-700/30 p-2 rounded">
                        <p className="text-slate-400 text-xs">승률</p>
                        <p className="text-white font-semibold">{result.winRate}</p>
                      </div>
                      <div className="bg-slate-700/30 p-2 rounded">
                        <p className="text-slate-400 text-xs">샤프 비율</p>
                        <p className="text-cyan-400 font-semibold">{result.sharpeRatio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 프리미엄 기능 (로그인 필요) */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-white mb-4">🔐 프리미엄 기능</h2>
            <p className="text-center text-slate-400 mb-8">
              로그인하면 더 많은 기능을 이용할 수 있습니다
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-slate-800/30 border-slate-700/50 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-400">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/auth">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  무료 회원가입하고 이용하기
                </Button>
              </Link>
            </div>
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
