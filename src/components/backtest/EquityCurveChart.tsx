'use client';

import React, { useMemo } from 'react';
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
      // 단일 벤치마크: 기존 benchmark 필드 사용 (하위호환)
      row['benchmark'] = point.benchmark;
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

  const chartData = useMemo(
    () => transformChartData(equityCurve, benchmarkTickers),
    [equityCurve, benchmarkTickers],
  );

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
        <CardTitle className="text-white">수익 곡선</CardTitle>
        <CardDescription className="text-slate-400">{benchmarkDescription}</CardDescription>
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
              {!isMultiBenchmark ? (
                // 단일 벤치마크
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke={BENCHMARK_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray="5 5"
                />
              ) : (
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
              )}
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
