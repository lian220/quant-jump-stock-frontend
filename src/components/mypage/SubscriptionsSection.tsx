'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  getMySubscriptions,
  unsubscribeStrategy,
  updateSubscriptionAlert,
  updateSubscriptionBrokerAccount,
  type SubscriptionSummary,
} from '@/lib/api/subscriptions';
import { listBrokerAccounts } from '@/lib/api/broker-account';
import type { BrokerAccount } from '@/types/broker-account';
import { ACCOUNT_TYPE_LABEL } from '@/types/broker-account';
import { getAuthToken } from '@/lib/auth-store';

export function SubscriptionsSection() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [togglingAlert, setTogglingAlert] = useState<number | null>(null);
  const [unsubscribing, setUnsubscribing] = useState<number | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionLoadError, setSubscriptionLoadError] = useState(false);

  // Phase 1B v2.1: 구독별 실행 계좌 라디오용 broker accounts
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [updatingBrokerAccount, setUpdatingBrokerAccount] = useState<number | null>(null);

  // REAL 계좌 매핑 confirm 대상
  const [pendingRealMapping, setPendingRealMapping] = useState<{
    subscriptionId: number;
    accountId: number;
    strategyName: string;
    accountLabel: string;
  } | null>(null);

  // 구독 목록 로드
  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    if (!token) {
      setSubscriptionsLoading(false);
      return;
    }
    let mounted = true;
    getMySubscriptions(token)
      .then((data) => {
        if (mounted) setSubscriptions(data.subscriptions ?? []);
      })
      .catch(() => {
        if (mounted) setSubscriptionLoadError(true);
      })
      .finally(() => {
        if (mounted) setSubscriptionsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  // Phase 1B v2.1: 구독별 실행 계좌 라디오용 broker accounts 로드
  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    if (!token) return;
    let mounted = true;
    listBrokerAccounts(user.userId, token)
      .then((data) => {
        if (mounted) setBrokerAccounts(data.active);
      })
      .catch(() => {
        // broker accounts 가 없어도 구독 카드 자체는 표시되므로 silent fail
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleUnsubscribe(strategyId: number) {
    const token = getAuthToken();
    if (!token) return;
    setUnsubscribing(strategyId);
    setSubscriptionError(null);
    try {
      await unsubscribeStrategy(strategyId, token);
      setSubscriptions((prev) => prev.filter((s) => s.strategyId !== strategyId));
    } catch (err) {
      const message = err instanceof Error ? err.message : '구독 취소에 실패했습니다.';
      setSubscriptionError(message);
    } finally {
      setUnsubscribing(null);
    }
  }

  async function handleToggleAlert(subscriptionId: number, current: boolean) {
    const token = getAuthToken();
    if (!token) return;
    setTogglingAlert(subscriptionId);
    setSubscriptionError(null);
    try {
      await updateSubscriptionAlert(subscriptionId, !current, token);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.subscriptionId === subscriptionId ? { ...s, alertEnabled: !current } : s,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '알림 설정 변경에 실패했습니다.';
      setSubscriptionError(message);
    } finally {
      setTogglingAlert(null);
    }
  }

  /**
   * Phase 1B v2.1: 구독의 실행 계좌 변경. REAL 계좌 선택 시 ConfirmDialog 게이트 통과 필요.
   * null = legacy fallback (BE 가 사용자의 활성 계좌 1개 자동 선택).
   */
  function handleChangeBrokerAccount(subscriptionId: number, newAccountId: number | null) {
    if (newAccountId !== null) {
      const target = brokerAccounts.find((a) => a.id === newAccountId);
      if (target?.accountType === 'REAL') {
        const sub = subscriptions.find((s) => s.subscriptionId === subscriptionId);
        setPendingRealMapping({
          subscriptionId,
          accountId: newAccountId,
          strategyName: sub?.strategyName ?? `구독 #${subscriptionId}`,
          accountLabel: `${target.broker} 실전 ${target.accountNumber}${
            target.accountAlias ? ` — ${target.accountAlias}` : ''
          }`,
        });
        return;
      }
    }
    void persistBrokerMapping(subscriptionId, newAccountId);
  }

  /** ConfirmDialog 통과 후 또는 MOCK/미설정 즉시 실행. */
  async function persistBrokerMapping(subscriptionId: number, newAccountId: number | null) {
    const token = getAuthToken();
    if (!token) return;
    setUpdatingBrokerAccount(subscriptionId);
    setSubscriptionError(null);
    try {
      await updateSubscriptionBrokerAccount(subscriptionId, newAccountId, token);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.subscriptionId === subscriptionId ? { ...s, brokerAccountId: newAccountId } : s,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '실행 계좌 변경 실패';
      setSubscriptionError(message);
    } finally {
      setUpdatingBrokerAccount(null);
    }
  }

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-white">내 구독 전략</CardTitle>
            {!subscriptionsLoading && (
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                {subscriptions.length}개
              </Badge>
            )}
          </div>
          <Link href="/strategies">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-400 hover:text-emerald-300 text-xs"
            >
              전략 찾기
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : subscriptionLoadError ? (
            <div className="text-center py-6">
              <p className="text-red-400 text-sm mb-3">구독 목록을 불러오지 못했습니다</p>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-3">구독한 전략이 없습니다</p>
              <Link href="/strategies">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                >
                  마켓플레이스 둘러보기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptionError && (
                <p className="text-red-400 text-xs mb-2">{subscriptionError}</p>
              )}
              {subscriptions.map((sub) => {
                // Phase 1C — 계좌-구독 1:1 제약.
                // 다른 ACTIVE 구독이 이미 점유한 계좌 ID → 점유 구독 매핑.
                const accountUsageByOthers = new Map<number, SubscriptionSummary>();
                for (const other of subscriptions) {
                  if (
                    other.subscriptionId !== sub.subscriptionId &&
                    other.brokerAccountId != null
                  ) {
                    accountUsageByOthers.set(other.brokerAccountId, other);
                  }
                }
                return (
                  <div
                    key={sub.subscriptionId}
                    className="flex flex-col gap-2 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    data-testid={`subscription-${sub.subscriptionId}`}
                  >
                    <div className="flex items-center gap-3">
                      <Link href={`/strategies/${sub.strategyId}`} className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {sub.strategyName}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {new Date(sub.subscribedAt).toLocaleDateString('ko-KR')} 구독
                        </p>
                      </Link>
                      <button
                        onClick={() => handleToggleAlert(sub.subscriptionId, sub.alertEnabled)}
                        disabled={togglingAlert === sub.subscriptionId}
                        className={`shrink-0 text-xs px-2 py-1 rounded transition-colors ${
                          sub.alertEnabled
                            ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                            : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                        title={sub.alertEnabled ? '알림 끄기' : '알림 켜기'}
                        aria-label={sub.alertEnabled ? '알림 끄기' : '알림 켜기'}
                        aria-pressed={sub.alertEnabled}
                      >
                        {togglingAlert === sub.subscriptionId ? (
                          '...'
                        ) : (
                          <span aria-hidden="true">{sub.alertEnabled ? '🔔' : '🔕'}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleUnsubscribe(sub.strategyId)}
                        disabled={unsubscribing === sub.strategyId}
                        className="shrink-0 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
                        title="구독 취소"
                        aria-label="구독 취소"
                      >
                        {unsubscribing === sub.strategyId ? '...' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <label className="text-slate-400 text-xs whitespace-nowrap">
                        이 전략으로 주문 나갈 계좌
                      </label>
                      <select
                        value={sub.brokerAccountId ?? ''}
                        onChange={(e) =>
                          handleChangeBrokerAccount(
                            sub.subscriptionId,
                            e.target.value === '' ? null : Number(e.target.value),
                          )
                        }
                        disabled={updatingBrokerAccount === sub.subscriptionId}
                        className="flex-1 bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
                        data-testid={`subscription-broker-${sub.subscriptionId}`}
                      >
                        <option value="">미설정 — 자동매매 안 함</option>
                        {brokerAccounts.map((acc) => {
                          const occupiedBy = accountUsageByOthers.get(acc.id);
                          const baseLabel = `${acc.broker} ${ACCOUNT_TYPE_LABEL[acc.accountType]} ${acc.accountNumber}${acc.accountAlias ? ` — ${acc.accountAlias}` : ''}`;
                          return (
                            <option key={acc.id} value={acc.id} disabled={occupiedBy != null}>
                              {baseLabel}
                              {occupiedBy != null
                                ? ` — 「${occupiedBy.strategyName}」 사용 중`
                                : ''}
                            </option>
                          );
                        })}
                      </select>
                      {updatingBrokerAccount === sub.subscriptionId && (
                        <span className="text-xs text-slate-400">저장 중...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingRealMapping !== null}
        title="실전 계좌로 매핑"
        description={
          pendingRealMapping
            ? `"${pendingRealMapping.strategyName}" 전략을 다음 실전 계좌로 실행합니다.\n\n${pendingRealMapping.accountLabel}\n\n실제 자금이 자동매매에 사용됩니다. 계속하시겠습니까?`
            : ''
        }
        confirmLabel="실전 계좌로 매핑"
        cancelLabel="취소"
        tone="danger"
        onConfirm={() => {
          const p = pendingRealMapping;
          setPendingRealMapping(null);
          if (p) void persistBrokerMapping(p.subscriptionId, p.accountId);
        }}
        onCancel={() => setPendingRealMapping(null)}
      />
    </>
  );
}
