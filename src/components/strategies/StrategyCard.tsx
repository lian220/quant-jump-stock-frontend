'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Strategy } from '@/types/strategy';

interface StrategyCardProps {
  strategy: Strategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  // 리스크 레벨에 따른 색상
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // 리스크 레벨 한글 변환
  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low':
        return '낮음';
      case 'medium':
        return '중간';
      case 'high':
        return '높음';
      default:
        return level;
    }
  };

  // 카테고리 한글 변환
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      momentum: '모멘텀',
      value: '밸류',
      growth: '성장주',
      dividend: '배당주',
      factor: '팩터',
      all: '전체',
    };
    return labels[category] || category;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-white truncate">{strategy.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
                {getCategoryLabel(strategy.category)}
              </Badge>
              <Badge className={`${getRiskColor(strategy.riskLevel)} text-xs`}>
                리스크: {getRiskLabel(strategy.riskLevel)}
              </Badge>
            </div>
          </div>
          {strategy.isPremium && (
            <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
              프리미엄
            </Badge>
          )}
        </div>
        <CardDescription className="text-slate-400 line-clamp-2 mt-2">
          {strategy.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 주요 성과 지표 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 p-3 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">누적 수익률</p>
            <p className="text-lg font-bold text-emerald-400">{strategy.totalReturn}</p>
          </div>
          <div className="bg-slate-700/30 p-3 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">연환산 수익률</p>
            <p className="text-lg font-bold text-cyan-400">{strategy.annualReturn}</p>
          </div>
          <div className="bg-slate-700/30 p-3 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">승률</p>
            <p className="text-sm font-semibold text-white">{strategy.winRate}</p>
          </div>
          <div className="bg-slate-700/30 p-3 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">샤프 비율</p>
            <p className="text-sm font-semibold text-white">{strategy.sharpeRatio}</p>
          </div>
        </div>

        {/* 위험 지표 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">최대 낙폭</span>
          <span className="text-red-400 font-mono">{strategy.maxDrawdown}</span>
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

        {/* 액션 버튼 */}
        <Link href={`/strategies/${strategy.id}`} className="block">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            상세보기
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
