'use client';

import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TermTooltip } from './TermTooltip';
import type { EquityCurveData, BenchmarkSeries } from '@/types/strategy';

interface EquityCurveChartProps {
  data: EquityCurveData[];
  benchmarks?: BenchmarkSeries[];
}

// 벤치마크별 색상 (최대 5개)
const BENCHMARK_COLORS = ['#94a3b8', '#f59e0b', '#a78bfa', '#f87171', '#38bdf8'];

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  color: string;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomChartTooltip({
  active,
  payload,
  label,
  initialValue,
  benchmarks,
}: CustomTooltipProps & { initialValue: number; benchmarks?: BenchmarkSeries[] }) {
  if (!active || !payload?.length) return null;

  const date = new Date(label as string);
  const dateStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  const strategyEntry = payload.find((p) => p.dataKey === 'value');
  const strategyValue = strategyEntry?.value ?? 0;
  const strategyReturn =
    initialValue > 0 ? ((strategyValue - initialValue) / initialValue) * 100 : 0;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{dateStr}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-emerald-400">전략</span>
          <div className="text-right">
            <span className="text-sm font-medium text-white">
              {Math.round(strategyValue).toLocaleString()}원
            </span>
            <span
              className={`text-xs ml-2 ${strategyReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              ({strategyReturn >= 0 ? '+' : ''}
              {strategyReturn.toFixed(1)}%)
            </span>
          </div>
        </div>
        {benchmarks?.map((bm, idx) => {
          const bmEntry = payload.find((p) => p.dataKey === `bm_${bm.ticker}`);
          const bmValue = bmEntry?.value ?? 0;
          if (bmValue <= 0) return null;
          const bmReturn = initialValue > 0 ? ((bmValue - initialValue) / initialValue) * 100 : 0;
          const excessReturn = strategyReturn - bmReturn;
          return (
            <React.Fragment key={bm.ticker}>
              <div className="flex items-center justify-between gap-6">
                <span
                  className="text-xs"
                  style={{ color: BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length] }}
                >
                  {bm.displayName}
                </span>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-300">
                    {Math.round(bmValue).toLocaleString()}원
                  </span>
                  <span
                    className={`text-xs ml-2 ${bmReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    ({bmReturn >= 0 ? '+' : ''}
                    {bmReturn.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-1.5 flex items-center justify-between gap-6">
                <span className="text-xs text-cyan-400">초과수익 vs {bm.displayName}</span>
                <span
                  className={`text-xs font-medium ${excessReturn >= 0 ? 'text-cyan-400' : 'text-red-400'}`}
                >
                  {excessReturn >= 0 ? '+' : ''}
                  {excessReturn.toFixed(1)}%p
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function EquityCurveChart({ data, benchmarks }: EquityCurveChartProps) {
  const initialValue = data?.[0]?.value ?? 0;

  // equityCurve 없이 벤치마크만 있는 경우
  const benchmarkOnly = (!data || data.length === 0) && benchmarks && benchmarks.length > 0;

  // 벤치마크 데이터를 equityCurve 데이터와 merge
  const mergedData = React.useMemo(() => {
    if (benchmarkOnly && benchmarks) {
      // equityCurve 없이 벤치마크만 표시
      const dataMap = new Map<string, Record<string, number>>();
      for (const bm of benchmarks) {
        for (const pt of bm.points) {
          const existing = dataMap.get(pt.date) ?? {};
          existing[`bm_${bm.ticker}`] = pt.value;
          dataMap.set(pt.date, existing);
        }
      }
      return Array.from(dataMap.entries())
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    if (!data || data.length === 0) return [];

    // 기본 equityCurve를 date-keyed map으로
    const dataMap = new Map<string, Record<string, number>>();
    for (const point of data) {
      dataMap.set(point.date, { value: point.value });
    }

    // 각 벤치마크의 points를 merge
    if (benchmarks) {
      for (const bm of benchmarks) {
        for (const pt of bm.points) {
          const existing = dataMap.get(pt.date);
          if (existing) {
            existing[`bm_${bm.ticker}`] = pt.value;
          }
        }
      }
    }

    return Array.from(dataMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, benchmarks, benchmarkOnly]);

  // Y축 도메인 계산
  const allValues = mergedData.flatMap((d) =>
    Object.entries(d)
      .filter(([key]) => key !== 'date')
      .map(([, v]) => Number(v))
      .filter((v) => !isNaN(v) && v > 0),
  );
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0;
  const padding = (dataMax - dataMin) * 0.1 || dataMax * 0.05;
  const yMin = Math.max(0, Math.floor((dataMin - padding) / 100000) * 100000);
  const yMax = Math.ceil((dataMax + padding) / 100000) * 100000;

  // 벤치마크 이름 조합
  const benchmarkNames = benchmarks?.map((bm) => bm.displayName).join(', ') || '';
  const descriptionText = benchmarkOnly
    ? `${benchmarkNames} 최근 1년 수익률 (백테스트 실행 후 전략과 비교됩니다)`
    : benchmarkNames
      ? `전략 vs ${benchmarkNames} 누적 수익률 비교`
      : '전략 누적 수익률';

  if ((!data || data.length === 0) && !benchmarkOnly) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            <TermTooltip termKey="equityCurve">수익 곡선</TermTooltip>
          </CardTitle>
          <CardDescription className="text-slate-400">
            전략 vs <TermTooltip termKey="benchmark">벤치마크</TermTooltip> 누적 수익률 비교
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-2">수익 곡선 데이터가 아직 없습니다</p>
              <p className="text-slate-500 text-sm">백테스트 완료 후 차트가 표시됩니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">
          <TermTooltip termKey="equityCurve">수익 곡선</TermTooltip>
        </CardTitle>
        <CardDescription className="text-slate-400">{descriptionText}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="strategyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
                }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                domain={[yMin, yMax]}
              />
              <Tooltip
                content={<CustomChartTooltip initialValue={initialValue} benchmarks={benchmarks} />}
                cursor={{ stroke: '#475569', strokeDasharray: '3 3' }}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'value') return '전략';
                  const bm = benchmarks?.find((b) => `bm_${b.ticker}` === value);
                  return bm?.displayName || value;
                }}
              />
              {!benchmarkOnly && (
                <Area
                  type="monotone"
                  dataKey="value"
                  fill="url(#strategyGradient)"
                  stroke="none"
                  legendType="none"
                />
              )}
              {!benchmarkOnly && (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: '#34d399',
                    strokeWidth: 2,
                    fill: '#0f172a',
                  }}
                />
              )}
              {benchmarks?.map((bm, idx) => (
                <Line
                  key={bm.ticker}
                  type="monotone"
                  dataKey={`bm_${bm.ticker}`}
                  stroke={BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length],
                    strokeWidth: 2,
                    fill: '#0f172a',
                  }}
                  strokeDasharray="5 5"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
