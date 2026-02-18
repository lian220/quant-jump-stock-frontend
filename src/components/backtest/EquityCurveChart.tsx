'use client';

import React, { useMemo, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { BacktestEquityPoint } from '@/types/backtest';
import { BENCHMARK_COLORS } from '@/constants/backtest';

interface EquityCurveChartProps {
  equityCurve: BacktestEquityPoint[];
  /** 사용된 벤치마크 목록 (SCRUM-337: 다중 벤치마크) */
  benchmarkLabels?: string[];
}

// 차트 데이터 변환: equity curve의 benchmarks 필드를 flat key로 펼침
function transformChartData(
  equityCurve: BacktestEquityPoint[],
  benchmarkTickers: string[],
): Record<string, unknown>[] {
  return equityCurve.map((point) => {
    const row: Record<string, unknown> = {
      date: point.date,
      value: point.value,
    };

    if (benchmarkTickers.length <= 1) {
      // 단일 벤치마크: 기존 benchmark 필드 우선, 없으면 benchmarks 맵에서 폴백
      row['benchmark'] = point.benchmark ?? point.benchmarks?.[benchmarkTickers[0]] ?? null;
    } else {
      // 다중 벤치마크: benchmarks 맵에서 추출
      for (const ticker of benchmarkTickers) {
        row[`bm_${ticker}`] = point.benchmarks?.[ticker] ?? null;
      }
    }

    return row;
  });
}

export default function EquityCurveChart({ equityCurve, benchmarkLabels }: EquityCurveChartProps) {
  // UX-06: 절대값/수익률(%) 토글
  const [showPercent, setShowPercent] = useState(false);

  // 벤치마크 티커 목록 결정
  const benchmarkTickers = useMemo(() => {
    if (benchmarkLabels && benchmarkLabels.length > 0) return benchmarkLabels;
    // fallback: equityCurve의 첫 포인트에서 benchmarks 키 추출
    const firstWithBm = equityCurve.find(
      (p) => p.benchmarks && Object.keys(p.benchmarks).length > 0,
    );
    if (firstWithBm?.benchmarks) return Object.keys(firstWithBm.benchmarks);
    // 단일 벤치마크 fallback
    if (equityCurve.some((p) => p.benchmark != null)) return ['SPY'];
    return [];
  }, [equityCurve, benchmarkLabels]);

  const isMultiBenchmark = benchmarkTickers.length > 1;

  const rawChartData = useMemo(
    () => transformChartData(equityCurve, benchmarkTickers),
    [equityCurve, benchmarkTickers],
  );

  // UX-06: 수익률(%) 모드 데이터 변환 (첫 유효값 기준 정규화)
  const chartData = useMemo(() => {
    if (!showPercent || rawChartData.length === 0) return rawChartData;
    const first = rawChartData[0];
    const baseValue = (first.value as number) || 1;

    // 첫 유효 벤치마크 값 찾기 (null/0 방지)
    const findBase = (key: string) => {
      for (const row of rawChartData) {
        const v = row[key] as number;
        if (v != null && v > 0) return v;
      }
      return null;
    };

    const baseBmSingle = !isMultiBenchmark ? findBase('benchmark') : null;
    const baseBmMulti: Record<string, number | null> = {};
    if (isMultiBenchmark) {
      for (const ticker of benchmarkTickers) {
        baseBmMulti[`bm_${ticker}`] = findBase(`bm_${ticker}`);
      }
    }

    return rawChartData.map((row) => {
      const normalized: Record<string, unknown> = { date: row.date };
      normalized.value =
        row.value != null ? (((row.value as number) - baseValue) / baseValue) * 100 : null;
      if (!isMultiBenchmark) {
        if (baseBmSingle != null) {
          normalized.benchmark =
            row.benchmark != null
              ? (((row.benchmark as number) - baseBmSingle) / baseBmSingle) * 100
              : null;
        } else {
          normalized.benchmark = null;
        }
      } else {
        for (const ticker of benchmarkTickers) {
          const key = `bm_${ticker}`;
          const base = baseBmMulti[key];
          normalized[key] =
            base != null && row[key] != null ? (((row[key] as number) - base) / base) * 100 : null;
        }
      }
      return normalized;
    });
  }, [rawChartData, showPercent, isMultiBenchmark, benchmarkTickers]);

  const benchmarkDescription =
    benchmarkTickers.length > 0
      ? `전략 vs ${benchmarkTickers.join(', ')} 누적 수익률 비교`
      : '전략 누적 수익률';

  if (!equityCurve || equityCurve.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">수익 곡선</CardTitle>
          <CardDescription className="text-slate-400">수익 곡선 데이터가 없습니다</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">수익 곡선</CardTitle>
            <CardDescription className="text-slate-400">{benchmarkDescription}</CardDescription>
          </div>
          {/* UX-06: 절대값/수익률 토글 */}
          <div className="flex gap-1 bg-slate-700/50 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setShowPercent(false)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                !showPercent ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              절대값
            </button>
            <button
              type="button"
              onClick={() => setShowPercent(true)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                showPercent ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              수익률(%)
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                tickFormatter={(value) => {
                  if (showPercent) return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
                  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
                  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
                  return value.toLocaleString();
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value, name) => {
                  if (value == null) return ['-', getLineName(name as string, benchmarkTickers)];
                  const numValue = typeof value === 'number' ? value : 0;
                  if (showPercent) {
                    return [
                      `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`,
                      getLineName(name as string, benchmarkTickers),
                    ];
                  }
                  return [
                    `${numValue.toLocaleString()}원`,
                    getLineName(name as string, benchmarkTickers),
                  ];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label as string);
                  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
                }}
              />
              <Legend formatter={(value) => getLineName(value, benchmarkTickers)} />
              {/* 전략 라인 */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {/* 벤치마크 라인 */}
              {!isMultiBenchmark && benchmarkTickers.length > 0 ? (
                // 단일 벤치마크 (데이터가 있을 때만 렌더)
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke={BENCHMARK_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray="5 5"
                />
              ) : isMultiBenchmark ? (
                // 다중 벤치마크
                benchmarkTickers.map((ticker, idx) => (
                  <Line
                    key={ticker}
                    type="monotone"
                    dataKey={`bm_${ticker}`}
                    stroke={BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    strokeDasharray="5 5"
                  />
                ))
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** 라인 dataKey를 사용자 표시용 이름으로 변환 */
function getLineName(dataKey: string, benchmarkTickers: string[]): string {
  if (dataKey === 'value') return '전략';
  if (dataKey === 'benchmark') {
    return `벤치마크(${benchmarkTickers[0] || 'SPY'})`;
  }
  // bm_SPY → SPY
  if (dataKey.startsWith('bm_')) {
    return dataKey.slice(3);
  }
  return dataKey;
}
