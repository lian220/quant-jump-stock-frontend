'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getStrategyById, generateMockStrategyDetail } from '@/lib/api/strategies';
import type { StrategyDetail } from '@/types/strategy';

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrategy = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getStrategyById(id);
        setStrategy(data);
      } catch (err) {
        console.error('Failed to fetch strategy:', err);
        // 백엔드 API가 없으면 mock 데이터 사용
        const mockData = generateMockStrategyDetail(id);
        setStrategy(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStrategy();
    }
  }, [id]);

  // 리스크 레벨 색상
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // 리스크 레벨 한글
  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low':
        return '낮음';
      case 'medium':
        return '중간';
      case 'high':
        return '높음';
      default:
        return level;
    }
  };

  // 카테고리 한글
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      momentum: '모멘텀',
      value: '밸류',
      growth: '성장주',
      dividend: '배당주',
      factor: '팩터',
    };
    return labels[category] || category;
  };

  // 룰 타입 한글
  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entry: '진입 조건',
      exit: '청산 조건',
      filter: '필터 조건',
      rebalance: '리밸런싱',
    };
    return labels[type] || type;
  };

  // 룰 타입 색상
  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'entry':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'exit':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'filter':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'rebalance':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

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
      {/* 헤더 */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                퀀트점프
              </h1>
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              >
                BETA
              </Badge>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/strategies">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  전략 목록
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-emerald-600 hover:bg-emerald-700">로그인</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 전략 헤더 */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{strategy.name}</h1>
                {strategy.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
                    프리미엄
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                  {getCategoryLabel(strategy.category)}
                </Badge>
                <Badge className={getRiskColor(strategy.riskLevel)}>
                  리스크: {getRiskLabel(strategy.riskLevel)}
                </Badge>
                <span className="text-slate-400 text-sm">백테스트: {strategy.backtestPeriod}</span>
              </div>
              <p className="text-slate-400 max-w-2xl">{strategy.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>⭐ {strategy.rating.toFixed(1)}</span>
                  <span>|</span>
                  <span>👥 {strategy.subscribers.toLocaleString()}명 구독</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 성과 지표 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-emerald-400">{strategy.totalReturn}</p>
              <p className="text-xs text-slate-400 mt-1">누적 수익률</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-cyan-400">{strategy.annualReturn}</p>
              <p className="text-xs text-slate-400 mt-1">연환산 수익률 (CAGR)</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-red-400">{strategy.maxDrawdown}</p>
              <p className="text-xs text-slate-400 mt-1">최대 낙폭 (MDD)</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-purple-400">{strategy.sharpeRatio}</p>
              <p className="text-xs text-slate-400 mt-1">샤프 비율</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-yellow-400">{strategy.winRate}</p>
              <p className="text-xs text-slate-400 mt-1">승률</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-white">
                {(strategy.minInvestment / 10000).toLocaleString()}만원
              </p>
              <p className="text-xs text-slate-400 mt-1">최소 투자금</p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              수익 곡선
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              전략 조건
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              월별 수익률
            </TabsTrigger>
          </TabsList>

          {/* 수익 곡선 탭 */}
          <TabsContent value="performance">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">수익 곡선</CardTitle>
                <CardDescription className="text-slate-400">
                  전략 vs 벤치마크(KOSPI) 누적 수익률 비교
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={strategy.equityCurve}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
                        }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 10000).toFixed(1)}만`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value, name) => {
                          const numValue = typeof value === 'number' ? value : 0;
                          return [
                            `${numValue.toLocaleString()}원`,
                            name === 'value' ? '전략' : '벤치마크',
                          ];
                        }}
                        labelFormatter={(label) => {
                          const date = new Date(label as string);
                          return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
                        }}
                      />
                      <Legend
                        formatter={(value) => (value === 'value' ? '전략' : '벤치마크(KOSPI)')}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="benchmark"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
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
                <div className="space-y-4">
                  {strategy.rules.map((rule, index) => (
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
                        const years = [...new Set(strategy.monthlyReturns.map((r) => r.year))].sort(
                          (a, b) => b - a,
                        );
                        return years.map((year) => {
                          const yearData = strategy.monthlyReturns.filter((r) => r.year === year);
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 구독 CTA 섹션 */}
        <Card className="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 border-emerald-500/30 mt-8">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  이 전략으로 투자를 시작하세요
                </h3>
                <p className="text-slate-300">
                  {strategy.isPremium
                    ? '프리미엄 구독으로 실시간 매매 신호를 받아보세요.'
                    : '무료로 이 전략의 매매 신호를 받아보세요.'}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                  <span>✓ 실시간 매매 알림</span>
                  <span>✓ 포트폴리오 연동</span>
                  <span>✓ 성과 리포트</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                {strategy.isPremium && <p className="text-slate-400 text-sm">월 29,900원</p>}
                <Button
                  size="lg"
                  className={`px-8 ${
                    strategy.isPremium
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {strategy.isPremium ? '프리미엄 구독하기' : '무료로 구독하기'}
                </Button>
                <p className="text-xs text-slate-500">
                  {strategy.subscribers.toLocaleString()}명이 이미 구독 중
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

      {/* 푸터 */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p className="mb-2">퀀트점프 - AI 기반 스마트 투자 플랫폼</p>
            <p className="text-sm">© 2025 QuantJump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
