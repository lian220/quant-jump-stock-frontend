'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  saveAuthReturnUrl,
  CATEGORY_OPTIONS,
  MARKET_OPTIONS,
  RISK_OPTIONS,
} from '@/lib/onboarding';
import { getPreferences, type PreferencesData } from '@/lib/api/preferences';
import { getStrategies } from '@/lib/api/strategies';
import {
  getMySubscriptions,
  unsubscribeStrategy,
  updateSubscriptionAlert,
  type SubscriptionSummary,
} from '@/lib/api/subscriptions';
import type { Strategy, RiskLevel } from '@/types/strategy';
import { getRiskColor, getRiskLabel, getCategoryLabel } from '@/lib/strategy-helpers';

export default function MyPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = React.useState<PreferencesData | null>(null);
  const [prefsLoading, setPrefsLoading] = React.useState(true);
  const [recommendedStrategies, setRecommendedStrategies] = React.useState<Strategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = React.useState(false);
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionSummary[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = React.useState(true);
  const [togglingAlert, setTogglingAlert] = React.useState<number | null>(null);
  const [unsubscribing, setUnsubscribing] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!loading && !user) {
      saveAuthReturnUrl('/mypage');
      router.push('/auth');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!user) return;
    let mounted = true;
    getPreferences()
      .then((prefs) => {
        if (mounted) setPreferences(prefs);
      })
      .finally(() => {
        if (mounted) setPrefsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  // 구독 목록 로드
  React.useEffect(() => {
    if (!user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setSubscriptionsLoading(false);
      return;
    }
    let mounted = true;
    getMySubscriptions(token)
      .then((data) => {
        if (mounted) setSubscriptions(data.subscriptions);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setSubscriptionsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleUnsubscribe(strategyId: number) {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setUnsubscribing(strategyId);
    try {
      await unsubscribeStrategy(strategyId, token);
      setSubscriptions((prev) => prev.filter((s) => s.strategyId !== strategyId));
    } catch {
      // 실패 시 무시
    } finally {
      setUnsubscribing(null);
    }
  }

  async function handleToggleAlert(subscriptionId: number, current: boolean) {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setTogglingAlert(subscriptionId);
    try {
      await updateSubscriptionAlert(subscriptionId, !current, token);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.subscriptionId === subscriptionId ? { ...s, alertEnabled: !current } : s,
        ),
      );
    } catch {
      // 실패 시 무시
    } finally {
      setTogglingAlert(null);
    }
  }

  // 성향 기반 전략 추천 로드
  React.useEffect(() => {
    if (!preferences?.onboardingCompleted) return;

    const firstCategory = preferences.investmentCategories?.[0];
    if (!firstCategory) return;

    setStrategiesLoading(true);

    // 리스크 성향에 따른 정렬: 공격형→수익률순, 안정형→구독자순(안정적), 균형형→구독자순
    const sortMap: Record<string, 'cagr' | 'subscribers'> = {
      high: 'cagr',
      low: 'subscribers',
      medium: 'subscribers',
    };
    const sortBy = sortMap[preferences.riskTolerance ?? 'medium'] ?? 'subscribers';

    getStrategies({ category: firstCategory, sortBy, page: 0, size: 4 })
      .then((res) => {
        // 리스크 성향에 맞는 전략 우선 필터링
        const risk = preferences.riskTolerance as RiskLevel | undefined;
        if (risk) {
          const matched = res.strategies.filter((s) => s.riskLevel === risk);
          const others = res.strategies.filter((s) => s.riskLevel !== risk);
          setRecommendedStrategies([...matched, ...others].slice(0, 4));
        } else {
          setRecommendedStrategies(res.strategies.slice(0, 4));
        }
      })
      .catch((err) => console.error('추천 전략 로드 실패:', err))
      .finally(() => setStrategiesLoading(false));
  }, [preferences]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const infoItems = [
    { label: '아이디', value: user.userId },
    { label: '이름', value: user.name || '-' },
    { label: '이메일', value: user.email },
    { label: '휴대전화번호', value: user.phone || '-' },
    { label: '등급', value: user.role === 'ADMIN' ? '관리자' : '일반 회원' },
    { label: '상태', value: user.status === 'ACTIVE' ? '활성' : user.status },
  ];

  const categoryLabels = (preferences?.investmentCategories ?? [])
    .map((v) => CATEGORY_OPTIONS.find((o) => o.value === v))
    .filter(Boolean)
    .map((o) => `${o!.icon} ${o!.label}`);

  const marketLabels = (preferences?.markets ?? [])
    .map((v) => MARKET_OPTIONS.find((o) => o.value === v))
    .filter(Boolean)
    .map((o) => `${o!.icon} ${o!.label}`);

  const riskLabel = RISK_OPTIONS.find((o) => o.value === preferences?.riskTolerance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">마이페이지</h1>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">내 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0"
              >
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 내 구독 전략 */}
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
                {subscriptions.map((sub) => (
                  <div
                    key={sub.subscriptionId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    {/* 전략 정보 */}
                    <Link href={`/strategies/${sub.strategyId}`} className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{sub.strategyName}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(sub.subscribedAt).toLocaleDateString('ko-KR')} 구독
                      </p>
                    </Link>

                    {/* 알림 토글 */}
                    <button
                      onClick={() => handleToggleAlert(sub.subscriptionId, sub.alertEnabled)}
                      disabled={togglingAlert === sub.subscriptionId}
                      className={`shrink-0 text-xs px-2 py-1 rounded transition-colors ${
                        sub.alertEnabled
                          ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                      }`}
                      title={sub.alertEnabled ? '알림 끄기' : '알림 켜기'}
                    >
                      {togglingAlert === sub.subscriptionId
                        ? '...'
                        : sub.alertEnabled
                          ? '🔔'
                          : '🔕'}
                    </button>

                    {/* 구독 취소 */}
                    <button
                      onClick={() => handleUnsubscribe(sub.strategyId)}
                      disabled={unsubscribing === sub.strategyId}
                      className="shrink-0 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
                      title="구독 취소"
                    >
                      {unsubscribing === sub.strategyId ? '...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">내 투자성향</CardTitle>
          </CardHeader>
          <CardContent>
            {prefsLoading ? (
              <p className="text-slate-400 text-sm">로딩 중...</p>
            ) : preferences && preferences.onboardingCompleted ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start py-2 border-b border-slate-700">
                  <span className="text-slate-400 text-sm">투자 스타일</span>
                  <span className="text-white text-sm font-medium text-right">
                    {categoryLabels.join(', ') || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-slate-700">
                  <span className="text-slate-400 text-sm">관심 시장</span>
                  <span className="text-white text-sm font-medium text-right">
                    {marketLabels.join(', ') || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">리스크 성향</span>
                  <span className="text-white text-sm font-medium">
                    {riskLabel ? `${riskLabel.icon} ${riskLabel.label}` : '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-3">투자 성향을 설정해보세요</p>
                <Link href="/onboarding">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                  >
                    성향 설정하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 성향 맞춤 전략 추천 */}
        {preferences?.onboardingCompleted && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">내 성향 맞춤 전략</CardTitle>
              <Link
                href={`/strategies?category=${preferences.investmentCategories?.[0] ?? ''}&risk=${preferences.riskTolerance ?? ''}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300 text-xs"
                >
                  더보기
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {strategiesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-slate-700/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recommendedStrategies.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  아직 추천할 전략이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendedStrategies.map((strategy) => (
                    <Link key={strategy.id} href={`/strategies/${strategy.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">{strategy.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-600 text-slate-400"
                            >
                              {getCategoryLabel(strategy.category)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs border-slate-600 ${getRiskColor(strategy.riskLevel)}`}
                            >
                              {getRiskLabel(strategy.riskLevel)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="text-emerald-400 text-sm font-semibold">
                            {strategy.annualReturn}
                          </p>
                          <p className="text-slate-500 text-xs">연수익률</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
