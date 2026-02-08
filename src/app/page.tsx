'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageSEO } from '@/components/seo';
import { pageDefaults } from '@/lib/seo/config';
import { getStrategies } from '@/lib/api/strategies';
import { getCategoryLabel } from '@/lib/strategy-helpers';
import type { Strategy } from '@/types/strategy';
import { Menu, X } from 'lucide-react';

export default function Home() {
  const { user, signOut } = useAuth();
  const [featuredStrategies, setFeaturedStrategies] = useState<Strategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const features = [
    {
      title: '📊 실시간 시세',
      description: '국내외 주식 실시간 시세 및 차트 제공',
      status: 'completed',
    },
    {
      title: '🤖 AI 퀀트 분석',
      description: '머신러닝 기반 종목 분석 및 투자 신호',
      status: 'completed',
    },
    {
      title: '📈 백테스팅',
      description: '과거 데이터 기반 전략 검증 시스템',
      status: 'completed',
    },
    {
      title: '🔔 알림 시스템',
      description: '맞춤형 매매 신호 및 포트폴리오 알림',
      status: 'completed',
    },
  ];

  const stats = [
    { label: '분석 종목', value: '2,500+' },
    { label: '일평균 신호', value: '150+' },
    { label: '백테스트 정확도', value: '78%' },
    { label: '활성 사용자', value: '5,000+' },
  ];

  // 인기 종목 랭킹 (샘플 데이터)
  const popularStocks = [
    { rank: 1, name: '삼성전자', code: '005930', price: '71,500', change: '+2.3%', signal: '매수' },
    {
      rank: 2,
      name: 'SK하이닉스',
      code: '000660',
      price: '178,000',
      change: '+1.8%',
      signal: '매수',
    },
    {
      rank: 3,
      name: 'LG에너지솔루션',
      code: '373220',
      price: '385,000',
      change: '-0.5%',
      signal: '관망',
    },
    {
      rank: 4,
      name: '삼성바이오로직스',
      code: '207940',
      price: '782,000',
      change: '+1.2%',
      signal: '매수',
    },
    { rank: 5, name: '현대차', code: '005380', price: '235,500', change: '+0.8%', signal: '관망' },
    { rank: 6, name: 'NAVER', code: '035420', price: '198,500', change: '+3.1%', signal: '매수' },
    { rank: 7, name: '카카오', code: '035720', price: '45,800', change: '-1.2%', signal: '관망' },
    {
      rank: 8,
      name: 'POSCO홀딩스',
      code: '005490',
      price: '298,000',
      change: '+0.5%',
      signal: '매수',
    },
    { rank: 9, name: '기아', code: '000270', price: '95,200', change: '+1.5%', signal: '매수' },
    {
      rank: 10,
      name: '셀트리온',
      code: '068270',
      price: '178,500',
      change: '+2.1%',
      signal: '매수',
    },
  ];

  // AI 분석 샘플 데이터
  const aiAnalysisSamples = [
    {
      stock: '삼성전자',
      code: '005930',
      score: 85,
      recommendation: '매수',
      reasons: ['실적 개선 기대', '반도체 업황 회복', '외국인 순매수 지속'],
      targetPrice: '82,000',
      currentPrice: '71,500',
      upside: '+14.7%',
    },
    {
      stock: 'NAVER',
      code: '035420',
      score: 78,
      recommendation: '매수',
      reasons: ['AI 서비스 성장', '광고 매출 회복', '일본 라인 시너지'],
      targetPrice: '230,000',
      currentPrice: '198,500',
      upside: '+15.9%',
    },
    {
      stock: 'SK하이닉스',
      code: '000660',
      score: 82,
      recommendation: '매수',
      reasons: ['HBM 수요 급증', 'AI 서버 수혜', 'DRAM 가격 상승'],
      targetPrice: '210,000',
      currentPrice: '178,000',
      upside: '+18.0%',
    },
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
    { icon: '🔔', title: '매매 알림', description: '실시간 매수/매도 신호 푸시 알림' },
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
        {/* 헤더 - Sticky */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src="/main_logo.png"
                        alt="Alpha Foundry Logo"
                        width={56}
                        height={56}
                        className="object-cover"
                        style={{ objectPosition: '50% 30%', transform: 'scale(1.2)' }}
                      />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer">
                      Alpha Foundry
                    </h1>
                  </Link>
                  <Badge
                    variant="secondary"
                    className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  >
                    BETA
                  </Badge>
                </div>
                {/* 데스크톱 네비게이션 메뉴 */}
                <nav className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/strategies"
                    className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
                  >
                    전략 마켓플레이스
                  </Link>
                  <Link
                    href="/stocks"
                    className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
                  >
                    종목 탐색
                  </Link>
                  <Link
                    href="#features"
                    className="text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    기능
                  </Link>
                  <Link
                    href="#pricing"
                    className="text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    요금제
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-3">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      로그아웃
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* 데스크톱 버튼 */}
                    <div className="hidden md:flex gap-3">
                      <Link href="/auth">
                        <Button
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          로그인
                        </Button>
                      </Link>
                      <Link href="/auth">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">무료 시작</Button>
                      </Link>
                    </div>
                    {/* 모바일 버튼 */}
                    <Link href="/auth" className="md:hidden">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        시작하기
                      </Button>
                    </Link>
                  </>
                )}
                {/* 모바일 햄버거 메뉴 버튼 */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
                  aria-label="메뉴"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* 모바일 메뉴 드롭다운 */}
            {mobileMenuOpen && (
              <nav className="md:hidden py-4 border-t border-slate-700">
                <div className="flex flex-col space-y-3">
                  <Link
                    href="/strategies"
                    className="text-slate-300 hover:text-emerald-400 transition-colors font-medium py-2 px-4 hover:bg-slate-800/50 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    전략 마켓플레이스
                  </Link>
                  <Link
                    href="/stocks"
                    className="text-slate-300 hover:text-emerald-400 transition-colors font-medium py-2 px-4 hover:bg-slate-800/50 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    종목 탐색
                  </Link>
                  <Link
                    href="#features"
                    className="text-slate-300 hover:text-emerald-400 transition-colors py-2 px-4 hover:bg-slate-800/50 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    기능
                  </Link>
                  <Link
                    href="#pricing"
                    className="text-slate-300 hover:text-emerald-400 transition-colors py-2 px-4 hover:bg-slate-800/50 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    요금제
                  </Link>
                  {!user && (
                    <Link
                      href="/auth"
                      className="text-slate-300 hover:text-emerald-400 transition-colors font-medium py-2 px-4 hover:bg-slate-800/50 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      로그인
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </div>
        </header>

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

          {/* 인기 종목 랭킹 */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-white mb-4">🔥 인기 종목 TOP 10</h2>
            <p className="text-center text-slate-400 mb-8">실시간 투자자 관심도 기반 인기 종목</p>

            {/* 데스크톱 테이블 뷰 */}
            <Card className="hidden md:block bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        순위
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                        종목명
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                        현재가
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                        등락률
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">
                        AI 신호
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {popularStocks.map((stock) => (
                      <tr key={stock.rank} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                              stock.rank <= 3
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-600 text-slate-300'
                            }`}
                          >
                            {stock.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-white">{stock.name}</p>
                            <p className="text-xs text-slate-500">{stock.code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white">
                          ₩{stock.price}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono ${
                            stock.change.startsWith('+')
                              ? 'text-red-400'
                              : stock.change.startsWith('-')
                                ? 'text-blue-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {stock.change}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            className={
                              stock.signal === '매수'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-slate-600/50 text-slate-300 border-slate-500/30'
                            }
                          >
                            {stock.signal}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden space-y-3">
              {popularStocks.map((stock) => (
                <Card
                  key={stock.rank}
                  className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            stock.rank <= 3
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-600 text-slate-300'
                          }`}
                        >
                          {stock.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-white text-base">{stock.name}</p>
                          <p className="text-xs text-slate-500">{stock.code}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          stock.signal === '매수'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-slate-600/50 text-slate-300 border-slate-500/30'
                        }
                      >
                        {stock.signal}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">현재가</p>
                        <p className="font-mono text-white font-medium">₩{stock.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs mb-1">등락률</p>
                        <p
                          className={`font-mono font-medium ${
                            stock.change.startsWith('+')
                              ? 'text-red-400'
                              : stock.change.startsWith('-')
                                ? 'text-blue-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {stock.change}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* AI 분석 예시 */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-white mb-4">🤖 AI 종목 분석 예시</h2>
            <p className="text-center text-slate-400 mb-8">머신러닝 기반 종목 분석 리포트 샘플</p>
            <div className="grid md:grid-cols-3 gap-6">
              {aiAnalysisSamples.map((analysis) => (
                <Card
                  key={analysis.code}
                  className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-white">{analysis.stock}</CardTitle>
                        <p className="text-xs text-slate-500">{analysis.code}</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            analysis.score >= 80
                              ? 'text-emerald-400'
                              : analysis.score >= 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {analysis.score}점
                        </div>
                        <Badge
                          className={
                            analysis.recommendation === '매수'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-slate-600/50 text-slate-300'
                          }
                        >
                          {analysis.recommendation}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">현재가</span>
                        <span className="text-white font-mono">₩{analysis.currentPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">목표가</span>
                        <span className="text-emerald-400 font-mono">₩{analysis.targetPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">상승여력</span>
                        <span className="text-emerald-400 font-bold">{analysis.upside}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-3 mt-3">
                        <p className="text-xs text-slate-500 mb-2">AI 분석 근거</p>
                        <ul className="space-y-1">
                          {analysis.reasons.map((reason, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-center">
                              <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

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
        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-slate-500">
              <p className="mb-2">Alpha Foundry - AI 기반 스마트 투자 플랫폼</p>
              <p className="text-sm">© 2025 Alpha Foundry. All rights reserved.</p>
              <p className="text-xs mt-2 text-slate-600">
                투자에 대한 최종 결정은 본인에게 있으며, 투자 손실에 대한 책임은 투자자 본인에게
                있습니다.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
