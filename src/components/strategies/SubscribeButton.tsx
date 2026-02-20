'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeStrategy,
  unsubscribeStrategy,
  type SubscribeResponse,
} from '@/lib/api/subscriptions';

interface Props {
  strategyId: number;
  initialSubscribed: boolean;
  isPremiumStrategy: boolean;
  onSubscribeChange?: (subscribed: boolean, subscriptionId?: number) => void;
}

export function SubscribeButton({
  strategyId,
  initialSubscribed,
  isPremiumStrategy,
  onSubscribeChange,
}: Props) {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 부모로부터 구독 상태가 비동기로 로드될 때 동기화
  useEffect(() => {
    setSubscribed(initialSubscribed);
  }, [initialSubscribed]);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleToggle = async () => {
    if (!user) {
      showToast('로그인 후 구독할 수 있습니다.', 'error');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      showToast('인증 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeStrategy(strategyId, token);
        setSubscribed(false);
        onSubscribeChange?.(false, undefined);
        showToast('구독이 취소되었습니다.', 'success');
      } else {
        const result: SubscribeResponse = await subscribeStrategy(strategyId, token);
        setSubscribed(true);
        onSubscribeChange?.(true, result.subscriptionId);
        showToast('전략을 구독했습니다.', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청에 실패했습니다.';
      if (message.includes('구독 제한') || message.includes('SUBSCRIPTION_LIMIT')) {
        showToast('구독 한도를 초과했습니다. 프리미엄으로 업그레이드하세요.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {subscribed ? (
        <Button
          variant="outline"
          className="w-full lg:w-auto border-emerald-500/50 text-emerald-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 gap-2 active:scale-95 transition-all"
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
          구독 중
        </Button>
      ) : (
        <Button
          className={`w-full lg:w-auto gap-2 active:scale-95 transition-all ${isPremiumStrategy ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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
