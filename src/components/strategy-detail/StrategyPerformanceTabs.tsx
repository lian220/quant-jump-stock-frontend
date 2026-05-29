'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard, TermTooltip } from '@/components/strategies';
import type { StrategyDetail } from '@/types/strategy';

const BacktestHistoryList = dynamic(() => import('@/components/backtest/BacktestHistoryList'), {
  ssr: false,
});

interface Props {
  strategy: StrategyDetail;
  strategyId: string;
  isLoggedIn: boolean;
  authLoading: boolean;
}

export function StrategyPerformanceTabs({ strategy, strategyId, isLoggedIn, authLoading }: Props) {
  return (
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
                    {strategy.canonicalBacktest.startDate} ~ {strategy.canonicalBacktest.endDate} |
                    초기자본 {(strategy.canonicalBacktest.initialCapital / 10000).toLocaleString()}
                    만원
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
        {!authLoading && !isLoggedIn ? (
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
            <BacktestHistoryList strategyId={strategyId} />

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-medium">새로운 조건으로 테스트</h4>
                    <p className="text-slate-400 text-sm">
                      기간, 자본금, 유니버스를 직접 설정하세요
                    </p>
                  </div>
                  <Link href={`/strategies/${strategyId}/backtest`}>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">새 시뮬레이션 실행</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
