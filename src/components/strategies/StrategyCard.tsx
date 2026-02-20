'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getRiskColor,
  getRiskLabel,
  getCategoryLabel,
  getUniverseLabel,
  getUniverseColor,
} from '@/lib/strategy-helpers';
import { MetricsGrid } from '@/components/ui/metrics-grid';
import type { Strategy } from '@/types/strategy';

interface StrategyCardProps {
  strategy: Strategy;
}

function hasData(v: string | number | null | undefined): boolean {
  return v != null && v !== '' && v !== '-' && v !== 'N/A';
}

// "+42.5%" 또는 "-12.3%" 문자열에서 숫자 추출, null이면 undefined 반환
function parseReturn(v: string | number | null | undefined): number | undefined {
  if (!hasData(v)) return undefined;
  const n = parseFloat(String(v).replace('%', '').replace('+', ''));
  return isNaN(n) ? undefined : n;
}

// 누적 수익률 미니 바: 최대 ±150%를 100%로 표시
function ReturnBar({ value }: { value: string | number | null | undefined }) {
  const n = parseReturn(value);
  if (n === undefined) return null;
  const isPositive = n >= 0;
  const width = Math.min(Math.abs(n) / 150, 1) * 100;
  return (
    <div className="mt-1 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-white truncate">{strategy.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
                {getCategoryLabel(strategy.category)}
              </Badge>
              <Badge className={`${getRiskColor(strategy.riskLevel)} text-xs`}>
                리스크: {getRiskLabel(strategy.riskLevel)}
              </Badge>
              {strategy.isPremium && (
                <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  프리미엄
                </Badge>
              )}
            </div>
            {strategy.recommendedUniverseType && (
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getUniverseColor(strategy.recommendedUniverseType)} text-xs`}>
                  {getUniverseLabel(strategy.recommendedUniverseType)}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <CardDescription className="text-slate-400 line-clamp-2 mt-2">
          {strategy.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 주요 성과 지표 */}
        <MetricsGrid
          metrics={[
            {
              label: '누적 수익률',
              value: hasData(strategy.totalReturn) ? strategy.totalReturn : '준비중',
              valueColor: hasData(strategy.totalReturn) ? 'text-emerald-400' : 'text-slate-500',
              valueSize: 'sm',
            },
            {
              label: '연환산 수익률',
              value: hasData(strategy.annualReturn) ? strategy.annualReturn : '준비중',
              valueColor: hasData(strategy.annualReturn) ? 'text-cyan-400' : 'text-slate-500',
              valueSize: 'sm',
            },
            {
              label: '승률',
              value: hasData(strategy.winRate) ? strategy.winRate : '준비중',
              valueColor: hasData(strategy.winRate) ? 'text-white' : 'text-slate-500',
              valueSize: 'sm',
            },
            {
              label: '샤프 비율',
              value: hasData(strategy.sharpeRatio) ? strategy.sharpeRatio : '준비중',
              valueColor: hasData(strategy.sharpeRatio) ? 'text-white' : 'text-slate-500',
              valueSize: 'sm',
            },
          ]}
        />
        {/* 누적 수익률 미니 바 */}
        <ReturnBar value={strategy.totalReturn} />

        {/* 위험 지표 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">최대 낙폭</span>
          <span className="text-red-400 font-mono">
            {strategy.maxDrawdown && strategy.maxDrawdown !== '-' && strategy.maxDrawdown !== 'N/A'
              ? strategy.maxDrawdown
              : '데이터 준비중'}
          </span>
        </div>

        {/* 추가 정보 */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <span>⭐ {strategy.rating.toFixed(1)}</span>
            <span>👥 {strategy.subscribers.toLocaleString()}</span>
          </div>
          <span>{strategy.backtestPeriod}</span>
        </div>

        {/* 태그 */}
        {strategy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {strategy.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-slate-700/20 text-slate-400 border-slate-600 text-xs"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 액션 버튼 - Primary/Secondary 위계 */}
        <div className="flex items-center gap-2">
          <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href={`/strategies/${strategy.id}`}>상세보기</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200 text-xs shrink-0"
          >
            <Link href={`/strategies/${strategy.id}/backtest`}>백테스트 →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
