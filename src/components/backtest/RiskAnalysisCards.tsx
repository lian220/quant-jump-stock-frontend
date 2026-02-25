'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BacktestMetrics } from '@/types/backtest';

interface RiskAnalysisCardsProps {
  metrics: BacktestMetrics;
}

export default function RiskAnalysisCards({ metrics }: RiskAnalysisCardsProps) {
  const fmt = (v: number | null | undefined, digits = 2) => (v != null ? v.toFixed(digits) : '-');

  const hasRiskData =
    metrics.profitFactor != null ||
    metrics.kellyPercentage != null ||
    metrics.totalCommission != null ||
    metrics.stopLossCount != null;

  if (!hasRiskData) return null;

  // 청산 사유 분포 데이터
  const exitReasons = [
    { label: '손절', count: metrics.stopLossCount ?? 0, color: 'bg-red-500' },
    { label: '익절', count: metrics.takeProfitCount ?? 0, color: 'bg-emerald-500' },
    { label: '트레일링', count: metrics.trailingStopCount ?? 0, color: 'bg-cyan-500' },
  ];
  const totalExitCount = exitReasons.reduce((sum, r) => sum + r.count, 0);
  const signalCount = Math.max((metrics.totalTrades ?? 0) - totalExitCount, 0);

  // 거래 비용 합계
  const totalCosts =
    (metrics.totalCommission ?? 0) + (metrics.totalSlippage ?? 0) + (metrics.totalTax ?? 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">위험 분석</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 위험 지표 카드 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">위험 지표</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">켈리 비율</span>
              <span className="text-sm font-mono text-cyan-400">
                {metrics.kellyPercentage != null ? `${fmt(metrics.kellyPercentage)}%` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">손익비 (R/R)</span>
              <span
                className={`text-sm font-mono ${(metrics.riskRewardRatio ?? 0) >= 1 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {fmt(metrics.riskRewardRatio)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Calmar Ratio</span>
              <span className="text-sm font-mono text-purple-400">{fmt(metrics.calmarRatio)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">최고 수익 거래</span>
              <span className="text-sm font-mono text-emerald-400">
                {metrics.bestTrade != null ? `+${fmt(metrics.bestTrade)}%` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">최대 손실 거래</span>
              <span className="text-sm font-mono text-red-400">
                {metrics.worstTrade != null ? `${fmt(metrics.worstTrade)}%` : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 거래 비용 카드 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">거래 비용 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">수수료 합계</span>
              <span className="text-sm font-mono text-yellow-400">
                {metrics.totalCommission != null
                  ? `${metrics.totalCommission.toLocaleString()}원`
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">세금 합계</span>
              <span className="text-sm font-mono text-yellow-400">
                {metrics.totalTax != null ? `${metrics.totalTax.toLocaleString()}원` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">슬리피지 합계</span>
              <span className="text-sm font-mono text-yellow-400">
                {metrics.totalSlippage != null
                  ? `${metrics.totalSlippage.toLocaleString()}원`
                  : '-'}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-200">총 비용</span>
              <span className="text-sm font-mono font-bold text-orange-400">
                {totalCosts > 0 ? `${totalCosts.toLocaleString()}원` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">비용 차감 순이익</span>
              <span
                className={`text-sm font-mono ${(metrics.netProfitAfterCosts ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {metrics.netProfitAfterCosts != null
                  ? `${metrics.netProfitAfterCosts.toLocaleString()}원`
                  : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 청산 사유 & 연속 통계 카드 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">청산 사유 & 연속 통계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 청산 사유 바 */}
            {totalExitCount > 0 && (
              <div className="space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-700">
                  {signalCount > 0 && (
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(signalCount / (metrics.totalTrades ?? 1)) * 100}%`,
                      }}
                    />
                  )}
                  {exitReasons.map(
                    (r) =>
                      r.count > 0 && (
                        <div
                          key={r.label}
                          className={r.color}
                          style={{
                            width: `${(r.count / (metrics.totalTrades ?? 1)) * 100}%`,
                          }}
                        />
                      ),
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {signalCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-400">신호 {signalCount}</span>
                    </span>
                  )}
                  {exitReasons.map(
                    (r) =>
                      r.count > 0 && (
                        <span key={r.label} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${r.color}`} />
                          <span className="text-slate-400">
                            {r.label} {r.count}
                          </span>
                        </span>
                      ),
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">최대 연속 승리</span>
                <span className="text-sm font-mono text-emerald-400">
                  {metrics.maxConsecutiveWins != null ? `${metrics.maxConsecutiveWins}회` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">최대 연속 패배</span>
                <span className="text-sm font-mono text-red-400">
                  {metrics.maxConsecutiveLosses != null ? `${metrics.maxConsecutiveLosses}회` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">평균 보유 기간</span>
                <span className="text-sm font-mono text-slate-200">
                  {metrics.avgHoldingPeriod != null ? `${fmt(metrics.avgHoldingPeriod, 1)}일` : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
