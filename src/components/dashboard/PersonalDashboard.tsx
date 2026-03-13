'use client';

/**
 * 로그인 사용자 개인화 대시보드 블록
 * - 구독 전략, 미확인 알림, AI 사용량
 * - Dashboard API 데이터 표시
 */

import Link from 'next/link';
import type { DashboardResponse } from '@/lib/api/dashboard';

interface PersonalDashboardProps {
  dashboard: DashboardResponse;
}

export function PersonalDashboard({ dashboard }: PersonalDashboardProps) {
  const { subscriptions, signals, aiUsage } = dashboard;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* 구독 전략 */}
      <Link href="/strategies" className="block">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 sm:p-3 hover:border-emerald-500/30 transition-colors text-center">
          <p className="text-lg sm:text-xl font-bold text-emerald-400 tabular-nums">
            {subscriptions.count}
            <span className="text-xs text-slate-500 font-normal">/{subscriptions.maxCount}</span>
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">구독 전략</p>
        </div>
      </Link>

      {/* 미확인 알림 */}
      <Link href="/mypage" className="block">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 sm:p-3 hover:border-cyan-500/30 transition-colors text-center relative">
          <p className="text-lg sm:text-xl font-bold text-cyan-400 tabular-nums">
            {signals.unreadCount}
            <span className="text-xs text-slate-500 font-normal">건</span>
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">미확인 알림</p>
          {signals.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </Link>

      {/* AI 사용량 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 sm:p-3 text-center">
        <p className="text-lg sm:text-xl font-bold text-purple-400 tabular-nums">
          {aiUsage.backtestUsed}
          <span className="text-xs text-slate-500 font-normal">/{aiUsage.backtestLimit}</span>
        </p>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">백테스트</p>
        {/* 사용량 미니 바 */}
        <div className="w-full h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-1 bg-purple-500 rounded-full transition-all"
            style={{
              width: `${Math.min((aiUsage.backtestUsed / aiUsage.backtestLimit) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** 로딩 스켈레톤 */
export function PersonalDashboardSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 sm:p-3 text-center animate-pulse"
        >
          <div className="h-6 bg-slate-700 rounded w-12 mx-auto mb-1.5" />
          <div className="h-3 bg-slate-700 rounded w-14 mx-auto" />
        </div>
      ))}
    </div>
  );
}
