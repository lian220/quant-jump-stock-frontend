'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  saveAuthReturnUrl,
  CATEGORY_OPTIONS,
  MARKET_OPTIONS,
  RISK_OPTIONS,
} from '@/lib/onboarding';
import { getPreferences, type PreferencesData } from '@/lib/api/preferences';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
  type NotificationPreferenceUpdate,
} from '@/lib/api/notification-preferences';
import { getStrategies } from '@/lib/api/strategies';
import {
  getMySubscriptions,
  unsubscribeStrategy,
  updateSubscriptionAlert,
  type SubscriptionSummary,
} from '@/lib/api/subscriptions';
import type { Strategy, RiskLevel } from '@/types/strategy';
import { getRiskColor, getRiskLabel, getCategoryLabel } from '@/lib/strategy-helpers';
import { PageSEO } from '@/components/seo';

export default function MyPage() {
  const { user, loading, signOut, resetPassword, updateProfile } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [recommendedStrategies, setRecommendedStrategies] = useState<Strategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [togglingAlert, setTogglingAlert] = useState<number | null>(null);
  const [unsubscribing, setUnsubscribing] = useState<number | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionLoadError, setSubscriptionLoadError] = useState(false);

  // 프로필 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 알림 설정 상태
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(true);
  const [notifToggling, setNotifToggling] = useState<string | null>(null);

  // 비밀번호 재설정 상태
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      saveAuthReturnUrl('/mypage');
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
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
  useEffect(() => {
    if (!user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
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

  // 알림 설정 로드
  useEffect(() => {
    if (!user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setNotifPrefsLoading(false);
      return;
    }
    let mounted = true;
    getNotificationPreferences(token)
      .then((data) => {
        if (mounted) setNotifPrefs(data);
      })
      .catch(() => {
        // 설정 없으면 기본값 사용
        if (mounted)
          setNotifPrefs({
            newsEnabled: true,
            announcementEnabled: true,
            tradingSignalEnabled: true,
            backtestEnabled: true,
            priceAlertEnabled: true,
            weeklyDigestEnabled: true,
            pushEnabled: true,
          });
      })
      .finally(() => {
        if (mounted) setNotifPrefsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleToggleNotifPref(key: keyof NotificationPreferences) {
    const token = localStorage.getItem('auth_token');
    if (!token || !notifPrefs) return;
    setNotifToggling(key);
    try {
      const update: NotificationPreferenceUpdate = { [key]: !notifPrefs[key] };
      const updated = await updateNotificationPreferences(token, update);
      setNotifPrefs(updated);
    } catch {
      // 실패 시 무시
    } finally {
      setNotifToggling(null);
    }
  }

  async function handleUnsubscribe(strategyId: number) {
    const token = localStorage.getItem('auth_token');
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
    const token = localStorage.getItem('auth_token');
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

  const profileMessageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSaveName() {
    if (!editName.trim()) return;
    setProfileSaving(true);
    setProfileMessage(null);
    const result = await updateProfile({ displayName: editName.trim() });
    if (result.error) {
      setProfileMessage({ type: 'error', text: result.error });
    } else {
      setProfileMessage({ type: 'success', text: '이름이 변경되었어요' });
      setIsEditingName(false);
    }
    setProfileSaving(false);
    if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    profileMessageTimer.current = setTimeout(() => setProfileMessage(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    };
  }, []);

  async function handlePasswordReset() {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    setPasswordResetError(null);
    const result = await resetPassword(user.email);
    if (result.error) {
      setPasswordResetError(result.error);
    } else {
      setPasswordResetSent(true);
    }
    setPasswordResetLoading(false);
  }

  // 성향 기반 전략 추천 로드
  useEffect(() => {
    if (!preferences?.onboardingCompleted) return;
    const firstCategory = preferences.investmentCategories?.[0];
    if (!firstCategory) return;

    setStrategiesLoading(true);
    const sortMap: Record<string, 'cagr' | 'subscribers'> = {
      high: 'cagr',
      low: 'subscribers',
      medium: 'subscribers',
    };
    const sortBy = sortMap[preferences.riskTolerance ?? 'medium'] ?? 'subscribers';

    getStrategies({ category: firstCategory, sortBy, page: 0, size: 4 })
      .then((res) => {
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
      <PageSEO
        title="마이페이지 - Alpha Foundry"
        description="내 계정 정보, 구독 전략, 투자 성향을 관리하세요."
      />
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">마이페이지</h1>

        {/* 내 프로필 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">내 프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileMessage && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            {/* 이름 */}
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">이름</span>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 w-32 text-sm bg-slate-700 border-slate-600 text-white"
                    placeholder="이름 입력"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSaveName}
                    disabled={profileSaving || !editName.trim()}
                  >
                    {profileSaving ? '...' : '저장'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-400 hover:text-white"
                    onClick={() => setIsEditingName(false)}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{user.name || '미설정'}</span>
                  <button
                    onClick={() => {
                      setEditName(user.name || '');
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-emerald-400 transition-colors text-xs"
                  >
                    수정
                  </button>
                </div>
              )}
            </div>

            {/* 아이디 */}
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">아이디</span>
              <span className="text-white text-sm font-medium">{user.userId}</span>
            </div>

            {/* 이메일 */}
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">이메일</span>
              <span className="text-white text-sm font-medium">{user.email}</span>
            </div>

            {/* 전화번호 */}
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400 text-sm">전화번호</span>
              <span className="text-white text-sm font-medium">{user.phone || '미설정'}</span>
            </div>

            {/* 등급 */}
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">등급</span>
              <Badge
                variant="outline"
                className={`text-xs ${
                  user.role === 'ADMIN'
                    ? 'border-purple-500/30 text-purple-400'
                    : 'border-slate-600 text-slate-400'
                }`}
              >
                {user.role === 'ADMIN' ? '관리자' : '일반 회원'}
              </Badge>
            </div>
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
                {subscriptions.map((sub) => (
                  <div
                    key={sub.subscriptionId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <Link href={`/strategies/${sub.strategyId}`} className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{sub.strategyName}</p>
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
                    >
                      {togglingAlert === sub.subscriptionId
                        ? '...'
                        : sub.alertEnabled
                          ? '🔔'
                          : '🔕'}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">알림 설정</CardTitle>
          </CardHeader>
          <CardContent>
            {notifPrefsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-700/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : notifPrefs ? (
              <div className="space-y-1">
                {[
                  {
                    key: 'newsEnabled' as const,
                    label: '뉴스 알림',
                    desc: '주요 뉴스 알림을 받습니다',
                  },
                  {
                    key: 'announcementEnabled' as const,
                    label: '공지사항',
                    desc: '운영팀 공지를 받습니다',
                  },
                  {
                    key: 'tradingSignalEnabled' as const,
                    label: '매매 신호',
                    desc: '전략 매수/매도 신호 알림',
                  },
                  {
                    key: 'backtestEnabled' as const,
                    label: '백테스트 완료',
                    desc: '백테스트 완료 시 알림',
                  },
                  {
                    key: 'priceAlertEnabled' as const,
                    label: '가격 알림',
                    desc: '설정한 가격 도달 시 알림',
                  },
                  {
                    key: 'weeklyDigestEnabled' as const,
                    label: '주간 리포트',
                    desc: '주간 투자 요약 리포트',
                  },
                  {
                    key: 'pushEnabled' as const,
                    label: 'Web Push 알림',
                    desc: '브라우저 푸시 알림 (꺼도 인앱 알림은 유지)',
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggleNotifPref(key)}
                      disabled={notifToggling === key}
                      className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifPrefs[key] ? 'bg-emerald-600' : 'bg-slate-600'
                      } ${notifToggling === key ? 'opacity-50' : ''}`}
                      role="switch"
                      aria-checked={notifPrefs[key]}
                      aria-label={`${label} ${notifPrefs[key] ? '끄기' : '켜기'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* 내 투자 성향 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">내 투자 성향</CardTitle>
            {preferences?.onboardingCompleted && (
              <Link href="/onboarding">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300 text-xs"
                >
                  다시 설정
                </Button>
              </Link>
            )}
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
                  <span className="text-slate-400 text-sm">위험 성향</span>
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

        {/* 계정 관리 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 비밀번호 변경 */}
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <div>
                <p className="text-slate-300 text-sm">비밀번호 변경</p>
                <p className="text-slate-500 text-xs mt-0.5">이메일로 재설정 링크를 보내드려요</p>
                {passwordResetError && (
                  <p className="text-red-400 text-xs mt-1">{passwordResetError}</p>
                )}
              </div>
              {passwordResetSent ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  메일 발송 완료
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                  onClick={handlePasswordReset}
                  disabled={passwordResetLoading}
                >
                  {passwordResetLoading ? '발송 중...' : '재설정 메일 받기'}
                </Button>
              )}
            </div>

            {/* 로그아웃 */}
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-slate-300 text-sm">로그아웃</p>
                <p className="text-slate-500 text-xs mt-0.5">현재 기기에서 로그아웃합니다</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
              >
                로그아웃
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
