'use client';

import { getCategoryLabel } from '@/lib/strategy-helpers';
import type { SubscriptionSummary } from '@/lib/api/subscriptions';
import type { StrategyCategory } from '@/types/strategy';

interface Props {
  subscriptionInfo: SubscriptionSummary;
}

export function StrategySubscriptionInfo({ subscriptionInfo }: Props) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-emerald-400">구독 활성화됨</span>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(subscriptionInfo.subscribedAt).toLocaleDateString('ko-KR')} 시작
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
        <div>
          <p className="text-xs text-slate-500">카테고리</p>
          <p className="text-sm text-slate-200">
            {getCategoryLabel(subscriptionInfo.strategyCategory as StrategyCategory)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">상태</p>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${subscriptionInfo.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-yellow-400'}`}
            />
            <p className="text-sm text-slate-200">
              {subscriptionInfo.status === 'ACTIVE' ? '운용 중' : '일시정지'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">알림</p>
          <p className="text-sm text-slate-200">
            {subscriptionInfo.alertEnabled ? '🔔 활성' : '🔕 비활성'}
          </p>
        </div>
      </div>
    </div>
  );
}
