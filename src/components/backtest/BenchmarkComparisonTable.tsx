'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BacktestEquityPoint } from '@/types/backtest';

interface BenchmarkComparisonTableProps {
  equityCurve: BacktestEquityPoint[];
  benchmarks: string[];
  strategyCagr: number | null;
  strategyTotalReturn: number | null;
}

// ticker → 표시명 매핑
const BENCHMARK_LABELS: Record<string, string> = {
  '^KS11': 'KOSPI',
  '^KQ11': 'KOSDAQ',
  SPY: 'S&P 500',
  QQQ: 'NASDAQ 100',
  DIA: 'Dow Jones',
  IWM: 'Russell 2000',
  '^N225': '닛케이 225',
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
};

function getBenchmarkLabel(ticker: string): string {
  return BENCHMARK_LABELS[ticker] ?? ticker;
}

// 일일 수익률 시계열 계산
function calcDailyReturns(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  return returns;
}

// 피어슨 상관계수
function calcPearsonCorrelation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;

  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;

  let cov = 0,
    varA = 0,
    varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  const denom = Math.sqrt(varA * varB);
  if (denom === 0) return null;
  return cov / denom;
}

// 총 수익률 (%)
function calcTotalReturn(values: number[]): number | null {
  if (values.length < 2 || values[0] === 0) return null;
  return ((values[values.length - 1] - values[0]) / values[0]) * 100;
}

// CAGR (%)
function calcCagr(values: number[], firstDate: string, lastDate: string): number | null {
  if (values.length < 2 || values[0] === 0) return null;
  const years =
    (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years <= 0) return null;
  return (Math.pow(values[values.length - 1] / values[0], 1 / years) - 1) * 100;
}

// 상관계수 → 연동도 해석
function correlationInfo(r: number | null): { text: string; colorClass: string } {
  if (r === null) return { text: '계산불가', colorClass: 'text-slate-500' };
  const abs = Math.abs(r);
  if (abs >= 0.8) return { text: '매우 높은 연동', colorClass: 'text-orange-400' };
  if (abs >= 0.6) return { text: '높은 연동', colorClass: 'text-yellow-400' };
  if (abs >= 0.4) return { text: '중간 연동', colorClass: 'text-cyan-400' };
  if (abs >= 0.2) return { text: '낮은 연동', colorClass: 'text-emerald-400' };
  return { text: '독립적', colorClass: 'text-emerald-400' };
}

export default function BenchmarkComparisonTable({
  equityCurve,
  benchmarks,
  strategyCagr,
  strategyTotalReturn,
}: BenchmarkComparisonTableProps) {
  const rows = useMemo(() => {
    if (!equityCurve || equityCurve.length < 2 || !benchmarks || benchmarks.length === 0) {
      return [];
    }

    const strategyValues = equityCurve.map((p) => p.value);
    const strategyDailyReturns = calcDailyReturns(strategyValues);
    const firstDate = equityCurve[0].date;
    const lastDate = equityCurve[equityCurve.length - 1].date;

    return benchmarks.map((ticker) => {
      // 다중 벤치마크 맵 우선, 단일 벤치마크 fallback
      const bmValues = equityCurve
        .map((p) => {
          if (p.benchmarks && p.benchmarks[ticker] != null) return Number(p.benchmarks[ticker]);
          if (ticker === benchmarks[0] && p.benchmark != null) return Number(p.benchmark);
          return null;
        })
        .filter((v): v is number => v !== null);

      if (bmValues.length < 2) {
        return {
          ticker,
          label: getBenchmarkLabel(ticker),
          bmTotalReturn: null,
          bmCagr: null,
          excessReturn: null,
          excessCagr: null,
          correlation: null,
        };
      }

      const bmTotalReturn = calcTotalReturn(bmValues);
      const bmCagr = calcCagr(bmValues, firstDate, lastDate);
      const excessReturn =
        strategyTotalReturn != null && bmTotalReturn != null
          ? strategyTotalReturn - bmTotalReturn
          : null;
      const excessCagr = strategyCagr != null && bmCagr != null ? strategyCagr - bmCagr : null;
      const bmDailyReturns = calcDailyReturns(bmValues);
      const correlation = calcPearsonCorrelation(strategyDailyReturns, bmDailyReturns);

      return {
        ticker,
        label: getBenchmarkLabel(ticker),
        bmTotalReturn,
        bmCagr,
        excessReturn,
        excessCagr,
        correlation,
      };
    });
  }, [equityCurve, benchmarks, strategyCagr, strategyTotalReturn]);

  if (rows.length === 0) return null;

  const fmtPct = (v: number | null) => {
    if (v === null) return '—';
    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  };

  const fmtCorr = (v: number | null) => {
    if (v === null) return '—';
    return v.toFixed(2);
  };

  const excessColor = (v: number | null) => {
    if (v === null) return 'text-slate-500';
    return v >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base">벤치마크 비교 분석</CardTitle>
        <p className="text-xs text-slate-400">전략과 각 벤치마크의 성과 비교 및 상관관계</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 pr-4 text-slate-400 font-medium">벤치마크</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">수익률</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">CAGR</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium whitespace-nowrap">
                  초과수익
                </th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium whitespace-nowrap">
                  초과 CAGR
                </th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">상관계수</th>
                <th className="text-right py-2 pl-3 text-slate-400 font-medium hidden sm:table-cell">
                  연동도
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(
                ({
                  ticker,
                  label,
                  bmTotalReturn,
                  bmCagr,
                  excessReturn,
                  excessCagr,
                  correlation,
                }) => {
                  const corrInfo = correlationInfo(correlation);
                  return (
                    <tr
                      key={ticker}
                      className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-white">{label}</div>
                        <div className="text-xs text-slate-500">{ticker}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {fmtPct(bmTotalReturn)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {fmtPct(bmCagr)}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono ${excessColor(excessReturn)}`}>
                        {excessReturn !== null ? (
                          <>
                            {fmtPct(excessReturn)}
                            <span className="ml-0.5 text-xs">{excessReturn >= 0 ? '↑' : '↓'}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono ${excessColor(excessCagr)}`}>
                        {excessCagr !== null ? (
                          <>
                            {fmtPct(excessCagr)}
                            <span className="ml-0.5 text-xs">{excessCagr >= 0 ? '↑' : '↓'}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {fmtCorr(correlation)}
                      </td>
                      <td className="py-3 pl-3 text-right hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs border-slate-600 bg-transparent ${corrInfo.colorClass}`}
                        >
                          {corrInfo.text}
                        </Badge>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          초과수익 = 전략 수익률 − 벤치마크 수익률 &nbsp;|&nbsp; 상관계수: ±1에 가까울수록 동조, 0에
          가까울수록 독립
        </p>
      </CardContent>
    </Card>
  );
}
