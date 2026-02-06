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
import type { EquityCurveData } from '@/types/strategy';

interface EquityCurveChartProps {
  data: EquityCurveData[];
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  color: string;
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
}: CustomTooltipProps & { initialValue: number }) {
  if (!active || !payload?.length) return null;

  const date = new Date(label as string);
  const dateStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  const strategyEntry = payload.find((p) => p.dataKey === 'value');
  const benchmarkEntry = payload.find((p) => p.dataKey === 'benchmark');

  const strategyValue = strategyEntry?.value ?? 0;
  const benchmarkValue = benchmarkEntry?.value ?? 0;

  const strategyReturn =
    initialValue > 0 ? ((strategyValue - initialValue) / initialValue) * 100 : 0;
  const benchmarkReturn =
    benchmarkValue > 0 && initialValue > 0
      ? ((benchmarkValue - initialValue) / initialValue) * 100
      : 0;
  const excessReturn = strategyReturn - benchmarkReturn;

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
        {benchmarkValue > 0 && (
          <>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-slate-400">벤치마크</span>
              <div className="text-right">
                <span className="text-sm font-medium text-slate-300">
                  {Math.round(benchmarkValue).toLocaleString()}원
                </span>
                <span
                  className={`text-xs ml-2 ${benchmarkReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  ({benchmarkReturn >= 0 ? '+' : ''}
                  {benchmarkReturn.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-1.5 flex items-center justify-between gap-6">
              <span className="text-xs text-cyan-400">초과수익</span>
              <span
                className={`text-xs font-medium ${excessReturn >= 0 ? 'text-cyan-400' : 'text-red-400'}`}
              >
                {excessReturn >= 0 ? '+' : ''}
                {excessReturn.toFixed(1)}%p
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  const initialValue = data?.[0]?.value ?? 0;

  // Y축 도메인 계산 (데이터 범위에 맞게 5% 패딩)
  const allValues = (data || []).flatMap((d) =>
    [d.value, d.benchmark].filter((v): v is number => v != null && v > 0),
  );
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0;
  const padding = (dataMax - dataMin) * 0.1 || dataMax * 0.05;
  const yMin = Math.max(0, Math.floor((dataMin - padding) / 100000) * 100000);
  const yMax = Math.ceil((dataMax + padding) / 100000) * 100000;

  if (!data || data.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            <TermTooltip termKey="equityCurve">수익 곡선</TermTooltip>
          </CardTitle>
          <CardDescription className="text-slate-400">
            전략 vs <TermTooltip termKey="benchmark">벤치마크(KOSPI)</TermTooltip> 누적 수익률 비교
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
        <CardDescription className="text-slate-400">
          전략 vs <TermTooltip termKey="benchmark">벤치마크(KOSPI)</TermTooltip> 누적 수익률 비교
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  const date = new Date(value);
                  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
                }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                domain={[yMin, yMax]}
              />
              <Tooltip
                content={<CustomChartTooltip initialValue={initialValue} />}
                cursor={{ stroke: '#475569', strokeDasharray: '3 3' }}
              />
              <Legend formatter={(value) => (value === 'value' ? '전략' : '벤치마크(KOSPI)')} />
              <Area
                type="monotone"
                dataKey="value"
                fill="url(#strategyGradient)"
                stroke="none"
                legendType="none"
              />
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
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: '#94a3b8',
                  strokeWidth: 2,
                  fill: '#0f172a',
                }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
