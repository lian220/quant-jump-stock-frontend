'use client';

import React from 'react';
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

interface EquityCurveChartProps {
  equityCurve: BacktestEquityPoint[];
  benchmarkLabel?: string;
}

export default function EquityCurveChart({
  equityCurve,
  benchmarkLabel = 'SPY',
}: EquityCurveChartProps) {
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
        <CardDescription className="text-slate-400">
          전략 vs 벤치마크({benchmarkLabel}) 누적 수익률 비교
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityCurve} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  if (value == null)
                    return ['-', name === 'value' ? '전략' : `벤치마크(${benchmarkLabel})`];
                  const numValue = typeof value === 'number' ? value : 0;
                  return [
                    `${numValue.toLocaleString()}원`,
                    name === 'value' ? '전략' : `벤치마크(${benchmarkLabel})`,
                  ];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label as string);
                  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
                }}
              />
              <Legend
                formatter={(value) => (value === 'value' ? '전략' : `벤치마크(${benchmarkLabel})`)}
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
  );
}
