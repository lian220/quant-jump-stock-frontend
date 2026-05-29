'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StrategyDetail } from '@/types/strategy';

interface Props {
  strategy: StrategyDetail;
  strategyId: string;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  onSubscribeClick: () => void;
}

export function StrategySubscriptionCTA({
  strategy,
  strategyId,
  isSubscribed,
  isLoggedIn,
  onSubscribeClick,
}: Props) {
  if (isSubscribed) {
    return (
      <Card className="bg-slate-800/50 border-emerald-500/20 mt-8">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {strategy.name} 전략을 구독 중입니다
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              현재 이 전략의 매매 신호를 받고 있습니다
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
              <Link href="/mypage">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  내 구독 관리
                </Button>
              </Link>
              <Link href={`/strategies/${strategyId}/backtest`}>
                <Button className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700">
                  직접 시뮬레이션 →
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 border-emerald-500/30 mt-8">
      <CardContent className="py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
              이 전략으로 투자를 시작하세요
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base">
              {!isLoggedIn
                ? '로그인 후 무료로 구독할 수 있습니다.'
                : strategy.isPremium
                  ? '프리미엄 구독으로 실시간 매매 신호를 받아보세요.'
                  : '무료로 이 전략의 매매 신호를 받아보세요.'}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-4 mt-3 text-[11px] sm:text-sm text-slate-400 flex-wrap">
              <span className="whitespace-nowrap">✓ 실시간 매매 알림</span>
              <span className="whitespace-nowrap">✓ 포트폴리오 연동</span>
              <span className="whitespace-nowrap">✓ 성과 리포트</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 w-full md:w-auto shrink-0">
            {strategy.isPremium && <p className="text-slate-400 text-sm">월 29,900원</p>}
            {!isLoggedIn ? (
              <Link href={`/auth?returnUrl=/strategies/${strategyId}`} className="w-full md:w-auto">
                <Button
                  size="lg"
                  className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-700"
                >
                  로그인 후 구독하기
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className={`w-full md:w-auto px-8 ${
                  strategy.isPremium
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                onClick={onSubscribeClick}
              >
                {strategy.isPremium ? '프리미엄 구독하기' : '무료로 구독하기'}
              </Button>
            )}
            <p className="text-xs text-slate-500">
              {strategy.subscribers.toLocaleString()}명이 이미 구독 중
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
