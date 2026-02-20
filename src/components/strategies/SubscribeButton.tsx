'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeStrategy,
  unsubscribeStrategy,
  type SubscribeResponse,
} from '@/lib/api/subscriptions';

interface Props {
  strategyId: number;
  initialSubscribed: boolean;
  subscriptionId?: number;
  isPremiumStrategy: boolean;
  onSubscribeChange?: (subscribed: boolean, subscriptionId?: number) => void;
}

export function SubscribeButton({
  strategyId,
  initialSubscribed,
  subscriptionId: initialSubscriptionId,
  isPremiumStrategy,
  onSubscribeChange,
}: Props) {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<number | undefined>(
    initialSubscriptionId,
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 부모로부터 구독 상태가 비동기로 로드될 때 동기화
  useEffect(() => {
    setSubscribed(initialSubscribed);
    setCurrentSubscriptionId(initialSubscriptionId);
  }, [initialSubscribed, initialSubscriptionId]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  const handleToggle = async () => {
    if (!user) {
      showToast('로그인 후 구독할 수 있습니다.', 'error');
      return;
    }

    const token = getToken();
    if (!token) {
      showToast('인증 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeStrategy(strategyId, token);
        setSubscribed(false);
        setCurrentSubscriptionId(undefined);
        onSubscribeChange?.(false, undefined);
        showToast('구독이 취소되었습니다.', 'success');
      } else {
        const result: SubscribeResponse = await subscribeStrategy(strategyId, token);
        setSubscribed(true);
        setCurrentSubscriptionId(result.subscriptionId);
        onSubscribeChange?.(true, result.subscriptionId);
        showToast('전략을 구독했습니다.', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청에 실패했습니다.';
      // FREE 구독 제한 초과 안내
      if (message.includes('구독 제한') || message.includes('SUBSCRIPTION_LIMIT')) {
        showToast('구독 한도를 초과했습니다. 프리미엄으로 업그레이드하세요.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // currentSubscriptionId는 추후 알림 설정 등에서 사용
  void currentSubscriptionId;

  return (
    <div className="relative inline-block">
      {/* 구독/구독취소 버튼 */}
      {subscribed ? (
        <Button
          variant="outline"
          className="border-emerald-500/50 text-emerald-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 gap-2"
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
          구독 중
        </Button>
      ) : (
        <Button
          className={`gap-2 ${isPremiumStrategy ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPremiumStrategy ? (
            <Crown className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          구독하기
        </Button>
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`absolute left-1/2 top-full mt-2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg px-4 py-2 text-sm shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600/90 text-white'}`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
