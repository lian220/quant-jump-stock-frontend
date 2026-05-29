'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StrategyEquityCurveChart } from '@/components/strategies';
import { getRuleTypeLabel, getRuleTypeColor } from '@/lib/strategy-helpers';
import type { StrategyDetail, BenchmarkSeries } from '@/types/strategy';

interface Props {
  strategy: StrategyDetail;
  benchmarks: BenchmarkSeries[];
}

export function StrategyAnalysisTabs({ strategy, benchmarks }: Props) {
  return (
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
            <CardDescription className="text-slate-400">연도별 월간 수익률 히트맵</CardDescription>
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
  );
}
