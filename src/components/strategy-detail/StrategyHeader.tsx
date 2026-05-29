'use client';

import { Badge } from '@/components/ui/badge';
import { SubscribeButton, TermTooltip } from '@/components/strategies';
import { getRiskColor, getRiskLabel, getCategoryLabel } from '@/lib/strategy-helpers';
import type { StrategyDetail } from '@/types/strategy';

interface Props {
  strategy: StrategyDetail;
  strategyId: number;
  isSubscribed: boolean;
  onSubscribeChange: (subscribed: boolean) => void;
}

export function StrategyHeader({ strategy, strategyId, isSubscribed, onSubscribeChange }: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      {/* 좌측: 제목 + 뱃지 + 설명 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{strategy.name}</h1>
          {strategy.isPremium && (
            <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
              프리미엄
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
            {getCategoryLabel(strategy.category)}
          </Badge>
          <Badge className={getRiskColor(strategy.riskLevel)}>
            <TermTooltip termKey="riskLevel">
              위험도: {getRiskLabel(strategy.riskLevel)}
            </TermTooltip>
          </Badge>
          <span className="text-slate-400 text-sm">
            <TermTooltip termKey="backtest">시뮬레이션 기간: {strategy.backtestPeriod}</TermTooltip>
          </span>
        </div>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base">{strategy.description}</p>
      </div>

      {/* 우측: 평점 + 구독 버튼 */}
      <div className="flex flex-col gap-2 lg:items-end lg:shrink-0">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">⭐</span> {strategy.rating.toFixed(1)}
          </span>
          <span className="w-px h-4 bg-slate-700" />
          <span>👥 {strategy.subscribers.toLocaleString()}명 구독</span>
        </div>
        <div className="w-full lg:w-auto">
          <SubscribeButton
            strategyId={strategyId}
            initialSubscribed={isSubscribed}
            isPremiumStrategy={strategy.isPremium}
            onSubscribeChange={onSubscribeChange}
          />
        </div>
      </div>
    </div>
  );
}
